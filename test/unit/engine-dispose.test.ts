// Disposal fences a held render: the tool call cannot reach play, and the engine refuses playback after shutdown. The
// fake Aurum sidecar writes a WAV to a temp path; no speaker and no real engine are used.
import { afterAll, describe, expect, test } from "bun:test"
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { SpeechEngine } from "../../src/provider/index.js"
import { EngineError } from "../../src/provider/errors.js"
import { speakHandler } from "../../src/handlers/speak.js"
import type { MethodCall } from "@we-the-rebel-alliance/plugin-contract/register"

const FAKE = new URL("../fixtures/fake-aurum.mjs", import.meta.url).pathname
const dir = mkdtempSync(join(tmpdir(), "voice-dispose-"))
afterAll(() => rmSync(dir, { recursive: true, force: true }))

const waitFor = async (what: string, check: () => boolean, ms = 5_000) => {
  const deadline = Date.now() + ms
  while (!check()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting until ${what}`)
    await Bun.sleep(10)
  }
}

const events = (path: string): { event?: string; path?: string }[] => {
  if (!existsSync(path)) return []
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as { event?: string; path?: string })
}

describe("engine disposal during a held render", () => {
  test("dispose settles after a deferred spawn error with no child exit", async () => {
    const bin = join(dir, "vanish-aurum")
    writeFileSync(
      bin,
      "#!/bin/sh\nif [ \"$1\" = \"--version\" ]; then echo 'aurum 0.0.24'; rm -f \"$0\"; exit 0; fi\nexit 127\n",
      { mode: 0o755 },
    )
    chmodSync(bin, 0o755)
    const engine = new SpeechEngine({
      bin,
      model: "tiny-q5_1",
      language: "auto",
      cacheRoot: join(dir, "spawn-error-cache"),
      voice: "Luna",
      maxRecordSeconds: 30,
      env: { FAKE_AURUM_LOG: join(dir, "spawn-error.log") },
      timeouts: { stopMs: 100 },
    })
    try {
      const error = await engine.warmup().then(
        () => undefined,
        (cause: unknown) => cause,
      )
      expect(error).toBeInstanceOf(EngineError)
      expect((error as EngineError).code).toBe("SIDECAR_FAILED")
      const started = Date.now()
      await engine.dispose()
      expect(Date.now() - started).toBeLessThan(2_000)
      expect((engine as unknown as { sidecar?: unknown }).sidecar).toBeUndefined()
    } finally {
      await engine.dispose().catch(() => undefined)
    }
  }, 20_000)

  test("a resistant startup timeout retains ownership, allows replacement, and disposal waits", async () => {
    const log = join(dir, "startup-timeout.log")
    const readyFile = join(dir, "startup-timeout.ready")
    writeFileSync(readyFile, "1")
    const engine = new SpeechEngine({
      bin: FAKE,
      model: "tiny-q5_1",
      language: "auto",
      cacheRoot: join(dir, "startup-timeout-cache"),
      voice: "Luna",
      maxRecordSeconds: 30,
      env: {
        FAKE_AURUM_LOG: log,
        FAKE_AURUM_READY_DELAY_FILE: readyFile,
        FAKE_AURUM_READY_DELAY_FILE_MS: "5000",
        FAKE_AURUM_IGNORE_SHUTDOWN: "1",
        FAKE_AURUM_IGNORE_TERM: "1",
      },
      timeouts: { readyMs: 800, stopMs: 100 },
    })
    try {
      const first = engine.warmup().then(
        () => undefined,
        (cause: unknown) => cause,
      )
      const error = await first
      expect(error).toBeInstanceOf(EngineError)
      expect((error as EngineError).code).toBe("TIMEOUT")
      unlinkSync(readyFile)
      await engine.warmup()
      expect(events(log).filter((entry) => entry.event === "converse-args")).toHaveLength(2)
      await engine.dispose()
      expect((engine as unknown as { retiring: Set<Promise<void>> }).retiring.size).toBe(0)
    } finally {
      await engine.dispose().catch(() => undefined)
    }
  }, 20_000)

  test("a retired sidecar's idle cannot publish after a newer sidecar is ready", async () => {
    const log = join(dir, "state-owner.log")
    const states: string[] = []
    const engine = new SpeechEngine({
      bin: FAKE,
      model: "tiny-q5_1",
      language: "auto",
      cacheRoot: join(dir, "state-owner-cache"),
      voice: "Luna",
      maxRecordSeconds: 30,
      env: {
        FAKE_AURUM_LOG: log,
        FAKE_AURUM_DELAY_MS: "200",
        FAKE_AURUM_IGNORE_SHUTDOWN: "1",
        FAKE_AURUM_IGNORE_TERM: "1",
      },
      timeouts: { stopMs: 500 },
      onState: (state) => void states.push(state),
    })
    try {
      await engine.warmup()
      const first = engine.synthesize("old").then(
        () => undefined,
        (cause: unknown) => cause,
      )
      await waitFor("the retired sidecar has a request", () => events(log).some((entry) => entry.event === "synthesize"))
      engine.cancel()
      const error = await first
      expect(error).toBeInstanceOf(EngineError)
      expect((error as EngineError).code).toBe("CANCELLED")
      await engine.warmup()
      await engine.dispose()
      expect(states.filter((state) => state === "ready")).toHaveLength(2)
      expect(states.filter((state) => state === "idle")).toHaveLength(0)
      expect(states.at(-1)).toBe("ready")
    } finally {
      await engine.dispose().catch(() => undefined)
    }
  }, 20_000)

  test("concurrent dispose calls share one teardown and await the exact player child", async () => {
    const log = join(dir, "dispose-play.log")
    const hold = join(dir, "dispose-play.hold")
    writeFileSync(hold, "1")
    const engine = new SpeechEngine({
      bin: FAKE,
      model: "tiny-q5_1",
      language: "auto",
      cacheRoot: join(dir, "dispose-play-cache"),
      voice: "Luna",
      maxRecordSeconds: 30,
      env: {
        FAKE_AURUM_LOG: log,
        FAKE_AURUM_PLAY_MS: "3000",
        FAKE_AURUM_PLAY_HOLD_FILE: hold,
        FAKE_AURUM_PLAY_RESIST_SIGTERM: "1",
      },
    })
    try {
      const path = join(dir, "dispose-play.wav")
      const playing = engine.play(path).then(
        () => undefined,
        (cause: unknown) => cause,
      )
      await waitFor("the player child is ready", () => events(log).some((entry) => entry.event === "play-ready" && entry.path === path))
      const first = engine.dispose()
      const second = engine.dispose()
      expect(first).toBe(second)
      let settled = false
      void first.then(() => {
        settled = true
      })
      await Bun.sleep(0)
      expect(settled).toBe(false)
      await first
      const playError = await playing
      expect(playError).toBeInstanceOf(EngineError)
      expect((playError as EngineError).code).toBe("CANCELLED")
      expect(events(log).some((entry) => entry.event === "play-sigterm" && entry.path === path)).toBe(true)
      const refused = await engine.play(path).then(
        () => undefined,
        (cause: unknown) => cause,
      )
      expect(refused).toBeInstanceOf(EngineError)
      expect((refused as EngineError).code).toBe("CANCELLED")
    } finally {
      await engine.dispose().catch(() => undefined)
    }
  }, 20_000)

  test("dispose during model preflight starts no sidecar and dispatches no synth", async () => {
    const log = join(dir, "preflight.log")
    let release!: () => void
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    let entered!: () => void
    const started = new Promise<void>((resolve) => {
      entered = resolve
    })
    const engine = new SpeechEngine({
      bin: FAKE,
      model: "tiny-q5_1",
      language: "auto",
      cacheRoot: join(dir, "preflight-cache"),
      voice: "Luna",
      maxRecordSeconds: 30,
      env: { FAKE_AURUM_LOG: log },
      preflight: async () => {
        entered()
        await held
      },
    })
    const rendered = engine.synthesize("hello").then(
      () => undefined,
      (cause: unknown) => cause,
    )
    await started
    await engine.dispose()
    release()
    const error = await rendered
    expect(error).toBeInstanceOf(EngineError)
    expect((error as EngineError).code).toBe("CANCELLED")
    expect(events(log).some((entry) => entry.event === "converse-args")).toBe(false)
    expect(events(log).some((entry) => entry.event === "synthesize")).toBe(false)
  }, 20_000)

  test("cancel during model preflight starts no sidecar and dispatches no synth", async () => {
    const log = join(dir, "preflight-cancel.log")
    let release!: () => void
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    let entered!: () => void
    const started = new Promise<void>((resolve) => {
      entered = resolve
    })
    const engine = new SpeechEngine({
      bin: FAKE,
      model: "tiny-q5_1",
      language: "auto",
      cacheRoot: join(dir, "preflight-cancel-cache"),
      voice: "Luna",
      maxRecordSeconds: 30,
      env: { FAKE_AURUM_LOG: log },
      preflight: async () => {
        entered()
        await held
      },
    })
    try {
      const rendered = engine.synthesize("hello").then(
        () => undefined,
        (cause: unknown) => cause,
      )
      await started
      engine.cancel()
      release()
      const error = await rendered
      expect(error).toBeInstanceOf(EngineError)
      expect((error as EngineError).code).toBe("CANCELLED")
      expect(events(log).some((entry) => entry.event === "converse-args")).toBe(false)
      expect(events(log).some((entry) => entry.event === "synthesize")).toBe(false)
    } finally {
      await engine.dispose().catch(() => undefined)
    }
  }, 20_000)

  test("a cancelled synth event cannot settle the next render", async () => {
    const log = join(dir, "stale.log")
    const engine = new SpeechEngine({
      bin: FAKE,
      model: "tiny-q5_1",
      language: "auto",
      cacheRoot: join(dir, "stale-cache"),
      voice: "Luna",
      maxRecordSeconds: 30,
      env: {
        FAKE_AURUM_LOG: log,
        FAKE_AURUM_DELAY_MS: "150",
        FAKE_AURUM_IGNORE_SHUTDOWN: "1",
        FAKE_AURUM_IGNORE_TERM: "1",
      },
      timeouts: { stopMs: 100 },
    })
    try {
      const first = engine.synthesize("first").then(
        () => undefined,
        (cause: unknown) => cause,
      )
      await waitFor("the first synth reaches the fake sidecar", () => events(log).some((entry) => entry.event === "synthesize"))
      const firstPath = events(log).find((entry) => entry.event === "synthesize")?.path
      expect(typeof firstPath).toBe("string")
      engine.cancel()
      const firstError = await first
      expect(firstError).toBeInstanceOf(EngineError)
      expect((firstError as EngineError).code).toBe("CANCELLED")

      const second = await engine.synthesize("second")
      const requested = events(log)
        .filter((entry) => entry.event === "synthesize")
        .map((entry) => entry.path)
        .filter((path): path is string => typeof path === "string")
      const secondPath = requested.find((path) => path !== firstPath)
      if (secondPath === undefined) throw new Error("the second synth did not reach the fake sidecar")
      expect(second.path).toBe(secondPath)
      // The old process still emits its stale synthesized event; it cannot settle or supply the new render.
      await waitFor("the stale synthesized event is emitted", () => events(log).some((entry) => entry.event === "synthesized-event" && entry.path === firstPath))
      expect(events(log).filter((entry) => entry.event === "synthesized-event" && entry.path === secondPath)).toHaveLength(1)
    } finally {
      await engine.dispose().catch(() => undefined)
    }
  }, 20_000)

  test("a timed-out synth cannot settle the next render", async () => {
    const log = join(dir, "timeout.log")
    const delayFile = join(dir, "timeout.delay")
    writeFileSync(delayFile, "1")
    const engine = new SpeechEngine({
      bin: FAKE,
      model: "tiny-q5_1",
      language: "auto",
      cacheRoot: join(dir, "timeout-cache"),
      voice: "Luna",
      maxRecordSeconds: 30,
      env: {
        FAKE_AURUM_LOG: log,
        FAKE_AURUM_DELAY_MS: "0",
        FAKE_AURUM_DELAY_FILE: delayFile,
        FAKE_AURUM_DELAY_FILE_MS: "700",
        FAKE_AURUM_IGNORE_SHUTDOWN: "1",
        FAKE_AURUM_IGNORE_TERM: "1",
      },
      timeouts: { synthesizeMs: 500, stopMs: 100 },
    })
    try {
      await engine.warmup()
      const first = engine.synthesize("first").then(
        () => undefined,
        (cause: unknown) => cause,
      )
      await waitFor("the first synth reaches the fake sidecar", () => events(log).some((entry) => entry.event === "synthesize"))
      const firstPath = events(log).find((entry) => entry.event === "synthesize")?.path
      const firstError = await first
      expect(firstError).toBeInstanceOf(EngineError)
      expect((firstError as EngineError).code).toBe("TIMEOUT")

      unlinkSync(delayFile)
      const second = await engine.synthesize("second")
      const requested = events(log)
        .filter((entry) => entry.event === "synthesize")
        .map((entry) => entry.path)
        .filter((path): path is string => typeof path === "string")
      const secondPath = requested.find((path) => path !== firstPath)
      if (secondPath === undefined) throw new Error("the second synth did not reach the fake sidecar")
      expect(second.path).toBe(secondPath)
      expect(events(log).filter((entry) => entry.event === "converse-args")).toHaveLength(2)
      await waitFor("the timed-out child's late synthesized event is emitted", () => events(log).some((entry) => entry.event === "synthesized-event" && entry.path === firstPath))
      expect(events(log).filter((entry) => entry.event === "synthesized-event" && entry.path === secondPath)).toHaveLength(1)
    } finally {
      await engine.dispose().catch(() => undefined)
    }
  }, 20_000)

  test("cancel during a held render rejects the render before any play", async () => {
    const log = join(dir, "cancel.log")
    const engine = new SpeechEngine({
      bin: FAKE,
      model: "tiny-q5_1",
      language: "auto",
      cacheRoot: join(dir, "cancel-cache"),
      voice: "Luna",
      maxRecordSeconds: 30,
      env: { FAKE_AURUM_DELAY_MS: "5000", FAKE_AURUM_LOG: log },
    })
    try {
      const render = engine.synthesize("hello")
      await waitFor("the fake sidecar received synthesize", () => events(log).some((entry) => entry.event === "synthesize"))
      engine.cancel()
      const error = await render.then(
        () => undefined,
        (cause: unknown) => cause,
      )
      expect(error).toBeInstanceOf(EngineError)
      expect((error as EngineError).code).toBe("CANCELLED")
      expect(events(log).some((entry) => entry.event === "play")).toBe(false)
    } finally {
      await engine.dispose().catch(() => undefined)
    }
  }, 20_000)

  test("the tool call is CANCELLED before play, and play refuses after disposal", async () => {
    const log = join(dir, "dispose.log")
    const engine = new SpeechEngine({
      bin: FAKE,
      model: "tiny-q5_1",
      language: "auto",
      cacheRoot: join(dir, "cache"),
      voice: "Luna",
      maxRecordSeconds: 30,
      env: { FAKE_AURUM_DELAY_MS: "5000", FAKE_AURUM_LOG: log },
    })
    try {
      const handler = speakHandler({ provider: { engine } as never })
      const speaking = handler.run(
        { text: "hello" },
        {
          sessionID: "ses_1",
          agent: "build",
          messageID: "msg_1",
          id: "call_1",
          signal: new AbortController().signal,
          progress: async () => undefined,
          account: "default",
          bus: { name: "voice", emit: async () => ({ ok: true }) },
          access: { level: "all", aliases: ["default"], rules: [], problems: [], dispose: async () => undefined },
          unguardedAgents: async () => [],
          door: "tool",
        } as unknown as MethodCall,
      )
      const speakingResult = speaking.then(
        () => undefined,
        (cause: unknown) => cause,
      )
      await waitFor("the fake sidecar received synthesize", () => events(log).some((entry) => entry.event === "synthesize"))
      await engine.dispose()
      const error = await speakingResult
      expect(String(error)).toContain("UNAVAILABLE")
      expect(events(log).some((entry) => entry.event === "play")).toBe(false)

      const playError = await engine.play(join(dir, "later.wav")).then(
        () => undefined,
        (cause: unknown) => cause,
      )
      expect(playError).toBeInstanceOf(EngineError)
      expect((playError as EngineError).code).toBe("CANCELLED")
    } finally {
      await engine.dispose().catch(() => undefined)
    }
  }, 20_000)
})
