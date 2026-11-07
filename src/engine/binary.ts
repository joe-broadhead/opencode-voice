import { createHash } from "node:crypto"
import { existsSync, readFileSync, statSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join, resolve } from "node:path"
import { EngineError } from "./errors.js"
import { BINARY_NAME, PACKAGE_FOR, platformKey, platformLabel, type PlatformKey } from "./platform.js"

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
  /** The pinned version, when a manifest or the option names it. */
  readonly version: string | null
  /** `package` (a shipped platform package), `option` (the aurumPath option), `environment` (VOICE_AURUM_PATH) or `path`. */
  readonly source: "package" | "option" | "environment" | "path"
  /** True when the file's SHA-256 matched the pinned manifest. Only a package or a matched option is verified. */
  readonly verified: boolean
  readonly platform: string
  /** False when the platform has no engine package at all. */
  readonly supported: boolean
}

export interface ResolveInput {
  readonly packageRoot: string
  readonly optionPath?: string
  readonly env?: Readonly<Record<string, string | undefined>>
  readonly platform?: string
  readonly arch?: string
}

const hex = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex")

/** Reads a platform package's pinned manifest, if it is installed. */
function packageManifest(key: PlatformKey): { dir: string; manifest: EngineManifest } | undefined {
  const require = createRequire(import.meta.url)
  try {
    const entry = require.resolve(`${PACKAGE_FOR[key]}/package.json`)
    const dir = dirname(entry)
    const manifest = JSON.parse(readFileSync(join(dir, "manifest", "aurum.json"), "utf8")) as EngineManifest
    return { dir, manifest }
  } catch {
    return undefined
  }
}

/** Reads the plugin's own pinned manifest, which the build writes beside the bundles. */
export function pinnedManifest(packageRoot: string): EngineManifest | undefined {
  try {
    return JSON.parse(readFileSync(join(packageRoot, "manifest", "aurum.json"), "utf8")) as EngineManifest
  } catch {
    return undefined
  }
}

/** The binary a `which`-style PATH lookup finds, without spawning. */
function pathLookup(name: string, env: Readonly<Record<string, string | undefined>>) {
  const separator = process.platform === "win32" ? ";" : ":"
  for (const dir of (env.PATH ?? "").split(separator)) {
    if (dir === "") continue
    const candidate = join(dir, name)
    if (existsSync(candidate)) return candidate
  }
  return undefined
}

/**
 * Finds the engine binary, in order: the `aurumPath` option, the platform package the build pins, `VOICE_AURUM_PATH`
 * (a test and development seam, never shipped as a default), then PATH. A package or an option whose digest matches the
 * pinned manifest is verified; everything else is labelled unverified in status and still runs.
 */
export function resolveEngine(input: ResolveInput): EngineInfo {
  const platform = input.platform ?? process.platform
  const arch = input.arch ?? process.arch
  const key = platformKey(platform, arch)
  const env = input.env ?? process.env
  const pinned = pinnedManifest(input.packageRoot)

  const candidate = (path: string, source: EngineInfo["source"], version: string | null, expected: string | undefined): EngineInfo => {
    let verified = false
    if (expected !== undefined) {
      try {
        verified = hex(path) === expected
      } catch {
        verified = false
      }
    }
    return { path, version, source, verified, platform: platformLabel(platform, arch), supported: key !== undefined }
  }

  if (input.optionPath !== undefined) {
    const path = resolve(input.optionPath)
    if (!existsSync(path)) throw new EngineError("ENGINE_MISSING", "The aurumPath option points at a file that does not exist.")
    return candidate(path, "option", pinned?.version ?? null, pinned?.sha256)
  }

  if (key !== undefined) {
    const found = packageManifest(key)
    if (found !== undefined) {
      const path = join(found.dir, "bin", BINARY_NAME)
      if (existsSync(path)) return candidate(path, "package", found.manifest.version, found.manifest.sha256)
    }
  }

  const fromEnv = env.VOICE_AURUM_PATH
  if (fromEnv !== undefined && fromEnv !== "") {
    const path = resolve(fromEnv)
    if (!existsSync(path)) throw new EngineError("ENGINE_MISSING", "VOICE_AURUM_PATH points at a file that does not exist.")
    return candidate(path, "environment", pinned?.version ?? null, pinned?.sha256)
  }

  const onPath = pathLookup(BINARY_NAME, env)
  if (onPath !== undefined) return candidate(onPath, "path", null, pinned?.sha256)

  throw new EngineError(
    key === undefined ? "UNSUPPORTED_PLATFORM" : "ENGINE_MISSING",
    key === undefined
      ? `There is no speech engine for ${platformLabel(platform, arch)}.`
      : "The pinned speech engine is not installed.",
  )
}

/** A cheap existence check, for a status read that must not throw. */
export function tryResolveEngine(input: ResolveInput): EngineInfo | undefined {
  try {
    return resolveEngine(input)
  } catch {
    return undefined
  }
}

/** Whether the file is still the size the manifest pins. Used before hashing a large binary. */
export function sizeMatches(path: string, expected: number | undefined): boolean {
  if (expected === undefined) return true
  try {
    return statSync(path).size === expected
  } catch {
    return false
  }
}
