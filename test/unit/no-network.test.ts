// Local mode makes no network call: status, a transcription and a synthesis all run with `fetch` replaced by a counter
// that fails the test if it is ever used. The only code allowed to call fetch is the model download, which nothing here
// invokes.
import { afterAll, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { SpeechEngine } from "../../src/engine/index.js"
import { ModelStore } from "../../src/engine/assets.js"
import { tone } from "../../src/engine/wav.js"

const FAKE = new URL("../fixtures/fake-aurum.mjs", import.meta.url).pathname
const dir = mkdtempSync(join(tmpdir(), "voice-net-"))
afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe("local mode", () => {
  test("status and speech never call fetch", async () => {
    let calls = 0
    const original = globalThis.fetch
    globalThis.fetch = (async () => {
      calls += 1
      throw new Error("local mode must not reach the network")
    }) as unknown as typeof fetch
    const engine = new SpeechEngine({
      bin: FAKE,
      model: "tiny-q5_1",
      language: "auto",
      cacheRoot: join(dir, "cache"),
      voice: "Luna",
      maxRecordSeconds: 30,
      readyMs: 5_000,
      transcribeMs: 5_000,
      synthesizeMs: 5_000,
    } as never)
    try {
      const wav = join(dir, "a.wav")
      writeFileSync(wav, tone(1.2))
      const transcript = await engine.transcribeFile(wav)
      expect(transcript.text).toBe("hello from the fixture engine")
      const speech = await engine.synthesize("hello")
      expect(speech.durationMs).toBe(1200)
      await engine.release(speech.path)
      const manifest = join(dir, "models.json")
      writeFileSync(manifest, JSON.stringify({ version: "0", models: [] }))
      const store = new ModelStore({ cacheRoot: join(dir, "models"), manifestPath: manifest })
      expect(await store.inspect()).toEqual([])
      expect(calls).toBe(0)
    } finally {
      globalThis.fetch = original
      await engine.dispose()
    }
  }, 30_000)
})
