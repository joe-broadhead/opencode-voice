import { Endpointer } from "../engine/endpoint.js"
import type { SpeechEngine } from "../engine/index.js"
import { asEngineError, isCancel } from "../engine/errors.js"
import { label, type Phase } from "./state.js"

export type ToastKind = "info" | "success" | "warning" | "error"

/** What the flow needs from the TUI, so it can be tested without one. */
export interface DictationHost {
  readonly engine: SpeechEngine
  activeSession(): string | undefined
  submit(sessionID: string, text: string): Promise<void>
  /** The prefilled review dialog; undefined when dismissed. */
  review(text: string): Promise<string | undefined>
  toast(message: string, variant?: ToastKind): void
  /** Where the listening state shows, if anywhere. */
  status(state: Phase | "idle", text?: string): void
  submitMode(): "send" | "review"
  /** Called with every finished transcript, for the opt-in history. */
  record(text: string): void
}

interface LiveRecorder {
  readonly recorder: {
    start(handlers: { onLevel: (dbfs: number) => void; onExit?: (error?: unknown) => void }): void
    stop(): Promise<{ path: string; bytes: number; seconds: number }>
    cancel(): void
  }
  readonly path: string
}

/**
 * One dictation: start the recorder, endpoint the levels, transcribe, then send or review.
 *
 * A cancel wins at every phase. Each start carries a generation; cancel increments it, so a recorder that arrives after
 * the cancel is never started, a transcript that arrives after it is never sent, and every path that was created is
 * released. It never sends anything the user did not finish speaking.
 */
export class DictationFlow {
  private phase: Phase = "idle"
  private abort: AbortController | undefined
  private recorder: LiveRecorder | undefined
  private generation = 0
  private finishing = false

  private readonly host: DictationHost

  constructor(host: DictationHost) {
    this.host = host
  }

  get state(): Phase {
    return this.phase
  }

  get active(): boolean {
    return this.phase === "preparing" || this.phase === "listening" || this.phase === "transcribing" || this.phase === "sending" || this.phase === "reviewing"
  }

  private set(phase: Phase, text?: string) {
    this.phase = phase
    this.host.status(phase, text)
  }

  private cancelled(generation: number): boolean {
    return generation !== this.generation || this.abort?.signal.aborted === true
  }

  private fail(error: unknown) {
    if (isCancel(error)) {
      this.set("idle")
      return
    }
    const failure = asEngineError(error)
    this.set("failed")
    this.host.toast(failure.message, "error")
  }

  /** Starts listening. A second call while active ends the turn, like a second press. */
  async start(): Promise<void> {
    if (this.active) {
      await this.finish()
      return
    }
    if (this.phase === "playing") this.host.engine.stopPlayback()
    const generation = ++this.generation
    const abort = new AbortController()
    this.abort = abort
    this.finishing = false
    this.set("preparing")
    let created: LiveRecorder | undefined
    try {
      created = await this.host.engine.recorder(abort.signal)
    } catch (error) {
      if (!this.cancelled(generation)) this.fail(error)
      else this.set("idle")
      return
    }
    // A cancel during "preparing" wins: the recorder never starts, and its path is released.
    if (created === undefined) return
    if (this.cancelled(generation)) {
      await this.host.engine.release(created.path)
      this.set("idle")
      return
    }
    this.recorder = created
    const endpointer = new Endpointer()
    let ended = false
    const end = () => {
      if (ended) return
      ended = true
      void this.finish()
    }
    this.set("listening")
    this.host.toast("Listening", "info")
    created.recorder.start({
      onLevel: (dbfs) => {
        if (ended || this.cancelled(generation)) return
        const state = endpointer.push(dbfs)
        if (state === "pause") this.host.status("listening", "pause")
        if (state === "end") end()
        if (state === "no-speech") {
          ended = true
          created.recorder.cancel()
          this.set("idle")
          this.host.toast("No speech heard", "warning")
          void this.host.engine.release(created.path)
        }
      },
      onExit: (error) => {
        if (ended || this.cancelled(generation)) return
        ended = true
        if (error !== undefined) {
          this.fail(error)
          void this.host.engine.release(created.path)
          return
        }
        void this.finish()
      },
    })
  }

  /** Ends the recording now and transcribes what was said. A cancel during any await stops the turn. */
  async finish(): Promise<void> {
    if (this.finishing || this.recorder === undefined) return
    this.finishing = true
    const generation = this.generation
    const current = this.recorder
    this.recorder = undefined
    this.set("transcribing")
    let path: string | undefined = current.path
    try {
      const recording = await current.recorder.stop()
      path = recording.path
      if (this.cancelled(generation)) return
      const transcript = await this.host.engine.transcribeFile(recording.path)
      if (this.cancelled(generation)) return
      if (transcript.silent || transcript.text.trim() === "") {
        this.set("idle")
        this.host.toast("No speech recognized", "warning")
        return
      }
      const text = transcript.text.trim()
      this.host.record(text)
      const sessionID = this.host.activeSession()
      if (sessionID === undefined) {
        this.set("idle")
        this.host.toast("Open a session to send the transcript", "warning")
        return
      }
      if (this.host.submitMode() === "review") {
        this.set("reviewing")
        const edited = await this.host.review(text)
        if (this.cancelled(generation) || edited === undefined || edited.trim() === "") {
          this.set("idle")
          return
        }
        this.set("sending")
        await this.host.submit(sessionID, edited.trim())
      } else {
        this.set("sending")
        await this.host.submit(sessionID, text)
      }
      if (this.cancelled(generation)) return
      this.set("idle")
      this.host.toast("Sent", "success")
    } catch (error) {
      if (!this.cancelled(generation)) this.fail(error)
      else this.set("idle")
    } finally {
      // The recording is deleted on every path: success, failure, cancel and a stop() that threw.
      if (path !== undefined && path !== "") await this.host.engine.release(path).catch(() => undefined)
      this.finishing = false
    }
  }

  /** Cancels at any phase: no recorder starts, nothing is transcribed or sent, and every temp path is released. */
  cancel(): void {
    if (!this.active && this.phase !== "playing") return
    this.generation += 1
    this.abort?.abort()
    this.recorder?.recorder.cancel()
    const path = this.recorder?.path
    this.recorder = undefined
    this.host.engine.cancel()
    if (path !== undefined) void this.host.engine.release(path)
    this.set("idle")
    this.host.toast("Cancelled", "info")
  }

  /** Reads text aloud. `markdown` reduces a reply to speakable text first. */
  async speak(text: string, options: { markdown?: boolean; rate?: number; signal?: AbortSignal } = {}): Promise<void> {
    if (this.active) {
      this.host.toast("Finish the dictation first", "warning")
      return
    }
    if (this.phase === "playing") {
      this.host.toast("A reply is already playing", "warning")
      return
    }
    this.set("playing")
    try {
      const speech = await this.host.engine.synthesize(text, {
        ...(options.markdown === true ? { markdown: true } : {}),
        ...(options.rate === undefined ? {} : { rate: options.rate }),
      })
      try {
        await this.host.engine.play(speech.path, { ...(options.signal === undefined ? {} : { signal: options.signal }), ...(options.rate === undefined ? {} : { rate: options.rate }) })
      } finally {
        await this.host.engine.release(speech.path)
      }
      this.set("idle")
    } catch (error) {
      if (isCancel(error)) this.set("idle")
      else this.fail(error)
    }
  }

  /** Stops playback and returns to idle. */
  stop(): void {
    if (this.phase === "playing") {
      this.host.engine.stopPlayback()
      this.set("idle")
      return
    }
    this.cancel()
  }

  /** The status line's text for the current phase. */
  statusText(): string | undefined {
    return this.phase === "idle" ? undefined : label(this.phase)
  }
}
