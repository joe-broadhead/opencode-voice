import { describe, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { installModels } from "../../src/commands.js"
import { ModelStore } from "../../src/engine/assets.js"
import { SpeechEngine } from "../../src/engine/index.js"
import { fromSidecarCategory } from "../../src/engine/errors.js"
import { unavailable } from "../../src/status.js"
import { TranscriptHistory } from "../../src/dictation/history.js"
import { runVoiceTool } from "../../src/host/tools.js"
import { buildStatus } from "../../src/status.js"
import { parseOptions } from "../../src/options.js"

const FAKE = new URL("../fixtures/fake-aurum.mjs", import.meta.url).pathname

/** Polls until `ready` or the deadline: a fake engine writes its file on its own schedule. */
async function waitFor(ready: () => boolean, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs
  while (!ready()) {
    if (Date.now() > deadline) throw new Error("timed out waiting for the fake engine")
    await Bun.sleep(20)
  }
}
const dir = () => mkdtempSync(join(tmpdir(), "voice-sec-"))

const manifest = (body: Uint8Array) => ({
  version: "0",
  models: [
    {
      role: "stt",
      name: "tiny",
      file: "tiny.bin",
      url: "https://example.invalid/tiny.bin",
      sha256: createHash("sha256").update(body).digest("hex"),
      bytes: body.length,
      licence: "MIT",
      revision: "r",
    },
  ],
})

describe("redaction on every surface", () => {
  test("a status failure never echoes a path or a newline", () => {
    const path = ["", "Users", "someone", "secret", "config.json"].join("/")
    const failure = unavailable(new Error(`cannot read ${path}\nsecond line`))
    expect(failure.message).not.toContain("/Users/")
    expect(failure.message).not.toContain("\n")
    expect(failure.message.startsWith("STATUS_UNAVAILABLE:")).toBe(true)
  })

  test("an engine error is one line with its token removed", () => {
    const error = fromSidecarCategory("environment", `failed with sk-abcdefghijklmnop\nat ${["", "Users", "x", "y"].join("/")}`)
    expect(error.message).not.toContain("sk-abcdefghijklmnop")
    expect(error.message).not.toContain("\n")
  })
})

describe("install asks first", () => {
  test("a refused ask downloads nothing", async () => {
    const root = dir()
    let calls = 0
    try {
      const body = new Uint8Array([1, 2, 3, 4])
      writeFileSync(join(root, "models.json"), JSON.stringify(manifest(body)))
      const store = new ModelStore({
        cacheRoot: root,
        manifestPath: join(root, "models.json"),
        fetchImpl: (async () => {
          calls += 1
          return new Response(body, { status: 200 })
        }) as unknown as typeof fetch,
      })
      const error = await installModels(store, new AbortController().signal, async () => {
        throw new Error("declined")
      }).then(() => undefined, (cause: unknown) => cause)
      expect(String(error)).toContain("declined")
      expect(calls).toBe(0)
      expect((await store.missing()).length).toBe(1)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("an accepted ask downloads, verifies and places the file where the engine reads it", async () => {
    const root = dir()
    try {
      const body = new Uint8Array([1, 2, 3, 4])
      writeFileSync(join(root, "models.json"), JSON.stringify(manifest(body)))
      const store = new ModelStore({
        cacheRoot: root,
        manifestPath: join(root, "models.json"),
        fetchImpl: (async () => new Response(body, { status: 200 })) as unknown as typeof fetch,
      })
      const result = await installModels(store, new AbortController().signal, async () => undefined)
      expect(result.downloaded).toEqual(["tiny.bin"])
      expect(await store.verifyRoles(["stt"])).toBeUndefined()
      expect(readFileSync(join(root, "engine", "models", "tiny.bin"))).toEqual(Buffer.from(body))
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})

describe("the transcript history", () => {
  test("keeps the last 20 texts, newest first, and clears", async () => {
    let entries: { text: string; at: number }[] = []
    const history = new TranscriptHistory({
      read: () => entries,
      write: async (next) => {
        entries = [...next]
      },
    })
    for (let index = 0; index < 25; index += 1) await history.add(`text ${index}`, index)
    expect(history.count()).toBe(20)
    expect(history.list()[0]!.text).toBe("text 24")
    expect(history.list().at(-1)!.text).toBe("text 5")
    await history.clear()
    expect(history.count()).toBe(0)
  })
})

describe("the engine owns its children", () => {
  test("dispose cancels a live recorder and removes only its own temp folder", async () => {
    const root = dir()
    try {
      const engine = new SpeechEngine({ bin: FAKE, model: "tiny-q5_1", language: "auto", cacheRoot: root, voice: "Luna", maxRecordSeconds: 30 })
      const { recorder } = await engine.recorder()
      recorder.start({ onLevel: () => undefined })
      expect(recorder.running).toBe(true)
      await engine.dispose()
      expect(recorder.running).toBe(false)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }, 20_000)

  test("a finished recording is mode 0600", async () => {
    const root = dir()
    try {
      const engine = new SpeechEngine({ bin: FAKE, model: "tiny-q5_1", language: "auto", cacheRoot: root, voice: "Luna", maxRecordSeconds: 30 })
      const { recorder, path } = await engine.recorder()
      recorder.start({ onLevel: () => undefined })
      // Wait for the fake engine to write the WAV rather than for a fixed 200 ms: under load the file was not there
      // yet, and `stop` reported NO_SPEECH from a test that is about the file's mode.
      await waitFor(() => existsSync(path) && statSync(path).size > 44, 10_000)
      const saved = await recorder.stop()
      expect(saved.path).toBe(path)
      expect(statSync(path).mode & 0o777).toBe(0o600)
      await engine.dispose()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }, 20_000)
})

describe("the compact status tool", () => {
  test("returns no paths and no agent names, only the count", async () => {
    const status = buildStatus({
      host: { version: "2.2.5", range: ">=2.2.3 <2.3.0", tested: true },
      engine: { path: "/secret/aurum", version: "0.0.24", source: "package", verified: true, platform: "darwin-arm64", supported: true },
      models: [],
      options: { submit: "send", autoSpeak: false, voice: "Luna", sttModel: "tiny-q5_1", language: "auto", maxRecordSeconds: 120, statusIndicator: "toast", keepTranscripts: false, allowUntestedHost: false, engine: true, access: "all" },
      keybind: "ctrl+shift+space",
      tools: { registered: 2, readable: 1 },
      unguardedAgents: ["build"],
    })
    const engine = { synthesize: async () => ({ path: "/x", spoken: "x", durationMs: 1, voice: "Luna" }), play: async () => undefined, release: async () => undefined } as never
    const result = await runVoiceTool({ engine, status: async () => status, assert: (async () => undefined) as never }, "status", {})
    const json = JSON.stringify(result.output)
    expect(json).not.toContain("/secret")
    expect(json).not.toContain("build")
    expect(result.output.unguardedAgents).toBe(1)
  })

  test("maxRecordSeconds is capped at 120", () => {
    expect(parseOptions({ maxRecordSeconds: 300 }).ok).toBe(false)
    expect(parseOptions({ maxRecordSeconds: 120 }).ok).toBe(true)
  })
})
