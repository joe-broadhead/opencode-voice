import { describe, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { digestMatches, isCompatibleEngine, parseEngineVersion, probeEngine, resolveEngine } from "../../src/engine/binary.js"

const FAKE = new URL("../fixtures/fake-aurum.mjs", import.meta.url).pathname
const dir = () => mkdtempSync(join(tmpdir(), "voice-bin-"))
// The pinned asset is darwin-arm64. Each call names that platform, so the resolver's answer does not depend on the runner.
const PINNED = "darwin-arm64"
const ON_PINNED = { platform: "darwin", arch: "arm64" } as const

describe("engine resolution", () => {
  const pinned = (root: string, bin: string, sha: string) => {
    const key = PINNED
    mkdirSync(join(root, "manifest"), { recursive: true })
    writeFileSync(
      join(root, "manifest", "aurum.json"),
      JSON.stringify({
        version: "0.0.24",
        tag: "v0.0.24",
        commit: "1a3c28c",
        source: "test",
        licence: "MIT",
        assets: { [key]: { name: "aurum-test", url: "https://example.invalid/aurum", sha256: sha, bytes: readFileSync(bin).byteLength } },
      }),
    )
    mkdirSync(join(root, "cache", "engine", "bin"), { recursive: true })
    writeFileSync(join(root, "cache", "engine", "bin", "aurum"), readFileSync(bin), { mode: 0o755 })
  }

  test("a downloaded engine whose digest does not match is refused with ENGINE_UNVERIFIED", () => {
    const root = dir()
    try {
      const bin = join(root, "aurum")
      writeFileSync(bin, "#!/bin/sh\nexit 0\n", { mode: 0o755 })
      pinned(root, bin, "b".repeat(64))
      const error = (() => {
        try {
          resolveEngine({ packageRoot: root, cacheRoot: join(root, "cache"), env: {}, ...ON_PINNED })
          return undefined
        } catch (cause) {
          return cause as { code?: string }
        }
      })()
      expect(error?.code).toBe("ENGINE_UNVERIFIED")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a downloaded engine with a matching digest is verified", () => {
    const root = dir()
    try {
      const bin = join(root, "aurum")
      writeFileSync(bin, "#!/bin/sh\nexit 0\n", { mode: 0o755 })
      const sha = createHash("sha256").update(readFileSync(bin)).digest("hex")
      pinned(root, bin, sha)
      const info = resolveEngine({ packageRoot: root, cacheRoot: join(root, "cache"), env: {}, ...ON_PINNED })
      expect(info.verified).toBe(true)
      expect(info.source).toBe("download")
      expect(info.version).toBe("0.0.24")
      expect(digestMatches(bin, sha)).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("an aurum on PATH is never run", () => {
    const root = dir()
    try {
      const bin = join(root, "aurum")
      writeFileSync(bin, "#!/bin/sh\nexit 0\n", { mode: 0o755 })
      chmodSync(bin, 0o755)
      const error = (() => {
        try {
          resolveEngine({ packageRoot: root, env: { PATH: root }, ...ON_PINNED })
          return undefined
        } catch (cause) {
          return cause as { code?: string }
        }
      })()
      expect(error?.code).toBe("ENGINE_MISSING")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("the test seam is labelled environment and unverified", () => {
    const root = dir()
    try {
      const info = resolveEngine({ packageRoot: root, env: { VOICE_AURUM_PATH: FAKE } })
      expect(info.source).toBe("environment")
      expect(info.verified).toBe(false)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})

describe("the engine version", () => {
  test("parses aurum output and requires 0.0.24", () => {
    expect(parseEngineVersion("aurum 0.0.24")).toBe("0.0.24")
    expect(parseEngineVersion("aurum 0.0.24-fixture")).toBe("0.0.24")
    expect(parseEngineVersion("nonsense")).toBeUndefined()
    expect(isCompatibleEngine("0.0.23")).toBe(false)
    expect(isCompatibleEngine("0.0.24")).toBe(true)
    expect(isCompatibleEngine("0.1.0")).toBe(true)
    expect(isCompatibleEngine(undefined)).toBe(false)
  })

  test("probes a real binary, and an older one is incompatible", async () => {
    expect((await probeEngine(FAKE)).compatible).toBe(true)
    process.env.FAKE_AURUM_VERSION = "0.0.23"
    try {
      const probe = await probeEngine(FAKE)
      expect(probe.version).toBe("0.0.23")
      expect(probe.compatible).toBe(false)
    } finally {
      delete process.env.FAKE_AURUM_VERSION
    }
  }, 20_000)

  test("an engine the loader refuses names the library it could not open, and is incompatible", async () => {
    const root = dir()
    try {
      const bin = join(root, "aurum")
      writeFileSync(bin, "#!/bin/sh\necho 'aurum: error while loading shared libraries: libasound.so.2: cannot open shared object file' >&2\nexit 127\n", { mode: 0o755 })
      expect(await probeEngine(bin)).toEqual({ version: null, compatible: false, missingLibrary: "libasound.so.2" })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }, 20_000)
})
