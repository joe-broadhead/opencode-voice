import { homedir } from "node:os"
import { join } from "node:path"
import type { Options } from "../options.js"
import { ModelStore, defaultCacheRoot, type InspectedAsset } from "./assets.js"
import { probeEngine, resolveEngine, type EngineInfo, type EngineProbe } from "./binary.js"
import { deviceName, microphonePermission, runDoctor, type DoctorCheck } from "./doctor.js"
import { EngineError } from "./errors.js"
import { SpeechEngine } from "./index.js"
import { installAll, installRequest, type InstallRequest } from "./install.js"

export type { MicrophonePermission } from "./doctor.js"

/** The live engine facts a status or doctor answer is built from. Absent facts mean unknown, never zero. */
export interface EngineFacts {
  readonly engine?: EngineInfo | undefined
  readonly probe?: EngineProbe | undefined
  readonly doctor?: readonly DoctorCheck[] | undefined
  readonly microphone: "authorized" | "denied" | "restricted" | "not_determined" | "unknown"
  readonly input?: string | undefined
  readonly output?: string | undefined
  readonly models?: readonly InspectedAsset[] | undefined
  readonly modelsVersion?: string | undefined
  /** Set when the engine could not be resolved or verified: the precise reason, never a path. */
  readonly engineError?: EngineError | undefined
}

export interface ProviderInput {
  readonly packageRoot: string
  readonly options: Options
  readonly cacheRoot?: string
  readonly home?: string
  readonly platform?: string
  readonly arch?: string
  readonly env?: Readonly<Record<string, string | undefined>>
  /** Injected by tests: the only seam that can reach the network, and only an install uses it. */
  readonly fetchImpl?: typeof fetch
}

/** The one place the speech engine, the model cache and the pinned release are named. */
export interface Provider {
  readonly packageRoot: string
  readonly cacheRoot: string
  /** `<cacheRoot>/engine`, passed to every engine command as `--cache-dir`. */
  readonly engineCacheDir: string
  /** Absent when the engine is not installed: the plugin's reads still work. */
  readonly engine: SpeechEngine | undefined
  readonly engineInfo: EngineInfo | undefined
  readonly store: ModelStore
  /** What an install would fetch, for the one ask. */
  installRequest(): Promise<InstallRequest>
  /** Downloads the engine and the missing models after `ask` answers with yes. */
  install(signal: AbortSignal, ask: (request: InstallRequest) => Promise<void>): Promise<{ downloaded: string[]; bytes: number }>
  /** The engine, model, microphone and doctor facts, with a 30-second probe cache. */
  facts(): Promise<EngineFacts>
  dispose(): Promise<void>
}

const PROBE_TTL_MS = 30_000

export function createProvider(input: ProviderInput): Provider {
  const platform = input.platform ?? process.platform
  const arch = input.arch ?? process.arch
  const env = input.env ?? process.env
  const cacheRoot = input.cacheRoot ?? defaultCacheRoot(input.home ?? homedir(), platform, env)
  const engineCacheDir = join(cacheRoot, "engine")
  const options = input.options

  let engineInfo: EngineInfo | undefined
  let engineError: EngineError | undefined
  try {
    engineInfo = resolveEngine({
      packageRoot: input.packageRoot,
      cacheRoot,
      env,
      platform,
      arch,
      ...(options.aurumPath === undefined ? {} : { optionPath: options.aurumPath }),
    })
  } catch (error) {
    engineError = error instanceof EngineError ? error : new EngineError("ENGINE_MISSING", "The speech engine could not be resolved.")
  }

  const store = new ModelStore({
    cacheRoot,
    manifestPath: env.VOICE_MODELS_MANIFEST ?? join(input.packageRoot, "manifest", "models.json"),
    ...(options.assetsDir === undefined ? {} : { assetsDir: options.assetsDir }),
    ...(input.fetchImpl === undefined ? {} : { fetchImpl: input.fetchImpl }),
  })

  const engine =
    engineInfo === undefined
      ? undefined
      : new SpeechEngine({
          bin: engineInfo.path,
          model: options.sttModel,
          language: options.language,
          cacheRoot,
          voice: options.voice,
          maxRecordSeconds: options.maxRecordSeconds,
          env,
          preflight: (role: "stt" | "tts") => store.verifyRoles(role === "stt" ? ["stt"] : ["tts-model", "tts-voices", "tts-config"]),
        })

  let probe: { readonly at: number; readonly version: EngineProbe; readonly check: readonly DoctorCheck[] | undefined } | undefined
  const probeFor = async (info: EngineInfo) => {
    if (probe !== undefined && Date.now() - probe.at < PROBE_TTL_MS) return probe
    const [version, check] = await Promise.all([
      probeEngine(info.path, env),
      runDoctor(info.path, { env, cacheDir: engineCacheDir }).catch(() => undefined),
    ])
    probe = { at: Date.now(), version, check }
    return probe
  }

  return {
    packageRoot: input.packageRoot,
    cacheRoot,
    engineCacheDir,
    engine,
    engineInfo,
    store,
    async facts(): Promise<EngineFacts> {
      const live = engineInfo === undefined ? undefined : await probeFor(engineInfo)
      const manifest = await store.manifest().catch(() => undefined)
      const models = await store.inspect().catch(() => undefined)
      return {
        ...(engineInfo === undefined ? {} : { engine: engineInfo }),
        ...(live === undefined ? {} : { probe: live.version }),
        ...(models === undefined ? {} : { models }),
        ...(manifest === undefined ? {} : { modelsVersion: manifest.version }),
        ...(live?.check === undefined ? {} : { doctor: live.check }),
        microphone: live?.check === undefined ? "unknown" : microphonePermission(live.check),
        ...(live?.check === undefined ? {} : { input: deviceName(live.check, "input") ?? undefined }),
        ...(live?.check === undefined ? {} : { output: deviceName(live.check, "output") ?? undefined }),
        ...(engineError === undefined ? {} : { engineError }),
      }
    },
    installRequest: () =>
      installRequest({
        packageRoot: input.packageRoot,
        cacheRoot,
        platform,
        arch,
        store,
      }),
    install: (signal, ask) =>
      installAll({ packageRoot: input.packageRoot, cacheRoot, platform, arch, store }, signal, ask),
    async dispose() {
      await engine?.dispose()
    },
  }
}
