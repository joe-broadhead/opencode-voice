import { describe, expect, test } from "bun:test"
import { runVoiceTool } from "../../src/host/tools.js"
import { DictationFlow } from "../../src/dictation/flow.js"
import type { SpeechEngine } from "../../src/engine/index.js"
import { buildStatus } from "../../src/status.js"

const status = buildStatus({
  engine: { path: "/x/aurum", version: "0.0.24", source: "package", verified: true, platform: "darwin-arm64", supported: true },
  models: [],
  host: { version: "2.2.5", range: ">=2.2.3 <2.3.0", tested: true },
  options: {
    submit: "send",
    autoSpeak: false,
    voice: "Luna",
    sttModel: "tiny-q5_1",
    language: "auto",
    maxRecordSeconds: 120,
    statusIndicator: "toast",
    keepTranscripts: false,
    allowUntestedHost: false,
    access: "all",
    engine: true,
  },
  keybind: "ctrl+shift+space",
})

function fakeEngine(overrides: Partial<Record<keyof SpeechEngine, unknown>> = {}) {
  const calls: string[] = []
  const engine = {
    synthesize: async () => ({ path: "/x/x.wav", spoken: "hello", durationMs: 1200, voice: "Luna" }),
    play: async () => void calls.push("play"),
    release: async () => void calls.push("release"),
    recorder: async () => ({
      path: "/x/rec.wav",
      recorder: {
        start: () => undefined,
        stop: async () => ({ path: "/x/rec.wav", bytes: 100, seconds: 1 }),
        cancel: () => undefined,
      },
    }),
    transcribeFile: async () => ({ text: "hello world", silent: false, provider: "local", model: "tiny-q5_1", wav: {} }),
    cancel: () => undefined,
    ...overrides,
  } as unknown as SpeechEngine
  return { engine, calls }
}

const call = { sessionID: "ses_1", agent: "build", messageID: "msg_1", id: "call_1" }

describe("the tools", () => {
  test("voice_status reads the status and needs no permission check", async () => {
    let asserted = 0
    const { engine } = fakeEngine()
    const result = await runVoiceTool({ engine, status: async () => status, assert: (async () => void (asserted += 1)) as never }, "status", {}, call)
    expect(result.output.state).toBe("ready")
    expect(result.text).toContain("Voice 0.0.0")
    expect(asserted).toBe(0)
  })

  test("voice_speak asserts first, then synthesizes and plays", async () => {
    const order: string[] = []
    const { engine } = fakeEngine()
    const result = await runVoiceTool(
      {
        engine,
        status: async () => status,
        assert: (async () => void order.push("assert")) as never,
      },
      "speak",
      { text: "hello" },
      call,
    )
    expect(order).toEqual(["assert"])
    expect(result.output.played).toBe(true)
  })

  test("a refused assert plays nothing", async () => {
    const { engine, calls } = fakeEngine()
    const error = await runVoiceTool(
      { engine, status: async () => status, assert: (async () => Promise.reject(new Error("declined"))) as never },
      "speak",
      { text: "hello" },
      call,
    ).then(() => undefined, (cause: unknown) => cause)
    expect(String(error)).toContain("declined")
    expect(calls).toEqual([])
  })
})

describe("the dictation flow", () => {
  const hostOf = (overrides: Record<string, unknown> = {}) => {
    const submitted: string[] = []
    const toasts: string[] = []
    const states: string[] = []
    const { engine, calls } = fakeEngine()
    const host = {
      engine,
      activeSession: () => "ses_1",
      submit: async (_sessionID: string, text: string) => void submitted.push(text),
      review: async (text: string) => text,
      toast: (message: string) => void toasts.push(message),
      status: (phase: string) => void states.push(phase),
      submitMode: () => "send" as const,
      record: () => undefined,
      ...overrides,
    }
    return { host, submitted, toasts, states, calls }
  }

  test("send mode submits the transcript once", async () => {
    const { host, submitted } = hostOf()
    const flow = new DictationFlow(host as never)
    await flow.start()
    // The fake recorder never emits; the flow is listening and a key press finishes it.
    await flow.finish()
    expect(submitted).toEqual(["hello world"])
    expect(flow.state).toBe("idle")
  })

  test("review mode submits the edited text", async () => {
    const { host, submitted } = hostOf({ submitMode: () => "review" as const, review: async () => "edited" })
    const flow = new DictationFlow(host as never)
    await flow.start()
    await flow.finish()
    expect(submitted).toEqual(["edited"])
  })

  test("a dismissed review sends nothing", async () => {
    const { host, submitted } = hostOf({ submitMode: () => "review" as const, review: async () => undefined })
    const flow = new DictationFlow(host as never)
    await flow.start()
    await flow.finish()
    expect(submitted).toEqual([])
  })

  test("silence sends nothing and says so", async () => {
    const { host, submitted, toasts } = hostOf()
    const silent = fakeEngine({ transcribeFile: async () => ({ text: "", silent: true, provider: "local", model: "m", wav: {} }) })
    const flow = new DictationFlow({ ...host, engine: silent.engine } as never)
    await flow.start()
    await flow.finish()
    expect(submitted).toEqual([])
    expect(toasts.join(" ")).toContain("No speech")
  })

  test("cancel sends nothing", async () => {
    const { host, submitted } = hostOf()
    const flow = new DictationFlow(host as never)
    await flow.start()
    flow.cancel()
    expect(submitted).toEqual([])
    expect(flow.state).toBe("idle")
  })
})
