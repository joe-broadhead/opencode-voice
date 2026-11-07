import { describe, expect, test } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createHash } from "node:crypto"
import { ModelStore, defaultCacheRoot, parseManifest } from "../../src/engine/assets.js"

const manifest = {
  version: "0.0.24",
  models: [
    {
      role: "stt",
      name: "tiny-q5_1",
      file: "tiny.bin",
      url: "https://example.invalid/tiny.bin",
      sha256: "a".repeat(64),
      bytes: 4,
      licence: "MIT",
      revision: "r1",
    },
  ],
}

const dir = () => mkdtempSync(join(tmpdir(), "voice-assets-"))

describe("the model manifest", () => {
  test("accepts the pinned shape and refuses a malformed entry", () => {
    expect(parseManifest(manifest).models[0]!.name).toBe("tiny-q5_1")
    expect(() => parseManifest({ version: "x", models: [{ ...manifest.models[0], url: "http://example.invalid/x" }] })).toThrow(/manifest/)
    expect(() => parseManifest({ version: "x", models: [{ ...manifest.models[0], sha256: "short" }] })).toThrow(/manifest/)
  })

  test("inspects a cache by the pinned size, and never hashes or downloads", async () => {
    const root = dir()
    try {
      const path = join(root, manifest.models[0]!.sha256, "tiny.bin")
      mkdirSync(join(root, manifest.models[0]!.sha256), { recursive: true })
      writeFileSync(path, "abcd")
      const store = new ModelStore({ cacheRoot: root, manifestPath: join(root, "models.json") })
      writeFileSync(join(root, "models.json"), JSON.stringify(manifest))
      const found = await store.inspect()
      expect(found[0]!.state).toBe("cached")
      expect(await store.ready("stt")).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("downloads once, verifies the hash and places the file content-addressed", async () => {
    const root = dir()
    try {
      const body = new Uint8Array([1, 2, 3, 4])
      const sha = createHash("sha256").update(body).digest("hex")
      const store = new ModelStore({
        cacheRoot: root,
        manifestPath: join(root, "models.json"),
        fetchImpl: (async () => new Response(body, { status: 200 })) as unknown as typeof fetch,
      })
      writeFileSync(join(root, "models.json"), JSON.stringify({ version: "0", models: [{ ...manifest.models[0], sha256: sha }] }))
      const [asset] = await store.missing()
      const saved = await store.download(asset!, new AbortController().signal)
      expect(saved.state).toBe("cached")
      expect(await store.verify(asset!)).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a hash mismatch is INTEGRITY_MISMATCH and leaves no file", async () => {
    const root = dir()
    try {
      const store = new ModelStore({
        cacheRoot: root,
        manifestPath: join(root, "models.json"),
        fetchImpl: (async () => new Response(new Uint8Array([9, 9, 9, 9]), { status: 200 })) as unknown as typeof fetch,
      })
      writeFileSync(join(root, "models.json"), JSON.stringify(manifest))
      const [asset] = await store.missing()
      const error = await store.download(asset!, new AbortController().signal).then(() => undefined, (cause: unknown) => cause as { code?: string })
      expect(error?.code).toBe("INTEGRITY_MISMATCH")
      expect(await store.missing()).toHaveLength(1)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a pre-seeded folder never downloads", async () => {
    const root = dir()
    try {
      const seeded = join(root, "seeded")
      writeFileSync(join(root, "models.json"), JSON.stringify(manifest))
      const store = new ModelStore({ cacheRoot: root, manifestPath: join(root, "models.json"), assetsDir: seeded })
      const [asset] = await store.missing()
      const error = await store.download(asset!, new AbortController().signal).then(() => undefined, (cause: unknown) => cause as { code?: string })
      expect(error?.code).toBe("MODEL_MISSING")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("the default cache root follows the platform", () => {
    const home = ["", "home", "u"].join("/")
    expect(defaultCacheRoot(home, "darwin", {})).toBe(`${home}/Library/Caches/opencode-voice`)
    expect(defaultCacheRoot(home, "linux", { XDG_CACHE_HOME: "/x" })).toBe("/x/opencode-voice")
  })
})
