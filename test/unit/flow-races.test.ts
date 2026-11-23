// Stop during render and stale cleanup: the old speak operation may finish later, but it must neither play nor reset a
// newer dictation's state. The host and engine are fakes; no audio is used.
import { describe, expect, test } from "bun:test"
import { DictationFlow } from "../../src/dictation/flow.js"

interface Speech {
  readonly path: string
  readonly spoken: string
  readonly durationMs: number
  readonly voice: string
}

function harness() {
  const calls: string[] = []
  const states: string[] = []
  let resolveSynth: ((speech: Speech) => void) | undefined
  let rejectSynth: ((error: unknown) => void) | undefined
  const synthesized = new Promise<Speech>((resolve, reject) => {
    resolveSynth = resolve
    rejectSynth = reject
  })
  const engine = {
    synthesize: async () => synthesized,
    play: async () => void calls.push("play"),
    release: async () => void calls.push("release"),
    cancel: () => void calls.push("cancel"),
    stopPlayback: () => void calls.push("stopPlayback"),
    recorder: async () => ({
      path: "/x/rec.wav",
      recorder: {
        start: () => undefined,
        stop: async () => ({ path: "/x/rec.wav", bytes: 100, seconds: 1 }),
        cancel: () => void calls.push("recorder-cancel"),
      },
    }),
    transcribeFile: async () => ({ text: "hello", silent: false, provider: "local", model: "tiny-q5_1", wav: {} }),
  }
  const host = {
    engine,
    activeSession: () => "ses_1",
    submit: async () => undefined,
    review: async (text: string) => text,
    toast: () => undefined,
    status: (phase: string) => void states.push(phase),
    submitMode: () => "send" as const,
    record: () => undefined,
  }
  return {
    flow: new DictationFlow(host as never),
    calls,
    states,
    resolveSynth: (speech: Speech) => resolveSynth!(speech),
    rejectSynth: (error: unknown) => rejectSynth!(error),
  }
}

const speech: Speech = { path: "/x/speech.wav", spoken: "hello", durationMs: 1_000, voice: "Luna" }

describe("speak and dictation races", () => {
  test("Stop during render rejects the operation and never calls play", async () => {
    const { flow, calls, resolveSynth } = harness()
    const speaking = flow.speak("hello")
    expect(flow.state).toBe("playing")
    flow.stop()
    expect(flow.state).toBe("idle")
    expect(calls).toContain("cancel")
    resolveSynth(speech)
    await speaking
    expect(calls).not.toContain("play")
    expect(calls).toContain("release")
    expect(flow.state).toBe("idle")
  })

  test("stale render cleanup does not reset a newer dictation's listening state", async () => {
    const { flow, calls, resolveSynth } = harness()
    const speaking = flow.speak("hello")
    flow.stop()
    await flow.start()
    expect(flow.state).toBe("listening")
    resolveSynth(speech)
    await speaking
    expect(flow.state).toBe("listening")
    expect(calls).not.toContain("play")
    expect(calls).toContain("release")
    flow.cancel()
    expect(flow.state).toBe("idle")
  })
})
