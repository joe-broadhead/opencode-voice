/** One dictated transcript, kept only when `keepTranscripts` is on, as text and when it was sent. */
export interface HistoryEntry {
  readonly text: string
  readonly at: number
}

export const HISTORY_LIMIT = 20

export interface HistoryStore {
  read(): readonly HistoryEntry[]
  write(entries: readonly HistoryEntry[]): Promise<void>
}

/**
 * The opt-in transcript history: the last 20 texts, newest first, text only, in the plugin's own store. Audio is never
 * kept. The store belongs to OpenCode, so it lives under OpenCode's plugin storage with the rest of the plugin's state.
 */
export class TranscriptHistory {
  private readonly store: HistoryStore

  constructor(store: HistoryStore) {
    this.store = store
  }

  list(): readonly HistoryEntry[] {
    return this.store.read()
  }

  count(): number {
    return this.store.read().length
  }

  /** Adds one transcript at the front, dropping the oldest past the cap. */
  add(text: string, at = Date.now()): Promise<void> {
    const value = text.trim()
    if (value === "") return Promise.resolve()
    const entries = [{ text: value, at }, ...this.store.read()].slice(0, HISTORY_LIMIT)
    return this.store.write(entries)
  }

  clear(): Promise<void> {
    return this.store.write([])
  }
}
