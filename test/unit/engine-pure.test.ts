import { describe, expect, test } from "bun:test"
import { Endpointer } from "../../src/engine/endpoint.js"
import { isSilent, makeWav, readWav, tone } from "../../src/engine/wav.js"
import { speakable } from "../../src/engine/speakable.js"
import { microphonePermission, parseDoctor } from "../../src/engine/doctor.js"

describe("the endpointer", () => {
  test("ends after the thinking pause early and the shorter pause later", () => {
    const early = new Endpointer()
    expect(early.push(-20)).toBe("listening")
    for (let index = 0; index < 10; index += 1) early.push(-20)
    expect(early.state).toBe("speech")
    // 1.0 s of silence is inside the 1.2 s thinking pause.
    for (let index = 0; index < 50; index += 1) early.push(-70)
    expect(early.state).toBe("pause")
    for (let index = 0; index < 15; index += 1) early.push(-70)
    expect(early.state).toBe("end")
  })

  test("a long utterance uses the 0.7 s floor", () => {
    const late = new Endpointer()
    for (let index = 0; index < 150; index += 1) late.push(-20)
    for (let index = 0; index < 36; index += 1) late.push(-70)
    expect(late.state).toBe("end")
  })

  test("a quiet room never becomes speech, and times out", () => {
    const quiet = new Endpointer({ noSpeechTimeoutMs: 200 })
    for (let index = 0; index < 12; index += 1) quiet.push(-70)
    expect(quiet.state).toBe("no-speech")
  })

  test("a key press ends the turn at once", () => {
    const key = new Endpointer()
    for (let index = 0; index < 10; index += 1) key.push(-20)
    expect(key.finish()).toBe("end")
  })
})

describe("the WAV contract", () => {
  test("reads a tone as sound and silence as silent", () => {
    const loud = readWav(tone(0.5))
    expect(loud.sampleRate).toBe(16_000)
    expect(loud.channels).toBe(1)
    expect(isSilent(loud)).toBe(false)
    const quiet = readWav(makeWav(new Int16Array(16_000)))
    expect(isSilent(quiet)).toBe(true)
  })

  test("refuses a non-WAV, stereo, and a wrong rate", () => {
    expect(() => readWav(new Uint8Array([1, 2, 3, 4]))).toThrow(/WAV/)
    const stereo = Buffer.from(tone(0.2))
    stereo.writeUInt16LE(2, 22)
    expect(() => readWav(stereo)).toThrow(/mono/)
    const wrongRate = Buffer.from(tone(0.2))
    wrongRate.writeUInt32LE(44_100, 24)
    expect(() => readWav(wrongRate)).toThrow(/16 kHz/)
  })
})

describe("speakable", () => {
  test("drops code fences, link targets, headings and table pipes", () => {
    const text = speakable("# Title\n\nLook at [this](https://example.com) and `code`.\n\n```js\nconst x = 1\n```\n\n| a | b |\n|---|---|\n| 1 | 2 |")
    expect(text).toContain("Title")
    expect(text).toContain("this")
    expect(text).not.toContain("https://")
    expect(text).not.toContain("```")
    expect(text).not.toContain("|")
  })

  test("cuts at a word boundary", () => {
    const text = speakable("one two three four five", 12)
    expect(text.endsWith("…")).toBe(true)
    expect(text.length).toBeLessThanOrEqual(12)
  })
})

describe("the doctor parser", () => {
  test("reads checks and the microphone permission", () => {
    const checks = parseDoctor(JSON.stringify({ checks: [{ id: "microphone", ok: true, detail: "authorized" }, { id: "engine", ok: false, detail: "missing" }] }))
    expect(checks).toHaveLength(2)
    expect(microphonePermission(checks!)).toBe("authorized")
    expect(parseDoctor("not json")).toBeUndefined()
  })

  test("maps denied and undetermined", () => {
    expect(microphonePermission([{ id: "microphone", ok: false, detail: "denied by the user" }])).toBe("denied")
    expect(microphonePermission([{ id: "microphone", ok: false, detail: "not determined" }])).toBe("not_determined")
    expect(microphonePermission([])).toBe("unknown")
  })
})

describe("the 0.0.24 doctor report", () => {
  test("reads summary, hint, the microphone object and the model cache", () => {
    const checks = parseDoctor(
      JSON.stringify({
        checks: [{ id: "ffmpeg", ok: false, summary: "ffmpeg not found", hint: "install ffmpeg" }],
        microphone: { probed: true, available: true, name: "MacBook Air Microphone", devices: [], reason: "48000 Hz" },
        models: { stt: "tiny-q5_1", stt_cached: true, tts: "kitten-nano-int8", tts_cached: true },
      }),
    )
    expect(checks?.find((check) => check.id === "ffmpeg")).toMatchObject({ ok: false, detail: "ffmpeg not found", next: "install ffmpeg" })
    expect(checks?.find((check) => check.id === "microphone")).toMatchObject({ ok: true, detail: "MacBook Air Microphone" })
    expect(microphonePermission(checks!)).toBe("authorized")
    expect(checks?.find((check) => check.id === "models")?.ok).toBe(true)
  })
})
