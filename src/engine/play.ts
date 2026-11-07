import { spawn, type ChildProcess } from "node:child_process"
import { EngineError } from "./errors.js"

export interface PlayerOptions {
  readonly bin: string
  readonly env?: Readonly<Record<string, string | undefined>>
  readonly log?: (level: "debug" | "warn" | "error", message: string) => void
  readonly rate?: number
}

/**
 * Playback, as `aurum play` owns it: one child per file, stopped by `stop()` with SIGTERM. The plugin never touches an
 * audio device, so no `afplay` and no second output stack.
 */
export class Player {
  private child: ChildProcess | undefined
  private resolveExit: (() => void) | undefined

  private readonly options: PlayerOptions

  constructor(options: PlayerOptions) {
    this.options = options
  }

  get playing(): boolean {
    return this.child !== undefined && this.child.exitCode === null
  }

  play(path: string, signal?: AbortSignal): Promise<void> {
    if (this.playing) return Promise.reject(new EngineError("BUSY", "A reply is already playing."))
    const args = ["play", path]
    if (this.options.rate !== undefined && this.options.rate !== 1) args.push("--rate", String(this.options.rate))
    let child: ChildProcess
    try {
      child = spawn(this.options.bin, args, { env: { ...process.env, ...this.options.env }, stdio: ["ignore", "ignore", "pipe"] })
    } catch (error) {
      return Promise.reject(new EngineError("ENGINE_MISSING", `The speech engine could not start: ${String(error)}`))
    }
    this.child = child
    let stderr = ""
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8")
    })
    return new Promise<void>((resolve, reject) => {
      this.resolveExit = resolve
      const abort = () => this.stop()
      signal?.addEventListener("abort", abort, { once: true })
      child.on("error", (error) => {
        this.child = undefined
        reject(new EngineError("ENGINE_MISSING", `The speech engine could not play audio: ${error.message}`))
      })
      child.on("exit", (code) => {
        this.child = undefined
        signal?.removeEventListener("abort", abort)
        if (signal?.aborted === true) return reject(new EngineError("CANCELLED", "Playback was stopped."))
        if (code === 0) return resolve()
        reject(
          /no (?:default )?(?:output|speaker)|device not found/i.test(stderr)
            ? new EngineError("AUDIO_DEVICE_MISSING", "No output device is available.")
            : new EngineError("SIDECAR_FAILED", "The reply could not be played."),
        )
      })
    })
  }

  /** Stops playback at once. Only the exact child is signalled. */
  stop(): void {
    const child = this.child
    if (child !== undefined && child.exitCode === null) child.kill("SIGTERM")
    this.resolveExit?.()
    this.resolveExit = undefined
  }
}
