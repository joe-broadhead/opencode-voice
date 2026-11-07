import { randomUUID } from "node:crypto"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { EngineError } from "./errors.js"
import { probeEngine } from "./binary.js"
import { Player } from "./play.js"
import { Recorder } from "./record.js"
import { AurumSidecar, sidecarArgs, type SidecarState } from "./sidecar.js"
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
  /** Verifies the models for a role before the engine reads them; called once per process for each role. */
  readonly preflight?: (role: "stt" | "tts") => Promise<void>
  readonly timeouts?: { readyMs?: number; transcribeMs?: number; synthesizeMs?: number; stopMs?: number }
}

export interface Transcript {
  readonly text: string
  readonly silent: boolean
  readonly provider: string
  readonly model: string
  readonly wav: WavInfo
}

/** Aurum's live utterance limit before 0.0.24's long-audio capability. */
const SIDECAR_UTTERANCE_SECONDS = 30

/**
 * The speech half of the plugin, with no OpenCode import: the sidecar, the recorder, the player and the temp files. The
 * TUI and the engine RPC both build on it, so they cannot disagree about silence, limits or cleanup.
 */
export class SpeechEngine {
  private sidecar: AurumSidecar | undefined
  private readonly player: Player
  private readonly options: SpeechEngineOptions
  private readonly temp: string
  private readonly checked = new Set<"stt" | "tts">()
  private activeRecorder: Recorder | undefined
  private recorderPath: string | undefined
  private versionChecked = false
  private disposed = false

  constructor(options: SpeechEngineOptions) {
    this.options = options
    this.temp = join(options.cacheRoot, "tmp", `${process.pid}-${randomUUID()}`)
    this.player = new Player({ bin: options.bin, ...(options.env === undefined ? {} : { env: options.env }), ...(options.log === undefined ? {} : { log: options.log }) })
  }

  /** The engine cache passed to Aurum as `--cache-dir`; it holds the models the plugin downloaded. */
  get cacheDir(): string {
    return join(this.options.cacheRoot, "engine")
  }

  get state(): SidecarState {
    return this.sidecar?.current ?? "idle"
  }

  /** The capabilities the running sidecar advertised; empty before it starts. */
  get caps(): readonly string[] {
    return this.sidecar?.caps ?? []
  }

  private async preflight(role: "stt" | "tts") {
    if (this.options.preflight === undefined || this.checked.has(role)) return
    await this.options.preflight(role)
    this.checked.add(role)
  }

  private async checkVersion() {
    if (this.versionChecked) return
    const probe = await probeEngine(this.options.bin, this.options.env)
    if (!probe.compatible) {
      throw new EngineError(
        "ENGINE_INCOMPATIBLE",
        probe.version === null
          ? "The speech engine did not report a version; Aurum 0.0.24 or later is required."
          : `Aurum ${probe.version} is older than the required ${"0.0.24"}; record, play and converse --stdio need 0.0.24.`,
      )
    }
    this.versionChecked = true
  }

  private async ensureSidecar(role: "stt" | "tts" = "stt"): Promise<AurumSidecar> {
    if (this.disposed) throw new EngineError("CANCELLED", "The engine has been shut down.")
    await this.checkVersion()
    await this.preflight(role)
    if (this.sidecar === undefined) {
      this.sidecar = new AurumSidecar({
        bin: this.options.bin,
        model: this.options.model,
        language: this.options.language,
        voice: this.options.voice,
        cacheDir: this.cacheDir,
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

  /** A recorder for one utterance. The engine owns it: dispose cancels it, and the caller releases the path. */
  async recorder(signal?: AbortSignal): Promise<{ recorder: Recorder; path: string }> {
    if (this.activeRecorder?.running === true) throw new EngineError("BUSY", "A recording is already running.")
    const path = await this.newPath("wav")
    const recorder = new Recorder({
      bin: this.options.bin,
      path,
      maxSeconds: this.options.maxRecordSeconds,
      ...(this.options.env === undefined ? {} : { env: this.options.env }),
      ...(this.options.log === undefined ? {} : { log: this.options.log }),
      onEnd: () => {
        if (this.activeRecorder === recorder) this.activeRecorder = undefined
      },
    })
    this.activeRecorder = recorder
    this.recorderPath = path
    signal?.addEventListener("abort", () => recorder.cancel(), { once: true })
    return { recorder, path }
  }

  /** Checks a WAV path without handing it to the engine. */
  async inspectWav(path: string): Promise<WavInfo & { bytes: number }> {
    let bytes: Buffer
    try {
      bytes = await readFile(path)
    } catch {
      throw new EngineError("BAD_AUDIO", "The recording could not be read.")
    }
    const info = readWav(bytes)
    if (info.seconds > 120) throw new EngineError("AUDIO_TOO_LONG", "The recording is longer than 120 seconds.")
    return { ...info, bytes: bytes.byteLength }
  }

  /** Refuses audio beyond Aurum's live limit unless the build advertises `long_audio`. */
  private assertLength(sidecar: AurumSidecar, seconds: number) {
    if (seconds > SIDECAR_UTTERANCE_SECONDS && !sidecar.caps.includes("long_audio")) {
      throw new EngineError("AUDIO_TOO_LONG", "This Aurum build accepts at most 30 seconds per utterance.")
    }
  }

  /** Transcribes a WAV path. Silent audio never reaches the model. */
  async transcribeFile(path: string): Promise<Transcript> {
    const wav = await this.inspectWav(path)
    if (isSilent(wav)) return { text: "", silent: true, provider: "local", model: this.options.model, wav }
    const sidecar = await this.ensureSidecar("stt")
    this.assertLength(sidecar, wav.seconds)
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
      const sidecar = await this.ensureSidecar("stt")
      this.assertLength(sidecar, wav.seconds)
      const result = await sidecar.transcribe(path)
      return { ...result, silent: false }
    } finally {
      await rm(path, { force: true })
    }
  }

  /** Synthesizes text to a temp WAV and returns its path; the caller plays it and calls `release`. */
  async synthesize(text: string, options: { markdown?: boolean; rate?: number } = {}): Promise<{ path: string; spoken: string; durationMs: number; voice: string }> {
    const spoken = options.markdown === true ? speakable(text) : text.trim()
    if (spoken === "") throw new EngineError("BAD_AUDIO", "There is nothing to read aloud.")
    const path = await this.newPath("wav")
    const sidecar = await this.ensureSidecar("tts")
    try {
      const result = await sidecar.synthesize(spoken, path, options.rate === undefined ? {} : { rate: options.rate })
      return { path, spoken, durationMs: result.durationMs, voice: result.voice || this.options.voice }
    } catch (error) {
      await rm(path, { force: true })
      throw error
    }
  }

  /** Plays a WAV, at an optional speaking rate, or rejects with `CANCELLED` when the caller aborts. */
  async play(path: string, options: { signal?: AbortSignal; rate?: number } = {}): Promise<void> {
    await this.player.play(path, { ...(options.signal === undefined ? {} : { signal: options.signal }), ...(options.rate === undefined ? {} : { rate: options.rate }) }).catch((error: unknown) => {
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
    this.activeRecorder?.cancel()
    this.activeRecorder = undefined
  }

  async release(path: string): Promise<void> {
    if (path === "") return
    await rm(path, { force: true })
  }

  async dispose(): Promise<void> {
    this.disposed = true
    this.player.stop()
    this.activeRecorder?.cancel()
    this.activeRecorder = undefined
    if (this.recorderPath !== undefined) await rm(this.recorderPath, { force: true }).catch(() => undefined)
    await this.sidecar?.stop().catch(() => undefined)
    this.sidecar = undefined
    // Only this instance's own temp folder is removed: the server and TUI parts do not share one.
    await rm(this.temp, { recursive: true, force: true }).catch(() => undefined)
  }
}

export { sidecarArgs }
