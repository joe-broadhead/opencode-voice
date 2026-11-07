// The surfaces inside a real stock OpenCode server: the status RPC, the tools RPC, the engine RPC and the permission
// rules, on the binary in OPENCODE_BIN. No provider is configured, no model is called, and the fake engine answers.
import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { tone } from "../../src/engine/wav.js"
import { fakeEvents, startStock, type StockHost } from "./stock.js"

let host: StockHost
beforeAll(async () => {
  host = await startStock()
}, 60_000)
afterAll(async () => {
  await host.stop()
}, 60_000)

const rpc = (id: string, methods: Record<string, { input: object; output: object }>) =>
  host.client.rpc({ id, methods, events: {} } as never) as unknown as Record<string, (input: unknown, options?: unknown) => Promise<unknown>>

const statusRpc = () =>
  rpc("voice.dictation", { status: { input: { type: "object" }, output: { type: "object" } } })["status"]({}, { location: host.location })

const toolsRpc = () =>
  rpc("voice.dictation.tools", {
    describe: { input: { type: "object" }, output: { type: "object" } },
    voice_status: { input: { type: "object" }, output: { type: "object" } },
    voice_speak: { input: { type: "object" }, output: { type: "object" } },
  })

const engineRpc = () =>
  rpc("voice.dictation.engine", {
    status: { input: { type: "object" }, output: { type: "object" } },
    warmup: { input: { type: "object" }, output: { type: "object" } },
    transcribe: { input: { type: "object" }, output: { type: "object" } },
    synthesize: { input: { type: "object" }, output: { type: "object" } },
    cancel: { input: { type: "object" }, output: { type: "object" } },
  })

const session = async (permissions?: readonly { action: string; resource: string; effect: "allow" | "deny" | "ask" }[]) =>
  (
    await host.client.session.create({
      location: host.location,
      agent: "build",
      ...(permissions === undefined ? {} : { permissions }),
    })
  ).id

describe("voice on stock OpenCode", () => {
  test("the plugin loads and the status RPC answers with the shared fields", async () => {
    const status = (await statusRpc()) as Record<string, any>
    expect(status.state).toBe("ready")
    expect(status.host.range).toBe(">=2.2.3 <2.3.0")
    expect(status.host.tested).toBe(true)
    expect(status.engine.installed).toBe(true)
    expect(status.engine.platform).toContain(process.platform)
    expect(status.providers).toEqual({ stt: "local", tts: "local" })
    expect(status.privacy).toEqual({ audioLeavesMachine: false, keepRecordings: false, transcriptHistory: false })
    expect(typeof status.nextStep).toBe("string")
    expect(Array.isArray(status.unguardedAgents)).toBe(true)
  }, 120_000)

  test("the v2 methods are the two tools, classed read and write", async () => {
    const described = (await toolsRpc()["describe"]({}, { location: host.location })) as { methods: { name: string; class: string }[] }
    expect(described.methods.map((method) => `${method.name}:${method.class}`).sort()).toEqual(["voice_speak:write", "voice_status:read"])
  }, 120_000)

  test("voice_status is allowed to a script and voice_speak asks, so it is refused without a grant", async () => {
    const id = await session()
    const status = (await toolsRpc()["voice_status"]({ sessionID: id, input: {} }, { location: host.location })) as Record<string, any>
    expect(status.state).toBe("ready")
    const refused = await toolsRpc()["voice_speak"]({ sessionID: id, input: { text: "read this" } }, { location: host.location })
      .then(() => undefined, (error: unknown) => error as { data?: { code?: string } })
    expect(refused?.data?.code).toBe("PERMISSION_DENIED")
    expect(fakeEvents(host.log).filter((event) => event.event === "play")).toHaveLength(0)
  }, 120_000)

  test("a session that allows voice_speak runs it and plays the audio", async () => {
    const id = await session([{ action: "voice_speak", resource: "*", effect: "allow" }])
    const result = (await toolsRpc()["voice_speak"]({ sessionID: id, input: { text: "read this" } }, { location: host.location })) as Record<string, any>
    expect(result.played).toBe(true)
    expect(fakeEvents(host.log).some((event) => event.event === "play")).toBe(true)
  }, 120_000)

  test("the engine RPC transcribes bytes as a host such as Jelly would", async () => {
    const audio = tone(1.2).toString("base64")
    const result = (await engineRpc()["transcribe"]({ v: 1, audio, mime: "audio/wav" }, { location: host.location })) as Record<string, any>
    expect(result.text).toBe("hello from the fixture engine")
    expect(result.silent).toBe(false)
    expect(result.ms).toBeGreaterThanOrEqual(0)
  }, 120_000)

  test("the engine RPC refuses audio that is not WAV", async () => {
    const refused = await engineRpc()["transcribe"]({ v: 1, audio: Buffer.from("not a wav").toString("base64"), mime: "audio/wav" }, { location: host.location })
      .then(() => undefined, (error: unknown) => error as { data?: { code?: string } })
    expect(refused?.data?.code).toBe("BAD_AUDIO")
  }, 120_000)

  test("the engine status advertises its capabilities", async () => {
    const result = (await engineRpc()["status"]({ v: 1 }, { location: host.location })) as Record<string, any>
    expect(result.v).toBe(1)
    expect(result.caps).toContain("transcribe")
    expect(result.caps).toContain("synthesize")
  }, 120_000)
})
