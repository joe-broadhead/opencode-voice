import { NEXT_STEPS, errorText } from "../constants.js"
import { shortReason } from "../redact.js"

/** Every code the plugin's speech path can raise. The docs and the README table name each one. */
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
  | "PROVIDER_AUTH_REQUIRED"
  | "PROVIDER_FAILED"

/**
 * A failed speech operation. `message` and `next` are safe to show to a person: they never carry audio, a transcript,
 * a key or a path outside the plugin's own cache.
 */
export class EngineError extends Error {
  readonly code: EngineCode
  readonly next: string

  constructor(code: EngineCode, message: string, next = NEXT_STEPS[code] ?? "Try again.") {
    super(errorText(code, message, next))
    this.name = "EngineError"
    this.code = code
    this.next = next
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
    case "provider":
      return new EngineError("PROVIDER_FAILED", text)
    default:
      return new EngineError("SIDECAR_FAILED", text)
  }
}
