import { describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { AurumSidecar } from "../../src/engine/sidecar.js"
import { tone } from "../../src/engine/wav.js"

const FAKE = new URL("../fixtures/fake-aurum.mjs", import.meta.url).pathname

const sidecar = () =>
  new AurumSidecar({ bin: FAKE, model: "tiny-q5_1", language: "auto", voice: "Luna", cacheDir: "/x/engine", readyMs: 5_000, transcribeMs: 5_000, synthesizeMs: 5_000, stopMs: 1_000 })

const waitFor = async (what: string, check: () => boolean, ms = 5_000) => {
  const deadline = Date.now() + ms
  while (!check()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting until ${what}`)
    await Bun.sleep(10)
  }
}



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

  test("a cancelled request rejects, the slot is quarantined, and a fresh sidecar runs the next one", async () => {
    const dir = mkdtempSync(join(tmpdir(), "voice-sidecar-"))
    process.env.FAKE_AURUM_DELAY_MS = "200"
    try {
      const wav = join(dir, "a.wav")
      writeFileSync(wav, tone(1.2))
      const client = sidecar()
      await client.start()
      const pending = client.transcribe(wav)
      await waitFor("the request is in flight", () => client.hasPending)
      client.cancel()
      const error = await pending.then(() => undefined, (cause: unknown) => cause as { code?: string })
      expect(error?.code).toBe("CANCELLED")
      const refused = await client.transcribe(wav).then(() => undefined, (cause: unknown) => cause as { code?: string })
      expect(refused?.code).toBe("CANCELLED")
      const startRefused = await client.start().then(() => undefined, (cause: unknown) => cause as { code?: string })
      expect(startRefused?.code).toBe("CANCELLED")
      await client.stop()
      const again = await client.transcribe(wav)
      expect(again.text).toBe("hello from the fixture engine")
      await client.stop()
    } finally {
      delete process.env.FAKE_AURUM_DELAY_MS
      rmSync(dir, { recursive: true, force: true })
    }
  }, 30_000)

  test("close while starting rejects the pending start and forbids reuse", async () => {
    process.env.FAKE_AURUM_READY_DELAY_MS = "5000"
    const client = sidecar()
    try {
      const starting = client.start().then(
        () => undefined,
        (cause: unknown) => cause as { code?: string },
      )
      await client.close()
      const error = await starting
      expect(error?.code).toBe("CANCELLED")
      const again = await client.start().then(
        () => undefined,
        (cause: unknown) => cause as { code?: string },
      )
      expect(again?.code).toBe("CANCELLED")
      const restart = await client.restart().then(
        () => undefined,
        (cause: unknown) => cause as { code?: string },
      )
      expect(restart?.code).toBe("CANCELLED")
    } finally {
      delete process.env.FAKE_AURUM_READY_DELAY_MS
    }
  }, 20_000)

  test("a retired child's late ready cannot publish ready state", async () => {
    const dir = mkdtempSync(join(tmpdir(), "voice-sidecar-"))
    process.env.FAKE_AURUM_READY_DELAY_MS = "5000"
    process.env.FAKE_AURUM_IGNORE_SHUTDOWN = "1"
    process.env.FAKE_AURUM_IGNORE_TERM = "1"
    const states: string[] = []
    const client = new AurumSidecar({
      bin: FAKE,
      model: "tiny-q5_1",
      language: "auto",
      voice: "Luna",
      cacheDir: "/x/engine",
      readyMs: 5_000,
      stopMs: 100,
      onState: (state) => void states.push(state),
    })
    try {
      const starting = client.start().then(
        () => undefined,
        (cause: unknown) => cause as { code?: string },
      )
      await client.close()
      const error = await starting
      expect(error?.code).toBe("CANCELLED")
      ;(client as unknown as { onLine: (line: string) => void }).onLine(JSON.stringify({ v: 1, type: "ready", caps: ["transcribe"] }))
      expect(states).not.toContain("ready")
      expect(client.current).toBe("idle")
    } finally {
      delete process.env.FAKE_AURUM_READY_DELAY_MS
      delete process.env.FAKE_AURUM_IGNORE_SHUTDOWN
      delete process.env.FAKE_AURUM_IGNORE_TERM
      rmSync(dir, { recursive: true, force: true })
    }
  }, 20_000)

  test("a late ready after a start timeout cannot publish ready state", async () => {
    const dir = mkdtempSync(join(tmpdir(), "voice-sidecar-"))
    process.env.FAKE_AURUM_READY_DELAY_MS = "5000"
    const states: string[] = []
    const client = new AurumSidecar({
      bin: FAKE,
      model: "tiny-q5_1",
      language: "auto",
      voice: "Luna",
      cacheDir: "/x/engine",
      readyMs: 50,
      stopMs: 100,
      onState: (state) => void states.push(state),
    })
    try {
      const wav = join(dir, "a.wav")
      writeFileSync(wav, tone(1.2))
      const error = await client.start().then(
        () => undefined,
        (cause: unknown) => cause as { code?: string },
      )
      expect(error?.code).toBe("TIMEOUT")
      ;(client as unknown as { onLine: (line: string) => void }).onLine(JSON.stringify({ v: 1, type: "ready", caps: ["transcribe"] }))
      expect(states).not.toContain("ready")
      expect(client.current).toBe("failed")
      const refused = await client.transcribe(wav).then(
        () => undefined,
        (cause: unknown) => cause as { code?: string },
      )
      expect(refused?.code).toBe("CANCELLED")
      await client.close()
    } finally {
      delete process.env.FAKE_AURUM_READY_DELAY_MS
      rmSync(dir, { recursive: true, force: true })
    }
  }, 20_000)

  test("a startup timeout retains the resistant child until close observes its exit", async () => {
    const dir = mkdtempSync(join(tmpdir(), "voice-sidecar-"))
    process.env.FAKE_AURUM_READY_DELAY_MS = "5000"
    process.env.FAKE_AURUM_IGNORE_SHUTDOWN = "1"
    process.env.FAKE_AURUM_IGNORE_TERM = "1"
    const client = new AurumSidecar({
      bin: FAKE,
      model: "tiny-q5_1",
      language: "auto",
      voice: "Luna",
      cacheDir: "/x/engine",
      readyMs: 50,
      stopMs: 100,
    })
    try {
      const error = await client.start().then(
        () => undefined,
        (cause: unknown) => cause as { code?: string },
      )
      expect(error?.code).toBe("TIMEOUT")
      const child = (client as unknown as { child?: { exitCode: number | null; signalCode: string | null } }).child
      expect(child).toBeDefined()
      expect(child?.exitCode).toBeNull()
      await client.close()
      expect(child?.exitCode !== null || child?.signalCode !== null).toBe(true)
      expect((client as unknown as { child?: unknown }).child).toBeUndefined()
      expect(client.current).toBe("idle")
    } finally {
      delete process.env.FAKE_AURUM_READY_DELAY_MS
      delete process.env.FAKE_AURUM_IGNORE_SHUTDOWN
      delete process.env.FAKE_AURUM_IGNORE_TERM
      rmSync(dir, { recursive: true, force: true })
    }
  }, 20_000)

  test("a synchronous starting callback can close before any child or waiter exists", async () => {
    const dir = mkdtempSync(join(tmpdir(), "voice-sidecar-"))
    let client!: AurumSidecar
    let closing: Promise<void> | undefined
    client = new AurumSidecar({
      bin: join(dir, "must-not-spawn"),
      model: "tiny-q5_1",
      language: "auto",
      voice: "Luna",
      cacheDir: "/x/engine",
      readyMs: 2_000,
      onState: (state) => {
        if (state === "starting" && closing === undefined) closing = client.close()
      },
    })
    try {
      const error = await client.start().then(
        () => undefined,
        (cause: unknown) => cause as { code?: string },
      )
      expect(error?.code).toBe("CANCELLED")
      expect(closing).toBeDefined()
      await closing
      expect(client.current).toBe("idle")
      const owned = client as unknown as { child?: unknown; waiters: unknown[]; readyTimer?: unknown }
      expect(owned.child).toBeUndefined()
      expect(owned.waiters).toHaveLength(0)
      expect(owned.readyTimer).toBeUndefined()
      const again = await client.start().then(
        () => undefined,
        (cause: unknown) => cause as { code?: string },
      )
      expect(again?.code).toBe("CANCELLED")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 10_000)

  test("a deferred spawn error settles close without waiting for an exit", async () => {
    const dir = mkdtempSync(join(tmpdir(), "voice-sidecar-"))
    const client = new AurumSidecar({
      bin: join(dir, "missing-aurum"),
      model: "tiny-q5_1",
      language: "auto",
      voice: "Luna",
      cacheDir: "/x/engine",
      readyMs: 2_000,
      stopMs: 100,
    })
    try {
      const error = await client.start().then(
        () => undefined,
        (cause: unknown) => cause as { code?: string },
      )
      expect(error?.code).toBe("SIDECAR_FAILED")
      const started = Date.now()
      await client.close()
      expect(Date.now() - started).toBeLessThan(2_000)
      expect(client.current).toBe("idle")
      expect((client as unknown as { child?: unknown }).child).toBeUndefined()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 10_000)

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
