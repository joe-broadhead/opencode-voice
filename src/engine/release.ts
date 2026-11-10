import { createHash } from "node:crypto"
import { existsSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import {
  cachePath,
  installNative,
  NativeError,
  parseNativeManifest,
  type NativeAsset,
  type NativeCode,
  type NativeManifest,
  type NativeOptions,
} from "../native/install.js"
import { EngineError, type EngineCode } from "./errors.js"
import { MINIMUM_ENGINE, MODULE, platformKey, platformLabel, type PlatformKey } from "./platform.js"

/** The command that downloads the pinned engine, named in each next step that needs it. */
export const INSTALL_COMMAND = "/voice-install"

/** The shared installer's codes, as this plugin's codes. Each refusal keeps the installer's next step. */
const CODE_FOR: Partial<Record<NativeCode, EngineCode>> = {
  NATIVE_MANIFEST_MISSING: "ENGINE_MISSING",
  NATIVE_MANIFEST_INVALID: "ENGINE_MISSING",
  NATIVE_UNSUPPORTED_PLATFORM: "UNSUPPORTED_PLATFORM",
  NATIVE_NOT_INSTALLED: "ENGINE_MISSING",
  NATIVE_NETWORK: "MODEL_DOWNLOAD_FAILED",
  NATIVE_NOT_FOUND: "MODEL_DOWNLOAD_FAILED",
  NATIVE_STALLED: "MODEL_DOWNLOAD_FAILED",
  NATIVE_WRITE_FAILED: "MODEL_DOWNLOAD_FAILED",
  NATIVE_HASH_MISMATCH: "INTEGRITY_MISMATCH",
  NATIVE_SIZE_MISMATCH: "INTEGRITY_MISMATCH",
  NATIVE_CANCELLED: "CANCELLED",
}

/** A shared-installer refusal, as this plugin's error. Any other error passes through unchanged. */
export function toEngineError(error: unknown): unknown {
  if (!(error instanceof NativeError)) return error
  return new EngineError(CODE_FOR[error.code] ?? "MODEL_DOWNLOAD_FAILED", error.message.replace(/^NATIVE_[A-Z_]+: /, ""), error.next)
}

/** True when the file is the pinned SHA-256. A missing or unreadable file is not verified. */
export function digestMatches(path: string, expected: string): boolean {
  try {
    return createHash("sha256").update(readFileSync(path)).digest("hex") === expected
  } catch {
    return false
  }
}

/**
 * The release manifest the release commit pinned (manifest/native.json), or undefined when this copy has none: a
 * development checkout. A manifest that is present but not valid is refused, never read as missing.
 */
export function readRelease(packageRoot: string): NativeManifest | undefined {
  let text: string
  try {
    text = readFileSync(join(packageRoot, "manifest", "native.json"), "utf8")
  } catch {
    return undefined
  }
  try {
    return parseNativeManifest(JSON.parse(text))
  } catch {
    throw new EngineError("ENGINE_MISSING", "The release manifest in this copy of Voice is invalid.", "Reinstall the plugin from a release whose manifest is valid.")
  }
}

/** The engine version the package pins (manifest/aurum.json), or null when it cannot be read. */
export function pinnedVersion(packageRoot: string): string | null {
  try {
    const version = (JSON.parse(readFileSync(join(packageRoot, "manifest", "aurum.json"), "utf8")) as { version?: unknown }).version
    return typeof version === "string" ? version : null
  } catch {
    return null
  }
}

export interface PinnedEngine {
  readonly manifest: NativeManifest
  readonly key: PlatformKey
  readonly entry: NativeAsset
}

/**
 * The pinned engine for this platform. Two refusals come first, before anything is asked or fetched: a copy with no
 * release manifest has no pinned engine, and a platform with no build has none either.
 */
export function pinnedEngine(packageRoot: string, platform: string = process.platform, arch: string = process.arch): PinnedEngine {
  const manifest = readRelease(packageRoot)
  if (manifest === undefined) {
    throw new EngineError(
      "ENGINE_MISSING",
      "This copy of Voice carries no release manifest, so it has no pinned speech engine.",
      "Set the aurumPath option to an Aurum binary, or install a release of the plugin.",
    )
  }
  const key = platformKey(platform, arch)
  const entry = key === undefined ? undefined : manifest.modules[MODULE]?.[key]
  if (key === undefined || entry === undefined) {
    throw new EngineError("UNSUPPORTED_PLATFORM", `There is no Aurum ${MINIMUM_ENGINE} binary for ${platformLabel(platform, arch)}.`)
  }
  return { manifest, key, entry }
}

/** The installer's options for the engine: its module, this platform's key and the cache folder. */
export function engineOptions(cacheRoot: string, pinned: Pick<PinnedEngine, "manifest" | "key">): NativeOptions {
  return { manifest: pinned.manifest, module: MODULE, key: pinned.key, cacheRoot, installCommand: INSTALL_COMMAND }
}

/**
 * The downloaded engine's path when it is in the cache, or undefined when it is not. A cached copy whose size or
 * SHA-256 does not match is refused with ENGINE_UNVERIFIED before anything runs.
 */
export function cachedEngine(cacheRoot: string, pinned: PinnedEngine): string | undefined {
  const path = cachePath(engineOptions(cacheRoot, pinned))
  if (!existsSync(path)) return undefined
  const current = statSync(path)
  if (!current.isFile() || current.size !== pinned.entry.executable.bytes || !digestMatches(path, pinned.entry.executable.sha256)) {
    throw new EngineError("ENGINE_UNVERIFIED", "The downloaded speech engine does not match its pinned SHA-256 hash, so it was not run.")
  }
  return path
}

export interface InstallEngineInput {
  readonly packageRoot: string
  readonly cacheRoot: string
  readonly platform?: string
  readonly arch?: string
  readonly signal: AbortSignal
  /** The network seam: a test passes a fake, and the default is the global fetch. */
  readonly fetchImpl?: typeof fetch
  readonly log?: (message: string) => void
}

export interface InstalledEngine {
  readonly path: string
  readonly asset: { readonly name: string; readonly bytes: number; readonly sha256: string }
  readonly downloaded: boolean
}

/**
 * Makes the pinned engine available: the verified cached copy, or a download of the pinned release file. The shared
 * installer checks the download's size and SHA-256 as it arrives and the executable's after decompression, and renames
 * it into place only then.
 */
export async function installEngine(input: InstallEngineInput): Promise<InstalledEngine> {
  const pinned = pinnedEngine(input.packageRoot, input.platform, input.arch)
  try {
    const installed = await installNative({
      ...engineOptions(input.cacheRoot, pinned),
      signal: input.signal,
      ...(input.fetchImpl === undefined ? {} : { fetchImpl: input.fetchImpl }),
      ...(input.log === undefined ? {} : { log: input.log }),
    })
    return {
      path: installed.path,
      asset: { name: pinned.entry.name, bytes: pinned.entry.bytes, sha256: pinned.entry.sha256 },
      downloaded: installed.downloaded,
    }
  } catch (error) {
    throw toEngineError(error)
  }
}
