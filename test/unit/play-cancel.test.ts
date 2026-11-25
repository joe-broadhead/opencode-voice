// A Stop during playback is a cancellation, not a completed reply. The fake Aurum fixture holds its `play` child open
// until the abort, so no speaker and no real engine are involved.
import { afterAll, describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { SpeechEngine } from "../../src/provider/index.js"
import { EngineError } from "../../src/provider/errors.js"

const FAKE = new URL("../fixtures/fake-aurum.mjs", import.meta.url).pathname
const dir = mkdtempSync(join(tmpdir(), "voice-play-"))
afterAll(() => rmSync(dir, { recursive: true, force: true }))

const waitFor = async (what: string, check: () => boolean, ms = 5_000) => {
  const deadline = Date.now() + ms
  while (!check()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting until ${what}`)
    await Bun.sleep(10)
  }
}

describe("playback cancellation", () => {
  test("a stop during playback rejects CANCELLED instead of resolving as played", async () => {
    const ready = join(dir, "ready")
    const hold = join(dir, "hold")
    writeFileSync(hold, "1")
    const engine = new SpeechEngine({
      bin: FAKE,
      model: "tiny-q5_1",
      language: "auto",
      cacheRoot: join(dir, "cache"),
      voice: "Luna",
      maxRecordSeconds: 30,
      env: { FAKE_AURUM_PLAY_MS: "5000", FAKE_AURUM_PLAY_READY: ready, FAKE_AURUM_PLAY_HOLD_FILE: hold },
    })
    const controller = new AbortController()
    try {
      const playback = engine.play(join(dir, "reply.wav"), { signal: controller.signal })
      await waitFor("the fixture playback is ready", () => existsSync(ready))
      controller.abort()
      const outcome = await Promise.race([
        playback.then(
          () => "resolved",
          (error: unknown) => error,
        ),
        Bun.sleep(2_000).then(() => "timed out"),
      ])
      expect(outcome).toBeInstanceOf(EngineError)
      expect((outcome as EngineError).code).toBe("CANCELLED")
    } finally {
      await engine.dispose()
    }
  })
})
