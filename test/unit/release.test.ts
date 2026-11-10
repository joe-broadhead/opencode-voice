import { describe, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { engineBinaryPath, installEngine, parseRelease } from "../../src/engine/release.js"
import { resolveEngine } from "../../src/engine/binary.js"

// The pinned asset is darwin-arm64. These tests name that platform on every call, so they exercise the pinned download
// on any runner; the platform a runner really has is checked by the tests that ask for it.
const PINNED = "darwin-arm64"
const ON_PINNED = { platform: "darwin", arch: "arm64" } as const

const dir = () => mkdtempSync(join(tmpdir(), "voice-release-"))

function packageRoot(body: Uint8Array, sha = createHash("sha256").update(body).digest("hex")) {
  const root = dir()
  mkdirSync(join(root, "manifest"), { recursive: true })
  writeFileSync(
    join(root, "manifest", "aurum.json"),
    JSON.stringify({
      version: "0.0.24",
      tag: "v0.0.24",
      commit: "1a3c28c",
      source: "test",
      licence: "MIT",
      assets: { [PINNED]: { name: "aurum-macos-arm64", url: "https://example.invalid/aurum", sha256: sha, bytes: body.length } },
    }),
  )
  return root
}

describe("the pinned Aurum release", () => {
  test("pins exactly the platforms Voice ships, at 0.0.24", () => {
    const manifest = parseRelease(JSON.parse(readFileSync(new URL("../../manifest/aurum.json", import.meta.url), "utf8")))
    expect(manifest.version).toBe("0.0.24")
    expect(manifest.commit).toBe("1a3c28c00becd5bcf05a02cb920c8400f5cf8696")
    expect(Object.keys(manifest.assets).sort()).toEqual(["darwin-arm64", "linux-arm64-gnu", "linux-x64-gnu"])
    for (const asset of Object.values(manifest.assets)) expect(asset!.sha256).toMatch(/^[a-f0-9]{64}$/)
  })

  test("installs the binary at the pinned digest, executable, where the engine resolver finds it", async () => {
    const body = new Uint8Array([1, 2, 3, 4])
    const root = packageRoot(body)
    try {
      const installed = await installEngine({
        packageRoot: root,
        cacheRoot: join(root, "cache"),
        ...ON_PINNED,
        signal: new AbortController().signal,
        fetchImpl: (async () => new Response(body, { status: 200 })) as unknown as typeof fetch,
      })
      expect(installed.downloaded).toBe(true)
      expect(installed.path).toBe(engineBinaryPath(join(root, "cache")))
      expect(statSync(installed.path).mode & 0o111).not.toBe(0)
      const info = resolveEngine({ packageRoot: root, cacheRoot: join(root, "cache"), env: {}, ...ON_PINNED })
      expect(info.source).toBe("download")
      expect(info.verified).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("refuses a tampered body and leaves no binary", async () => {
    const body = new Uint8Array([1, 2, 3, 4])
    const root = packageRoot(body, "b".repeat(64))
    try {
      const error = await installEngine({
        packageRoot: root,
        cacheRoot: join(root, "cache"),
        ...ON_PINNED,
        signal: new AbortController().signal,
        fetchImpl: (async () => new Response(body, { status: 200 })) as unknown as typeof fetch,
      }).then(() => undefined, (cause: unknown) => cause as { code?: string })
      expect(error?.code).toBe("INTEGRITY_MISMATCH")
      expect(() => statSync(engineBinaryPath(join(root, "cache")))).toThrow()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a file altered after install is refused before it runs, and install replaces it", async () => {
    const body = new Uint8Array([1, 2, 3, 4])
    const root = packageRoot(body)
    const fetchImpl = (async () => new Response(body, { status: 200 })) as unknown as typeof fetch
    try {
      const installed = await installEngine({ packageRoot: root, cacheRoot: join(root, "cache"), ...ON_PINNED, signal: new AbortController().signal, fetchImpl })
      const tampered = Buffer.from(readFileSync(installed.path))
      tampered[0] = tampered[0]! ^ 0xff
      writeFileSync(installed.path, tampered)
      const error = (() => {
        try {
          resolveEngine({ packageRoot: root, cacheRoot: join(root, "cache"), env: {}, ...ON_PINNED })
          return undefined
        } catch (cause) {
          return cause as { code?: string }
        }
      })()
      expect(error?.code).toBe("ENGINE_UNVERIFIED")
      const again = await installEngine({ packageRoot: root, cacheRoot: join(root, "cache"), ...ON_PINNED, signal: new AbortController().signal, fetchImpl })
      expect(again.downloaded).toBe(true)
      expect(readFileSync(again.path)).toEqual(Buffer.from(body))
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a platform with no pinned build is UNSUPPORTED_PLATFORM, and nothing is fetched", async () => {
    const body = new Uint8Array([1, 2, 3, 4])
    const root = packageRoot(body)
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
          return new Response(body, { status: 200 })
        }) as unknown as typeof fetch,
      }).then(() => undefined, (cause: unknown) => cause as { code?: string })
      expect(error?.code).toBe("UNSUPPORTED_PLATFORM")
      expect(fetched).toBe(false)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
