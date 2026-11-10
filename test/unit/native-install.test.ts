// The install asks for the pinned engine only when the cache does not hold a verified copy. A copy with no pinned engine,
// and a platform with no build, are refused before anything is asked or fetched.
import { describe, expect, test } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { installRequest, type InstallTarget } from "../../src/commands.js"
import type { ModelStore } from "../../src/engine/assets.js"
import { resolveEngine } from "../../src/engine/binary.js"
import { EXECUTABLE, packageWith, RELEASE } from "../support/native-fixture.js"

const dir = () => mkdtempSync(join(tmpdir(), "voice-native-"))
const ASSET = "aurum-darwin-arm64.gz"
const idle = { missing: async () => [] } as unknown as ModelStore
/** A store that fails the test if the install asks for the model list: the refusal must come first. */
const asked = { missing: async () => Promise.reject(new Error("the model list was asked for")) } as unknown as ModelStore

const target = (root: string, platform = "darwin", arch = "arm64", store: ModelStore = idle): InstallTarget => ({
  packageRoot: root,
  cacheRoot: join(root, "cache"),
  platform,
  arch,
  store,
})

/** Puts an engine in the cache where the install puts a verified download. */
function cachedEngine(root: string, body: Uint8Array = EXECUTABLE) {
  const folder = join(root, "cache", "native", "v0.0.0", "aurum", "darwin-arm64")
  mkdirSync(folder, { recursive: true })
  writeFileSync(join(folder, "aurum"), body, { mode: 0o755 })
}

const failure = (run: () => unknown): { code?: string } | undefined => {
  try {
    run()
    return undefined
  } catch (cause) {
    return cause as { code?: string }
  }
}

describe("the install's engine request", () => {
  test("a verified cached engine asks for no engine download", async () => {
    const root = packageWith(dir())
    cachedEngine(root)
    try {
      const request = await installRequest(target(root))
      expect(request.engine).toBe(false)
      expect(request.files).not.toContain(ASSET)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("an altered cached engine is requested again, so the install replaces it", async () => {
    const root = packageWith(dir())
    cachedEngine(root, new Uint8Array([9, 9, 9, 9]))
    try {
      const request = await installRequest(target(root))
      expect(request.engine).toBe(true)
      expect(request.files).toContain(ASSET)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("with no cached engine the install asks for the pinned release file, from its release host", async () => {
    const root = packageWith(dir())
    try {
      const request = await installRequest(target(root))
      expect(request.engine).toBe(true)
      expect(request.files).toContain(ASSET)
      expect(request.hosts).toEqual([new URL(RELEASE).host])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a copy with no release manifest is ENGINE_MISSING, before the model list is read", async () => {
    const root = dir()
    try {
      const error = await installRequest(target(root, "darwin", "arm64", asked)).then(
        () => undefined,
        (cause: unknown) => cause as { code?: string },
      )
      expect(error?.code).toBe("ENGINE_MISSING")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("an install on an Intel Mac or Windows refuses with UNSUPPORTED_PLATFORM before the model list is read", async () => {
    for (const [platform, arch] of [["darwin", "x64"], ["win32", "x64"]] as const) {
      const root = packageWith(dir())
      try {
        const error = await installRequest(target(root, platform, arch, asked)).then(
          () => undefined,
          (cause: unknown) => cause as { code?: string },
        )
        expect({ platform, arch, code: error?.code }).toEqual({ platform, arch, code: "UNSUPPORTED_PLATFORM" })
      } finally {
        rmSync(root, { recursive: true, force: true })
      }
    }
  })

  test("Intel Macs and Windows with no binary of their own are UNSUPPORTED_PLATFORM from the resolver", () => {
    for (const [platform, arch] of [["win32", "x64"], ["darwin", "x64"]] as const) {
      const root = packageWith(dir())
      try {
        const error = failure(() => resolveEngine({ packageRoot: root, cacheRoot: join(root, "cache"), platform, arch, env: {} }))
        expect({ platform, arch, code: error?.code }).toEqual({ platform, arch, code: "UNSUPPORTED_PLATFORM" })
      } finally {
        rmSync(root, { recursive: true, force: true })
      }
    }
  })
})
