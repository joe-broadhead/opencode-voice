import type { JsonSchema, Manifest } from "@we-the-rebel-alliance/plugin-contract/manifest"
import type { MethodHandler } from "@we-the-rebel-alliance/plugin-contract/register"
import { hostInRange } from "@we-the-rebel-alliance/plugin-contract/manifest"
import type { Options } from "../options.js"
import type { EngineFacts, Provider } from "../provider/create.js"
import type { InspectedAsset } from "../provider/assets.js"
import type { EngineInfo, EngineProbe } from "../provider/binary.js"
import type { EngineError } from "../provider/errors.js"
import { NEXT_STEPS } from "../provider/errors.js"
import { cut, oneLine, shortReason } from "../redact.js"
import { readUnguarded } from "./agents.js"

/** The rich product state, beside the contract's closed three-value state. */
export type DoctorState = "ready" | "not_configured" | "failed" | "host_untested"

export interface ModelView {
  readonly name: string
  readonly bytes: number
  readonly licence: string
  readonly state: string
  readonly path: string
}

export interface DoctorEngine {
  readonly installed: boolean
  readonly version: string | null
  readonly path: string | null
  readonly verified: boolean
  readonly compatible: boolean
  readonly platform: string
  readonly source: string | null
  readonly error: { readonly code: string; readonly what: string; readonly next: string } | null
}

/** Everything `doctor` answers: the facts the TUI dialog and `/voice-status` render, and `status` summarises. */
export interface DoctorAnswer {
  readonly name: string
  readonly version: string
  readonly host: { readonly version: string; readonly range: string; readonly tested: boolean }
  readonly state: DoctorState
  readonly engine: DoctorEngine
  readonly models: {
    readonly version: string | null
    readonly stt: ModelView | null
    readonly tts: ModelView | null
  }
  readonly microphone: {
    readonly permission: "authorized" | "denied" | "restricted" | "not_determined" | "unknown"
    readonly input: string | null
    readonly output: string | null
  }
  readonly dictation: { readonly keybind: string; readonly submit: "send" | "review" }
  readonly access: Options["access"]
  readonly tools: { readonly registered: number; readonly readable: number }
  readonly privacy: {
    readonly audioLeavesMachine: false
    readonly keepRecordings: false
    readonly transcriptHistory: boolean
  }
  readonly unguardedAgents: readonly string[]
  /** One line of at most 200 characters, or null when nothing needs doing. */
  readonly nextStep: string | null
  readonly problems: readonly string[]
}

export interface DoctorInput {
  readonly provider: Pick<Provider, "facts">
  readonly options: Options
  readonly keybind: string
  readonly manifest: Manifest
  readonly version: string
  /** The running OpenCode release, or "" when it reports none. */
  readonly hostVersion: string
}

/** The facts `doctor` and `status` share, from the provider and the person's options. */
export interface DerivedFacts extends EngineFacts {
  readonly options: Options
  readonly keybind: string
}

const modelOf = (models: readonly InspectedAsset[] | undefined, role: string) => models?.find((asset) => asset.role === role)

const view = (asset: InspectedAsset | undefined): ModelView | null =>
  asset === undefined ? null : { name: asset.name, bytes: asset.bytes, licence: asset.licence, state: asset.state, path: asset.path }

const byteLabel = (bytes: number) => (bytes >= 1024 * 1024 ? `${Math.round(bytes / (1024 * 1024))} MB` : `${Math.round(bytes / 1024)} KB`)

/** One line of at most 200 characters, redacted: a next step a person reads. */
export const nextStepText = (text: string): string => cut(oneLine(shortReason(text) ?? text), 200)

/**
 * The one next action: install the engine, install the models, grant the microphone, doctor a failure, or nothing.
 * The order follows what blocks the next thing a person would try.
 */
export function nextStepOf(facts: DerivedFacts, engine: EngineInfo | undefined, stt: InspectedAsset | undefined, tts: InspectedAsset | undefined): string | null {
  const failure: EngineError | undefined = facts.engineError
  if (failure !== undefined) return nextStepText(failure.next)
  if (engine === undefined) return nextStepText(NEXT_STEPS.ENGINE_MISSING!)
  if (!engine.supported) return nextStepText(NEXT_STEPS.UNSUPPORTED_PLATFORM!)
  // A binary the person chose (aurumPath, VOICE_AURUM_PATH) is never digest-verified; that is what they chose, not a fault.
  if (!engine.verified && engine.source === "download") return nextStepText(NEXT_STEPS.ENGINE_UNVERIFIED!)
  if (facts.probe !== undefined && !facts.probe.compatible) {
    if (facts.probe.olderSystem !== undefined) {
      return nextStepText(`The speech engine needs ${facts.probe.olderSystem} from this system's libraries, which are older. Use Ubuntu 24.04, Debian 13 or a newer system.`)
    }
    if (facts.probe.missingLibrary !== undefined) {
      return nextStepText(`The speech engine cannot load ${facts.probe.missingLibrary}. Install the ALSA runtime (libasound2; libasound2t64 on Ubuntu 24.04), then run /voice-status.`)
    }
    return nextStepText(NEXT_STEPS.ENGINE_INCOMPATIBLE!)
  }
  if (stt === undefined || stt.state === "missing" || tts === undefined || tts.state === "missing") {
    return "Run /voice-install to download the speech models."
  }
  if (facts.microphone === "denied" || facts.microphone === "restricted") return nextStepText(NEXT_STEPS.MIC_DENIED!)
  if (facts.microphone === "not_determined") return "Run /voice-dictate once and allow microphone access."
  if (facts.microphone === "unknown") return "Run the doctor in /voice to check the microphone."
  const failed = facts.doctor?.find((check) => !check.ok)
  if (failed !== undefined) return nextStepText(failed.next === undefined ? "Run the doctor in /voice." : failed.next)
  return null
}

/** The one status state, derived from the same facts: an absent optional engine is not an error. */
export function doctorStateOf(facts: DerivedFacts, engine: EngineInfo | undefined, hostVersion: string): DoctorState {
  if (hostVersion !== "" && !hostInRange(hostVersion)) return "host_untested"
  const failure = facts.engineError
  if (failure !== undefined && failure.missing !== "not-installed") return "failed"
  if (engine === undefined) return "not_configured"
  if (facts.probe !== undefined && !facts.probe.compatible) return "failed"
  if (!engine.supported) return "failed"
  return "ready"
}

/** The problems list: one redacted line each, newest cause first. */
function problemsOf(facts: DerivedFacts, probe: EngineProbe | undefined, engine: EngineInfo | undefined): readonly string[] {
  const problems: string[] = []
  if (facts.engineError !== undefined) problems.push(nextStepText(facts.engineError.message))
  if (probe !== undefined && !probe.compatible) problems.push(nextStepText(NEXT_STEPS.ENGINE_INCOMPATIBLE!))
  if (engine !== undefined && !engine.verified && engine.source === "download") problems.push(nextStepText(NEXT_STEPS.ENGINE_UNVERIFIED!))
  for (const check of facts.doctor ?? []) if (!check.ok) problems.push(nextStepText(`${check.id}: ${check.detail}`))
  return problems
}

/** The doctor answer, from the provider's facts and the person's options. */
export function buildDoctor(input: DoctorInput, facts: EngineFacts, unguardedAgents: readonly string[]): DoctorAnswer {
  const derived: DerivedFacts = { ...facts, options: input.options, keybind: input.keybind }
  const engine = facts.engine
  const host = input.manifest.plugin.host
  const stt = modelOf(facts.models, "stt")
  const tts = modelOf(facts.models, "tts-model")
  const microphone = facts.microphone
  const error = facts.engineError
  return {
    name: input.manifest.plugin.name,
    version: input.version,
    host: {
      version: input.hostVersion === "" ? "unknown" : input.hostVersion,
      range: host.opencode,
      tested: host.tested.includes(input.hostVersion),
    },
    state: doctorStateOf(derived, engine, input.hostVersion),
    engine: {
      installed: engine !== undefined,
      version: facts.probe?.version ?? engine?.version ?? null,
      path: engine?.path ?? null,
      verified: engine?.verified ?? false,
      compatible: facts.probe?.compatible ?? (engine?.supported ?? false),
      platform: engine?.platform ?? `${process.platform}-${process.arch}`,
      source: engine?.source ?? null,
      error:
        error === undefined
          ? null
          : {
              code: error.code,
              what: nextStepText(error.message.replace(/^[A-Z][A-Z0-9_]*:\s*/, "").replace(/ Next step: [\s\S]*$/, "")),
              next: nextStepText(error.next),
            },
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
    dictation: { keybind: input.keybind, submit: input.options.submit },
    access: input.options.access,
    tools: { registered: 3, readable: 2 },
    privacy: {
      audioLeavesMachine: false,
      keepRecordings: false,
      transcriptHistory: input.options.keepTranscripts,
    },
    unguardedAgents: [...unguardedAgents],
    nextStep: nextStepOf(derived, engine, stt, tts),
    problems: problemsOf(derived, facts.probe, engine),
  }
}

const MODEL = {
  anyOf: [
    { type: "null" },
    {
      type: "object",
      properties: {
        name: { type: "string" },
        bytes: { type: "integer" },
        licence: { type: "string" },
        state: { type: "string" },
        path: { type: "string" },
      },
      required: ["name", "bytes", "licence", "state", "path"],
      additionalProperties: false,
    },
  ],
} as const

/** The doctor answer's schema. It is a read: local paths and device names are this person's own machine. */
export const DOCTOR_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    version: { type: "string", minLength: 1 },
    host: {
      type: "object",
      properties: {
        version: { type: "string", minLength: 1 },
        range: { type: "string", minLength: 1 },
        tested: { type: "boolean" },
      },
      required: ["version", "range", "tested"],
      additionalProperties: false,
    },
    state: { type: "string", enum: ["ready", "not_configured", "failed", "host_untested"] },
    engine: {
      type: "object",
      properties: {
        installed: { type: "boolean" },
        version: { anyOf: [{ type: "null" }, { type: "string" }] },
        path: { anyOf: [{ type: "null" }, { type: "string" }] },
        verified: { type: "boolean" },
        compatible: { type: "boolean" },
        platform: { type: "string" },
        source: { anyOf: [{ type: "null" }, { type: "string" }] },
        error: {
          anyOf: [
            { type: "null" },
            {
              type: "object",
              properties: { code: { type: "string" }, what: { type: "string" }, next: { type: "string" } },
              required: ["code", "what", "next"],
              additionalProperties: false,
            },
          ],
        },
      },
      required: ["installed", "version", "path", "verified", "compatible", "platform", "source", "error"],
      additionalProperties: false,
    },
    models: {
      type: "object",
      properties: { version: { anyOf: [{ type: "null" }, { type: "string" }] }, stt: MODEL, tts: MODEL },
      required: ["version", "stt", "tts"],
      additionalProperties: false,
    },
    microphone: {
      type: "object",
      properties: {
        permission: { type: "string", enum: ["authorized", "denied", "restricted", "not_determined", "unknown"] },
        input: { anyOf: [{ type: "null" }, { type: "string" }] },
        output: { anyOf: [{ type: "null" }, { type: "string" }] },
      },
      required: ["permission", "input", "output"],
      additionalProperties: false,
    },
    dictation: {
      type: "object",
      properties: { keybind: { type: "string", minLength: 1 }, submit: { type: "string", enum: ["send", "review"] } },
      required: ["keybind", "submit"],
      additionalProperties: false,
    },
    access: { type: "string", enum: ["all", "ask-changes", "read-only"] },
    tools: {
      type: "object",
      properties: { registered: { type: "integer" }, readable: { type: "integer" } },
      required: ["registered", "readable"],
      additionalProperties: false,
    },
    privacy: {
      type: "object",
      properties: {
        audioLeavesMachine: { type: "boolean" },
        keepRecordings: { type: "boolean" },
        transcriptHistory: { type: "boolean" },
      },
      required: ["audioLeavesMachine", "keepRecordings", "transcriptHistory"],
      additionalProperties: false,
    },
    unguardedAgents: { type: "array", items: { type: "string" } },
    nextStep: { anyOf: [{ type: "null" }, { type: "string", maxLength: 200 }] },
    problems: { type: "array", items: { type: "string" } },
  },
  required: [
    "name",
    "version",
    "host",
    "state",
    "engine",
    "models",
    "microphone",
    "dictation",
    "access",
    "tools",
    "privacy",
    "unguardedAgents",
    "nextStep",
    "problems",
  ],
  additionalProperties: false,
}

/** The dialog's and `/voice-status`'s text. */
export function formatDoctor(answer: DoctorAnswer): string {
  const engine = answer.engine.installed
    ? `${answer.engine.version ?? "unknown version"} (${answer.engine.verified ? "verified" : "unverified"})`
    : "not installed"
  const access = `${answer.microphone.permission.replace("_", " ")}${answer.microphone.input === null ? "" : ` · ${oneLine(answer.microphone.input)}`}`
  const models = [answer.models.stt, answer.models.tts]
    .filter((model): model is ModelView => model !== null)
    .map((model) => `${model.name} · ${byteLabel(model.bytes)} · ${model.state}`)
    .join(" · ")
  const dictation = `${answer.dictation.submit === "send" ? "Send on pause" : "Review before sending"} · ${answer.dictation.keybind}`
  return [
    `Voice ${answer.version}`,
    `Connection: Engine ${engine}`,
    `Account: On-device`,
    `Access: Microphone ${access}`,
    `Models: ${models === "" ? "none" : models}`,
    `Dictation: ${dictation}`,
    `Tools: ${answer.tools.registered} registered · ${answer.tools.readable} readable`,
    `Agents without default rules: ${answer.unguardedAgents.length === 0 ? "none" : answer.unguardedAgents.map((agent) => oneLine(agent)).join(", ")}`,
    `OpenCode: ${answer.host.version} (${answer.host.tested ? "tested" : "untested"})`,
    `Next step: ${answer.nextStep ?? "Nothing to do."}`,
  ].join("\n")
}

/** The `doctor` handler: the rich engine facts, one read, no account. */
export function doctorHandler(input: DoctorInput): MethodHandler {
  return {
    description:
      "Report the local voice facts: the speech engine and its path, the model cache, the microphone and output device, the dictation key, the access level and the one next step. The engine is optional, and this reads nothing and speaks nothing.",
    input: { type: "object", properties: {}, additionalProperties: false },
    output: DOCTOR_SCHEMA,
    async run(_raw, call) {
      const facts = await input.provider.facts()
      const list = await readUnguarded(call)
      const answer = buildDoctor(input, facts, list.agents)
      return list.problem === undefined ? answer : { ...answer, problems: [list.problem, ...answer.problems] }
    },
  }
}
