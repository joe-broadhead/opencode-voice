/** The dictation phases, as one pure machine so the TUI and its tests agree. */
export type Phase = "idle" | "preparing" | "listening" | "transcribing" | "sending" | "reviewing" | "playing" | "failed"

export type Event =
  | "start"
  | "ready"
  | "end"
  | "transcribed"
  | "sent"
  | "review"
  | "play"
  | "stopped"
  | "cancel"
  | "error"

const NEXT: Readonly<Record<Phase, Partial<Record<Event, Phase>>>> = {
  idle: { start: "preparing", play: "playing" },
  preparing: { ready: "listening", cancel: "idle", error: "failed" },
  listening: { end: "transcribing", cancel: "idle", error: "failed" },
  transcribing: { transcribed: "sending", review: "reviewing", cancel: "idle", error: "failed" },
  sending: { sent: "idle", cancel: "idle", error: "failed" },
  reviewing: { sent: "idle", cancel: "idle", error: "failed" },
  playing: { stopped: "idle", cancel: "idle", error: "failed" },
  failed: { start: "preparing", cancel: "idle" },
}

/** The next phase, or the same phase when the event cannot apply here. */
export function next(phase: Phase, event: Event): Phase {
  return NEXT[phase][event] ?? phase
}

/** True while a dictation owns the microphone or a request. */
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
