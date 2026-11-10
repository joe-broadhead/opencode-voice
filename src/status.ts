import { errorText, NEXT_STEPS } from "./constants.js"
import { isSupportedHost } from "./host-version.js"
import type { EngineInfo, EngineProbe } from "./engine/binary.js"
import type { InspectedAsset } from "./engine/assets.js"
import type { DoctorCheck } from "./engine/doctor.js"
import type { HostCheck } from "./host-version.js"
import type { Options } from "./options.js"
import { oneLine } from "./redact.js"
import { VERSION } from "./version.js"

/** The shared status labels in machine form. `conflict` is the keybind conflict the TUI detects. */
export type State = "ready" | "not_configured" | "failed" | "host_untested" | "conflict"

export type MicrophonePermission = "authorized" | "denied" | "restricted" | "not_determined" | "unknown"

export interface StatusFacts {
  readonly host: HostCheck
  readonly engine?: EngineInfo
  readonly probe?: EngineProbe
  readonly models?: readonly InspectedAsset[]
  readonly modelsVersion?: string
  readonly doctor?: readonly DoctorCheck[]
  readonly microphone?: MicrophonePermission
  readonly input?: string
  readonly output?: string
  readonly options: Options
  readonly keybind: string
  /** The tool counts this instance actually registered. */
  readonly tools?: { readonly registered: number; readonly readable: number }
  /** A key the TUI found another command already owns, with that command's title. */
  readonly keybindConflict?: { readonly key: string; readonly command: string }
  readonly lastLatencyMs?: number
  readonly unguardedAgents?: readonly string[]
  readonly problems?: readonly string[]
  /** Set when setup could not run, so status can still answer. */
  readonly setup?: { readonly code: string; readonly message: string; readonly next: string }
  /** The engine could not be resolved or verified: a coded refusal with its next step. */
  readonly engineError?: { readonly code: string; readonly message: string; readonly next: string }
}

export interface Status {
  readonly version: string
  readonly state: State
  readonly host: HostCheck
  readonly unguardedAgents: readonly string[]
  readonly nextStep: string
  readonly engine: {
    readonly installed: boolean
    readonly version: string | null
    readonly path: string | null
    readonly verified: boolean
    readonly compatible: boolean
    readonly platform: string
    readonly source: string | null
  }
  readonly models: {
    readonly version: string | null
    readonly stt: ModelView | null
    readonly tts: ModelView | null
  }
  readonly microphone: {
    readonly permission: MicrophonePermission
    readonly input: string | null
    readonly output: string | null
  }
  readonly dictation: {
    readonly keybind: string
    readonly submit: "send" | "review"
    readonly lastLatencyMs: number | null
  }
  readonly tools: { readonly registered: number; readonly readable: number }
  readonly providers: { readonly stt: "local"; readonly tts: "local" }
  readonly privacy: {
    readonly audioLeavesMachine: false
    readonly keepRecordings: false
    readonly transcriptHistory: boolean
  }
  readonly problems: readonly string[]
}

export interface ModelView {
  readonly name: string
  readonly bytes: number
  readonly licence: string
  readonly state: string
  readonly path: string
}

const view = (asset: InspectedAsset | undefined): ModelView | null =>
  asset === undefined
    ? null
    : { name: asset.name, bytes: asset.bytes, licence: asset.licence, state: asset.state, path: asset.path }

const modelOf = (models: readonly InspectedAsset[] | undefined, role: string) => models?.find((asset) => asset.role === role)

/** The one status model the dialog, `/voice-status`, the status RPC and `voice_status` render. */
export function buildStatus(facts: StatusFacts): Status {
  const engine = facts.engine
  const models = facts.models
  const stt = modelOf(models, "stt")
  const tts = modelOf(models, "tts-model")
  const microphone = facts.microphone ?? "unknown"
  const problems = [...(facts.problems ?? [])]
  if (facts.setup !== undefined) problems.unshift(facts.setup.message)
  if (facts.engineError !== undefined) problems.unshift(facts.engineError.message)

  const outside = facts.host.version !== null && !isSupportedHost(facts.host.version)
  const conflict = facts.keybindConflict !== undefined
  const state: State =
    conflict
      ? "conflict"
      : outside
        ? "host_untested"
        : facts.engineError !== undefined
          ? "failed"
          : engine === undefined
            ? "not_configured"
          : facts.probe !== undefined && !facts.probe.compatible
            ? "failed"
            : !engine.supported
              ? "failed"
              : "ready"

  return {
    version: VERSION,
    state,
    host: facts.host,
    unguardedAgents: [...(facts.unguardedAgents ?? [])],
    nextStep: nextStep({ facts, engine, stt, tts, microphone, problems }),
    engine: {
      installed: engine !== undefined,
      version: facts.probe?.version ?? engine?.version ?? null,
      path: engine?.path ?? null,
      verified: engine?.verified ?? false,
      compatible: facts.probe?.compatible ?? (engine?.supported ?? false),
      platform: engine?.platform ?? `${process.platform}-${process.arch}`,
      source: engine?.source ?? null,
    },
    models: {
      version: facts.modelsVersion ?? null,
      stt: view(stt),
      tts: view(tts),
    },
    microphone: {
      permission: microphone,
      input: facts.input === undefined ? null : oneLine(facts.input),
      output: facts.output === undefined ? null : oneLine(facts.output),
    },
    dictation: {
      keybind: facts.keybind,
      submit: facts.options.submit,
      lastLatencyMs: facts.lastLatencyMs ?? null,
    },
    tools: facts.tools ?? { registered: 0, readable: 0 },
    providers: { stt: "local", tts: "local" },
    privacy: {
      audioLeavesMachine: false,
      keepRecordings: false,
      transcriptHistory: facts.options.keepTranscripts,
    },
    problems,
  }
}

function nextStep(input: {
  facts: StatusFacts
  engine: EngineInfo | undefined
  stt: InspectedAsset | undefined
  tts: InspectedAsset | undefined
  microphone: MicrophonePermission
  problems: readonly string[]
}): string {
  const { facts, engine, stt, tts, microphone } = input
  if (facts.keybindConflict !== undefined) {
    return `The key ${facts.keybindConflict.key} is also used by ${facts.keybindConflict.command}; set another keybind option.`
  }
  if (facts.setup !== undefined) return facts.setup.next
  if (facts.engineError !== undefined) return facts.engineError.next
  if (engine === undefined) return NEXT_STEPS.ENGINE_MISSING!
  if (!engine.supported) return NEXT_STEPS.UNSUPPORTED_PLATFORM!
  if (!engine.verified) return NEXT_STEPS.ENGINE_UNVERIFIED!
  if (facts.probe !== undefined && !facts.probe.compatible) {
    if (facts.probe.olderSystem !== undefined) {
      return `The speech engine needs ${facts.probe.olderSystem} from this system's libraries, which are older. Use Ubuntu 24.04, Debian 13 or a newer system.`
    }
    if (facts.probe.missingLibrary !== undefined) {
      return `The speech engine cannot load ${facts.probe.missingLibrary}. Install the ALSA runtime (libasound2; libasound2t64 on Ubuntu 24.04), then run /voice-status.`
    }
    return NEXT_STEPS.ENGINE_INCOMPATIBLE!
  }
  if (stt === undefined || stt.state === "missing" || tts === undefined || tts.state === "missing") {
    return "Run /voice-install to download the speech models."
  }
  if (microphone === "denied" || microphone === "restricted") return NEXT_STEPS.MIC_DENIED!
  if (microphone === "not_determined") return "Run /voice-dictate once and allow microphone access."
  if (microphone === "unknown") return "Run the doctor in /voice to check the microphone."
  const failed = facts.doctor?.find((check) => !check.ok)
  if (failed !== undefined) return failed.next === undefined ? "Run the doctor in /voice." : oneLine(failed.next)
  if (facts.problems !== undefined && facts.problems.length > 0) return "Open /voice for the problem and its next step."
  return "Nothing to do."
}

const bytesLabel = (bytes: number) => (bytes >= 1024 * 1024 ? `${Math.round(bytes / (1024 * 1024))} MB` : `${Math.round(bytes / 1024)} KB`)

/** The dialog's and `/voice-status`'s text: the S9 rows, in order. */
export function formatStatus(status: Status): string {
  const engine = status.engine.installed
    ? `${status.engine.version ?? "unknown version"} (${status.engine.verified ? "verified" : "unverified"})`
    : "not installed"
  const access = `${status.microphone.permission.replace("_", " ")}${status.microphone.input === null ? "" : ` · ${oneLine(status.microphone.input)}`}`
  const models = [status.models.stt, status.models.tts]
    .filter((model): model is ModelView => model !== null)
    .map((model) => `${model.name} · ${bytesLabel(model.bytes)} · ${model.state}`)
    .join(" · ")
  const dictation = [
    status.dictation.submit === "send" ? "Send on pause" : "Review before sending",
    status.dictation.keybind,
    ...(status.dictation.lastLatencyMs === null ? [] : [`last ${(status.dictation.lastLatencyMs / 1000).toFixed(1)} s`]),
  ].join(" · ")
  return [
    `Voice ${status.version}`,
    `Connection: Engine ${engine}`,
    `Account: On-device`,
    `Access: Microphone ${access}`,
    `Models: ${models === "" ? "none" : models}`,
    `Dictation: ${dictation}`,
    `Tools: ${status.tools.registered} registered · ${status.tools.readable} readable`,
    `Agents without default rules: ${status.unguardedAgents.length === 0 ? "none" : status.unguardedAgents.map((agent) => oneLine(agent)).join(", ")}`,
    `OpenCode: ${status.host.version ?? "unknown"} (${status.host.tested ? "tested" : "untested"})`,
    `Next step: ${status.nextStep}`,
  ].join("\n")
}

/** The compact text `voice_status` returns: what a person needs, never a transcript or a path. */
export function compactStatus(status: Status): string {
  const missing = [status.models.stt, status.models.tts].filter((model) => model === null || model.state === "missing").length
  return [
    `Voice ${status.version} on OpenCode ${status.host.version ?? "unknown"} (${status.state}).`,
    `Engine: ${status.engine.installed ? `${status.engine.version ?? "unknown"} ${status.engine.verified ? "verified" : "unverified"}` : "not installed"}; models: ${missing === 0 ? "ready" : `${missing} missing`}; microphone: ${status.microphone.permission.replace("_", " ")}.`,
    `Privacy: on-device only; recordings are not kept.`,
    `Next step: ${status.nextStep}`,
  ].join("\n")
}

/** The compact object `voice_status` returns: no paths, no names of agents, no full document. */
export function statusSummary(status: Status): {
  readonly state: State
  readonly nextStep: string
  readonly unguardedAgents: number
  readonly engine: { readonly installed: boolean; readonly verified: boolean; readonly version: string | null }
  readonly models: { readonly missing: number }
  readonly microphone: MicrophonePermission
} {
  const missing = [status.models.stt, status.models.tts].filter((model) => model === null || model.state === "missing").length
  return {
    state: status.state,
    nextStep: status.nextStep,
    unguardedAgents: status.unguardedAgents.length,
    engine: { installed: status.engine.installed, verified: status.engine.verified, version: status.engine.version },
    models: { missing },
    microphone: status.microphone.permission,
  }
}

/** A status read that failed, as a coded message and its next step. The detail is never echoed. */
export function unavailable(error: unknown): { code: "STATUS_UNAVAILABLE"; message: string; nextStep: string } {
  // The detail is never echoed: it can name a path, a model file or engine text. The reason is logged nowhere either.
  void error
  return {
    code: "STATUS_UNAVAILABLE",
    message: errorText("STATUS_UNAVAILABLE", "The voice status could not be read.", NEXT_STEPS.STATUS_UNAVAILABLE!),
    nextStep: NEXT_STEPS.STATUS_UNAVAILABLE!,
  }
}

/** The row labels, in order, for tests that every row is present. */
export const ROW_LABELS = ["Connection", "Account", "Access", "Models", "Dictation", "Tools", "Agents without default rules", "OpenCode", "Next step"] as const

/** The status RPC's output schema, shared by the contract and the dialog's expectations. */
export const STATUS_OUTPUT = {
  type: "object",
  properties: {
    version: { type: "string" },
    state: { type: "string", enum: ["ready", "not_configured", "failed", "host_untested", "conflict"] },
    host: {
      type: "object",
      properties: { version: { type: ["string", "null"] }, range: { type: "string" }, tested: { type: "boolean" } },
      required: ["version", "range", "tested"],
    },
    unguardedAgents: { type: "array", items: { type: "string" } },
    nextStep: { type: "string" },
    engine: { type: "object" },
    models: { type: "object" },
    microphone: { type: "object" },
    dictation: { type: "object" },
    tools: { type: "object" },
    providers: { type: "object" },
    privacy: { type: "object" },
    problems: { type: "array", items: { type: "string" } },
  },
  required: ["version", "state", "host", "unguardedAgents", "nextStep", "engine", "models", "microphone", "dictation", "tools", "providers", "privacy", "problems"],
} as const
