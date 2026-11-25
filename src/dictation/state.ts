/** The dictation phases, as one small type so the TUI and its labels agree. */
export type Phase = "idle" | "preparing" | "listening" | "transcribing" | "sending" | "reviewing" | "playing" | "failed"

/** The one-word state the toast and footer show. */
export function label(phase: Phase): string {
  switch (phase) {
    case "preparing":
      return "preparing"
    case "listening":
      return "listening"
    case "transcribing":
      return "transcribing"
    case "sending":
      return "sending"
    case "reviewing":
      return "review"
    case "playing":
      return "speaking"
    case "failed":
      return "failed"
    default:
      return "idle"
  }
}
