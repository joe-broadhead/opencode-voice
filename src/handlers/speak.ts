import type { MethodHandler } from "@we-the-rebel-alliance/plugin-contract/register"
import { refusal, RegisterError } from "@we-the-rebel-alliance/plugin-contract/register"
import type { Provider } from "../provider/create.js"
import { engineFailure } from "../provider/errors.js"

export interface SpeakInput {
  readonly provider: Pick<Provider, "engine">
}

const SPEAK_INPUT = {
  type: "object",
  properties: {
    text: { type: "string", minLength: 1, maxLength: 5_000, description: "The text to read aloud." },
  },
  required: ["text"],
  additionalProperties: false,
} as const

const SPEAK_OUTPUT = {
  type: "object",
  properties: {
    played: { type: "boolean" },
    seconds: { type: "number" },
    voice: { type: "string" },
  },
  required: ["played", "seconds", "voice"],
  additionalProperties: false,
} as const

/**
 * The `speak` handler: local playback of the text, and nothing else. It sends nothing to a provider and keeps nothing,
 * so nothing an app could re-read changes: no plan/commit, and no bus event.
 */
export function speakHandler(input: SpeakInput): MethodHandler {
  return {
    description:
      "Read text aloud on this machine with the local voice. It sends nothing to a model and keeps nothing. It runs without asking by default; with access \"ask-changes\" it asks first.",
    input: SPEAK_INPUT,
    output: SPEAK_OUTPUT,
    async run(raw, call) {
      const text = typeof raw["text"] === "string" ? raw["text"] : ""
      if (text.trim() === "") {
        throw new RegisterError(refusal("INPUT_INVALID", "There is nothing to read aloud", "Pass the text to speak, in the text field."))
      }
      const engine = input.provider.engine
      if (engine === undefined) {
        throw new RegisterError(
          refusal("UNAVAILABLE", "The local speech engine is not installed, so there is nothing to speak with", "Run /voice-install to download the pinned speech engine, then try again."),
        )
      }
      let speech: { readonly path: string; readonly durationMs: number; readonly voice: string }
      try {
        speech = await engine.synthesize(text, { markdown: false })
      } catch (error) {
        const failure = engineFailure(error)
        throw new RegisterError(refusal("UNAVAILABLE", failure.what, failure.next))
      }
      try {
        if (call.signal.aborted) {
          throw new RegisterError(refusal("UNAVAILABLE", "Speaking was stopped before it began", "Nothing to do."))
        }
        await engine.play(speech.path, { signal: call.signal })
      } catch (error) {
        if (error instanceof RegisterError) throw error
        const failure = engineFailure(error)
        throw new RegisterError(refusal("UNAVAILABLE", failure.what, failure.next))
      } finally {
        await engine.release(speech.path)
      }
      return { played: true, seconds: Math.round(speech.durationMs / 100) / 10, voice: speech.voice }
    },
  }
}
