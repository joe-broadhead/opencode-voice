// The dictation flow's guarantees: a cancel wins at every phase, and every recording is released on every path.
import { describe, expect, test } from "bun:test"
import { DictationFlow } from "../../src/dictation/flow.js"
import type { SpeechEngine } from "../../src/engine/index.js"

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

interface Harness {
  flow: DictationFlow
  submitted: string[]
  released: string[]
  cancelled: number
  started: number
  emit: (dbfs: number) => void
  recorderReady: ReturnType<typeof deferred<{ recorder: unknown; path: string }>>
  transcribe: ReturnType<typeof deferred<{ text: string; silent: boolean }>>
  review: ReturnType<typeof deferred<string | undefined>>
  submit: ReturnType<typeof deferred<void>>
  toasts: string[]
  phases: string[]
  recorder: { start: (handlers: { onLevel: (dbfs: number) => void }) => void; stop: () => Promise<{ path: string; bytes: number; seconds: number }>; cancel: () => void }
}

function harness(options: { mode?: "send" | "review"; holdRecorder?: boolean; failTranscribe?: boolean } = {}): Harness {
  const submitted: string[] = []
  const released: string[] = []
  const toasts: string[] = []
  const phases: string[] = []
  let cancelled = 0
  let started = 0
  let onLevel: ((dbfs: number) => void) | undefined
  const recorderReady = deferred<{ recorder: unknown; path: string }>()
  const transcribe = deferred<{ text: string; silent: boolean }>()
  const review = deferred<string | undefined>()
  const submit = deferred<void>()
  const recorder = {
    start: (handlers: { onLevel: (dbfs: number) => void }) => {
      started += 1
      onLevel = handlers.onLevel
    },
    stop: async () => ({ path: "/x/rec.wav", bytes: 100, seconds: 1 }),
    cancel: () => {
      cancelled += 1
    },
  }
  const engine = {
    recorder: async () => (options.holdRecorder === true ? recorderReady.promise : { recorder, path: "/x/rec.wav" }),
    transcribeFile: async () => {
      if (options.failTranscribe === true) throw new Error("engine failed")
      return transcribe.promise
    },
    release: async (path: string) => void released.push(path),
    cancel: () => undefined,
    synthesize: async () => ({ path: "/x/s.wav", spoken: "x", durationMs: 1, voice: "Luna" }),
    play: async () => undefined,
    stopPlayback: () => undefined,
  } as unknown as SpeechEngine
  const flow = new DictationFlow({
    engine,
    activeSession: () => "ses_1",
    submit: async (_sessionID, text) => {
      submitted.push(text)
      if (options.mode !== "review") return submit.promise
    },
    review: async () => review.promise,
    toast: (message) => void toasts.push(message),
    status: (phase) => void phases.push(phase),
    submitMode: () => options.mode ?? "send",
    record: () => undefined,
  })
  return { flow, submitted, released, get cancelled() { return cancelled }, get started() { return started }, recorder, emit: (dbfs) => onLevel?.(dbfs), recorderReady, transcribe, review, submit, toasts, phases }
}

const speech = (h: Harness) => {
  for (let index = 0; index < 10; index += 1) h.emit(-20)
}

describe("cancel at every phase", () => {
  test("preparing: the recorder never starts, nothing is sent, the path is released", async () => {
    const h = harness({ holdRecorder: true })
    const starting = h.flow.start()
    h.flow.cancel()
    h.recorderReady.resolve({ recorder: h.recorder, path: "/x/rec.wav" })
    await starting
    expect(h.started).toBe(0)
    expect(h.submitted).toEqual([])
    expect(h.released).toContain("/x/rec.wav")
    expect(h.flow.state).toBe("idle")
  })

  test("listening: the recorder is cancelled and nothing is sent", async () => {
    const h = harness()
    await h.flow.start()
    h.flow.cancel()
    speech(h)
    expect(h.cancelled).toBeGreaterThanOrEqual(1)
    expect(h.submitted).toEqual([])
    expect(h.flow.state).toBe("idle")
  })

  test("transcribing: the late transcript is never sent and the file is released", async () => {
    const h = harness()
    await h.flow.start()
    const finishing = h.flow.finish()
    h.flow.cancel()
    h.transcribe.resolve({ text: "do not send", silent: false })
    await finishing
    expect(h.submitted).toEqual([])
    expect(h.released).toContain("/x/rec.wav")
  })

  test("reviewing: a late dialog result is never sent", async () => {
    const h = harness({ mode: "review" })
    await h.flow.start()
    const finishing = h.flow.finish()
    await new Promise((resolve) => setTimeout(resolve, 5))
    h.transcribe.resolve({ text: "hello", silent: false })
    await new Promise((resolve) => setTimeout(resolve, 5))
    h.flow.cancel()
    h.review.resolve("edited")
    await finishing
    expect(h.submitted).toEqual([])
  })

  test("sending: a cancel does not send a second time", async () => {
    const h = harness()
    await h.flow.start()
    h.transcribe.resolve({ text: "hello", silent: false })
    const finishing = h.flow.finish()
    await new Promise((resolve) => setTimeout(resolve, 5))
    h.flow.cancel()
    h.submit.resolve()
    await finishing
    expect(h.submitted).toEqual(["hello"])
  })
})

describe("the recording is released on every path", () => {
  test("a failed transcription still deletes the file", async () => {
    const h = harness({ failTranscribe: true })
    await h.flow.start()
    await h.flow.finish()
    expect(h.released).toContain("/x/rec.wav")
    expect(h.submitted).toEqual([])
  })

  test("a silent transcript deletes it", async () => {
    const h = harness()
    await h.flow.start()
    h.transcribe.resolve({ text: "", silent: true })
    await h.flow.finish()
    expect(h.released).toContain("/x/rec.wav")
  })
})
