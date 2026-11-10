import { describe, expect, test } from "bun:test"
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { resolveEngine } from "../../src/engine/binary.js"
import { installEngine } from "../../src/engine/release.js"
import { EXECUTABLE, GZ, packageWith, serving, sha } from "../support/native-fixture.js"

// These tests name the platform on every call, so the outcome does not depend on the runner.
const ON_PINNED = { platform: "darwin", arch: "arm64" } as const
const dir = () => mkdtempSync(join(tmpdir(), "voice-release-"))
const engineBinaryPath = (cacheRoot: string) => join(cacheRoot, "native", "v0.0.0", "aurum", "darwin-arm64", "aurum")

describe("the pinned Aurum release", () => {
  test("the upstream pin names exactly the platforms Voice ships, at 0.0.24", () => {
    const pin = JSON.parse(readFileSync(fileURLToPath(new URL("../../manifest/aurum.json", import.meta.url)), "utf8"))
    expect(pin.version).toBe("0.0.24")
    expect(pin.commit).toBe("1a3c28c00becd5bcf05a02cb920c8400f5cf8696")
    expect(Object.keys(pin.assets).sort()).toEqual(["darwin-arm64", "linux-arm64-gnu", "linux-x64-gnu"])
    for (const asset of Object.values(pin.assets) as { sha256: string }[]) expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/)
  })

  test("installs the pinned engine into the cache, executable, where the resolver finds it", async () => {
    const root = packageWith(dir())
    const cacheRoot = join(root, "cache")
    try {
      const installed = await installEngine({ packageRoot: root, cacheRoot, ...ON_PINNED, signal: new AbortController().signal, fetchImpl: serving(GZ) })
      expect(installed.downloaded).toBe(true)
      expect(installed.path).toBe(engineBinaryPath(cacheRoot))
      expect(statSync(installed.path).mode & 0o111).not.toBe(0)
      expect(readFileSync(installed.path)).toEqual(Buffer.from(EXECUTABLE))
      const info = resolveEngine({ packageRoot: root, cacheRoot, env: {}, ...ON_PINNED })
      expect({ source: info.source, verified: info.verified, version: info.version, path: info.path }).toEqual({
        source: "download",
        verified: true,
        version: "0.0.24",
        path: installed.path,
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a verified copy in the cache is kept: a second install downloads nothing", async () => {
    const root = packageWith(dir())
    const cacheRoot = join(root, "cache")
    let fetched = 0
    const fetchImpl = (async () => {
      fetched += 1
      return new Response(GZ, { status: 200 })
    }) as unknown as typeof fetch
    try {
      await installEngine({ packageRoot: root, cacheRoot, ...ON_PINNED, signal: new AbortController().signal, fetchImpl })
      const again = await installEngine({ packageRoot: root, cacheRoot, ...ON_PINNED, signal: new AbortController().signal, fetchImpl })
      expect({ downloaded: again.downloaded, fetched }).toEqual({ downloaded: false, fetched: 1 })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("refuses a download that does not match its pinned hash, and leaves no engine", async () => {
    const root = packageWith(dir(), { asset: "b".repeat(64) })
    const cacheRoot = join(root, "cache")
    try {
      const error = await installEngine({ packageRoot: root, cacheRoot, ...ON_PINNED, signal: new AbortController().signal, fetchImpl: serving(GZ) }).then(
        () => undefined,
        (cause: unknown) => cause as { code?: string },
      )
      expect(error?.code).toBe("INTEGRITY_MISMATCH")
      const missing = (() => {
        try {
          resolveEngine({ packageRoot: root, cacheRoot, env: {}, ...ON_PINNED })
          return undefined
        } catch (cause) {
          return cause as { code?: string }
        }
      })()
      expect(missing?.code).toBe("ENGINE_MISSING")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("refuses a release file whose executable does not match its pin, and leaves no engine", async () => {
    const root = packageWith(dir(), { executable: "c".repeat(64) })
    const cacheRoot = join(root, "cache")
    try {
      const error = await installEngine({ packageRoot: root, cacheRoot, ...ON_PINNED, signal: new AbortController().signal, fetchImpl: serving(GZ) }).then(
        () => undefined,
        (cause: unknown) => cause as { code?: string },
      )
      expect(error?.code).toBe("INTEGRITY_MISMATCH")
      expect(() => statSync(engineBinaryPath(cacheRoot))).toThrow()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a cached file altered after install is refused before it runs, and install replaces it", async () => {
    const root = packageWith(dir())
    const cacheRoot = join(root, "cache")
    const fetchImpl = serving(GZ)
    try {
      const installed = await installEngine({ packageRoot: root, cacheRoot, ...ON_PINNED, signal: new AbortController().signal, fetchImpl })
      const tampered = Buffer.from(readFileSync(installed.path))
      tampered[0] = tampered[0]! ^ 0xff
      writeFileSync(installed.path, tampered)
      const error = (() => {
        try {
          resolveEngine({ packageRoot: root, cacheRoot, env: {}, ...ON_PINNED })
          return undefined
        } catch (cause) {
          return cause as { code?: string }
        }
      })()
      expect(error?.code).toBe("ENGINE_UNVERIFIED")
      const again = await installEngine({ packageRoot: root, cacheRoot, ...ON_PINNED, signal: new AbortController().signal, fetchImpl })
      expect(again.downloaded).toBe(true)
      expect(readFileSync(again.path)).toEqual(Buffer.from(EXECUTABLE))
      expect(sha(readFileSync(again.path))).toBe(sha(EXECUTABLE))
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a platform with no pinned build is UNSUPPORTED_PLATFORM, and nothing is fetched", async () => {
    const root = packageWith(dir())
    let fetched = false
    try {
      const error = await installEngine({
        packageRoot: root,
        cacheRoot: join(root, "cache"),
        platform: "darwin",
        arch: "x64",
        signal: new AbortController().signal,
        fetchImpl: (async () => {
          fetched = true
          return new Response(GZ, { status: 200 })
        }) as unknown as typeof fetch,
      }).then(() => undefined, (cause: unknown) => cause as { code?: string })
      expect(error?.code).toBe("UNSUPPORTED_PLATFORM")
      expect(fetched).toBe(false)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a copy with no release manifest is ENGINE_MISSING, and nothing is fetched", async () => {
    const root = dir()
    try {
      const error = await installEngine({ packageRoot: root, cacheRoot: join(root, "cache"), ...ON_PINNED, signal: new AbortController().signal, fetchImpl: serving(GZ) }).then(
        () => undefined,
        (cause: unknown) => cause as { code?: string },
      )
      expect(error?.code).toBe("ENGINE_MISSING")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
