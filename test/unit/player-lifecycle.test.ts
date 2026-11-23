// Each playback owns its child, settlement and abort listener. A failed, completed or stopped playback's old signal
// must not stop or settle the next playback on the same Player. The fake Aurum fixture reports readiness with a log
// event, never a fixed sleep.
import { afterAll, describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { Player } from "../../src/engine/play.js"
import { EngineError } from "../../src/engine/errors.js"

const FAKE = new URL("../fixtures/fake-aurum.mjs", import.meta.url).pathname
const dir = mkdtempSync(join(tmpdir(), "voice-player-"))
afterAll(() => rmSync(dir, { recursive: true, force: true }))

const waitFor = async (what: string, check: () => boolean, ms = 5_000) => {
  const deadline = Date.now() + ms
  while (!check()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting until ${what}`)
    await Bun.sleep(10)
  }
}

const logOf = (tag: string) => join(dir, `log-${tag}.log`)
const holdOf = (tag: string) => join(dir, `hold-${tag}`)
const envOf = (tag: string) => ({
  FAKE_AURUM_PLAY_MS: "5000",
  FAKE_AURUM_PLAY_HOLD_FILE: holdOf(tag),
  FAKE_AURUM_LOG: logOf(tag),
})
const hold = (tag: string) => writeFileSync(holdOf(tag), "1")

const events = (path: string): { event?: string; path?: string }[] => {
  if (!existsSync(path)) return []
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as { event?: string; path?: string })
}
const saw = (path: string, event: string, file: string) => events(path).some((entry) => entry.event === event && entry.path === file)

/** Abort an old signal while a held playback on the same Player is live: it must stay live, then stop only by itself. */
async function assertStaleSignalIgnored(player: Player, old: AbortController, tag: string) {
  const log = logOf(tag)
  const file = join(dir, `${tag}-second.wav`)
  hold(tag)
  const controller = new AbortController()
  let settled = false
  const playback = player.play(file, { signal: controller.signal })
  playback.then(
    () => {
      settled = true
    },
    () => {
      settled = true
    },
  )
  try {
    await waitFor(`the ${tag} second playback is ready`, () => saw(log, "play-ready", file))
    expect(player.playing).toBe(true)
    old.abort()
    // Flush microtasks and a macrotask: a stale listener would have rejected the second playback by now.
    await Bun.sleep(0)
    expect(settled).toBe(false)
    expect(player.playing).toBe(true)
    controller.abort()
    const error = await playback.then(
      () => undefined,
      (cause: unknown) => cause,
    )
    expect(error).toBeInstanceOf(EngineError)
    expect((error as EngineError).code).toBe("CANCELLED")
    await waitFor(`the ${tag} second fixture exits after its own stop`, () => saw(log, "play-exit", file))
  } finally {
    player.stop()
  }
}

describe("playback lifetime", () => {
  test("an already aborted signal is CANCELLED without starting a child", async () => {
    const player = new Player({ bin: join(dir, "never-aurum") })
    const error = await player.play(join(dir, "aborted.wav"), { signal: AbortSignal.abort() }).then(
      () => undefined,
      (cause: unknown) => cause,
    )
    expect(error).toBeInstanceOf(EngineError)
    expect((error as EngineError).code).toBe("CANCELLED")
    expect(player.playing).toBe(false)
  })

  test("a failed first spawn cannot leave a listener that stops a later playback on the same Player", async () => {
    const tag = "after-spawn-error"
    const bin = join(dir, "late-aurum")
    const player = new Player({ bin, env: envOf(tag) })
    const old = new AbortController()
    const error = await player.play(join(dir, "failed.wav"), { signal: old.signal }).then(
      () => undefined,
      (cause: unknown) => cause,
    )
    expect(error).toBeInstanceOf(EngineError)
    expect((error as EngineError).code).toBe("ENGINE_MISSING")
    symlinkSync(FAKE, bin)
    await assertStaleSignalIgnored(player, old, tag)
  })

  test("a completed playback's old signal cannot stop a later playback on the same Player", async () => {
    const tag = "after-success"
    const player = new Player({ bin: FAKE, env: envOf(tag) })
    const old = new AbortController()
    await player.play(join(dir, "done.wav"), { signal: old.signal })
    await assertStaleSignalIgnored(player, old, tag)
  })

  test("a SIGTERM-resistant child keeps the exclusive slot busy until it exits", async () => {
    const tag = "resistant"
    const player = new Player({
      bin: FAKE,
      env: { ...envOf(tag), FAKE_AURUM_PLAY_MS: "3000", FAKE_AURUM_PLAY_RESIST_SIGTERM: "1" },
    })
    const firstPath = join(dir, "resistant-first.wav")
    hold(tag)
    const first = player.play(firstPath, { signal: new AbortController().signal })
    const firstResult = first.then(
      () => undefined,
      (cause: unknown) => cause,
    )
    try {
      await waitFor("the resistant playback is ready", () => saw(logOf(tag), "play-ready", firstPath))
      player.stop()
      const error = await firstResult
      expect(error).toBeInstanceOf(EngineError)
      expect((error as EngineError).code).toBe("CANCELLED")
      expect(player.playing).toBe(true)

      // The next call must not spawn a concurrent playback while the old child is still alive.
      const secondPath = join(dir, "resistant-second.wav")
      const busy = await player.play(secondPath, { signal: new AbortController().signal }).then(
        () => undefined,
        (cause: unknown) => cause,
      )
      expect(busy).toBeInstanceOf(EngineError)
      expect((busy as EngineError).code).toBe("BUSY")
      expect(events(logOf(tag)).some((entry) => entry.event === "play" && entry.path === secondPath)).toBe(false)

      await waitFor("the resistant child is killed", () => !player.playing, 5_000)
      expect(saw(logOf(tag), "play-sigterm", firstPath)).toBe(true)

      // After the child exits, the slot is free again.
      unlinkSync(holdOf(tag))
      const thirdPath = join(dir, "resistant-third.wav")
      await player.play(thirdPath, { signal: new AbortController().signal })
      expect(saw(logOf(tag), "play-exit", thirdPath)).toBe(true)
    } finally {
      // The Player owns the exact child and its bounded SIGKILL; the fixture's own hold is a second bound.
      player.stop()
      await waitFor("the resistant child eventually exits", () => !player.playing, 5_000).catch(() => undefined)
    }
  })

  test("a stopped playback's old signal cannot stop a later playback on the same Player", async () => {
    const tag = "after-stop"
    const player = new Player({ bin: FAKE, env: envOf(tag) })
    const old = new AbortController()
    hold(tag)
    const playback = player.play(join(dir, "stopped.wav"), { signal: old.signal })
    await waitFor("the first playback is ready", () => saw(logOf(tag), "play-ready", join(dir, "stopped.wav")))
    player.stop()
    const error = await playback.then(
      () => undefined,
      (cause: unknown) => cause,
    )
    expect(error).toBeInstanceOf(EngineError)
    expect((error as EngineError).code).toBe("CANCELLED")
    // The call is rejected at once, but the exclusive slot is freed only when the child actually exits.
    await waitFor("the stopped child exits", () => !player.playing)
    await assertStaleSignalIgnored(player, old, tag)
  })
})
