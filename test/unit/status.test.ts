import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import type { Manifest } from "@we-the-rebel-alliance/plugin-contract/manifest"
import type { EngineFacts } from "../../src/provider/create.js"
import { EngineError } from "../../src/provider/errors.js"
import { buildDoctor, formatDoctor, type DoctorInput } from "../../src/handlers/doctor.js"
import { buildStatus } from "../../src/handlers/status.js"
import { DEFAULTS, type Options } from "../../src/options.js"

const manifest = (JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { capabilities: Manifest }).capabilities
const options: Options = { ...(DEFAULTS as unknown as Options) }

const input: DoctorInput = {
  provider: { facts: async () => ({ microphone: "authorized" }) },
  manifest,
  version: "0.0.0",
  options,
  keybind: "ctrl+shift+space",
  hostVersion: "2.4.1",
}

const ready: EngineFacts = {
  engine: { path: "/cache/aurum", version: "0.0.24", source: "download", verified: true, platform: "linux-x64", supported: true },
  probe: { version: "0.0.24", compatible: true },
  models: [
    { role: "stt", name: "tiny-q5_1", file: "tiny.bin", url: "https://example.invalid/tiny.bin", sha256: "a".repeat(64), bytes: 10, licence: "MIT", revision: "r", path: "/cache/engine/models/tiny.bin", state: "cached" },
    { role: "tts-model", name: "kitten", file: "kitten.onnx", url: "https://example.invalid/kitten.onnx", sha256: "b".repeat(64), bytes: 20, licence: "Apache-2.0", revision: "r", group: "kitten", path: "/cache/engine/tts/kitten/kitten.onnx", state: "cached" },
  ],
  modelsVersion: "0.0.24",
  doctor: [{ id: "microphone", ok: true, detail: "Studio Mic" }],
  microphone: "authorized",
  input: "Studio Mic",
}

describe("doctor", () => {
  test("answers the engine, models, microphone, key and next step", () => {
    const answer = buildDoctor(input, ready, [])
    expect(answer.name).toBe("voice")
    expect(answer.host).toEqual({ version: "2.4.1", range: ">=2.4.1 <2.5.0", tested: true })
    expect(answer.state).toBe("ready")
    expect(answer.engine).toMatchObject({ installed: true, version: "0.0.24", verified: true, compatible: true })
    expect(answer.models.stt?.state).toBe("cached")
    expect(answer.models.tts?.name).toBe("kitten")
    expect(answer.microphone).toEqual({ permission: "authorized", input: "Studio Mic", output: null })
    expect(answer.dictation).toEqual({ keybind: "ctrl+shift+space", submit: "send" })
    expect(answer.tools).toEqual({ registered: 3, readable: 2 })
    expect(answer.privacy).toEqual({ audioLeavesMachine: false, keepRecordings: false, transcriptHistory: false })
    expect(answer.nextStep).toBeNull()
  })

  test("an absent optional engine is not_configured with the install step", () => {
    const facts: EngineFacts = { microphone: "unknown", engineError: new EngineError("ENGINE_MISSING", "The pinned speech engine is not installed.", undefined, "not-installed") }
    const answer = buildDoctor(input, facts, [])
    expect(answer.state).toBe("not_configured")
    expect(answer.engine.installed).toBe(false)
    expect(answer.engine.error?.code).toBe("ENGINE_MISSING")
    expect(answer.nextStep).toContain("/voice-install")
  })

  test("a missing model asks for /voice-install", () => {
    const facts: EngineFacts = { ...ready, models: [{ ...ready.models![0]!, state: "missing" }] }
    expect(buildDoctor(input, facts, []).nextStep).toBe("Run /voice-install to download the speech models.")
  })

  test("a denied microphone names the system setting", () => {
    const facts: EngineFacts = { ...ready, microphone: "denied", doctor: [{ id: "microphone", ok: false, detail: "denied" }] }
    expect(buildDoctor(input, facts, []).nextStep).toContain("System Settings")
  })

  test("an incompatible engine is failed, with the library it needs when known", () => {
    const facts: EngineFacts = { ...ready, probe: { version: "0.0.24", compatible: false, missingLibrary: "libasound.so.2" } }
    const answer = buildDoctor(input, facts, [])
    expect(answer.state).toBe("failed")
    expect(answer.nextStep).toContain("libasound.so.2")
    expect(answer.problems.join(" ")).toContain("engine")
  })

  test("the dialog text names every row and no credential", () => {
    const text = formatDoctor(buildDoctor(input, ready, ["build"]))
    for (const row of ["Connection:", "Account:", "Access:", "Models:", "Dictation:", "Tools:", "Agents without default rules:", "OpenCode:", "Next step:"]) {
      expect(text).toContain(row)
    }
    expect(text).toContain("build")
    expect(text).not.toContain("token")
  })
})

describe("status", () => {
  test("is exactly the contract's shape with no accounts", () => {
    const answer = buildStatus(input, ready, { agents: ["build"] })
    expect(Object.keys(answer).sort()).toEqual(["accounts", "host", "name", "nextStep", "state", "unguardedAgents", "version"])
    expect(answer).toMatchObject({ name: "voice", version: "0.0.0", state: "ready", accounts: [], unguardedAgents: ["build"], nextStep: null })
    expect(answer.host).toEqual({ version: "2.4.1", range: ">=2.4.1 <2.5.0", tested: ["2.4.1"] })
  })

  test("a next step is the one problem, and the state is error until it is done", () => {
    const facts: EngineFacts = { microphone: "unknown" }
    const answer = buildStatus(input, facts, { agents: [] })
    expect(answer.state).toBe("error")
    expect(answer.nextStep).toContain("/voice-install")
  })

  test("an unreadable agent list is unknown, never zero, and is reported", () => {
    const answer = buildStatus(input, ready, { agents: [], problem: "The agent list could not be read." })
    expect(answer.state).toBe("error")
    expect(answer.nextStep).toBe("The agent list could not be read.")
    expect(answer.unguardedAgents).toEqual([])
  })

  test("an empty host version is named unknown, never an empty string", () => {
    expect(buildStatus({ ...input, hostVersion: "" }, ready, { agents: [] }).host.version).toBe("unknown")
  })

  test("a local engine path never reaches the status answer", () => {
    const facts: EngineFacts = {
      ...ready,
      engine: { ...ready.engine!, path: "/Users/someone/secret/aurum" },
      engineError: new EngineError("ENGINE_UNVERIFIED", "The downloaded engine at /Users/someone/secret/aurum does not match its hash."),
    }
    const text = JSON.stringify(buildStatus(input, facts, { agents: [] }))
    expect(text).not.toContain("secret/aurum")
  })
})
