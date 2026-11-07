import type { Plugin } from "@opencode/plugin"
import { Rpc } from "@opencode/plugin/rpc"
import { ENGINE_RPC_ID, PLUGIN_ID } from "./constants.js"
import { EngineError, asEngineError } from "./engine/errors.js"
import type { SpeechEngine } from "./engine/index.js"
import { readWav } from "./engine/wav.js"
import { STATUS_OUTPUT, unavailable, type Status } from "./status.js"

const string = { type: "string" } as const
const object = (properties: Record<string, object>, required: readonly string[]) =>
  ({ type: "object", properties, required, additionalProperties: false }) as const
const NO_INPUT = object({}, [])
const FAILED = object({ code: string, next: string }, ["code", "next"])
const FAILURES = { failed: FAILED }

/** The read-only status RPC: one method, the same model `/voice-status` and the dialog render. */
export const VoiceStatusRpc = Rpc.define({
  id: PLUGIN_ID,
  methods: {
    status: { input: NO_INPUT, output: STATUS_OUTPUT, errors: { unavailable: object({ nextStep: string }, ["nextStep"]) } },
  },
  events: {},
})

export type VoiceStatusRpcType = typeof VoiceStatusRpc

export function registerStatusRpc(rpc: Pick<Plugin.Context["rpc"], "register">, read: () => Promise<Status>) {
  const registration = rpc.register(VoiceStatusRpc, {
    status: (_input: unknown, { error }: { error: (type: "unavailable", message: string, data: { nextStep: string }) => unknown }) =>
      read().catch((cause: unknown) => {
        const failure = unavailable(cause)
        return error("unavailable", failure.message, { nextStep: failure.nextStep })
      }),
  } as never)
  return registration.then((registration) => registration.dispose)
}

const VERSION = { type: "integer", enum: [1] } as const
const AUDIO = { type: "string", minLength: 4, maxLength: 8 * 1024 * 1024 } as const

/** The engine RPC: audio in, text out, and text in, audio out. It is separate from the tools RPC. */
export const VoiceEngineRpc = Rpc.define({
  id: ENGINE_RPC_ID,
  methods: {
    status: { input: object({ v: VERSION }, ["v"]), output: { type: "object" }, errors: FAILURES },
    warmup: { input: object({ v: VERSION }, ["v"]), output: { type: "object" }, errors: FAILURES },
    transcribe: {
      input: object({ v: VERSION, audio: AUDIO, mime: { type: "string", enum: ["audio/wav"] }, language: string }, ["v", "audio", "mime"]),
      output: { type: "object" },
      errors: FAILURES,
    },
    synthesize: {
      input: object({ v: VERSION, text: { type: "string", minLength: 1, maxLength: 5_000 }, markdown: { type: "boolean" }, rate: { type: "number", minimum: 0.5, maximum: 2 } }, ["v", "text"]),
      output: { type: "object" },
      errors: FAILURES,
    },
    cancel: { input: object({ v: VERSION }, ["v"]), output: { type: "object" }, errors: FAILURES },
  },
  events: {},
})

export type VoiceEngineRpcType = typeof VoiceEngineRpc

const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/

function decodeAudio(value: unknown): Uint8Array {
  if (typeof value !== "string" || value.length === 0 || value.length % 4 !== 0 || !BASE64.test(value)) {
    throw new EngineError("BAD_AUDIO", "audio must be a base64 string.")
  }
  return Buffer.from(value, "base64")
}

const failureOf = (error: unknown) => {
  const failure = asEngineError(error)
  return { code: failure.code, next: failure.next, message: failure.message }
}

interface EngineDeps {
  readonly engine: SpeechEngine
  readonly status: () => Promise<Status>
}

/** Registers the engine RPC. A host such as hey-jelly calls it; the TUI never does. */
export function registerEngineRpc(rpc: Pick<Plugin.Context["rpc"], "register">, deps: EngineDeps) {
  const fail = (error: unknown, respond: (type: "failed", message: string, data: { code: string; next: string }) => unknown) => {
    const failure = failureOf(error)
    return respond("failed", failure.message, { code: failure.code, next: failure.next })
  }
  const registration = rpc.register(VoiceEngineRpc, {
    status: async () => {
      const status = await deps.status()
      return {
        v: 1,
        ready: status.state === "ready" && status.dictation.state !== "failed",
        stt: { provider: status.providers.stt, model: status.models.stt?.name ?? "", language: "auto" },
        tts: { provider: status.providers.tts, model: status.models.tts?.name ?? "", voice: "" },
        models: status.models,
        caps: ["transcribe", "synthesize", "warmup", "cancel"],
        problems: status.problems,
      }
    },
    warmup: async (_input: unknown, { error }: { error: (type: "failed", message: string, data: { code: string; next: string }) => unknown }) => {
      try {
        const result = await deps.engine.warmup()
        return { v: 1, ready: result.ready, state: result.state }
      } catch (cause) {
        return fail(cause, error)
      }
    },
    transcribe: async (input: unknown, { error }: { error: (type: "failed", message: string, data: { code: string; next: string }) => unknown }) => {
      try {
        const value = input as { audio?: unknown; language?: unknown }
        const bytes = decodeAudio(value.audio)
        readWav(bytes)
        const started = performance.now()
        const result = await deps.engine.transcribeBytes(bytes)
        return {
          v: 1,
          text: result.text,
          silent: result.silent,
          ms: Math.round(performance.now() - started),
          provider: result.provider,
          model: result.model,
        }
      } catch (cause) {
        return fail(cause, error)
      }
    },
    synthesize: async (input: unknown, { error }: { error: (type: "failed", message: string, data: { code: string; next: string }) => unknown }) => {
      try {
        const value = input as { text?: unknown; markdown?: unknown; rate?: unknown }
        if (typeof value.text !== "string" || value.text.trim() === "") throw new EngineError("BAD_AUDIO", "text must be a non-empty string.")
        if (value.text.length > 5_000) throw new EngineError("AUDIO_TOO_LONG", "text is longer than 5,000 characters.")
        const speech = await deps.engine.synthesize(value.text, { markdown: value.markdown === true })
        try {
          const { readFile } = await import("node:fs/promises")
          const audio = (await readFile(speech.path)).toString("base64")
          return {
            v: 1,
            audio,
            mime: "audio/wav",
            spokenText: speech.spoken,
            truncated: speech.spoken.length < value.text.trim().length,
          }
        } finally {
          await deps.engine.release(speech.path)
        }
      } catch (cause) {
        return fail(cause, error)
      }
    },
    cancel: async () => {
      deps.engine.cancel()
      return { v: 1 }
    },
  } as never)
  return registration.then((registration) => registration.dispose)
}
