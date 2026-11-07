import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join, resolve } from "node:path"
import { EngineError } from "./errors.js"
import { BINARY_NAME, PACKAGE_FOR, platformKey, platformLabel, type PlatformKey } from "./platform.js"
import { engineBinaryPath, readRelease } from "./release.js"

/** The pinned engine, as a platform package's `manifest/aurum.json` describes it. */
export interface EngineManifest {
  readonly version: string
  readonly asset: string
  readonly sha256: string
  readonly bytes: number
  readonly source: string
  readonly licence: string
}

export interface EngineInfo {
  readonly path: string
  readonly version: string | null
  readonly source: "package" | "option" | "environment" | "download"
  readonly verified: boolean
  readonly platform: string
  readonly supported: boolean
}

export interface ResolveInput {
  readonly packageRoot: string
  readonly optionPath?: string
  /** The plugin cache; a downloaded, pinned engine is looked up in `<cacheRoot>/engine/bin`. */
  readonly cacheRoot?: string
  readonly env?: Readonly<Record<string, string | undefined>>
  readonly platform?: string
  readonly arch?: string
}

/** The first Aurum release that ships `record`, `play`, `converse --stdio` and `--cache-dir`. */
export const MINIMUM_ENGINE = "0.0.24"

const hex = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex")

/** A synchronous digest check for the downloaded engine, whose path must be refused before any process starts. */
const awaitDigestSync = (path: string, expected: string): boolean => {
  try {
    return hex(path) === expected
  } catch {
    return false
  }
}

/** True when the file's SHA-256 is the pinned one. A missing or unreadable file is not verified. */
export function digestMatches(path: string, expected: string): boolean {
  try {
    return hex(path) === expected
  } catch {
    return false
  }
}

function packageManifest(key: PlatformKey): { dir: string; manifest: EngineManifest } | undefined {
  const require = createRequire(import.meta.url)
  try {
    const entry = require.resolve(`${PACKAGE_FOR[key]}/package.json`)
    const dir = dirname(entry)
    return { dir, manifest: JSON.parse(readFileSync(join(dir, "manifest", "aurum.json"), "utf8")) as EngineManifest }
  } catch {
    return undefined
  }
}

/**
 * Finds the engine binary, in order: the `aurumPath` option, the platform package the build pins, then the
 * `VOICE_AURUM_PATH` test seam. There is no PATH fallback: a dependency named `aurum` in a project must never get the
 * microphone. A pinned digest that does not match is refused with `ENGINE_UNVERIFIED` before anything runs.
 */
export function resolveEngine(input: ResolveInput): EngineInfo {
  const platform = input.platform ?? process.platform
  const arch = input.arch ?? process.arch
  const key = platformKey(platform, arch)
  const env = input.env ?? process.env
  const release = (() => {
    try {
      return readRelease(input.packageRoot)
    } catch {
      return undefined
    }
  })()

  const candidate = (path: string, source: EngineInfo["source"], version: string | null, verified: boolean): EngineInfo => ({
    path,
    version,
    source,
    verified,
    platform: platformLabel(platform, arch),
    supported: key !== undefined,
  })

  if (input.optionPath !== undefined) {
    const path = resolve(input.optionPath)
    if (!existsSync(path)) throw new EngineError("ENGINE_MISSING", "The aurumPath option points at a file that does not exist.")
    return candidate(path, "option", release?.version ?? null, false)
  }

  if (key !== undefined) {
    const found = packageManifest(key)
    if (found !== undefined) {
      const path = join(found.dir, "bin", BINARY_NAME)
      if (!existsSync(path)) throw new EngineError("ENGINE_MISSING", "The pinned speech engine is missing from its platform package.")
      if (!digestMatches(path, found.manifest.sha256)) {
        throw new EngineError("ENGINE_UNVERIFIED", "The speech engine does not match its pinned SHA-256 hash, so it was not run.")
      }
      return candidate(path, "package", found.manifest.version, true)
    }
  }

  // The test seam: a local build from the Aurum lane. It is never a default and is labelled unverified.
  const fromEnv = env.VOICE_AURUM_PATH
  if (fromEnv !== undefined && fromEnv !== "") {
    const path = resolve(fromEnv)
    if (!existsSync(path)) throw new EngineError("ENGINE_MISSING", "VOICE_AURUM_PATH points at a file that does not exist.")
    return candidate(path, "environment", release?.version ?? null, false)
  }

  // The downloaded, pinned engine: `/voice-install` writes it here after verifying its size and SHA-256.
  if (input.cacheRoot !== undefined && release !== undefined && key !== undefined) {
    const asset = release.assets[key]
    const path = engineBinaryPath(input.cacheRoot)
    if (asset !== undefined && existsSync(path)) {
      if (!(awaitDigestSync(path, asset.sha256))) {
        throw new EngineError("ENGINE_UNVERIFIED", "The downloaded speech engine does not match its pinned SHA-256 hash, so it was not run.")
      }
      return candidate(path, "download", release.version, true)
    }
  }

  throw new EngineError(
    key === undefined ? "UNSUPPORTED_PLATFORM" : "ENGINE_MISSING",
    key === undefined
      ? `There is no speech engine for ${platformLabel(platform, arch)}.`
      : "The pinned speech engine is not installed.",
  )
}

export interface EngineProbe {
  readonly version: string | null
  readonly compatible: boolean
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
    const timer = setTimeout(() => {
      child.kill("SIGTERM")
      setTimeout(() => {
        if (child.exitCode === null) child.kill("SIGKILL")
      }, 1_000).unref?.()
      resolveProbe({ version: null, compatible: false })
    }, PROBE_TIMEOUT)
    child.stdout?.on("data", (chunk: Buffer) => (output += chunk.toString("utf8")))
    child.on("error", () => {
      clearTimeout(timer)
      resolveProbe({ version: null, compatible: false })
    })
    child.on("exit", () => {
      clearTimeout(timer)
      const version = parseEngineVersion(output)
      resolveProbe({ version: version ?? null, compatible: isCompatibleEngine(version) })
    })
  })
}
