// The conformance recorder: it drives the real handler table with a deterministic fake provider and writes the one
// fixture `plugin-kit check` replays. `plugin-kit record` redacts it afterwards; there is nothing to redact (no account,
// no provider URL, no event), so a second run writes the same bytes.
import { describe, expect, test } from "bun:test"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import type { Manifest } from "@we-the-rebel-alliance/plugin-contract/manifest"
import type { MethodCall } from "@we-the-rebel-alliance/plugin-contract/register"
import type { EngineFacts, Provider } from "../../src/provider/create.js"
import { createHandlers } from "../../src/handlers/index.js"
import { DEFAULTS, type Options } from "../../src/options.js"

const root = fileURLToPath(new URL("../../", import.meta.url))
const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8")) as { name: string; version: string; capabilities: Manifest }
const manifest = pkg.capabilities
const options = { ...(DEFAULTS as unknown as Options) }

const facts: EngineFacts = {
  engine: { path: "/cache/voice-plugin/native/v0.0.0/aurum/linux-x64-gnu/aurum", version: "0.0.24", source: "download", verified: true, platform: "linux-x64", supported: true },
  probe: { version: "0.0.24", compatible: true },
  models: [
    { role: "stt", name: "tiny-q5_1", file: "tiny.bin", url: "https://example.invalid/tiny.bin", sha256: "a".repeat(64), bytes: 10, licence: "MIT", revision: "r", path: "/cache/voice-plugin/engine/models/tiny.bin", state: "cached" },
    { role: "tts-model", name: "kitten", file: "kitten.onnx", url: "https://example.invalid/kitten.onnx", sha256: "b".repeat(64), bytes: 20, licence: "Apache-2.0", revision: "r", group: "kitten", path: "/cache/voice-plugin/engine/tts/kitten/kitten.onnx", state: "cached" },
  ],
  modelsVersion: "0.0.24",
  doctor: [{ id: "microphone", ok: true, detail: "Studio Mic" }],
  microphone: "authorized",
  input: "Studio Mic",
}

const provider = {
  facts: async () => facts,
} as unknown as Provider

const call = {
  sessionID: "ses_record",
  agent: "build",
  messageID: "msg_record",
  id: "call_record",
  signal: new AbortController().signal,
  progress: async () => undefined,
  account: "default",
  bus: { name: "voice", emit: async () => ({ ok: true }) },
  access: { level: "all", aliases: ["default"], rules: [], problems: [], dispose: async () => undefined },
  unguardedAgents: async () => ({ ok: true, agents: [] }),
  door: "rpc",
} as unknown as MethodCall

describe("the conformance recording", () => {
  test("writes the fixture the kit replays", async () => {
    const handlers = createHandlers({ provider, manifest, version: pkg.version, options, keybind: "ctrl+space", hostVersion: "2.4.1" })
    const status = (await handlers.status.run({}, call)) as Record<string, unknown>
    const fixture = {
      $comment: "Recorded from the plugin's own handler table with the pinned engine and models present: a tools-only plugin with no accounts, no sources and no bus events.",
      plugin: pkg.name,
      namespace: manifest.plugin.summary,
      events: { emitted: [], status },
      rpc: { inputs: { speak: { text: "hello" } } },
    }
    const text = `${JSON.stringify(fixture, null, 2)}\n`
    const path = `${root}fixtures/conformance.json`
    let committed: string | undefined
    try {
      committed = readFileSync(path, "utf8")
    } catch {
      committed = undefined
    }
    mkdirSync(`${root}fixtures`, { recursive: true })
    writeFileSync(path, text)
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual(fixture)
    // The committed fixture is the recording: a handler change that alters the answer fails here until it is re-recorded.
    if (committed !== undefined) expect(committed).toBe(text)
    expect(fixture.namespace.length).toBeLessThanOrEqual(400)
    expect(fixture.events.status["accounts"]).toEqual([])
    expect(fixture.events.status["state"]).toBe("ready")
    expect(fixture.events.status["nextStep"]).toBeNull()
  })
})
