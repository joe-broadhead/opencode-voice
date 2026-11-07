import { Endpointer } from "../engine/endpoint.js"
import type { SpeechEngine } from "../engine/index.js"
import { asEngineError, isCancel } from "../engine/errors.js"
import { label, next, type Phase } from "./state.js"

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

/**
 * One dictation: start the recorder, endpoint the levels, transcribe, then send or review. It never sends anything the
 * user did not finish speaking, and a cancel deletes the recording and sends nothing.
 */
export class DictationFlow {
  private phase: Phase = "idle"
  private abort: AbortController | undefined
  private recorder: { recorder: { stop(): Promise<{ path: string; bytes: number; seconds: number }>; cancel(): void }; path: string } | undefined
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
    const abort = new AbortController()
    this.abort = abort
    this.finishing = false
    this.set("preparing")
    try {
      const { recorder, path } = await this.host.engine.recorder(abort.signal)
      this.recorder = { recorder, path }
      const endpointer = new Endpointer()
      let ended = false
      const end = () => {
        if (ended) return
        ended = true
        void this.finish()
      }
      this.set("listening")
      this.host.toast("Listening", "info")
      recorder.start({
        onLevel: (dbfs) => {
          if (ended) return
          const state = endpointer.push(dbfs)
          if (state === "pause") this.host.status("listening", "pause")
          if (state === "end") end()
          if (state === "no-speech") {
            ended = true
            recorder.cancel()
            this.set("idle")
            this.host.toast("No speech heard", "warning")
            void this.host.engine.release(path)
          }
        },
        onExit: (error) => {
          if (ended) return
          ended = true
          if (error !== undefined) {
            this.fail(error)
            void this.host.engine.release(path)
            return
          }
          void this.finish()
        },
      })
    } catch (error) {
      this.fail(error)
    }
  }

  /** Ends the recording now and transcribes what was said. */
  async finish(): Promise<void> {
    if (this.finishing || this.recorder === undefined) return
    this.finishing = true
    const current = this.recorder
    this.recorder = undefined
    this.set("transcribing")
    try {
      const recording = await current.recorder.stop()
      const transcript = await this.host.engine.transcribeFile(recording.path)
      await this.host.engine.release(recording.path)
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
        if (edited === undefined || edited.trim() === "") {
          this.set("idle")
          return
        }
        this.set("sending")
        await this.host.submit(sessionID, edited.trim())
      } else {
        this.set("sending")
        await this.host.submit(sessionID, text)
      }
      this.set("idle")
      this.host.toast("Sent", "success")
    } catch (error) {
      this.fail(error)
    } finally {
      this.finishing = false
    }
  }

  /** Cancels the recording or transcription; nothing is sent and the temp file is deleted. */
  cancel(): void {
    if (!this.active && this.phase !== "playing") return
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
  async speak(text: string, options: { markdown?: boolean; signal?: AbortSignal } = {}): Promise<void> {
    if (this.active) {
      this.host.toast("Finish the dictation first", "warning")
      return
    }
    this.set("playing")
    try {
      const speech = await this.host.engine.synthesize(text, options.markdown === true ? { markdown: true } : {})
      try {
        await this.host.engine.play(speech.path, options.signal)
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

  /** Applies one event, for tests and for a host that drives the machine directly. */
  apply(event: "cancel" | "stopped"): void {
    this.set(next(this.phase, event))
  }
}
