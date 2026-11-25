// Adapted from oc-aurum (https://github.com/cesar-alves/oc-aurum), src/endpoint.ts
// Copyright (c) 2026 Cesar Alves. MIT. See NOTICE.
//
// Decides when a hands-free recording is over from the RMS level of each 20 ms frame. It follows Aurum's own
// `converse --mic` loop: an energy threshold (not a neural VAD), 0.7 s of silence after an utterance, and an extra
// 1.2 s while the utterance is still short, for a mid-thought pause. The noise floor adapts on every frame that is not
// voiced: it falls fast and rises slowly, so speech never raises it.

export type EndpointState = "listening" | "speech" | "pause" | "end" | "no-speech"

export interface EndpointOptions {
  readonly frameMs?: number
  readonly endpointSilenceMs?: number
  readonly thinkingPauseMs?: number
  readonly shortUtteranceMs?: number
  readonly noSpeechTimeoutMs?: number
  readonly floorFall?: number
  readonly floorRise?: number
  readonly speechMarginDb?: number
  readonly minThresholdDbfs?: number
  readonly maxThresholdDbfs?: number
  readonly minSpeechMs?: number
  readonly resumeSpeechMs?: number
  readonly pauseMs?: number
  readonly initialFloorDbfs?: number
}

export const DEFAULT_ENDPOINT: Required<Omit<EndpointOptions, "initialFloorDbfs">> = {
  frameMs: 20,
  endpointSilenceMs: 700,
  thinkingPauseMs: 1200,
  shortUtteranceMs: 2000,
  noSpeechTimeoutMs: 8000,
  floorFall: 0.5,
  // About a 1 s time constant at 20 ms frames.
  floorRise: 0.02,
  speechMarginDb: 10,
  minThresholdDbfs: -45,
  maxThresholdDbfs: -30,
  minSpeechMs: 160,
  resumeSpeechMs: 60,
  pauseMs: 400,
}

const FLOOR_MIN_DBFS = -100

export class Endpointer {
  private readonly options: Required<Omit<EndpointOptions, "initialFloorDbfs">>
  private floor: number
  private threshold: number
  private elapsedMs = 0
  private voicedRunMs = 0
  private speechStartMs: number | undefined
  private lastVoicedMs = 0
  private silenceMs = 0
  private current: EndpointState = "listening"
  private loudest = -Infinity

  constructor(options: EndpointOptions = {}) {
    const { initialFloorDbfs, ...rest } = options
    this.options = { ...DEFAULT_ENDPOINT, ...rest }
    this.floor = this.options.maxThresholdDbfs - this.options.speechMarginDb
    this.threshold = this.options.maxThresholdDbfs
    if (initialFloorDbfs !== undefined && Number.isFinite(initialFloorDbfs)) {
      this.floor = Math.max(FLOOR_MIN_DBFS, initialFloorDbfs)
      this.threshold = this.thresholdFor(this.floor)
    }
  }

  get state(): EndpointState {
    return this.current
  }

  get noiseFloorDbfs(): number {
    return this.floor
  }

  get thresholdDbfs(): number {
    return this.threshold
  }

  get loudestDbfs(): number {
    return this.loudest
  }

  private thresholdFor(floor: number) {
    return Math.min(this.options.maxThresholdDbfs, Math.max(this.options.minThresholdDbfs, floor + this.options.speechMarginDb))
  }

  /** Feeds one frame and returns the state after it. A finished turn ignores every later frame. */
  push(levelDbfs: number): EndpointState {
    if (this.current === "end" || this.current === "no-speech") return this.current
    const options = this.options
    this.elapsedMs += options.frameMs
    this.loudest = Math.max(this.loudest, levelDbfs)

    const voiced = levelDbfs > this.threshold
    if (!voiced) {
      this.floor = Math.max(FLOOR_MIN_DBFS, this.floor + (levelDbfs - this.floor) * (levelDbfs < this.floor ? options.floorFall : options.floorRise))
      this.threshold = this.thresholdFor(this.floor)
    }

    if (voiced) {
      this.voicedRunMs += options.frameMs
      this.silenceMs = 0
      this.lastVoicedMs = this.elapsedMs
      if (this.current !== "speech") {
        if (this.voicedRunMs >= options.minSpeechMs) {
          this.current = "speech"
          this.speechStartMs ??= this.elapsedMs - this.voicedRunMs
        }
      }
      return this.current
    }

    this.voicedRunMs = 0
    if (this.current !== "speech" && this.current !== "pause") {
      if (this.elapsedMs >= options.noSpeechTimeoutMs) this.current = "no-speech"
      return this.current
    }

    this.silenceMs += options.frameMs
    const spokenMs = (this.speechStartMs === undefined ? 0 : this.lastVoicedMs - this.speechStartMs)
    // A longer hangover early in the utterance (a thinking pause), easing to the floor after a couple of seconds.
    const hangover = spokenMs >= options.shortUtteranceMs ? options.endpointSilenceMs : options.thinkingPauseMs
    if (this.silenceMs >= hangover) {
      this.current = "end"
    } else if (this.silenceMs >= options.pauseMs) {
      this.current = "pause"
    }
    return this.current
  }

  /** A key press ends the turn at once, whatever the silence has said. */
  finish(): EndpointState {
    if (this.current === "speech" || this.current === "pause") this.current = "end"
    return this.current
  }

  /** The silence before the end, for a status line: how much of the hangover has passed. */
  get pauseMs(): number {
    return this.silenceMs
  }
}
