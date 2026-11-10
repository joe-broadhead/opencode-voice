import { describe, expect, test } from "bun:test"
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { digestMatches, isCompatibleEngine, parseEngineVersion, probeEngine, resolveEngine } from "../../src/engine/binary.js"
import { EXECUTABLE, packageWith, sha } from "../support/native-fixture.js"

const FAKE = new URL("../fixtures/fake-aurum.mjs", import.meta.url).pathname
const dir = () => mkdtempSync(join(tmpdir(), "voice-bin-"))
// Each call names the platform, so the resolver's answer does not depend on the runner.
const ON_PINNED = { platform: "darwin", arch: "arm64" } as const

const failure = (run: () => unknown): { code?: string; message?: string } | undefined => {
  try {
    run()
    return undefined
  } catch (cause) {
    return cause as { code?: string; message?: string }
  }
}

describe("engine resolution", () => {
  /** A package whose manifest pins the executable, and a cache holding `cached` where the install puts it. */
  const cached = (root: string, cached: Uint8Array) => {
    packageWith(root)
    const folder = join(root, "cache", "native", "v0.0.0", "aurum", "darwin-arm64")
    mkdirSync(folder, { recursive: true })
    writeFileSync(join(folder, "aurum"), cached, { mode: 0o755 })
  }

  test("a cached engine whose digest does not match is refused with ENGINE_UNVERIFIED", () => {
    const root = dir()
    try {
      cached(root, new Uint8Array([9, 9, 9, 9]))
      expect(failure(() => resolveEngine({ packageRoot: root, cacheRoot: join(root, "cache"), env: {}, ...ON_PINNED }))?.code).toBe("ENGINE_UNVERIFIED")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a cached engine with the pinned digest is verified and labelled download", () => {
    const root = dir()
    try {
      cached(root, EXECUTABLE)
      const path = join(root, "cache", "native", "v0.0.0", "aurum", "darwin-arm64", "aurum")
      const info = resolveEngine({ packageRoot: root, cacheRoot: join(root, "cache"), env: {}, ...ON_PINNED })
      expect({ verified: info.verified, source: info.source, version: info.version }).toEqual({ verified: true, source: "download", version: "0.0.24" })
      expect(info.path).toBe(path)
      expect(digestMatches(path, sha(EXECUTABLE))).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("with no cached engine it is ENGINE_MISSING: the install names /voice-install", () => {
    const root = dir()
    try {
      packageWith(root)
      expect(failure(() => resolveEngine({ packageRoot: root, cacheRoot: join(root, "cache"), env: {}, ...ON_PINNED }))?.code).toBe("ENGINE_MISSING")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a copy with no release manifest is ENGINE_MISSING, and an aurum on PATH is never run", () => {
    const root = dir()
    try {
      const bin = join(root, "aurum")
      writeFileSync(bin, "#!/bin/sh\nexit 0\n", { mode: 0o755 })
      chmodSync(bin, 0o755)
      expect(failure(() => resolveEngine({ packageRoot: root, env: { PATH: root }, ...ON_PINNED }))?.code).toBe("ENGINE_MISSING")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("the aurumPath option wins over a cached engine, and is labelled option and unverified", () => {
    const root = dir()
    try {
      cached(root, EXECUTABLE)
      const info = resolveEngine({ packageRoot: root, cacheRoot: join(root, "cache"), optionPath: FAKE, env: {}, ...ON_PINNED })
      expect({ source: info.source, verified: info.verified }).toEqual({ source: "option", verified: false })
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

  test("an engine built for a newer C library names the symbol version, so the system is reported as older", async () => {
    const root = dir()
    try {
      const bin = join(root, "aurum")
      writeFileSync(join(root, "loader.txt"), "aurum: /lib/aarch64-linux-gnu/libc.so.6: version `GLIBC_2.39' not found (required by aurum)\n")
      writeFileSync(bin, "#!/bin/sh\ncat \"$(dirname \"$0\")/loader.txt\" >&2\nexit 1\n", { mode: 0o755 })
      expect(await probeEngine(bin)).toEqual({ version: null, compatible: false, olderSystem: "GLIBC_2.39" })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }, 20_000)
})

describe("an Intel Mac, which has no pinned engine", () => {
  // Named explicitly on every call: these assert the darwin-x64 outcome, whatever the runner is.
  const INTEL = { platform: "darwin", arch: "x64" } as const

  test("the person's own binary runs there: resolved, labelled environment, and supported", () => {
    const root = dir()
    try {
      const info = resolveEngine({ packageRoot: root, env: { VOICE_AURUM_PATH: FAKE }, ...INTEL })
      expect({ source: info.source, platform: info.platform, supported: info.supported }).toEqual({
        source: "environment",
        platform: "darwin-x64",
        supported: true,
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("with no binary of its own it is refused with UNSUPPORTED_PLATFORM, and nothing is looked up", () => {
    const root = dir()
    try {
      const error = failure(() => resolveEngine({ packageRoot: root, env: {}, ...INTEL }))
      expect(error?.code).toBe("UNSUPPORTED_PLATFORM")
      expect(error?.message).toContain("darwin-x64")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
