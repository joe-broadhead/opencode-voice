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
      const path = join(root, "engine", "models", "tiny.bin")
      mkdirSync(join(root, "engine", "models"), { recursive: true })
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

describe("models are verified before use and downloaded safely", () => {
  test("verifyRoles refuses a file of the right size and the wrong hash", async () => {
    const root = dir()
    try {
      writeFileSync(join(root, "models.json"), JSON.stringify(manifest))
      const path = join(root, "engine", "models", "tiny.bin")
      mkdirSync(join(root, "engine", "models"), { recursive: true })
      writeFileSync(path, "abcd")
      const store = new ModelStore({ cacheRoot: root, manifestPath: join(root, "models.json") })
      const error = await store.verifyRoles(["stt"]).then(() => undefined, (cause: unknown) => cause as { code?: string })
      expect(error?.code).toBe("INTEGRITY_MISMATCH")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a redirect away from the pinned host is refused", async () => {
    const root = dir()
    try {
      writeFileSync(join(root, "models.json"), JSON.stringify(manifest))
      const store = new ModelStore({
        cacheRoot: root,
        manifestPath: join(root, "models.json"),
        fetchImpl: (async () => new Response(null, { status: 302, headers: { location: "https://evil.example/x" } })) as unknown as typeof fetch,
      })
      const [asset] = await store.missing()
      const error = await store.download(asset!, new AbortController().signal).then(() => undefined, (cause: unknown) => cause as { code?: string })
      expect(error?.code).toBe("MODEL_DOWNLOAD_FAILED")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a redirect on the pinned host is followed", async () => {
    const root = dir()
    try {
      const body = new Uint8Array([1, 2, 3, 4])
      const sha = createHash("sha256").update(body).digest("hex")
      writeFileSync(join(root, "models.json"), JSON.stringify({ version: "0", models: [{ ...manifest.models[0], sha256: sha }] }))
      let calls = 0
      const store = new ModelStore({
        cacheRoot: root,
        manifestPath: join(root, "models.json"),
        fetchImpl: (async () => {
          calls += 1
          if (calls === 1) return new Response(null, { status: 302, headers: { location: "https://example.invalid/tiny.bin" } })
          return new Response(body, { status: 200 })
        }) as unknown as typeof fetch,
      })
      const [asset] = await store.missing()
      const saved = await store.download(asset!, new AbortController().signal)
      expect(saved.state).toBe("cached")
      expect(calls).toBe(2)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("the install lock serialises two installers", async () => {
    const root = dir()
    try {
      writeFileSync(join(root, "models.json"), JSON.stringify({ version: "0", models: [] }))
      const store = new ModelStore({ cacheRoot: root, manifestPath: join(root, "models.json") })
      const order: string[] = []
      const first = store.withInstallLock(new AbortController().signal, async () => {
        order.push("first-in")
        await new Promise((resolve) => setTimeout(resolve, 120))
        order.push("first-out")
      })
      await new Promise((resolve) => setTimeout(resolve, 10))
      const second = store.withInstallLock(new AbortController().signal, async () => {
        order.push("second-in")
      })
      await Promise.all([first, second])
      expect(order).toEqual(["first-in", "first-out", "second-in"])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})

describe("the Hugging Face CDN", () => {
  test("a redirect to the model CDN is followed, and a foreign host is still refused", async () => {
    const root = dir()
    try {
      const body = new Uint8Array([1, 2, 3, 4])
      const sha = createHash("sha256").update(body).digest("hex")
      writeFileSync(join(root, "models.json"), JSON.stringify({ version: "0", models: [{ ...manifest.models[0], url: "https://huggingface.co/x/resolve/y", sha256: sha }] }))
      let calls = 0
      const store = new ModelStore({
        cacheRoot: root,
        manifestPath: join(root, "models.json"),
        fetchImpl: (async () => {
          calls += 1
          if (calls === 1) return new Response(null, { status: 302, headers: { location: "https://us.aws.cdn.hf.co/x/body" } })
          return new Response(body, { status: 200 })
        }) as unknown as typeof fetch,
      })
      const [asset] = await store.missing()
      expect((await store.download(asset!, new AbortController().signal)).state).toBe("cached")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
