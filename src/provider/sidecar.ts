// Adapted from oc-aurum (https://github.com/cesar-alves/oc-aurum), src/sidecar.ts
// Copyright (c) 2026 Cesar Alves. MIT. See NOTICE.
//
// The client for `aurum converse --stdio`: one JSON object per line on stdout, logs on stderr. Requests are strictly
// serialised: a second request waits for the first to settle, so an event can never resolve the wrong promise. The
// process is restarted once after a crash and is stopped with SIGTERM, then SIGKILL if it does not exit.
import { spawn, type ChildProcess } from "node:child_process"
import { createInterface, type Interface } from "node:readline"
import { EngineError, fromSidecarCategory } from "./errors.js"

export type SidecarState = "idle" | "starting" | "ready" | "busy" | "failed"

export interface ReadyEvent {
  readonly sttProvider: string
  readonly ttsProvider: string
  readonly caps: readonly string[]
}

export interface SidecarOptions {
  readonly bin: string
  readonly model: string
  readonly language: string
  readonly voice: string
  /** The plugin's `<cache>/engine`, passed as `--cache-dir`; it holds the models the plugin downloaded. */
  readonly cacheDir: string
  readonly env?: Readonly<Record<string, string | undefined>>
  readonly log?: (level: "debug" | "warn" | "error", message: string) => void
  readonly onState?: (state: SidecarState) => void
  readonly readyMs?: number
  readonly transcribeMs?: number
  readonly synthesizeMs?: number
  readonly stopMs?: number
}

interface Pending {
  readonly type: "transcribe" | "synthesize"
  readonly expected: "user_final" | "synthesized"
  readonly timeoutMs: number
  readonly read: (event: Record<string, unknown>) => unknown
  resolve: (value: unknown) => void
  reject: (error: EngineError) => void
  timer?: ReturnType<typeof setTimeout>
}

const READY_TIMEOUT = 60_000
const TRANSCRIBE_TIMEOUT = 120_000
const SYNTHESIZE_TIMEOUT = 30_000
const STOP_GRACE = 2_000
const KILL_GRACE = 1_000
const STDERR_TAIL = 3

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/** The exact argv for the sidecar, with the plugin's cache and voice, so tests can assert what the engine receives. */
export function sidecarArgs(options: Pick<SidecarOptions, "model" | "language" | "voice" | "cacheDir">): string[] {
  return [
    "converse",
    "--stdio",
    "--local-only",
    "--model",
    options.model,
    "--language",
    options.language,
    "--voice",
    options.voice,
    "--preload",
    "--cache-dir",
    options.cacheDir,
  ]
}

export class AurumSidecar {
  private readonly options: SidecarOptions
  private child: ChildProcess | undefined
  private childDone: Promise<void> | undefined
  private stdout: Interface | undefined
  private stderr: Interface | undefined
  private pending: Pending | undefined
  private chain: Promise<unknown> = Promise.resolve()
  private cancelEpoch = 0
  private ready: ReadyEvent | undefined
  private state: SidecarState = "idle"
  private stderrTail: string[] = []
  private restarts = 0
  private stopping = false
  private closed = false
  private quarantined = false
  private startEpoch = 0
  private waiters: { resolve: (value: ReadyEvent) => void; reject: (error: EngineError) => void }[] = []
  private failure: EngineError | undefined
  private readyTimer: ReturnType<typeof setTimeout> | undefined

  constructor(options: SidecarOptions) {
    this.options = options
  }

  get current(): SidecarState {
    return this.state
  }

  get caps(): readonly string[] {
    return this.ready?.caps ?? []
  }

  /** True while a request may still be on the wire; a cancelled one can emit a late event. */
  get hasPending(): boolean {
    return this.pending !== undefined
  }

  private setState(next: SidecarState) {
    if (next === this.state) return
    this.state = next
    try {
      this.options.onState?.(next)
    } catch (error) {
      this.options.log?.("warn", `state listener failed: ${String(error)}`)
    }
  }

  /** Starts the sidecar and waits for `ready`. Safe to call again while ready. */
  start(): Promise<ReadyEvent> {
    if (this.closed) return Promise.reject(new EngineError("CANCELLED", "The engine has been shut down."))
    if (this.quarantined) return Promise.reject(new EngineError("CANCELLED", "The cancelled request's engine is being replaced."))
    if (this.ready !== undefined) return Promise.resolve(this.ready)
    if (this.state === "starting") return new Promise((resolve, reject) => this.waiters.push({ resolve, reject }))
    if (this.state === "failed") return Promise.reject(this.failure ?? new EngineError("SIDECAR_FAILED", "The speech engine failed to start."))
    return this.launch()
  }

  private launch(): Promise<ReadyEvent> {
    if (this.closed) return Promise.reject(new EngineError("CANCELLED", "The engine has been shut down."))
    const epoch = ++this.startEpoch
    this.failure = undefined
    this.ready = undefined
    this.setState("starting")
    // A synchronous onState callback may close or stop this sidecar before any child or waiter exists.
    if (this.closed || this.stopping || epoch !== this.startEpoch) {
      return Promise.reject(new EngineError("CANCELLED", "The engine start was cancelled."))
    }
    let child: ChildProcess
    try {
      child = spawn(this.options.bin, sidecarArgs(this.options), {
        env: { ...process.env, ...this.options.env },
        stdio: ["pipe", "pipe", "pipe"],
      })
    } catch (error) {
      const failure = new EngineError("SIDECAR_FAILED", `The speech engine could not start: ${String(error)}`)
      this.failure = failure
      this.setState("failed")
      return Promise.reject(failure)
    }
    this.child = child
    let complete!: () => void
    let completed = false
    const done = new Promise<void>((resolve) => {
      complete = resolve
    })
    const finish = () => {
      if (completed) return
      completed = true
      complete()
    }
    this.childDone = done
    // A deferred spawn failure emits `error` and no `exit`; a successful child settles on its exact exit.
    child.once("error", () => {
      if (child.pid === undefined) finish()
    })
    child.once("exit", finish)
    if (child.exitCode !== null || child.signalCode !== null) finish()
    if (child.stdout === null || child.stderr === null || child.stdin === null) {
      this.failure = new EngineError("SIDECAR_FAILED", "The speech engine's pipes are unavailable.")
      this.setState("failed")
      return Promise.reject(this.failure)
    }
    this.stdout = createInterface({ input: child.stdout })
    this.stderr = createInterface({ input: child.stderr })
    this.stderr?.on("line", (line) => {
      this.stderrTail.push(line)
      if (this.stderrTail.length > STDERR_TAIL) this.stderrTail.shift()
      this.options.log?.("debug", line)
    })
    this.stdout.on("line", (line) => {
      // A retired or replaced child must not publish ready, error or a late response into this sidecar.
      if (this.child !== child || this.closed || this.stopping || this.state === "failed") return
      this.onLine(line)
    })
    child.on("error", (error) => {
      if (this.child !== child || this.closed || this.stopping) return
      this.fail(new EngineError("SIDECAR_FAILED", `The speech engine failed: ${error.message}`))
    })
    child.on("exit", (code) => {
      if (this.child !== child || this.closed || this.stopping) return
      this.fail(new EngineError("ENGINE_EXITED", `The speech engine exited with code ${code ?? "unknown"}.`))
    })
    const promise = new Promise<ReadyEvent>((resolve, reject) => this.waiters.push({ resolve, reject }))
    this.readyTimer = setTimeout(() => this.fail(new EngineError("TIMEOUT", "The speech engine did not become ready in time.")), this.options.readyMs ?? READY_TIMEOUT)
    return promise
  }

  private onLine(line: string) {
    if (this.closed || this.stopping || this.child === undefined || this.state === "failed") return
    let event: unknown
    try {
      event = JSON.parse(line)
    } catch {
      this.options.log?.("warn", "the speech engine wrote a line that is not JSON")
      return
    }
    if (!isRecord(event) || typeof event.type !== "string") return
    if (event.type === "ready") {
      const caps = Array.isArray(event.caps) ? event.caps.filter((cap): cap is string => typeof cap === "string") : []
      if (!caps.includes("transcribe")) {
        this.fail(new EngineError("ENGINE_INCOMPATIBLE", "This Aurum build does not advertise the transcribe capability."))
        return
      }
      this.ready = {
        sttProvider: typeof event.stt_provider === "string" ? event.stt_provider : "local",
        ttsProvider: typeof event.tts_provider === "string" ? event.tts_provider : "local",
        caps,
      }
      if (this.readyTimer !== undefined) {
        clearTimeout(this.readyTimer)
        this.readyTimer = undefined
      }
      this.setState("ready")
      for (const waiter of this.waiters.splice(0)) waiter.resolve(this.ready)
      return
    }
    if (event.type === "error") {
      const category = typeof event.category === "string" ? event.category : "internal"
      const message = typeof event.message === "string" ? event.message : "The speech engine reported an error."
      const error = fromSidecarCategory(category, message)
      this.settle(error)
      if (this.state === "starting") this.fail(error)
      return
    }
    const pending = this.pending
    if (pending === undefined || event.type !== pending.expected) return
    try {
      const value = pending.read(event)
      this.settle(undefined, value)
    } catch (error) {
      this.settle(error instanceof EngineError ? error : new EngineError("SIDECAR_FAILED", "The speech engine sent an unusable event."))
    }
  }

  private settle(error?: EngineError, value?: unknown) {
    const pending = this.pending
    if (pending === undefined) return
    this.pending = undefined
    if (pending.timer !== undefined) clearTimeout(pending.timer)
    this.setState("ready")
    if (error !== undefined) pending.reject(error)
    else pending.resolve(value)
  }

  private fail(error: EngineError) {
    if (this.closed || this.stopping) return
    if (error.code === "TIMEOUT") this.quarantined = true
    this.failure = error
    const pending = this.pending
    this.pending = undefined
    if (pending?.timer !== undefined) clearTimeout(pending.timer)
    pending?.reject(error)
    if (this.readyTimer !== undefined) {
      clearTimeout(this.readyTimer)
      this.readyTimer = undefined
    }
    for (const waiter of this.waiters.splice(0)) waiter.reject(error)
    this.ready = undefined
    this.setState("failed")
    // Keep the exact child until stop() has sent its bounded TERM/KILL and observed the exit.
    this.detachOutputs()
  }

  /** Stop publishing from a failed child but retain its handle for the owned shutdown. */
  private detachOutputs() {
    if (this.readyTimer !== undefined) {
      clearTimeout(this.readyTimer)
      this.readyTimer = undefined
    }
    this.stdout?.close()
    this.stderr?.close()
    this.stdout = undefined
    this.stderr = undefined
  }

  /** Clear the retained handle only after the exact child has exited. */
  private cleanup() {
    this.detachOutputs()
    const child = this.child
    this.child = undefined
    this.childDone = undefined
    if (child !== undefined && child.exitCode === null) child.kill("SIGTERM")
  }

  /**
   * One request at a time. The second waits for the first to settle before it takes `pending`, so a `user_final` can
   * never resolve the wrong promise. The request is pending at once, so a cancel in the same tick can settle it.
   */
  private send(pending: Omit<Pending, "resolve" | "reject">, request: Record<string, unknown>): Promise<unknown> {
    if (this.closed) return Promise.reject(new EngineError("CANCELLED", "The engine has been shut down."))
    if (this.quarantined) return Promise.reject(new EngineError("CANCELLED", "The cancelled request's engine is being replaced."))
    const epoch = this.cancelEpoch
    const task = this.chain.then(
      () =>
        new Promise<unknown>((resolve, reject) => {
          if (epoch !== this.cancelEpoch) {
            reject(new EngineError("CANCELLED", "The request was cancelled."))
            return
          }
          const entry: Pending = { ...pending, resolve, reject }
          this.pending = entry
          entry.timer = setTimeout(() => {
            // A timed-out request can still answer later. Quarantine this exact child until its owner replaces it.
            this.quarantined = true
            this.settle(new EngineError("TIMEOUT", "The speech engine did not answer in time."))
            this.setState("failed")
            this.cancel()
          }, pending.timeoutMs)
          void this.start()
            .then(() => {
              if (this.pending !== entry) return
              const child = this.child
              if (child?.stdin === null || child?.stdin === undefined) {
                this.settle(new EngineError("SIDECAR_FAILED", "The speech engine is not running."))
                return
              }
              this.setState("busy")
              try {
                child.stdin.write(`${JSON.stringify({ v: 1, ...request })}\n`)
              } catch (error) {
                this.settle(new EngineError("SIDECAR_FAILED", `The speech engine could not be written to: ${String(error)}`))
              }
            })
            .catch((error: unknown) => this.settle(error instanceof EngineError ? error : new EngineError("SIDECAR_FAILED", "The speech engine did not start.")))
        }),
    )
    this.chain = task.catch(() => undefined)
    return task
  }

  /** Transcribes an absolute WAV path; the engine reads it, so no audio crosses a pipe. */
  transcribe(path: string): Promise<{ text: string; provider: string; model: string }> {
    return this.send(
      {
        type: "transcribe",
        expected: "user_final",
        timeoutMs: this.options.transcribeMs ?? TRANSCRIBE_TIMEOUT,
        read: (event) => {
          if (typeof event.text !== "string") throw new EngineError("SIDECAR_FAILED", "The transcript event has no text.")
          return {
            text: event.text,
            provider: typeof event.provider === "string" ? event.provider : "local",
            model: typeof event.model === "string" ? event.model : this.options.model,
          }
        },
      },
      { type: "transcribe", path },
    ) as Promise<{ text: string; provider: string; model: string }>
  }

  /**
   * Writes a WAV to an absolute path. It does not play it. A speaking rate is sent only when Aurum advertises the
   * capability; otherwise a rate other than 1 is refused with UNSUPPORTED rather than silently ignored.
   */
  async synthesize(text: string, path: string, options: { rate?: number } = {}): Promise<{ path: string; durationMs: number; provider: string; model: string; voice: string }> {
    const rate = options.rate
    if (rate !== undefined && rate !== 1) {
      await this.start()
      if (!this.caps.includes("synthesize_speaking_rate")) {
        throw new EngineError("UNSUPPORTED", "This Aurum build cannot apply a speaking rate.")
      }
    }
    return this.send(
      {
        type: "synthesize",
        expected: "synthesized",
        timeoutMs: this.options.synthesizeMs ?? SYNTHESIZE_TIMEOUT,
        read: (event) => ({
          path: typeof event.path === "string" ? event.path : path,
          durationMs: typeof event.duration_ms === "number" ? event.duration_ms : 0,
          provider: typeof event.provider === "string" ? event.provider : "local",
          model: typeof event.model === "string" ? event.model : "",
          voice: typeof event.voice === "string" ? event.voice : "",
        }),
      },
      { type: "synthesize", text, path, ...(rate === undefined || rate === 1 ? {} : { speaking_rate: rate }) },
    ) as Promise<{ path: string; durationMs: number; provider: string; model: string; voice: string }>
  }

  /** Aborts the in-flight request, and any queued request issued before now, then tells the engine. */
  cancel() {
    this.cancelEpoch += 1
    if (this.pending !== undefined) {
      this.settle(new EngineError("CANCELLED", "The request was cancelled."))
      this.quarantined = true
    }
    const child = this.child
    if (child?.stdin !== null && child?.stdin !== undefined && child.stdin.writable) {
      try {
        child.stdin.write(`${JSON.stringify({ v: 1, type: "abort" })}\n`)
      } catch {
        // The process is already gone.
      }
    }
  }

  /** Fences this sidecar for good: no start, restart or dispatch, and every waiter rejects. */
  async close(): Promise<void> {
    if (!this.closed) {
      this.closed = true
      this.cancel()
    }
    await this.stop()
  }

  private rejectWaiters(error: EngineError) {
    for (const waiter of this.waiters.splice(0)) waiter.reject(error)
  }

  /** Asks the engine to exit, then escalates SIGTERM to SIGKILL; the promise is bounded whatever the child does. */
  async stop(): Promise<void> {
    this.startEpoch += 1
    const stopped = new EngineError("CANCELLED", "The engine was shut down.")
    if (this.readyTimer !== undefined) {
      clearTimeout(this.readyTimer)
      this.readyTimer = undefined
    }
    if (this.pending !== undefined) this.settle(stopped)
    this.rejectWaiters(stopped)
    const child = this.child
    if (child === undefined) {
      this.quarantined = false
      this.setState("idle")
      return
    }
    this.stopping = true
    const completed = this.childDone
    try {
      child.stdin?.write(`${JSON.stringify({ v: 1, type: "shutdown" })}\n`)
    } catch {
      // Fall through to the signals.
    }
    const terminate = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM")
    }, this.options.stopMs ?? STOP_GRACE)
    const kill = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL")
    }, (this.options.stopMs ?? STOP_GRACE) + KILL_GRACE)
    // A spawn error has no process to signal; every spawned child resolves this on its exact exit.
    await completed
    clearTimeout(terminate)
    clearTimeout(kill)
    this.cleanup()
    this.ready = undefined
    this.quarantined = false
    this.stopping = false
    this.setState("idle")
  }

  /** Restarts once after a crash; a second failure is reported as it is. */
  async restart(): Promise<void> {
    if (this.closed) throw new EngineError("CANCELLED", "The engine has been shut down.")
    if (this.restarts >= 1) throw new EngineError("SIDECAR_FAILED", "The speech engine failed twice; it will not be restarted again.")
    this.restarts += 1
    await this.stop().catch(() => undefined)
    this.failure = undefined
    await this.start()
  }
}
