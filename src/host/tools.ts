import type { Plugin } from "@opencode/plugin"
import { NAMESPACE, voiceError } from "../constants.js"
import type { SpeechEngine } from "../engine/index.js"
import type { Status } from "../status.js"
import { compactStatus, statusSummary } from "../status.js"
import type { MethodClass, PluginMethod } from "./tools-rpc.js"

/** Where the tools read status from, so a test can hand them a fixed model. */
export interface ToolInput {
  readonly engine: SpeechEngine
  readonly status: () => Promise<Status>
  readonly assert: Plugin.Context["permission"]["assert"]
}

export interface ToolResult {
  readonly output: Record<string, unknown>
  readonly text: string
}

/** A tool call's source, exactly as the host gives it to `execute`. */
export interface CallSource {
  readonly sessionID: string
  readonly agent: string
  readonly messageID: string
  readonly id: string
}

/** The short names, under the `voice` namespace: the host ids are `voice_status` and `voice_speak`. */
export const TOOL_NAMES = ["status", "speak"] as const
export type ToolName = (typeof TOOL_NAMES)[number]

/** The permission action and the tools-RPC method name: `<namespace>_<short name>`. */
export const actionOf = (name: ToolName) => `${NAMESPACE}_${name}`

export const READ_TOOLS = ["status"] as const

const EMPTY = { type: "object", properties: {}, additionalProperties: false } as const
const SPEAK = {
  type: "object",
  properties: {
    text: { type: "string", minLength: 1, maxLength: 5_000, description: "The text to read aloud." },
  },
  required: ["text"],
  additionalProperties: false,
} as const

const OUTPUT = { type: "object" } as const

const DESCRIPTIONS: Readonly<Record<ToolName, string>> = {
  status:
    "Report the local voice engine: whether it is installed and verified, the speech models and their cache state, microphone permission, the dictation key and the one next step. It reads nothing and speaks nothing.",
  speak: "Read text aloud on this machine with the local voice. It does not send anything to a model and keeps nothing. It asks before speaking.",
}

/** One tool's answer. A read runs; a change asserts its own action first. */
export async function runVoiceTool(input: ToolInput, name: ToolName, raw: unknown, call?: CallSource): Promise<ToolResult> {
  if (name === "speak") {
    if (call === undefined) {
      throw voiceError("UNCHECKED", "Speaking was called with nothing to check its permission against.", "Call it from a session, where the approval can be answered.")
    }
    await input.assert({
      sessionID: call.sessionID,
      agent: call.agent,
      action: actionOf(name),
      resources: ["*"],
      source: { type: "tool", messageID: call.messageID, id: call.id },
    })
  }
  const args = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>

  if (name === "status") {
    const status = await input.status()
    return {
      output: statusSummary(status) as unknown as Record<string, unknown>,
      text: compactStatus(status),
    }
  }

  const text = args.text
  if (typeof text !== "string" || text.trim() === "") throw voiceError("INPUT_INVALID", "There is nothing to read aloud.", "Pass the text to speak, in the text field.")
  if (text.length > 5_000) throw voiceError("INPUT_INVALID", "The text is longer than 5,000 characters.", "Speak it in shorter pieces, or raise the limit in a later release.")
  const speech = await input.engine.synthesize(text, { markdown: false })
  try {
    await input.engine.play(speech.path)
  } finally {
    await input.engine.release(speech.path)
  }
  return {
    output: { played: true, seconds: Math.round(speech.durationMs / 100) / 10, voice: speech.voice },
    text: `Read ${Math.max(1, Math.round(speech.durationMs / 1000))} s aloud.`,
  }
}

/** Registers the namespace text and both tools, with their permission actions. */
export function toolTransform(input: ToolInput) {
  return (editor: Parameters<Parameters<Plugin.Context["tool"]["transform"]>[0]>[0]) => {
    editor.namespace({
      name: NAMESPACE,
      description:
        "Local voice, powered by Aurum: report the engine and speak text aloud. Dictation happens in the terminal UI (a key or /voice-dictate), not through a tool. Audio and transcripts stay on this machine, and a recording is never kept. File transcription is not this plugin: use utilities_speech_transcribe.",
    })
    for (const name of TOOL_NAMES) {
      editor.add({
        name,
        description: DESCRIPTIONS[name],
        input: name === "status" ? EMPTY : SPEAK,
        output: OUTPUT,
        options: { namespace: NAMESPACE, permission: actionOf(name) },
        execute: async (value, context) => {
          const result = await runVoiceTool(input, name, value, {
            sessionID: context.sessionID,
            agent: context.agent,
            messageID: context.messageID,
            id: context.id,
          })
          return { output: result.output, content: result.text }
        },
      })
    }
  }
}

const CLASS_OF: Readonly<Record<ToolName, MethodClass>> = { status: "read", speak: "write" }

/** Both tools as tools-RPC methods, with the same schema, run and action. */
export function ownedMethods(input: ToolInput): readonly PluginMethod[] {
  return TOOL_NAMES.map((name) => ({
    kind: "plugin",
    class: CLASS_OF[name],
    name: actionOf(name),
    action: actionOf(name),
    description: DESCRIPTIONS[name],
    input: name === "status" ? EMPTY : SPEAK,
    output: OUTPUT,
    run: (value: unknown, call: { sessionID: string; agent: string; messageID: string; id: string }) =>
      runVoiceTool(input, name, value, call).then((result) => result.output),
  }))
}
