import { homedir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { Plugin } from "@opencode/plugin"
import { installModels, registerCommands } from "./commands.js"
import { DEFAULT_KEYBIND_MAC, DEFAULT_KEYBIND_OTHER, PLUGIN_ID } from "./constants.js"
import { ModelStore, defaultCacheRoot } from "./engine/assets.js"
import { resolveEngine } from "./engine/binary.js"
import { microphonePermission, runDoctor, type DoctorCheck } from "./engine/doctor.js"
import { SpeechEngine } from "./engine/index.js"
import { platformKey } from "./engine/platform.js"
import { checkHost } from "./host-version.js"
import { registerDefaultRules, unguardedAgents as unguardedOf, type AgentInfo } from "./host/permissions.js"
import { ownedMethods, toolTransform } from "./host/tools.js"
import { METHODS, registerToolsRpc } from "./host/tools-rpc.js"
import { parseOptions, type Options } from "./options.js"
import { registerEngineRpc, registerStatusRpc } from "./rpc.js"
import { buildStatus, type Status } from "./status.js"

/** The package root, so the shipped manifest is found from the bundle. */
const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url))

const DEFAULT_KEYBIND = process.platform === "darwin" ? DEFAULT_KEYBIND_MAC : DEFAULT_KEYBIND_OTHER

const keybindOf = (options: Options) => options.keybind ?? DEFAULT_KEYBIND

/** The facts one probe reads, cached briefly so a dialog refresh is not a doctor run. */
interface Probe {
  readonly at: number
  readonly check: readonly DoctorCheck[] | undefined
}

export default Plugin.define({
  id: PLUGIN_ID,
  async setup(ctx) {
    const parsed = parseOptions(ctx.options)
    const host = checkHost(ctx.app.version, parsed.ok ? parsed.options.allowUntestedHost : true)
    const setup =
      parsed.ok === false
        ? { code: "OPTIONS_INVALID", message: `Option ${parsed.error.field}: ${parsed.error.message}`, next: parsed.error.next }
        : undefined
    const options = parsed.ok ? parsed.options : undefined

    let probe: Probe | undefined
    const doctorFor = async (bin: string): Promise<readonly DoctorCheck[] | undefined> => {
      if (probe !== undefined && Date.now() - probe.at < 30_000) return probe.check
      const check = await runDoctor(bin).catch(() => undefined)
      probe = { at: Date.now(), check }
      return check
    }

    const engineInfo = (() => {
      try {
        return resolveEngine({
          packageRoot: PACKAGE_ROOT,
          ...(options?.aurumPath === undefined ? {} : { optionPath: options.aurumPath }),
        })
      } catch {
        return undefined
      }
    })()

    const modelStore = options === undefined ? undefined : new ModelStore({
      cacheRoot: defaultCacheRoot(homedir(), process.platform),
      manifestPath: process.env.VOICE_MODELS_MANIFEST ?? join(PACKAGE_ROOT, "manifest", "models.json"),
      ...(options.assetsDir === undefined ? {} : { assetsDir: options.assetsDir }),
    })

    const engine =
      engineInfo === undefined || options === undefined
        ? undefined
        : new SpeechEngine({
            bin: engineInfo.path,
            model: options.sttModel,
            language: options.language,
            cacheRoot: defaultCacheRoot(homedir(), process.platform),
            voice: options.voice,
            maxRecordSeconds: options.maxRecordSeconds,
          })

    const agents = async (): Promise<readonly AgentInfo[]> =>
      ctx.agent.list(ctx.location === undefined ? undefined : { location: { directory: ctx.location.directory } }).then(
        (found) => found.data as readonly AgentInfo[],
        () => [],
      )

    const readStatus = async (): Promise<Status> => {
      const list = await agents()
      const modelManifest = modelStore === undefined ? undefined : await modelStore.manifest().catch(() => undefined)
      const models = modelStore === undefined ? undefined : await modelStore.inspect().catch(() => undefined)
      const check = engineInfo === undefined ? undefined : await doctorFor(engineInfo.path)
      const action = (options ?? { submit: "send" as const, autoSpeak: false, voice: "Luna", sttModel: "tiny-q5_1", language: "auto", maxRecordSeconds: 120, statusIndicator: "toast" as const, keepTranscripts: false, allowUntestedHost: false, engine: true })
      return buildStatus({
        host,
        ...(engineInfo === undefined ? {} : { engine: engineInfo }),
        ...(models === undefined ? {} : { models }),
        ...(modelManifest === undefined ? {} : { modelsVersion: modelManifest.version }),
        ...(check === undefined ? {} : { doctor: check }),
        ...(check === undefined ? {} : { microphone: microphonePermission(check) }),
        options: action,
        keybind: keybindOf(action),
        sidecar: engine?.state ?? "idle",
        unguardedAgents: unguardedOf(list),
        ...(setup === undefined ? {} : { setup }),
      })
    }

    const stops: (() => Promise<void>)[] = []
    stops.push(await registerCommands(ctx, {
      status: readStatus,
      install: async (signal) => {
        if (modelStore === undefined) throw new Error("The model manifest is unavailable.")
        return installModels(modelStore, signal)
      },
    }))
    stops.push(await registerStatusRpc(ctx.rpc, readStatus))

    if (options !== undefined && engine !== undefined && modelStore !== undefined) {
      const toolInput = {
        engine,
        status: readStatus,
        assert: ctx.permission.assert,
      }
      stops.push(await ctx.tool.transform(toolTransform(toolInput)).then((registration) => registration.dispose))
      stops.push(await registerToolsRpc(ctx, { methods: [...METHODS, ...ownedMethods(toolInput)] }))
      if (options.engine) stops.push(await registerEngineRpc(ctx.rpc, { engine, status: readStatus }))
    }

    // The rules are transformed on every rebuild; inserting once is guarded.
    stops.push(await registerDefaultRules(ctx.agent).then((registration) => registration.dispose).catch(() => async () => {}))

    return async () => {
      for (const stop of stops.reverse()) await stop().catch(() => undefined)
      await engine?.dispose()
    }
  },
})

export { DEFAULT_KEYBIND, keybindOf, platformKey }
