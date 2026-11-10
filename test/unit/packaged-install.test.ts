// The packaged engine is what runs, so an install that carries a verified platform package asks for no engine download,
// and a platform with no engine package is reported as unsupported rather than as a missing install.
import { describe, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { installRequest, type InstallTarget } from "../../src/commands.js"
import type { ModelStore } from "../../src/engine/assets.js"
import { packagedEngineVerified, resolveEngine } from "../../src/engine/binary.js"
import { readRelease } from "../../src/engine/release.js"

const repo = fileURLToPath(new URL("../..", import.meta.url))
const assetName = readRelease(repo)!.assets["darwin-arm64"]!.name
const dir = () => mkdtempSync(join(tmpdir(), "voice-packaged-"))
const sha = (text: string) => createHash("sha256").update(text).digest("hex")
const idle = { missing: async () => [] } as unknown as ModelStore

/** A darwin-arm64 platform package beside a plugin file, laid out as npm lays a dependency out. Returns that file. */
function platformPackage(root: string, body: string, pinned: string = sha(body)): string {
  const scope = join(root, "node_modules", "@joe-broadhead")
  const pkg = join(scope, "opencode-voice-bin-darwin-arm64")
  mkdirSync(join(pkg, "bin"), { recursive: true })
  mkdirSync(join(pkg, "manifest"), { recursive: true })
  mkdirSync(join(scope, "opencode-voice", "dist"), { recursive: true })
  writeFileSync(join(pkg, "package.json"), JSON.stringify({ name: "@joe-broadhead/opencode-voice-bin-darwin-arm64", version: "0.0.0" }))
  writeFileSync(join(pkg, "bin", "aurum"), body, { mode: 0o755 })
  writeFileSync(
    join(pkg, "manifest", "aurum.json"),
    JSON.stringify({ version: "0.0.24", asset: assetName, sha256: pinned, bytes: Buffer.byteLength(body), source: "test", licence: "MIT" }),
  )
  return join(scope, "opencode-voice", "dist", "index.js")
}

const target = (root: string, from: string): InstallTarget => ({
  packageRoot: repo,
  cacheRoot: join(root, "cache"),
  platform: "darwin",
  arch: "arm64",
  store: idle,
  resolveFrom: from,
})

describe("a packaged engine", () => {
  test("a verified platform package is installed: the install asks for no engine download", async () => {
    const root = dir()
    try {
      const from = platformPackage(root, "#!/bin/sh\necho aurum 0.0.24\n")
      expect(packagedEngineVerified("darwin", "arm64", from)).toBe(true)
      const request = await installRequest(target(root, from))
      expect(request.engine).toBe(false)
      expect(request.files).not.toContain(assetName)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a platform package whose binary no longer matches its digest does not count", async () => {
    const root = dir()
    try {
      const from = platformPackage(root, "#!/bin/sh\necho aurum 0.0.24\n", sha("the pinned bytes"))
      expect(packagedEngineVerified("darwin", "arm64", from)).toBe(false)
      const request = await installRequest(target(root, from))
      expect(request.engine).toBe(true)
      expect(request.files).toContain(assetName)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("with no platform package the engine is requested, as before", async () => {
    const root = dir()
    try {
      const from = join(root, "elsewhere", "index.js")
      expect(packagedEngineVerified("darwin", "arm64", from)).toBe(false)
      const request = await installRequest(target(root, from))
      expect(request.engine).toBe(true)
      expect(request.files).toContain(assetName)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("an install on an Intel Mac or Windows refuses with UNSUPPORTED_PLATFORM before it reads the model list", async () => {
    // The store throws if it is asked for the models: the refusal must come first, so nothing is asked or downloaded.
    const asked = { missing: async () => Promise.reject(new Error("the model list was asked for")) } as unknown as ModelStore
    for (const [platform, arch] of [["darwin", "x64"], ["win32", "x64"]] as const) {
      const root = dir()
      try {
        const error = await installRequest({ ...target(root, join(root, "elsewhere", "index.js")), platform, arch, store: asked }).then(
          () => undefined,
          (cause: unknown) => cause as { code?: string },
        )
        expect({ platform, arch, code: error?.code }).toEqual({ platform, arch, code: "UNSUPPORTED_PLATFORM" })
      } finally {
        rmSync(root, { recursive: true, force: true })
      }
    }
  })

  test("Windows and Intel Macs have no engine package: UNSUPPORTED_PLATFORM, not a missing install", () => {
    for (const [platform, arch] of [["win32", "x64"], ["darwin", "x64"]] as const) {
      const root = dir()
      try {
        const error = (() => {
          try {
            resolveEngine({ packageRoot: repo, cacheRoot: join(root, "cache"), platform, arch, env: {} })
            return undefined
          } catch (cause) {
            return cause as { code?: string }
          }
        })()
        expect({ platform, arch, code: error?.code }).toEqual({ platform, arch, code: "UNSUPPORTED_PLATFORM" })
      } finally {
        rmSync(root, { recursive: true, force: true })
      }
    }
  })
})
