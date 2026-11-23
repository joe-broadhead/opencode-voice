#!/usr/bin/env node
// The fake Aurum engine: the sidecar protocol, the recorder, the player and the JSON commands, so the plugin's host and
// unit tests need no real engine, no microphone and no network. It is a test fixture and is never shipped.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"

const LOG = process.env.FAKE_AURUM_LOG
const TEXT = process.env.FAKE_AURUM_TEXT ?? "hello from the fixture engine"
const log = (event, data = {}) => {
  if (!LOG) return
  mkdirSync(dirname(LOG), { recursive: true })
  appendFileSync(LOG, `${JSON.stringify({ event, at: Date.now(), ...data })}\n`)
}
const args = process.argv.slice(2)
const delayMs = () => {
  const file = process.env.FAKE_AURUM_DELAY_FILE
  if (file !== undefined && existsSync(file)) return Number(process.env.FAKE_AURUM_DELAY_FILE_MS ?? process.env.FAKE_AURUM_DELAY_MS ?? 0)
  return Number(process.env.FAKE_AURUM_DELAY_MS ?? 0)
}

const RATE = 16_000
const wav = (seconds, amplitude = 0.2, hz = 220) => {
  const count = Math.round(RATE * seconds)
  const data = Buffer.alloc(count * 2)
  for (let index = 0; index < count; index += 1) data.writeInt16LE(Math.round(Math.sin((2 * Math.PI * hz * index) / RATE) * amplitude * 32767), index * 2)
  const header = Buffer.alloc(44)
  header.write("RIFF", 0, "ascii")
  header.writeUInt32LE(36 + data.length, 4)
  header.write("WAVE", 8, "ascii")
  header.write("fmt ", 12, "ascii")
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(RATE, 24)
  header.writeUInt32LE(RATE * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write("data", 36, "ascii")
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}
const voice = wav(1.2, 0.2)

if (args[0] === "--version") {
  process.stdout.write(`aurum ${process.env.FAKE_AURUM_VERSION ?? "0.0.24"}-fixture\n`)
  process.exit(0)
}

if (args[0] === "doctor") {
  process.stdout.write(
    JSON.stringify({
      checks: [
        { id: "engine", ok: true, detail: "0.0.24-fixture" },
        { id: "models", ok: true, detail: "tiny-q5_1 cached" },
        { id: "microphone", ok: true, detail: "authorized" },
        { id: "format", ok: true, detail: "16 kHz mono PCM16" },
        { id: "input", ok: true, detail: "Fixture Microphone" },
        { id: "output", ok: true, detail: "Fixture Speakers" },
      ],
    }) + "\n",
  )
  process.exit(0)
}

if (args[0] === "models" || (args[0] === "tts" && args[1] === "models")) {
  process.stdout.write(JSON.stringify({ models: [] }) + "\n")
  process.exit(0)
}

if (args[0] === "play") {
  const path = args[1]
  log("play", { path })
  let exited = false
  const finish = () => {
    if (exited) return
    exited = true
    log("play-exit", { path })
    process.exit(0)
  }
  if (process.env.FAKE_AURUM_PLAY_RESIST_SIGTERM === "1") {
    // Test-only: prove the exclusive slot stays held until the bounded SIGKILL, without touching another child.
    process.on("SIGTERM", () => log("play-sigterm", { path }))
  } else {
    process.on("SIGTERM", finish)
  }
  // Test-only readiness: logged and written only after the signal handler is installed, never raced with a sleep.
  log("play-ready", { path })
  const ready = process.env.FAKE_AURUM_PLAY_READY
  if (ready) {
    mkdirSync(dirname(ready), { recursive: true })
    writeFileSync(ready, "ready")
  }
  const holdFile = process.env.FAKE_AURUM_PLAY_HOLD_FILE
  const hold = holdFile !== undefined && existsSync(holdFile) ? Number(process.env.FAKE_AURUM_PLAY_MS ?? 5_000) : 0
  if (hold > 0) {
    // Test-only: stay alive long enough for a during-playback abort; SIGTERM is the normal exit.
    setTimeout(finish, hold)
  } else {
    finish()
  }
}

if (args[0] === "record") {
  const out = args[args.indexOf("-O") + 1]
  const seconds = Number(args[args.indexOf("--seconds") + 1] ?? 30)
  const levels = args.includes("--level-events")
  log("record", { out, seconds, levels })
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, voice)
  let stopped = false
  const finish = () => {
    if (stopped) return
    stopped = true
    log("record-stop", { out })
    process.exit(0)
  }
  process.on("SIGINT", finish)
  if (process.env.FAKE_AURUM_IGNORE_TERM !== "1") process.on("SIGTERM", finish)
  if (levels) {
    // 0.4 s of speech, then 1.6 s of silence: the endpointer ends the turn on its own.
    let frame = 0
    const timer = setInterval(() => {
      if (stopped) return
      const dbfs = frame < 20 ? -20 : -70
      process.stdout.write(`${JSON.stringify({ level_dbfs: dbfs })}\n`)
      frame += 1
      if (frame > Math.min(90, seconds * 50)) {
        clearInterval(timer)
        finish()
      }
    }, 20)
  }
  // Keep the process alive until a level stream ends it or a signal arrives.
  setTimeout(finish, Math.min(seconds, 10) * 1000)
}

if (args[0] === "converse") {
  log("converse-args", { args })
  process.on("exit", () => log("converse-exit", {}))
  if (process.env.FAKE_AURUM_IGNORE_TERM === "1") process.on("SIGTERM", () => undefined)
  const reader = (await import("node:readline")).createInterface({ input: process.stdin })
  const caps = (process.env.FAKE_AURUM_CAPS ?? "transcribe,synthesize,abort,long_audio,synthesize_speaking_rate").split(",")
  const ready = JSON.stringify({ v: 1, type: "ready", stt_provider: "local", tts_provider: "local", caps })
  const readyFile = process.env.FAKE_AURUM_READY_DELAY_FILE
  const readyDelay = readyFile !== undefined && existsSync(readyFile)
    ? Number(process.env.FAKE_AURUM_READY_DELAY_FILE_MS ?? process.env.FAKE_AURUM_READY_DELAY_MS ?? 0)
    : Number(process.env.FAKE_AURUM_READY_DELAY_MS ?? 0)
  const publishReady = () => {
    log("ready-event", {})
    process.stdout.write(`${ready}\n`)
    const exitAfter = Number(process.env.FAKE_AURUM_EXIT_AFTER_READY_MS ?? 0)
    if (exitAfter > 0) setTimeout(() => process.exit(0), exitAfter)
  }
  if (readyDelay > 0) setTimeout(publishReady, readyDelay)
  else publishReady()
  reader.on("line", (line) => {
    let command
    try {
      command = JSON.parse(line)
    } catch {
      return
    }
    if (command.type === "transcribe") {
      log("transcribe", { path: command.path })
      let text = TEXT
      try {
        const bytes = readFileSync(command.path)
        const data = bytes.subarray(44)
        const loud = data.some((byte) => byte !== 0)
        if (!loud) text = ""
      } catch {
        text = ""
      }
      setTimeout(() => process.stdout.write(JSON.stringify({ v: 1, type: "user_final", text, provider: "local", model: "tiny-q5_1" }) + "\n"), delayMs())
    } else if (command.type === "synthesize") {
      log("synthesize", { path: command.path, chars: String(command.text ?? "").length })
      mkdirSync(dirname(command.path), { recursive: true })
      writeFileSync(command.path, voice)
      const rate = typeof command.speaking_rate === "number" ? command.speaking_rate : 1
      setTimeout(() => {
        const event = JSON.stringify({ v: 1, type: "synthesized", path: command.path, duration_ms: Math.round(1200 / rate), provider: "local", model: "kitten", voice: process.env.FAKE_AURUM_VOICE ?? "Luna", sample_rate_hz: RATE })
        log("synthesized-event", { path: command.path })
        process.stdout.write(`${event}\n`)
      }, delayMs())
    } else if (command.type === "abort") {
      process.stdout.write(JSON.stringify({ v: 1, type: "listening" }) + "\n")
    } else if (command.type === "shutdown") {
      if (process.env.FAKE_AURUM_IGNORE_SHUTDOWN !== "1") {
        process.stdout.write(JSON.stringify({ v: 1, type: "shutdown" }) + "\n")
        process.exit(0)
      }
    }
  })
}

export {}
