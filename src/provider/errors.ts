import { shortReason } from "../redact.js"

/** The one error shape: `CODE: what happened. Next step: What to do.` Both parts are sentences. */
export const errorText = (code: string, message: string, nextStep: string) => `${code}: ${message.replace(/[.\s]+$/, "")}. Next step: ${nextStep}`

/**
 * The next step for each internal code. These codes never cross the contract's doors: a handler maps them to
 * `UNAVAILABLE` and carries the text here as its next step. `doctor` names the same facts for a person.
 */
export const NEXT_STEPS: Readonly<Record<string, string>> = {
  ENGINE_MISSING: "Voice is optional: run /voice-install to download the pinned speech engine, then run /voice-status.",
  ENGINE_UNVERIFIED: "Run /voice-install to replace the engine; if it persists, report it.",
  ENGINE_INCOMPATIBLE: "Run /voice-install to install the engine version this plugin needs.",
  UNSUPPORTED_PLATFORM: "Use macOS on Apple silicon or Linux, or set the aurumPath option to a local engine.",
  MODEL_MISSING: "Run /voice-install to download the speech models.",
  MODEL_DOWNLOAD_FAILED: "Retry /voice-install; if it persists, check the network or proxy.",
  INTEGRITY_MISMATCH: "Retry /voice-install; if it persists, report it.",
  MIC_DENIED: "Grant microphone access in System Settings → Privacy & Security → Microphone.",
  MIC_UNAVAILABLE: "Connect a microphone, then run /voice-dictate again.",
  AUDIO_DEVICE_MISSING: "Connect an output device, then try again.",
  NO_SPEECH: "Speak again, a little closer to the microphone.",
  AUDIO_TOO_LONG: "Shorten the recording or the text.",
  BAD_AUDIO: "Speak again, or pass plain text to speak.",
  BUSY: "Wait for the current dictation to finish, or press escape to cancel it.",
  TIMEOUT: "Try again, then run the doctor in /voice.",
  CANCELLED: "Nothing to do.",
  SIDECAR_FAILED: "Run the doctor in /voice, then try again.",
  ENGINE_EXITED: "Run the doctor in /voice, then try again.",
  UNSUPPORTED: "Use a supported platform and engine.",
}

/** Why an engine is absent. Only `not-installed` is the normal, optional empty release cache. */
export type EngineMissingReason = "not-installed" | "override" | "manifest"

/** Every code the plugin's speech path can raise. None is a contract code: see the module comment. */
export type EngineCode =
  | "ENGINE_MISSING"
  | "ENGINE_UNVERIFIED"
  | "ENGINE_INCOMPATIBLE"
  | "ENGINE_EXITED"
  | "UNSUPPORTED_PLATFORM"
  | "UNSUPPORTED"
  | "MODEL_MISSING"
  | "MODEL_DOWNLOAD_FAILED"
  | "INTEGRITY_MISMATCH"
  | "MIC_DENIED"
  | "MIC_UNAVAILABLE"
  | "AUDIO_DEVICE_MISSING"
  | "NO_SPEECH"
  | "AUDIO_TOO_LONG"
  | "BAD_AUDIO"
  | "BUSY"
  | "TIMEOUT"
  | "CANCELLED"
  | "SIDECAR_FAILED"

/**
 * A failed speech operation. `message` and `next` are safe to show to a person: they never carry audio, a transcript,
 * a key or a path outside the plugin's own cache.
 */
export class EngineError extends Error {
  readonly code: EngineCode
  readonly next: string
  /** `ENGINE_MISSING` only: the precise value that was absent, never a path or a secret. */
  readonly missing?: EngineMissingReason

  constructor(code: EngineCode, message: string, next = NEXT_STEPS[code] ?? "Try again.", missing?: EngineMissingReason) {
    super(errorText(code, message, next))
    this.name = "EngineError"
    this.code = code
    this.next = next
    this.missing = missing
  }
}

/** The coded error an unknown failure becomes: never its text, which may carry a path or a key. */
export function asEngineError(error: unknown): EngineError {
  if (error instanceof EngineError) return error
  return new EngineError("SIDECAR_FAILED", "The speech engine failed unexpectedly.")
}

/** True when an error is the user's own cancel, which is never shown as a failure. */
export const isCancel = (error: unknown) => error instanceof EngineError && error.code === "CANCELLED"

/** A sidecar error category, from Aurum's `error` event, as one of this plugin's codes. The text is redacted. */
export function fromSidecarCategory(category: string, message: string): EngineError {
  const text = shortReason(message) ?? "The speech engine reported an error."
  switch (category) {
    case "user":
      return new EngineError("BAD_AUDIO", text)
    case "environment":
      return new EngineError("SIDECAR_FAILED", text)
    default:
      return new EngineError("SIDECAR_FAILED", text)
  }
}

/** What a failed engine call means to a person, without the internal code: the what, and the one next step. */
export interface EngineFailure {
  readonly what: string
  readonly next: string
}

/**
 * An engine failure as the contract's `UNAVAILABLE`: the internal code is dropped (it is not in the contract table),
 * the redacted what is kept, and the next step is the engine's own. A credential or path never survives the redaction.
 */
export function engineFailure(error: unknown): EngineFailure {
  const failure = asEngineError(error)
  const what = shortReason(failure.message) ?? "The speech engine failed."
  return {
    what: what.replace(/^[A-Z][A-Z0-9_]*:\s*/, "").replace(/ Next step: [\s\S]*$/, "").replace(/[.\s]+$/, ""),
    next: failure.next,
  }
}
