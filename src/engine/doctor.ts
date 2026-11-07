import { spawn } from "node:child_process"
import { EngineError } from "./errors.js"

export interface DoctorCheck {
  readonly id: string
  readonly ok: boolean
  readonly detail: string
  readonly next?: string
}

const TIMEOUT_MS = 20_000
const KILL_MS = 1_000

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/**
 * The engine's own doctor, `aurum doctor --json`, as the plugin's checks. It reads the same `--cache-dir` the sidecar
 * uses, so the plugin and the engine agree about which model is installed.
 */
export function runDoctor(
  bin: string,
  options: { env?: Readonly<Record<string, string | undefined>>; cacheDir?: string } = {},
): Promise<readonly DoctorCheck[]> {
  return new Promise((resolve, reject) => {
    let child
    const args = ["doctor", "--json", ...(options.cacheDir === undefined ? [] : ["--cache-dir", options.cacheDir])]
    try {
      child = spawn(bin, args, { env: { ...process.env, ...options.env }, stdio: ["ignore", "pipe", "pipe"] })
    } catch (error) {
      reject(new EngineError("ENGINE_MISSING", `The speech engine could not start: ${String(error)}`))
      return
    }
    let stdout = ""
    let stderr = ""
    const kill = setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL")
    }, TIMEOUT_MS + KILL_MS)
    const timer = setTimeout(() => {
      child.kill("SIGTERM")
      setTimeout(() => {
        if (child.exitCode === null) child.kill("SIGKILL")
      }, KILL_MS).unref?.()
      reject(new EngineError("TIMEOUT", "The speech engine's doctor did not finish in time."))
    }, TIMEOUT_MS)
    child.stdout?.on("data", (chunk: Buffer) => (stdout += chunk.toString("utf8")))
    child.stderr?.on("data", (chunk: Buffer) => (stderr += chunk.toString("utf8")))
    child.on("error", (error) => {
      clearTimeout(timer)
      clearTimeout(kill)
      reject(new EngineError("ENGINE_MISSING", `The speech engine could not start: ${error.message}`))
    })
    child.on("exit", () => {
      clearTimeout(timer)
      clearTimeout(kill)
      const parsed = parseDoctor(stdout)
      if (parsed === undefined) {
        reject(new EngineError("SIDECAR_FAILED", stderr.trim() === "" ? "The speech engine's doctor returned no checks." : "The speech engine's doctor failed."))
        return
      }
      resolve(parsed)
    })
  })
}

/** Parses `{checks:[{id,ok,detail,next?}]}` or a bare array; undefined when the output is not a doctor report. */
export function parseDoctor(stdout: string): readonly DoctorCheck[] | undefined {
  let value: unknown
  try {
    value = JSON.parse(stdout)
  } catch {
    return undefined
  }
  const list = Array.isArray(value) ? value : isRecord(value) && Array.isArray(value.checks) ? value.checks : undefined
  if (list === undefined) return undefined
  const checks = list.flatMap((entry: unknown): DoctorCheck[] => {
    if (!isRecord(entry) || typeof entry.id !== "string" || typeof entry.ok !== "boolean") return []
    // Aurum 0.0.24 names the human line `summary` and the action `hint`; older reports used `detail` and `next`.
    const detail = typeof entry.summary === "string" ? entry.summary : typeof entry.detail === "string" ? entry.detail : ""
    const next = typeof entry.hint === "string" ? entry.hint : typeof entry.next === "string" ? entry.next : undefined
    return [{ id: entry.id, ok: entry.ok, detail, ...(next === undefined ? {} : { next }) }]
  })
  // The real report carries the microphone and the model cache as objects; make them checks the status rows read.
  if (isRecord(value) && isRecord(value.microphone)) {
    const mic = value.microphone
    const available = mic.available === true
    const name = typeof mic.name === "string" ? mic.name : ""
    checks.push({
      id: "microphone",
      ok: available,
      detail: available ? (name === "" ? "available" : name) : typeof mic.reason === "string" ? mic.reason : "unavailable",
      ...(available ? {} : { next: "Grant microphone access in System Settings → Privacy & Security → Microphone." }),
    })
    if (available && name !== "") checks.push({ id: "input", ok: true, detail: name })
  }
  if (isRecord(value) && isRecord(value.models)) {
    const stt = typeof value.models.stt === "string" ? value.models.stt : "the STT model"
    if (value.models.stt_cached === false) checks.push({ id: "models", ok: false, detail: `${stt} is not cached`, next: "Run /voice-install." })
    else if (value.models.stt_cached === true) checks.push({ id: "models", ok: true, detail: `${stt} cached` })
  }
  return checks
}

/** The permission the doctor reports, as the status row names it. */
export function microphonePermission(checks: readonly DoctorCheck[]): "authorized" | "denied" | "restricted" | "not_determined" | "unknown" {
  const check = checks.find((entry) => entry.id === "microphone" || entry.id === "mic")
  if (check === undefined) return "unknown"
  const text = `${check.detail} ${check.next ?? ""}`.toLowerCase()
  if (/not determined|notdetermined|not yet/.test(text)) return "not_determined"
  if (/denied/.test(text)) return "denied"
  if (/restricted/.test(text)) return "restricted"
  if (check.ok || /authorized|granted/.test(text)) return "authorized"
  return "unknown"
}

/** The input or output device a doctor check names, or null when it names none. */
export function deviceName(checks: readonly DoctorCheck[], id: "input" | "output" | "microphone" | "speaker"): string | null {
  const check = checks.find((entry) => entry.id === id)
  if (check === undefined) return null
  const detail = check.detail.trim()
  return detail === "" ? null : detail.slice(0, 120)
}
