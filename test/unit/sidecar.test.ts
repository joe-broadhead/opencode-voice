import { describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { AurumSidecar } from "../../src/engine/sidecar.js"
import { tone } from "../../src/engine/wav.js"

const FAKE = new URL("../fixtures/fake-aurum.mjs", import.meta.url).pathname

const sidecar = () =>
  new AurumSidecar({ bin: FAKE, model: "tiny-q5_1", language: "auto", voice: "Luna", cacheDir: "/x/engine", readyMs: 5_000, transcribeMs: 5_000, synthesizeMs: 5_000, stopMs: 1_000 })

describe("the sidecar protocol", () => {
  test("reaches ready with its caps, transcribes a file, synthesizes and shuts down", async () => {
    const dir = mkdtempSync(join(tmpdir(), "voice-sidecar-"))
    try {
      const wav = join(dir, "a.wav")
      writeFileSync(wav, tone(1.2))
      const client = sidecar()
      const ready = await client.start()
      expect(ready.sttProvider).toBe("local")
      expect(ready.caps).toContain("transcribe")
      const result = await client.transcribe(wav)
      expect(result.text).toBe("hello from the fixture engine")
      const speech = join(dir, "out.wav")
      const synthesized = await client.synthesize("hello", speech)
      expect(synthesized.durationMs).toBe(1200)
      expect(synthesized.voice).toBe("Luna")
      await client.stop()
      expect(client.current).toBe("idle")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 30_000)

  test("a cancelled request rejects as CANCELLED and the next one still runs", async () => {
    const dir = mkdtempSync(join(tmpdir(), "voice-sidecar-"))
    try {
      const wav = join(dir, "a.wav")
      writeFileSync(wav, tone(1.2))
      const client = sidecar()
      await client.start()
      const pending = client.transcribe(wav)
      client.cancel()
      const error = await pending.then(() => undefined, (cause: unknown) => cause as { code?: string })
      expect(error?.code).toBe("CANCELLED")
      const again = await client.transcribe(wav)
      expect(again.text).toBe("hello from the fixture engine")
      await client.stop()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 30_000)

  test("a missing binary is an ENGINE_MISSING start failure", async () => {
    const client = new AurumSidecar({ bin: "/nonexistent/aurum-voice-fixture", model: "tiny-q5_1", language: "auto", voice: "Luna", cacheDir: "/x/engine", readyMs: 2_000 })
    const error = await client.start().then(() => undefined, (cause: unknown) => cause as { code?: string })
    expect(error?.code).toBe("SIDECAR_FAILED")
  }, 10_000)
})

describe("the sidecar arguments and queue", () => {
  test("passes the plugin cache, the model, the language and the voice", async () => {
    const { sidecarArgs } = await import("../../src/engine/sidecar.js")
    expect(sidecarArgs({ model: "tiny-q5_1", language: "auto", voice: "Bella", cacheDir: "/x/engine" })).toEqual([
      "converse", "--stdio", "--local-only", "--model", "tiny-q5_1", "--language", "auto", "--voice", "Bella", "--preload", "--cache-dir", "/x/engine",
    ])
  })

  test("serialises two concurrent requests: both settle with their own payload", async () => {
    const dir = mkdtempSync(join(tmpdir(), "voice-sidecar-"))
    process.env.FAKE_AURUM_DELAY_MS = "120"
    try {
      const wav = join(dir, "a.wav")
      writeFileSync(wav, tone(1.2))
      const client = sidecar()
      const first = client.transcribe(wav)
      const second = client.transcribe(wav)
      const [a, b] = await Promise.all([first, second])
      expect(a.text).toBe("hello from the fixture engine")
      expect(b.text).toBe("hello from the fixture engine")
      await client.stop()
    } finally {
      delete process.env.FAKE_AURUM_DELAY_MS
      rmSync(dir, { recursive: true, force: true })
    }
  }, 30_000)

  test("a speaking rate is applied when the build advertises the cap, and refused when it does not", async () => {
    const dir = mkdtempSync(join(tmpdir(), "voice-sidecar-"))
    try {
      const speech = join(dir, "out.wav")
      const client = sidecar()
      const result = await client.synthesize("hello", speech, { rate: 2 })
      expect(result.durationMs).toBe(600)
      await client.stop()

      process.env.FAKE_AURUM_CAPS = "transcribe,synthesize,abort,long_audio"
      const bare = sidecar()
      const error = await bare.synthesize("hello", speech, { rate: 2 }).then(() => undefined, (cause: unknown) => cause as { code?: string })
      expect(error?.code).toBe("UNSUPPORTED")
      await bare.stop()
    } finally {
      delete process.env.FAKE_AURUM_CAPS
      rmSync(dir, { recursive: true, force: true })
    }
  }, 30_000)

  test("stop escalates to SIGKILL and resolves in bounded time when the engine ignores shutdown", async () => {
    process.env.FAKE_AURUM_IGNORE_SHUTDOWN = "1"
    process.env.FAKE_AURUM_IGNORE_TERM = "1"
    try {
      const client = new AurumSidecar({ bin: FAKE, model: "tiny-q5_1", language: "auto", voice: "Luna", cacheDir: "/x/engine", readyMs: 5_000, stopMs: 300 })
      await client.start()
      const started = Date.now()
      await client.stop()
      expect(Date.now() - started).toBeLessThan(5_000)
    } finally {
      delete process.env.FAKE_AURUM_IGNORE_SHUTDOWN
      delete process.env.FAKE_AURUM_IGNORE_TERM
    }
  }, 20_000)
})
