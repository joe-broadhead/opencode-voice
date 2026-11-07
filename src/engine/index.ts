import { randomUUID } from "node:crypto"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { EngineError } from "./errors.js"
import { Player } from "./play.js"
import { Recorder } from "./record.js"
import { AurumSidecar, type SidecarState } from "./sidecar.js"
import { isSilent, readWav, type WavInfo } from "./wav.js"
import { speakable } from "./speakable.js"

export interface SpeechEngineOptions {
  readonly bin: string
  readonly model: string
  readonly language: string
  readonly cacheRoot: string
  readonly voice: string
  readonly maxRecordSeconds: number
  readonly env?: Readonly<Record<string, string | undefined>>
  readonly log?: (level: "debug" | "warn" | "error", message: string) => void
  readonly onState?: (state: SidecarState) => void
  readonly timeouts?: { readyMs?: number; transcribeMs?: number; synthesizeMs?: number; stopMs?: number }
}

export interface Transcript {
  readonly text: string
  readonly silent: boolean
  readonly provider: string
  readonly model: string
  readonly wav: WavInfo
}

/**
 * The speech half of the plugin, with no OpenCode import: the sidecar, the recorder, the player and the temp files. The
 * TUI and the engine RPC both build on it, so they cannot disagree about silence, limits or cleanup.
 */
export class SpeechEngine {
  private sidecar: AurumSidecar | undefined
  private readonly player: Player
  private readonly temp: string
  private disposed = false

  private readonly options: SpeechEngineOptions

  constructor(options: SpeechEngineOptions) {
    this.options = options
    this.temp = join(options.cacheRoot, "tmp")
    this.player = new Player({ bin: options.bin, ...(options.env === undefined ? {} : { env: options.env }), ...(options.log === undefined ? {} : { log: options.log }) })
  }

  get state(): SidecarState {
    return this.sidecar?.current ?? "idle"
  }

  private async ensureSidecar(): Promise<AurumSidecar> {
    if (this.disposed) throw new EngineError("CANCELLED", "The engine has been shut down.")
    if (this.sidecar === undefined) {
      this.sidecar = new AurumSidecar({
        bin: this.options.bin,
        model: this.options.model,
        language: this.options.language,
        ...(this.options.env === undefined ? {} : { env: this.options.env }),
        ...(this.options.log === undefined ? {} : { log: this.options.log }),
        ...(this.options.onState === undefined ? {} : { onState: this.options.onState }),
        ...(this.options.timeouts?.readyMs === undefined ? {} : { readyMs: this.options.timeouts.readyMs }),
        ...(this.options.timeouts?.transcribeMs === undefined ? {} : { transcribeMs: this.options.timeouts.transcribeMs }),
        ...(this.options.timeouts?.synthesizeMs === undefined ? {} : { synthesizeMs: this.options.timeouts.synthesizeMs }),
        ...(this.options.timeouts?.stopMs === undefined ? {} : { stopMs: this.options.timeouts.stopMs }),
      })
    }
    return this.sidecar
  }

  /** Starts the sidecar and loads the model, so the first dictation does not pay the cold start. */
  async warmup(): Promise<{ ready: boolean; state: SidecarState }> {
    const sidecar = await this.ensureSidecar()
    await sidecar.start()
    return { ready: true, state: sidecar.current }
  }

  private async newPath(extension: "wav"): Promise<string> {
    await mkdir(this.temp, { recursive: true, mode: 0o700 })
    return join(this.temp, `voice-${randomUUID()}.${extension}`)
  }

  /** A recorder for one utterance; the caller owns its lifecycle and deletes the file through `release`. */
  async recorder(signal?: AbortSignal): Promise<{ recorder: Recorder; path: string }> {
    const path = await this.newPath("wav")
    const recorder = new Recorder({
      bin: this.options.bin,
      path,
      maxSeconds: this.options.maxRecordSeconds,
      ...(this.options.env === undefined ? {} : { env: this.options.env }),
      ...(this.options.log === undefined ? {} : { log: this.options.log }),
    })
    signal?.addEventListener("abort", () => recorder.cancel(), { once: true })
    return { recorder, path }
  }

  /** Checks a WAV path without reading it into memory. */
  async inspectWav(path: string): Promise<WavInfo & { bytes: number }> {
    let bytes: Buffer
    try {
      bytes = await readFile(path)
    } catch {
      throw new EngineError("BAD_AUDIO", "The recording could not be read.")
    }
    const info = readWav(bytes)
    if (info.seconds > 600) throw new EngineError("AUDIO_TOO_LONG", "The recording is longer than ten minutes.")
    return { ...info, bytes: bytes.byteLength }
  }

  /** Transcribes a WAV path. Silent audio never reaches the model. */
  async transcribeFile(path: string): Promise<Transcript> {
    const wav = await this.inspectWav(path)
    if (isSilent(wav)) return { text: "", silent: true, provider: "local", model: this.options.model, wav }
    const sidecar = await this.ensureSidecar()
    const result = await sidecar.transcribe(path)
    return { ...result, silent: false, wav }
  }

  /** Transcribes bytes, as the engine RPC receives them: a private temp file, deleted whatever happens. */
  async transcribeBytes(bytes: Uint8Array): Promise<Omit<Transcript, "wav">> {
    const wav = readWav(bytes)
    if (wav.seconds > 120) throw new EngineError("AUDIO_TOO_LONG", "The audio is longer than 120 seconds.")
    if (isSilent(wav)) return { text: "", silent: true, provider: "local", model: this.options.model }
    const path = await this.newPath("wav")
    try {
      await writeFile(path, bytes, { mode: 0o600 })
      const sidecar = await this.ensureSidecar()
      const result = await sidecar.transcribe(path)
      return { ...result, silent: false }
    } finally {
      await rm(path, { force: true })
    }
  }

  /** Synthesizes text to a temp WAV and returns its path; the caller plays it and calls `release`. */
  async synthesize(text: string, options: { markdown?: boolean } = {}): Promise<{ path: string; spoken: string; durationMs: number; voice: string }> {
    const spoken = options.markdown === true ? speakable(text) : text.trim()
    if (spoken === "") throw new EngineError("BAD_AUDIO", "There is nothing to read aloud.")
    const path = await this.newPath("wav")
    const sidecar = await this.ensureSidecar()
    try {
      const result = await sidecar.synthesize(spoken, path)
      return { path, spoken, durationMs: result.durationMs, voice: result.voice || this.options.voice }
    } catch (error) {
      await rm(path, { force: true })
      throw error
    }
  }

  /** Plays a WAV, or rejects with `CANCELLED` when the caller aborts. */
  async play(path: string, signal?: AbortSignal): Promise<void> {
    await this.player.play(path, signal).catch((error: unknown) => {
      if (error instanceof EngineError && error.code === "CANCELLED") return
      throw error
    })
  }

  stopPlayback(): void {
    this.player.stop()
  }

  cancel(): void {
    this.sidecar?.cancel()
    this.player.stop()
  }

  async release(path: string): Promise<void> {
    await rm(path, { force: true })
  }

  async dispose(): Promise<void> {
    this.disposed = true
    this.player.stop()
    await this.sidecar?.stop().catch(() => undefined)
    this.sidecar = undefined
    await rm(this.temp, { recursive: true, force: true }).catch(() => undefined)
  }
}
