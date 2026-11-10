import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { EngineError } from "./errors.js"
import { MINIMUM_ENGINE, MODULE, platformKey, platformLabel } from "./platform.js"
import { cachedEngine, digestMatches, pinnedVersion, readRelease, toEngineError } from "./release.js"

export { digestMatches, MINIMUM_ENGINE }

export interface EngineInfo {
  readonly path: string
  readonly version: string | null
  readonly source: "option" | "environment" | "download"
  readonly verified: boolean
  readonly platform: string
  readonly supported: boolean
}

export interface ResolveInput {
  readonly packageRoot: string
  readonly optionPath?: string
  /** The plugin cache; a downloaded, pinned engine is looked up in `<cacheRoot>/native/…` (release.ts). */
  readonly cacheRoot?: string
  readonly env?: Readonly<Record<string, string | undefined>>
  readonly platform?: string
  readonly arch?: string
}

/**
 * Finds the engine binary, in order: the `aurumPath` option, the `VOICE_AURUM_PATH` test seam, then the pinned engine
 * the first use or `/voice-install` downloaded into the cache. A configured binary is used before the cache or the
 * network (NATIVE-DESIGN.md section 2.5). There is no PATH fallback: a dependency named `aurum` in a project must never
 * get the microphone. A cached copy whose digest does not match is refused with `ENGINE_UNVERIFIED` before anything runs.
 */
export function resolveEngine(input: ResolveInput): EngineInfo {
  const platform = input.platform ?? process.platform
  const arch = input.arch ?? process.arch
  const env = input.env ?? process.env
  const label = platformLabel(platform, arch)
  const version = pinnedVersion(input.packageRoot)
  const candidate = (path: string, source: EngineInfo["source"], verified: boolean): EngineInfo => ({
    path,
    version,
    source,
    verified,
    platform: label,
    supported: true,
  })

  if (input.optionPath !== undefined) {
    const path = resolve(input.optionPath)
    if (!existsSync(path)) throw new EngineError("ENGINE_MISSING", "The aurumPath option points at a file that does not exist.")
    return candidate(path, "option", false)
  }

  // The test seam: a locally built Aurum binary. It is never a default and is labelled unverified.
  const fromEnv = env.VOICE_AURUM_PATH
  if (fromEnv !== undefined && fromEnv !== "") {
    const path = resolve(fromEnv)
    if (!existsSync(path)) throw new EngineError("ENGINE_MISSING", "VOICE_AURUM_PATH points at a file that does not exist.")
    return candidate(path, "environment", false)
  }

  // A platform with no build and no binary of the person's is refused here, before any candidate is made.
  const key = platformKey(platform, arch)
  if (key === undefined) throw new EngineError("UNSUPPORTED_PLATFORM", `There is no speech engine for ${label}.`)

  // The pinned engine, downloaded by `/voice-install` (or the first use) and verified against the release manifest.
  const release = (() => {
    try {
      return readRelease(input.packageRoot)
    } catch (error) {
      throw toEngineError(error)
    }
  })()
  if (release === undefined) {
    throw new EngineError(
      "ENGINE_MISSING",
      "This copy of Voice carries no release manifest, so it has no pinned speech engine.",
      "Set the aurumPath option to an Aurum binary, or install a release of the plugin.",
    )
  }
  const entry = release.modules[MODULE]?.[key]
  if (entry === undefined) throw new EngineError("UNSUPPORTED_PLATFORM", `There is no Aurum ${MINIMUM_ENGINE} binary for ${label}.`)
  if (input.cacheRoot !== undefined) {
    const path = cachedEngine(input.cacheRoot, { manifest: release, key, entry })
    if (path !== undefined) return candidate(path, "download", true)
  }

  throw new EngineError("ENGINE_MISSING", "The pinned speech engine is not installed.")
}

export interface EngineProbe {
  readonly version: string | null
  readonly compatible: boolean
  /** The shared library the dynamic loader refused, when the engine did not start for that reason (ALSA on Linux, say). */
  readonly missingLibrary?: string
  /** A symbol version this system's C or C++ library lacks (GLIBC_2.39, say): the system is older than the engine needs. */
  readonly olderSystem?: string
}

/** The version in `aurum X.Y.Z`, or a bare `X.Y.Z`. A suffix such as `-fixture` is ignored for comparison. */
export function parseEngineVersion(output: string): string | undefined {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(output)
  return match === null ? undefined : `${match[1]}.${match[2]}.${match[3]}`
}

const parts = (version: string) => version.split(".").map(Number)

/** True for Aurum 0.0.24 and later: the release that adds the commands and flags this plugin needs. */
export function isCompatibleEngine(version: string | undefined): boolean {
  if (version === undefined) return false
  const [major = 0, minor = 0, patch = 0] = parts(version)
  const [minMajor = 0, minMinor = 0, minPatch = 0] = parts(MINIMUM_ENGINE)
  if (major !== minMajor) return major > minMajor
  if (minor !== minMinor) return minor > minMinor
  return patch >= minPatch
}

const PROBE_TIMEOUT = 5_000

/** Runs `aurum --version` once. A binary that cannot answer is incompatible, never assumed good. */
export function probeEngine(bin: string, env?: Readonly<Record<string, string | undefined>>): Promise<EngineProbe> {
  return new Promise((resolveProbe) => {
    let child
    try {
      child = spawn(bin, ["--version"], { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] })
    } catch {
      resolveProbe({ version: null, compatible: false })
      return
    }
    let output = ""
    let errors = ""
    const timer = setTimeout(() => {
      child.kill("SIGTERM")
      setTimeout(() => {
        if (child.exitCode === null) child.kill("SIGKILL")
      }, 1_000).unref?.()
      resolveProbe({ version: null, compatible: false })
    }, PROBE_TIMEOUT)
    child.stdout?.on("data", (chunk: Buffer) => (output += chunk.toString("utf8")))
    child.stderr?.on("data", (chunk: Buffer) => (errors += chunk.toString("utf8")))
    child.on("error", () => {
      clearTimeout(timer)
      resolveProbe({ version: null, compatible: false })
    })
    child.on("exit", () => {
      clearTimeout(timer)
      const version = parseEngineVersion(output)
      // The loader names what it could not load, or the symbol version this system lacks; both are facts about this
      // machine, and the next step can say them without a path.
      const missing = /error while loading shared libraries: ([^:\s]+)/.exec(errors)?.[1]
      const older = /version `([A-Z][A-Z0-9_.]*)' not found/.exec(errors)?.[1]
      resolveProbe({
        version: version ?? null,
        compatible: isCompatibleEngine(version),
        ...(version === undefined && missing !== undefined ? { missingLibrary: missing } : {}),
        ...(version === undefined && older !== undefined ? { olderSystem: older } : {}),
      })
    })
  })
}
