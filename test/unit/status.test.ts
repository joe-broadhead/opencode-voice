import { describe, expect, test } from "bun:test"
import { buildStatus, compactStatus, formatStatus, ROW_LABELS, unavailable } from "../../src/status.js"
import { VERSION } from "../../src/version.js"
import type { EngineInfo } from "../../src/engine/binary.js"
import type { InspectedAsset } from "../../src/engine/assets.js"
import type { Options } from "../../src/options.js"

const host = { version: "2.2.5", range: ">=2.2.3 <2.3.0", tested: true }
const options: Options = {
  submit: "send",
  autoSpeak: false,
  voice: "Luna",
  sttModel: "tiny-q5_1",
  language: "auto",
  maxRecordSeconds: 120,
  statusIndicator: "toast",
  keepTranscripts: false,
  allowUntestedHost: false,
  engine: true,
  access: "all",
}
const engine: EngineInfo = { path: "/x/aurum", version: "0.0.24", source: "download", verified: true, platform: "darwin-arm64", supported: true }
const model = (role: "stt" | "tts-model", state: "cached" | "missing"): InspectedAsset => ({
  role,
  name: role === "stt" ? "tiny-q5_1" : "kitten",
  file: role === "stt" ? "tiny.bin" : "kitten.onnx",
  url: "https://example.invalid/x",
  sha256: "a".repeat(64),
  bytes: 1024,
  licence: "MIT",
  revision: "r",
  path: "/x/model",
  state,
})

const facts = (overrides: Record<string, unknown> = {}) => ({
  host,
  engine,
  models: [model("stt", "cached"), model("tts-model", "cached")],
  modelsVersion: "0.0.24",
  microphone: "authorized" as const,
  input: "MacBook Pro Microphone",
  options,
  keybind: "ctrl+shift+space",
  ...overrides,
})

describe("the status model", () => {
  test("is ready when the engine, the models and the microphone are", () => {
    const status = buildStatus(facts())
    expect(status.state).toBe("ready")
    expect(status.nextStep).toBe("Nothing to do.")
    expect(status.privacy.audioLeavesMachine).toBe(false)
    expect(status.dictation.keybind).toBe("ctrl+shift+space")
  })

  test("the rows are the shared ones, in order", () => {
    const text = formatStatus(buildStatus(facts()))
    const labels = text.split("\n").slice(1).map((line) => line.split(":")[0])
    expect(labels).toEqual([...ROW_LABELS])
    expect(text).toContain("Connection: Engine 0.0.24 (verified)")
  })

  test("an engine whose shared library is missing names the library and the ALSA package, not an update", () => {
    const status = buildStatus(facts({ probe: { version: null, compatible: false, missingLibrary: "libasound.so.2" } }))
    expect(status.nextStep).toContain("libasound.so.2")
    expect(status.nextStep).toContain("libasound2")
    expect(status.nextStep).not.toContain("Aurum version")
  })

  test("a platform with no engine gives that platform's next step, not a reinstall", () => {
    const status = buildStatus(
      facts({
        engine: undefined,
        models: undefined,
        engineError: {
          code: "UNSUPPORTED_PLATFORM",
          message: "UNSUPPORTED_PLATFORM: There is no Aurum 0.0.24 binary for darwin-x64.",
          next: "Use macOS on Apple silicon or Linux, or set the aurumPath option to a local engine.",
        },
      }),
    )
    expect(status.nextStep).toContain("Apple silicon")
    expect(status.nextStep).not.toContain("Reinstall")
  })

  test("an engine that needs a newer C library says so, and names the systems that have it", () => {
    const status = buildStatus(facts({ probe: { version: null, compatible: false, olderSystem: "GLIBC_2.39" } }))
    expect(status.nextStep).toContain("GLIBC_2.39")
    expect(status.nextStep).toContain("Ubuntu 24.04")
  })

  test("a missing engine is not_configured with an install step", () => {
    const status = buildStatus(facts({ engine: undefined, models: undefined }))
    expect(status.state).toBe("not_configured")
    expect(status.nextStep).toContain("/voice-install")
  })

  test("missing models point at the install action", () => {
    const status = buildStatus(facts({ models: [model("stt", "missing"), model("tts-model", "missing")] }))
    expect(status.nextStep).toContain("/voice-install")
  })

  test("a denied microphone points at the OS setting", () => {
    const status = buildStatus(facts({ microphone: "denied" }))
    expect(status.nextStep).toContain("Microphone")
    expect(formatStatus(status)).toContain("Microphone denied")
  })

  test("an unsupported platform is failed, and an untested host says so", () => {
    expect(buildStatus(facts({ engine: { ...engine, supported: false } })).state).toBe("failed")
    expect(buildStatus(facts({ host: { version: "2.2.99", range: ">=2.2.3 <2.3.0", tested: false } })).state).toBe("ready")
    expect(buildStatus(facts({ host: { version: "3.0.0", range: ">=2.2.3 <2.3.0", tested: false } })).state).toBe("host_untested")
  })

  test("the compact text never carries a transcript", () => {
    const text = compactStatus(buildStatus(facts()))
    expect(text).toContain(`Voice ${VERSION}`)
    expect(text).toContain("on-device")
    expect(text).not.toContain("hello")
  })

  test("a failed read has a code and a next step", () => {
    const failure = unavailable(new Error("boom"))
    expect(failure.code).toBe("STATUS_UNAVAILABLE")
    expect(failure.message).toContain("STATUS_UNAVAILABLE:")
    expect(failure.nextStep.endsWith(".")).toBe(true)
  })
})

describe("the status model on a platform with no pinned engine", () => {
  test("the person's own binary is ready on Intel Mac, and is not called unverified", () => {
    const status = buildStatus(facts({ engine: { ...engine, source: "environment", verified: false, platform: "darwin-x64" } }))
    expect(status.state).toBe("ready")
    expect(status.nextStep).not.toContain("Reinstall")
  })
})
