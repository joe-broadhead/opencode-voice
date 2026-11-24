// The surfaces inside a real stock OpenCode server: the status RPC, the tools RPC and the permission rules, on the
// binary in OPENCODE_BIN. No provider is configured, no model is called, and the fake engine answers.
import { HOST_ENV } from "./isolate.js"
import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { existsSync } from "node:fs"
import { stockGate } from "../support/stock-gate.js"
import { BIN, VERSION, fakeEvents, startStock, type StockHost } from "./stock.js"

/** This tested release: it runs here, skips with a notice on a laptop without its binary, and fails in CI. */
const gate = stockGate(VERSION, BIN ?? `(OPENCODE_BIN_${VERSION.replaceAll(".", "_")} is unset)`, BIN !== undefined && existsSync(BIN), HOST_ENV)

/** Set by the describe's beforeAll, which runs only when the gate runs the suite. */
let host!: StockHost

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

const session = async (permissions?: readonly { action: string; resource: string; effect: "allow" | "deny" | "ask" }[]) =>
  (
    await host.client.session.create({
      location: host.location,
      agent: "build",
      ...(permissions === undefined ? {} : { permissions }),
    })
  ).id

describe.skipIf(gate === "skip")("voice on stock OpenCode", () => {
  beforeAll(async () => {
    host = await startStock()
  }, 60_000)
  afterAll(async () => {
    await host.stop()
  }, 60_000)

  test("the plugin loads and the status RPC answers with the shared fields", async () => {
    const status = (await statusRpc()) as Record<string, any>
    expect(status.state).toBe("ready")
    expect(status.host.range).toBe(">=2.4.1 <2.5.0")
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

  test("voice_status is allowed, and voice_speak runs under the default allow", async () => {
    const id = await session()
    const status = (await toolsRpc()["voice_status"]({ sessionID: id, input: {} }, { location: host.location })) as Record<string, any>
    expect(status.state).toBe("ready")
    // Every tool is allowed by default (R18), so a script speaks with no prompt.
    const spoken = (await toolsRpc()["voice_speak"]({ sessionID: id, input: { text: "read this" } }, { location: host.location })) as Record<string, any>
    expect(spoken.played).toBe(true)
    expect(fakeEvents(host.log).some((event) => event.event === "play")).toBe(true)
  }, 120_000)

  test("a session that denies voice_speak is refused with no server call", async () => {
    const id = await session([{ action: "voice_speak", resource: "*", effect: "deny" }])
    const before = fakeEvents(host.log).filter((event) => event.event === "play").length
    const refused = await toolsRpc()["voice_speak"]({ sessionID: id, input: { text: "read this" } }, { location: host.location })
      .then(() => undefined, (error: unknown) => error as { data?: { code?: string } })
    expect(refused?.data?.code).toBe("PERMISSION_DENIED")
    expect(fakeEvents(host.log).filter((event) => event.event === "play").length).toBe(before)
  }, 120_000)

  // R2: an ask is refused before dispatch, with no prompt and no engine call, because a script cannot answer one.
  test("a session whose rule asks for voice_speak is refused with no engine call", async () => {
    const id = await session([{ action: "voice_speak", resource: "*", effect: "ask" }])
    const before = fakeEvents(host.log).filter((event) => event.event === "play").length
    const refused = await toolsRpc()["voice_speak"]({ sessionID: id, input: { text: "read this" } }, { location: host.location })
      .then(() => undefined, (error: unknown) => error as { data?: { code?: string } })
    expect(refused?.data?.code).toBe("PERMISSION_DENIED")
    expect(fakeEvents(host.log).filter((event) => event.event === "play").length).toBe(before)
  }, 120_000)

  test("a session that allows voice_speak runs it and plays the audio", async () => {
    const id = await session([{ action: "voice_speak", resource: "*", effect: "allow" }])
    const result = (await toolsRpc()["voice_speak"]({ sessionID: id, input: { text: "read this" } }, { location: host.location })) as Record<string, any>
    expect(result.played).toBe(true)
    expect(fakeEvents(host.log).some((event) => event.event === "play")).toBe(true)
  }, 120_000)

})
