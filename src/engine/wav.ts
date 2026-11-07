import { EngineError } from "./errors.js"

/** The wire format the engine accepts and the plugin records: 16 kHz, mono, 16-bit PCM. */
export const WIRE_RATE = 16_000
export const WIRE_CHANNELS = 1
export const WIRE_BITS = 16
/** Peak below this is silence; a dead microphone never rises above zero. */
export const SILENCE_PEAK_DBFS = -50
/** Voiced audio shorter than this is a click, not speech. */
export const MIN_VOICED_MS = 160
export const FRAME_MS = 20

export interface WavInfo {
  readonly sampleRate: number
  readonly channels: number
  readonly bits: number
  readonly dataOffset: number
  readonly dataBytes: number
  readonly seconds: number
  readonly peakDbfs: number
  /** Frames whose level rose above the silence gate, in milliseconds. */
  readonly voicedMs: number
}

const tag = (bytes: Uint8Array, at: number) => String.fromCharCode(...bytes.subarray(at, at + 4))

/**
 * Parses a WAV header and measures the audio. The wire format is strict: anything that is not mono 16-bit PCM at
 * 16 kHz is refused, because the engine's contract says so and a silent format mismatch is worse than an error.
 */
export function readWav(bytes: Uint8Array): WavInfo {
  const bad = (message: string) => new EngineError("BAD_AUDIO", message)
  if (bytes.length < 12 || tag(bytes, 0) !== "RIFF" || tag(bytes, 8) !== "WAVE") throw bad("The audio is not a WAV file.")
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let format: { code: number; channels: number; rate: number; bits: number } | undefined
  let offset = 12
  while (offset + 8 <= bytes.length) {
    const id = tag(bytes, offset)
    const declared = view.getUint32(offset + 4, true)
    const body = offset + 8
    if (id === "fmt ") {
      if (declared < 16 || body + 16 > bytes.length) throw bad("The WAV header is damaged.")
      format = {
        code: view.getUint16(body, true),
        channels: view.getUint16(body + 2, true),
        rate: view.getUint32(body + 4, true),
        bits: view.getUint16(body + 14, true),
      }
    } else if (id === "data") {
      if (format === undefined) throw bad("The WAV header is damaged.")
      if (format.code !== 1 || format.bits !== WIRE_BITS) throw bad("The WAV must be 16-bit PCM.")
      if (format.channels !== WIRE_CHANNELS) throw bad("The WAV must be mono.")
      if (format.rate !== WIRE_RATE) throw bad("The WAV must be 16 kHz.")
      const length = Math.min(declared, bytes.length - body)
      if (length < 2) throw bad("The WAV has no audio data.")
      const samples = Math.floor(length / 2)
      let peak = 0
      const frameSamples = Math.max(1, (WIRE_RATE * FRAME_MS) / 1000)
      let voicedFrames = 0
      for (let index = 0; index < samples; index += 1) {
        const sample = Math.abs(view.getInt16(body + index * 2, true)) / 32768
        if (sample > peak) peak = sample
      }
      for (let start = 0; start < samples; start += frameSamples) {
        const end = Math.min(samples, start + frameSamples)
        let sum = 0
        for (let index = start; index < end; index += 1) {
          const sample = view.getInt16(body + index * 2, true) / 32768
          sum += sample * sample
        }
        const dbfs = sum === 0 ? -Infinity : 20 * Math.log10(Math.sqrt(sum / Math.max(1, end - start)))
        if (dbfs > SILENCE_PEAK_DBFS) voicedFrames += 1
      }
      return {
        sampleRate: format.rate,
        channels: format.channels,
        bits: format.bits,
        dataOffset: body,
        dataBytes: length,
        seconds: length / (WIRE_RATE * 2),
        peakDbfs: peak === 0 ? -Infinity : 20 * Math.log10(peak),
        voicedMs: voicedFrames * FRAME_MS,
      }
    }
    offset = body + declared + (declared % 2)
  }
  throw bad("The WAV has no audio data.")
}

/** The silence verdict the engine contract returns: no sound, or under 160 ms of voiced audio. */
export const isSilent = (info: WavInfo) => info.peakDbfs < SILENCE_PEAK_DBFS || info.voicedMs < MIN_VOICED_MS

/** A 44-byte header for 16 kHz mono 16-bit PCM of the given data size. */
export function wavHeader(dataBytes: number): Buffer {
  const header = Buffer.alloc(44)
  header.write("RIFF", 0, "ascii")
  header.writeUInt32LE(36 + dataBytes, 4)
  header.write("WAVE", 8, "ascii")
  header.write("fmt ", 12, "ascii")
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(WIRE_CHANNELS, 22)
  header.writeUInt32LE(WIRE_RATE, 24)
  header.writeUInt32LE(WIRE_RATE * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(WIRE_BITS, 34)
  header.write("data", 36, "ascii")
  header.writeUInt32LE(dataBytes, 40)
  return header
}

/**
 * A quiet tone or silence as a WAV, for fixtures and tests. It is not used at run time: the recorder writes the real
 * file, and this keeps the tests free of binary fixtures.
 */
export function makeWav(samples: Int16Array): Buffer {
  const data = Buffer.alloc(samples.length * 2)
  samples.forEach((sample, index) => data.writeInt16LE(sample, index * 2))
  return Buffer.concat([wavHeader(data.length), data])
}

/** A simple 16 kHz sine tone, for a fixture that the front end must see as sound. */
export function tone(seconds: number, hz = 220, amplitude = 0.25): Buffer {
  const count = Math.round(WIRE_RATE * seconds)
  const samples = new Int16Array(count)
  for (let index = 0; index < count; index += 1) {
    samples[index] = Math.round(Math.sin((2 * Math.PI * hz * index) / WIRE_RATE) * amplitude * 32767)
  }
  return makeWav(samples)
}
