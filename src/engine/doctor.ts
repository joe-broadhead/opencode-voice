import { spawn } from "node:child_process"
import { EngineError } from "./errors.js"

export interface DoctorCheck {
  readonly id: string
  readonly ok: boolean
  readonly detail: string
  readonly next?: string
}

const TIMEOUT_MS = 20_000

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/**
 * The engine's own doctor, `aurum doctor --json`, as the plugin's checks. It is the one place microphone, device,
 * format and cache facts come from, so the plugin and a host cannot disagree about what is installed.
 */
export function runDoctor(bin: string, env?: Readonly<Record<string, string | undefined>>): Promise<readonly DoctorCheck[]> {
  return new Promise((resolve, reject) => {
    let child
    try {
      child = spawn(bin, ["doctor", "--json"], { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] })
    } catch (error) {
      reject(new EngineError("ENGINE_MISSING", `The speech engine could not start: ${String(error)}`))
      return
    }
    let stdout = ""
    let stderr = ""
    const timer = setTimeout(() => {
      child.kill("SIGTERM")
      reject(new EngineError("TIMEOUT", "The speech engine's doctor did not finish in time."))
    }, TIMEOUT_MS)
    child.stdout?.on("data", (chunk: Buffer) => (stdout += chunk.toString("utf8")))
    child.stderr?.on("data", (chunk: Buffer) => (stderr += chunk.toString("utf8")))
    child.on("error", (error) => {
      clearTimeout(timer)
      reject(new EngineError("ENGINE_MISSING", `The speech engine could not start: ${error.message}`))
    })
    child.on("exit", () => {
      clearTimeout(timer)
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
  return list.flatMap((entry: unknown): DoctorCheck[] => {
    if (!isRecord(entry) || typeof entry.id !== "string" || typeof entry.ok !== "boolean") return []
    return [
      {
        id: entry.id,
        ok: entry.ok,
        detail: typeof entry.detail === "string" ? entry.detail : "",
        ...(typeof entry.next === "string" ? { next: entry.next } : {}),
      },
    ]
  })
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
