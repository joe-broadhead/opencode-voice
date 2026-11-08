import { homedir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { Plugin } from "@opencode/plugin"
import { installAll, installRequest, registerCommands } from "./commands.js"
import { DEFAULT_KEYBIND_MAC, DEFAULT_KEYBIND_OTHER, PLUGIN_ID, SUPPORTED_HOST, TESTED_HOSTS } from "./constants.js"
import { ModelStore, defaultCacheRoot } from "./engine/assets.js"
import { probeEngine, resolveEngine, type EngineInfo, type EngineProbe } from "./engine/binary.js"
import { deviceName, microphonePermission, runDoctor, type DoctorCheck } from "./engine/doctor.js"
import { SpeechEngine } from "./engine/index.js"
import { EngineError } from "./engine/errors.js"
import { isSupportedHost } from "./host-version.js"
import { registerDefaultRules, unguardedAgents as unguardedOf, type AgentInfo } from "./host/permissions.js"
import { ownedMethods, toolTransform } from "./host/tools.js"
import { METHODS, registerToolsRpc } from "./host/tools-rpc.js"
import { parseOptions, type Options } from "./options.js"
import { registerEngineRpc, registerStatusRpc } from "./rpc.js"
import { buildStatus, type Status } from "./status.js"

const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url))
const DEFAULT_KEYBIND = process.platform === "darwin" ? DEFAULT_KEYBIND_MAC : DEFAULT_KEYBIND_OTHER

const keybindOf = (options: Options) => options.keybind ?? DEFAULT_KEYBIND

const isEngineError = (error: unknown): error is EngineError => error instanceof EngineError

const FALLBACK_OPTIONS: Options = {
  submit: "send",
  autoSpeak: false,
  voice: "Luna",
  sttModel: "tiny-q5_1",
  language: "auto",
  maxRecordSeconds: 120,
  statusIndicator: "toast",
  keepTranscripts: false,
  allowUntestedHost: false,
  engine: true,
  access: "all",
}

export default Plugin.define({
  id: PLUGIN_ID,
  async setup(ctx) {
    const parsed = parseOptions(ctx.options)
    const supported = isSupportedHost(ctx.app.version)
    const host = { version: ctx.app.version === "" ? null : ctx.app.version, range: SUPPORTED_HOST, tested: TESTED_HOSTS.includes(ctx.app.version) }
    const setup =
      parsed.ok === false
        ? { code: "OPTIONS_INVALID", message: `Option ${parsed.error.field}: ${parsed.error.message}`, next: parsed.error.next }
        : !supported && !parsed.options.allowUntestedHost
          ? {
              code: "HOST_UNTESTED",
              message: `OpenCode ${ctx.app.version || "of an unknown version"} is outside the supported range ${SUPPORTED_HOST}, so Voice is in status-only mode.`,
              next: `Use OpenCode ${SUPPORTED_HOST}, or set "allowUntestedHost": true.`,
            }
          : undefined
    const options = parsed.ok ? parsed.options : undefined
    const enabled = setup === undefined && options !== undefined

    const cacheRoot = defaultCacheRoot(homedir(), process.platform)
    const engineCacheDir = join(cacheRoot, "engine")

    let probe: { at: number; check: readonly DoctorCheck[] | undefined; version: EngineProbe } | undefined
    const probeFor = async (info: EngineInfo): Promise<{ check: readonly DoctorCheck[] | undefined; version: EngineProbe }> => {
      if (probe !== undefined && Date.now() - probe.at < 30_000) return probe
      const [version, check] = await Promise.all([
        probeEngine(info.path),
        runDoctor(info.path, { cacheDir: engineCacheDir }).catch(() => undefined),
      ])
      probe = { at: Date.now(), check, version }
      return probe
    }

    const engineInfo = (() => {
      if (!enabled) return undefined
      try {
        return resolveEngine({
          packageRoot: PACKAGE_ROOT,
          cacheRoot,
          ...(options?.aurumPath === undefined ? {} : { optionPath: options.aurumPath }),
        })
      } catch (error) {
        return { error } as const
      }
    })()

    const modelStore =
      options === undefined
        ? undefined
        : new ModelStore({
            cacheRoot,
            manifestPath: process.env.VOICE_MODELS_MANIFEST ?? join(PACKAGE_ROOT, "manifest", "models.json"),
            ...(options.assetsDir === undefined ? {} : { assetsDir: options.assetsDir }),
          })

    const engine =
      engineInfo === undefined || "error" in engineInfo || options === undefined
        ? undefined
        : new SpeechEngine({
            bin: engineInfo.path,
            model: options.sttModel,
            language: options.language,
            cacheRoot,
            voice: options.voice,
            maxRecordSeconds: options.maxRecordSeconds,
            ...(modelStore === undefined
              ? {}
              : {
                  preflight: (role: "stt" | "tts") =>
                    modelStore.verifyRoles(role === "stt" ? ["stt"] : ["tts-model", "tts-voices", "tts-config"]),
                }),
          })

    const agents = async (): Promise<readonly AgentInfo[]> =>
      ctx.agent.list(ctx.location === undefined ? undefined : { location: { directory: ctx.location.directory } }).then(
        (found) => found.data as readonly AgentInfo[],
        () => [],
      )

    const readStatus = async (): Promise<Status> => {
      const list = await agents()
      const info = engineInfo !== undefined && !("error" in engineInfo) ? engineInfo : undefined
      const manifest = modelStore === undefined ? undefined : await modelStore.manifest().catch(() => undefined)
      const models = modelStore === undefined ? undefined : await modelStore.inspect().catch(() => undefined)
      const live = info === undefined ? undefined : await probeFor(info)
      const action = options ?? FALLBACK_OPTIONS
      return buildStatus({
        host,
        ...(info === undefined ? {} : { engine: info }),
        ...(live === undefined ? {} : { probe: live.version }),
        ...(models === undefined ? {} : { models }),
        ...(manifest === undefined ? {} : { modelsVersion: manifest.version }),
        ...(live?.check === undefined ? {} : { doctor: live.check }),
        ...(live?.check === undefined ? {} : { microphone: microphonePermission(live.check) }),
        ...(live?.check === undefined ? {} : { input: deviceName(live.check, "input") ?? undefined }),
        ...(live?.check === undefined ? {} : { output: deviceName(live.check, "output") ?? undefined }),
        options: action,
        keybind: keybindOf(action),
        tools: engine === undefined ? { registered: 0, readable: 0 } : { registered: 2, readable: 1 },
        unguardedAgents: unguardedOf(list, options?.access ?? "all"),
        ...(setup === undefined ? {} : { setup }),
        ...(engineInfo !== undefined && "error" in engineInfo && isEngineError(engineInfo.error)
          ? { engineError: { code: engineInfo.error.code, message: engineInfo.error.message, next: engineInfo.error.next } }
          : {}),
      })
    }

    const stops: (() => Promise<void>)[] = []
    stops.push(
      await registerCommands(ctx, {
        status: readStatus,
        install: async (sessionID, signal) => {
          if (modelStore === undefined) throw new Error("The model manifest is unavailable.")
          const target = { packageRoot: PACKAGE_ROOT, cacheRoot, store: modelStore }
          const request = await installRequest(target)
          if (request.files.length === 0) return { downloaded: [], bytes: 0 }
          await ctx.permission.assert({
            sessionID,
            action: "voice_install",
            resources: request.hosts,
            save: request.hosts,
            metadata: { bytes: request.bytes, files: request.files },
          })
          return installAll(target, signal, async () => undefined)
        },
      }),
    )
    stops.push(await registerStatusRpc(ctx.rpc, readStatus))

    if (options !== undefined && engine !== undefined && modelStore !== undefined) {
      const toolInput = { engine, status: readStatus, assert: ctx.permission.assert }
      stops.push(await ctx.tool.transform(toolTransform(toolInput)).then((registration) => registration.dispose))
      stops.push(await registerToolsRpc(ctx, { methods: [...METHODS, ...ownedMethods(toolInput)] }))
      if (options.engine) stops.push(await registerEngineRpc(ctx.rpc, { engine, status: readStatus }))
      stops.push(await registerDefaultRules(ctx.agent, options.access).then((registration) => registration.dispose).catch(() => async () => {}))
    }

    return async () => {
      for (const stop of stops.reverse()) await stop().catch(() => undefined)
      await engine?.dispose()
    }
  },
})

