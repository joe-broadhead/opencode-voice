import { spawn, type ChildProcess } from "node:child_process"
import { stat } from "node:fs/promises"
import { createInterface, type Interface } from "node:readline"
import { EngineError } from "./errors.js"

export interface RecorderOptions {
  readonly bin: string
  readonly path: string
  readonly maxSeconds: number
  readonly env?: Readonly<Record<string, string | undefined>>
  readonly log?: (level: "debug" | "warn" | "error", message: string) => void
  /** How long a graceful stop may take before the child is terminated. */
  readonly stopMs?: number
}

export interface Recording {
  readonly path: string
  readonly bytes: number
  readonly seconds: number
}

const STOP_MS = 3_000

/** The stderr shapes the recorder maps to a user-facing code; everything else is an engine failure. */
function captureFailure(text: string): EngineError {
  if (/permission denied|not authorized|TCC/i.test(text)) {
    return new EngineError("MIC_DENIED", "The operating system refused microphone access.")
  }
  if (/no (?:default )?(?:input|microphone)|device not found|no such device/i.test(text)) {
    return new EngineError("MIC_UNAVAILABLE", "No input device is available.")
  }
  return new EngineError("SIDECAR_FAILED", "The microphone could not be opened.")
}

/**
 * The microphone, as `aurum record` owns it: 16 kHz mono WAV plus a JSONL level line every 20 ms. The plugin never
 * opens a device itself, so the OS grant belongs to the host process that started OpenCode, and one cross-platform
 * audio stack serves macOS and Linux.
 */
export class Recorder {
  private child: ChildProcess | undefined
  private lines: Interface | undefined
  private stderr: string[] = []
  private stopped = false
  private exited: Promise<number | null> = Promise.resolve(null)
  private started = false

  private readonly options: RecorderOptions

  constructor(options: RecorderOptions) {
    this.options = options
  }

  get running(): boolean {
    return this.child !== undefined && this.child.exitCode === null && !this.stopped
  }

  /**
   * Starts the recorder. `onLevel` receives dBFS for each 20 ms frame; `onExit` fires if the recorder ends on its own,
   * such as at the maximum length.
   */
  start(handlers: { onLevel: (dbfs: number) => void; onExit?: (error?: EngineError) => void }): void {
    if (this.started) throw new EngineError("BUSY", "A recording is already running.")
    this.started = true
    this.stopped = false
    const args = ["record", "-O", this.options.path, "--seconds", String(this.options.maxSeconds), "--level-events"]
    let child: ChildProcess
    try {
      child = spawn(this.options.bin, args, { env: { ...process.env, ...this.options.env }, stdio: ["ignore", "pipe", "pipe"] })
    } catch (error) {
      this.started = false
      throw new EngineError("ENGINE_MISSING", `The speech engine could not start: ${String(error)}`)
    }
    this.child = child
    if (child.stdout !== null) {
      this.lines = createInterface({ input: child.stdout })
      this.lines.on("line", (line) => {
        try {
          const event: unknown = JSON.parse(line)
          if (typeof event === "object" && event !== null && typeof (event as { level_dbfs?: unknown }).level_dbfs === "number") {
            handlers.onLevel((event as { level_dbfs: number }).level_dbfs)
          }
        } catch {
          // A log line on stdout is ignored: the level stream is the only contract.
        }
      })
    }
    if (child.stderr !== null) child.stderr.on("data", (chunk: Buffer) => this.stderr.push(chunk.toString("utf8")))
    this.exited = new Promise((resolve) => {
      child.on("error", (error) => {
        this.options.log?.("warn", `recorder error: ${error.message}`)
        handlers.onExit?.(new EngineError("ENGINE_MISSING", "The speech engine could not start."))
        resolve(null)
      })
      child.on("exit", (code) => {
        this.started = false
        if (this.stopped) return resolve(code)
        const error = code === 0 ? undefined : captureFailure(this.stderr.join(" "))
        handlers.onExit?.(error)
        resolve(code)
      })
    })
  }

  /** Ends the recording gracefully, so the WAV is finalised, then measures it. */
  async stop(): Promise<Recording> {
    const child = this.child
    this.stopped = true
    if (child !== undefined && child.exitCode === null) {
      child.kill("SIGINT")
      const timer = setTimeout(() => {
        if (child.exitCode === null) child.kill("SIGTERM")
      }, this.options.stopMs ?? STOP_MS)
      await this.exited
      clearTimeout(timer)
    }
    this.lines?.close()
    this.child = undefined
    this.started = false
    const info = await stat(this.options.path).catch(() => undefined)
    if (info === undefined || !info.isFile() || info.size <= 44) {
      throw new EngineError("NO_SPEECH", "No audio was recorded.")
    }
    return { path: this.options.path, bytes: info.size, seconds: (info.size - 44) / 32_000 }
  }

  /** Stops at once and keeps whatever was written; the caller deletes the file. */
  cancel(): void {
    this.stopped = true
    const child = this.child
    if (child !== undefined && child.exitCode === null) child.kill("SIGTERM")
    this.lines?.close()
    this.child = undefined
    this.started = false
  }
}
