import { spawn, type ChildProcess } from "node:child_process"
import { EngineError } from "./errors.js"

export interface PlayerOptions {
  readonly bin: string
  readonly env?: Readonly<Record<string, string | undefined>>
  readonly log?: (level: "debug" | "warn" | "error", message: string) => void
  readonly rate?: number
}

/** One playback owns its child, its settlement and its cancellation listener; nothing outlives it. */
interface Playback {
  readonly child: ChildProcess
  readonly stop: () => void
  /** Resolves when this exact child has actually exited or its spawn has failed. */
  readonly done: Promise<void>
}

/** A settled child may still report a failed `kill`; swallow that late error rather than leave it unhandled. */
const ignoreError = () => undefined

/**
 * Playback, as `aurum play` owns it: one child per file, stopped by `stop()` with SIGTERM. The plugin never touches an
 * audio device, so no `afplay` and no second output stack.
 */
export class Player {
  private current: Playback | undefined

  private readonly options: PlayerOptions

  constructor(options: PlayerOptions) {
    this.options = options
  }

  get playing(): boolean {
    return this.current !== undefined && this.current.child.exitCode === null
  }

  play(path: string, options: { signal?: AbortSignal; rate?: number } = {}): Promise<void> {
    const { signal } = options
    if (this.playing) return Promise.reject(new EngineError("BUSY", "A reply is already playing."))
    if (signal?.aborted === true) return Promise.reject(new EngineError("CANCELLED", "Playback was stopped."))
    const args = ["play", path]
    const rate = options.rate ?? this.options.rate
    if (rate !== undefined && rate !== 1) args.push("--rate", String(rate))
    let child: ChildProcess
    try {
      child = spawn(this.options.bin, args, { env: { ...process.env, ...this.options.env }, stdio: ["ignore", "ignore", "pipe"] })
    } catch (error) {
      return Promise.reject(new EngineError("ENGINE_MISSING", `The speech engine could not start: ${String(error)}`))
    }
    return new Promise<void>((resolve, reject) => {
      let settled = false
      let released = false
      let escalation: ReturnType<typeof setTimeout> | undefined
      let done!: () => void
      const exited = new Promise<void>((resolveDone) => {
        done = resolveDone
      })
      let stderr = ""
      const onData = (chunk: Buffer) => {
        stderr += chunk.toString("utf8")
      }
      child.stderr?.on("data", onData)

      /** Settle this call once. The exclusive player slot stays held until the child actually exits. */
      const settle = (error?: EngineError) => {
        if (settled) return
        settled = true
        signal?.removeEventListener("abort", abort)
        child.stderr?.removeListener("data", onData)
        if (error === undefined) resolve()
        else reject(error)
      }

      /** Free the slot once, only for this playback's own child. */
      const release = () => {
        if (released) return
        released = true
        if (escalation !== undefined) {
          clearTimeout(escalation)
          escalation = undefined
        }
        child.removeListener("error", onError)
        child.removeListener("exit", onExit)
        child.on("error", ignoreError)
        if (this.current === playback) this.current = undefined
        done()
      }

      /** Stop this playback's exact child and escalate if it does not exit. */
      const kill = () => {
        if (child.exitCode !== null) return
        child.kill("SIGTERM")
        if (escalation !== undefined) return
        escalation = setTimeout(() => {
          escalation = undefined
          if (child.exitCode === null) child.kill("SIGKILL")
        }, 1_000)
        escalation.unref?.()
      }

      const abort = () => {
        if (settled) return
        try {
          kill()
        } finally {
          // Reject the owning call at once, but keep the slot while the child may still be alive.
          settle(new EngineError("CANCELLED", "Playback was stopped."))
        }
      }

      const onError = (error: Error) => {
        settle(new EngineError("ENGINE_MISSING", `The speech engine could not play audio: ${error.message}`))
        // A spawn failure has no pid and no future exit; a failed kill of a live child keeps the slot.
        if (child.pid === undefined || child.exitCode !== null) release()
      }

      const onExit = (code: number | null) => {
        if (signal?.aborted === true) settle(new EngineError("CANCELLED", "Playback was stopped."))
        else if (code === 0) settle()
        else {
          settle(
            /no (?:default )?(?:output|speaker)|device not found/i.test(stderr)
              ? new EngineError("AUDIO_DEVICE_MISSING", "No output device is available.")
              : new EngineError("SIDECAR_FAILED", "The reply could not be played."),
          )
        }
        release()
      }

      const playback: Playback = { child, stop: abort, done: exited }
      this.current = playback
      signal?.addEventListener("abort", abort, { once: true })
      child.on("error", onError)
      child.on("exit", onExit)
      // An abort that lands between the early check and this listener must still stop the new child.
      if (signal?.aborted === true) abort()
    })
  }

  /** Stops the current playback at once, escalating SIGTERM to SIGKILL. Only that playback's exact child is signalled,
   * and its pending `play` is rejected as `CANCELLED`, so a caller never reports a stopped reply as played. */
  stop(): void {
    this.current?.stop()
  }

  /** Stop the exact current child and resolve only after it has exited or its spawn has failed. */
  stopAndWait(): Promise<void> {
    const current = this.current
    this.stop()
    return current === undefined ? Promise.resolve() : current.done
  }
}
