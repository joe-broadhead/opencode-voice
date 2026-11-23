// The status evidence rule: only an empty release cache with a valid synthetic manifest is the optional
// `not_configured` case. A broken manifest and a bad aurumPath or VOICE_AURUM_PATH override are faults with their own
// actionable step, and no local path reaches the status text.
import { afterAll, describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { resolveEngine } from "../../src/engine/binary.js"
import { EngineError } from "../../src/engine/errors.js"
import { runVoiceTool } from "../../src/host/tools.js"
import { parseOptions } from "../../src/options.js"
import { buildStatus, engineErrorFact, type StatusFacts } from "../../src/status.js"
import { packageWith } from "../support/native-fixture.js"

const dir = mkdtempSync(join(tmpdir(), "voice-evidence-"))
afterAll(() => rmSync(dir, { recursive: true, force: true }))

const parsed = parseOptions({})
if (!parsed.ok) throw new Error("the test options must parse")
const base = {
  host: { version: "2.3.2", range: ">=2.2.3 <2.4.0", tested: true },
  options: parsed.options,
  keybind: "ctrl+space",
  engine: undefined,
  models: undefined,
} satisfies StatusFacts
const facts = (error: EngineError): StatusFacts => ({ ...base, engineError: engineErrorFact(error) })
const ON_PINNED = { platform: "darwin", arch: "arm64" } as const

const failure = (run: () => unknown): EngineError => {
  try {
    run()
  } catch (cause) {
    if (cause instanceof EngineError) return cause
    throw cause
  }
  throw new Error("expected the engine resolution to refuse")
}

const emptyFolder = (path: string) => !existsSync(path)

describe("status evidence for an absent engine", () => {
  test("an actual empty release cache with a valid manifest is not_configured, and installs nothing", async () => {
    const root = join(dir, "valid")
    packageWith(root)
    const cache = join(root, "cache")
    const error = failure(() => resolveEngine({ packageRoot: root, cacheRoot: cache, env: {}, ...ON_PINNED }))
    expect({ code: error.code, missing: error.missing }).toEqual({ code: "ENGINE_MISSING", missing: "not-installed" })
    const status = buildStatus(facts(error))
    expect(status.state).toBe("not_configured")
    expect(status.nextStep).toContain("optional")
    expect(status.nextStep).toContain("/voice-install")
    expect(status.nextStep).toContain("Nothing downloads")
    const answer = await runVoiceTool(
      { engine: undefined, status: async () => status, assert: (async () => undefined) as never },
      "status",
      {},
      { sessionID: "ses_empty", agent: "build", messageID: "msg_empty", id: "call_empty" },
    )
    expect(answer.output.state).toBe("not_configured")
    expect(answer.text).toContain("optional")
    // Status only read the valid manifest and the empty cache.
    expect(emptyFolder(cache)).toBe(true)
  })

  test("a bad aurumPath or VOICE_AURUM_PATH override is a failed fault with its own step, and no path leaks", () => {
    const root = join(dir, "overrides")
    packageWith(root)
    const optionPath = join(root, "secret-aurum-option")
    const option = failure(() => resolveEngine({ packageRoot: root, optionPath, env: {}, ...ON_PINNED }))
    expect({ code: option.code, missing: option.missing }).toEqual({ code: "ENGINE_MISSING", missing: "override" })
    const optionStatus = buildStatus(facts(option))
    expect(optionStatus.state).toBe("failed")
    expect(optionStatus.nextStep).toContain("aurumPath")
    expect(optionStatus.nextStep).not.toContain(optionPath)

    const envPath = join(root, "secret-aurum-environment")
    const environment = failure(() => resolveEngine({ packageRoot: root, env: { VOICE_AURUM_PATH: envPath }, ...ON_PINNED }))
    expect({ code: environment.code, missing: environment.missing }).toEqual({ code: "ENGINE_MISSING", missing: "override" })
    const environmentStatus = buildStatus(facts(environment))
    expect(environmentStatus.state).toBe("failed")
    expect(environmentStatus.nextStep).toContain("VOICE_AURUM_PATH")
    expect(environmentStatus.nextStep).not.toContain(envPath)
  })

  test("a broken or missing release manifest is a manifest fault, never the optional cache miss", () => {
    const root = join(dir, "manifest")
    packageWith(root)
    writeFileSync(join(root, "manifest", "native.json"), "{not a manifest")
    const broken = failure(() => resolveEngine({ packageRoot: root, cacheRoot: join(root, "cache"), env: {}, ...ON_PINNED }))
    expect({ code: broken.code, missing: broken.missing }).toEqual({ code: "ENGINE_MISSING", missing: "manifest" })
    const brokenStatus = buildStatus(facts(broken))
    expect(brokenStatus.state).toBe("failed")
    expect(brokenStatus.nextStep).toContain("valid")

    unlinkSync(join(root, "manifest", "native.json"))
    const absent = failure(() => resolveEngine({ packageRoot: root, cacheRoot: join(root, "cache"), env: {}, ...ON_PINNED }))
    expect({ code: absent.code, missing: absent.missing }).toEqual({ code: "ENGINE_MISSING", missing: "manifest" })
    const absentStatus = buildStatus(facts(absent))
    expect(absentStatus.state).toBe("failed")
    expect(absentStatus.nextStep).toContain("install a release")
  })
})
