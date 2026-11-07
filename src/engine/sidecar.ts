// Adapted from oc-aurum (https://github.com/cesar-alves/oc-aurum), src/sidecar.ts
// Copyright (c) 2026 Cesar Alves. MIT. See NOTICE.
//
// The client for `aurum converse --stdio`: one JSON object per line on stdout, logs on stderr. It keeps at most one
// request in flight, queues the rest in order, restarts a crashed process once, and never lets a late event resolve a
// request that has already timed out or been cancelled.
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

const READY_TIMEOUT = 10_000
const TRANSCRIBE_TIMEOUT = 120_000
const SYNTHESIZE_TIMEOUT = 30_000
const STOP_TIMEOUT = 2_000
const STDERR_TAIL = 3

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

export class AurumSidecar {
  private readonly options: Required<Pick<SidecarOptions, "bin" | "model" | "language">> & SidecarOptions
  private child: ChildProcess | undefined
  private stdout: Interface | undefined
  private stderr: Interface | undefined
  private pending: Pending | undefined
  private queue: Promise<unknown> = Promise.resolve()
  private ready: ReadyEvent | undefined
  private state: SidecarState = "idle"
  private stderrTail: string[] = []
  private restarts = 0
  private stopping = false

  constructor(options: SidecarOptions) {
    this.options = { ...options }
  }

  get current(): SidecarState {
    return this.state
  }

  get caps(): readonly string[] {
    return this.ready?.caps ?? []
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
    if (this.ready !== undefined) return Promise.resolve(this.ready)
    if (this.state === "starting") return new Promise((resolve, reject) => this.waiters.push({ resolve, reject }))
    if (this.state === "failed") return Promise.reject(this.failure ?? new EngineError("SIDECAR_FAILED", "The speech engine failed to start."))
    return this.launch()
  }

  private waiters: { resolve: (value: ReadyEvent) => void; reject: (error: EngineError) => void }[] = []
  private failure: EngineError | undefined
  private readyTimer: ReturnType<typeof setTimeout> | undefined

  private launch(): Promise<ReadyEvent> {
    this.setState("starting")
    this.failure = undefined
    this.ready = undefined
    const args = ["converse", "--stdio", "--local-only", "--model", this.options.model, "--language", this.options.language]
    let child: ChildProcess
    try {
      child = spawn(this.options.bin, args, { env: { ...process.env, ...this.options.env }, stdio: ["pipe", "pipe", "pipe"] })
    } catch (error) {
      const failure = new EngineError("SIDECAR_FAILED", `The speech engine could not start: ${String(error)}`)
      this.failure = failure
      this.setState("failed")
      return Promise.reject(failure)
    }
    this.child = child
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
    this.stdout.on("line", (line) => this.onLine(line))
    child.on("error", (error) => this.fail(new EngineError("SIDECAR_FAILED", `The speech engine failed: ${error.message}`)))
    child.on("exit", (code) => {
      if (!this.stopping) this.fail(new EngineError("ENGINE_EXITED", `The speech engine exited with code ${code ?? "unknown"}.`))
    })

    const promise = new Promise<ReadyEvent>((resolve, reject) => this.waiters.push({ resolve, reject }))
    this.readyTimer = setTimeout(() => this.fail(new EngineError("TIMEOUT", "The speech engine did not become ready in time.")), this.options.readyMs ?? READY_TIMEOUT)
    return promise
  }

  private onLine(line: string) {
    let event: unknown
    try {
      event = JSON.parse(line)
    } catch {
      this.options.log?.("warn", "the speech engine wrote a line that is not JSON")
      return
    }
    if (!isRecord(event) || typeof event.type !== "string") return
    if (event.type === "ready") {
      this.ready = {
        sttProvider: typeof event.stt_provider === "string" ? event.stt_provider : "local",
        ttsProvider: typeof event.tts_provider === "string" ? event.tts_provider : "local",
        caps: Array.isArray(event.caps) ? event.caps.filter((cap): cap is string => typeof cap === "string") : [],
      }
      if (this.readyTimer !== undefined) clearTimeout(this.readyTimer)
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
    if (this.stopping) return
    this.failure = error
    const pending = this.pending
    this.pending = undefined
    if (pending?.timer !== undefined) clearTimeout(pending.timer)
    pending?.reject(error)
    if (this.readyTimer !== undefined) clearTimeout(this.readyTimer)
    for (const waiter of this.waiters.splice(0)) waiter.reject(error)
    this.ready = undefined
    this.setState("failed")
    this.cleanup()
  }

  private cleanup() {
    this.stdout?.close()
    this.stderr?.close()
    this.stdout = undefined
    this.stderr = undefined
    const child = this.child
    this.child = undefined
    if (child !== undefined && child.exitCode === null) child.kill("SIGTERM")
  }

  private send(pending: Omit<Pending, "resolve" | "reject">, request: Record<string, unknown>): Promise<unknown> {
    const previous = this.queue
    let resolve!: (value: unknown) => void
    let reject!: (error: EngineError) => void
    const promise = new Promise<unknown>((res, rej) => {
      resolve = res
      reject = rej
    })
    const entry: Pending = { ...pending, resolve, reject }
    // The request is pending at once, so a cancel called in the same tick can settle it before it is written.
    this.pending = entry
    entry.timer = setTimeout(() => {
      this.settle(new EngineError("TIMEOUT", "The speech engine did not answer in time."))
      this.cancel()
    }, pending.timeoutMs)
    this.queue = promise.catch(() => undefined)
    void (async () => {
      await previous.catch(() => undefined)
      if (this.pending !== entry) return
      try {
        await this.start()
      } catch (error) {
        this.settle(error instanceof EngineError ? error : new EngineError("SIDECAR_FAILED", "The speech engine did not start."))
        return
      }
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
    })()
    return promise
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

  /** Writes a WAV to an absolute path. It does not play it; the player owns the speaker. */
  synthesize(text: string, path: string): Promise<{ path: string; durationMs: number; provider: string; model: string; voice: string }> {
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
      { type: "synthesize", text, path },
    ) as Promise<{ path: string; durationMs: number; provider: string; model: string; voice: string }>
  }

  /** Aborts the in-flight request and tells the engine, which drops its work. */
  cancel() {
    const pending = this.pending
    if (pending !== undefined) this.settle(new EngineError("CANCELLED", "The request was cancelled."))
    const child = this.child
    if (child?.stdin !== null && child?.stdin !== undefined && child.stdin.writable) {
      try {
        child.stdin.write(`${JSON.stringify({ v: 1, type: "abort" })}\n`)
      } catch {
        // The process is already gone.
      }
    }
  }

  /** Asks the engine to exit, then kills it if it does not. Only the exact child is signalled. */
  async stop(): Promise<void> {
    const child = this.child
    if (child === undefined) {
      this.setState("idle")
      return
    }
    this.stopping = true
    const exited = new Promise<void>((resolve) => {
      if (child.exitCode !== null) return resolve()
      child.once("exit", () => resolve())
    })
    try {
      child.stdin?.write(`${JSON.stringify({ v: 1, type: "shutdown" })}\n`)
    } catch {
      // Fall through to the signal.
    }
    const timer = setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGTERM")
    }, this.options.stopMs ?? STOP_TIMEOUT)
    await exited
    clearTimeout(timer)
    this.cleanup()
    this.ready = undefined
    this.stopping = false
    this.setState("idle")
  }

  /**
   * Restarts once after a crash and retries the failed request. Used by the engine layer for a first utterance after
   * an idle timeout; a second failure is reported as it is.
   */
  async restart(): Promise<void> {
    if (this.restarts >= 1) throw new EngineError("SIDECAR_FAILED", "The speech engine failed twice; it will not be restarted again.", "Run the doctor in /voice, then restart OpenCode.")
    this.restarts += 1
    await this.stop().catch(() => undefined)
    this.failure = undefined
    await this.start()
  }
}
