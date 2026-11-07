import { createHash, randomUUID } from "node:crypto"
import { constants } from "node:fs"
import { chmod, mkdir, open, readFile, rename, rm, stat } from "node:fs/promises"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { EngineError } from "./errors.js"
import { BINARY_NAME, platformKey, platformLabel, type PlatformKey } from "./platform.js"

/** One platform asset from the pinned Aurum release. */
export interface ReleaseAsset {
  readonly name: string
  readonly url: string
  readonly sha256: string
  readonly bytes: number
}

export interface ReleaseManifest {
  readonly version: string
  readonly tag: string
  readonly commit: string
  readonly source: string
  readonly licence: string
  readonly assets: Readonly<Partial<Record<PlatformKey, ReleaseAsset>>>
}

const HASH = /^[a-f0-9]{64}$/
const STALL_MS = 120_000

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

export function parseRelease(raw: unknown): ReleaseManifest {
  if (!isRecord(raw) || typeof raw.version !== "string" || typeof raw.tag !== "string" || typeof raw.commit !== "string" || !isRecord(raw.assets)) {
    throw new EngineError("ENGINE_MISSING", "The Aurum release manifest is malformed.")
  }
  const assets: Partial<Record<PlatformKey, ReleaseAsset>> = {}
  for (const [key, value] of Object.entries(raw.assets)) {
    if (!isRecord(value)) throw new EngineError("ENGINE_MISSING", "The Aurum release manifest is malformed.")
    const { name, url, sha256, bytes } = value
    if (
      typeof name !== "string" ||
      typeof url !== "string" ||
      !url.startsWith("https://") ||
      typeof sha256 !== "string" ||
      !HASH.test(sha256) ||
      typeof bytes !== "number" ||
      !Number.isInteger(bytes) ||
      bytes <= 0
    ) {
      throw new EngineError("ENGINE_MISSING", "The Aurum release manifest has an entry the plugin cannot use.")
    }
    assets[key as PlatformKey] = { name, url, sha256, bytes }
  }
  return {
    version: raw.version,
    tag: raw.tag,
    commit: raw.commit,
    source: typeof raw.source === "string" ? raw.source : "",
    licence: typeof raw.licence === "string" ? raw.licence : "MIT",
    assets,
  }
}

/** Reads the pinned release the build writes beside the bundles. */
export function readRelease(packageRoot: string): ReleaseManifest | undefined {
  try {
    return parseRelease(JSON.parse(readFileSync(join(packageRoot, "manifest", "aurum.json"), "utf8")))
  } catch {
    return undefined
  }
}

function assetFor(manifest: ReleaseManifest, platform: string, arch: string): { key: PlatformKey; asset: ReleaseAsset } | undefined {
  const key = platformKey(platform, arch)
  if (key === undefined) return undefined
  const asset = manifest.assets[key]
  return asset === undefined ? undefined : { key, asset }
}

/** The downloaded engine's path inside the plugin cache. */
export const engineBinaryPath = (cacheRoot: string) => join(cacheRoot, "engine", "bin", BINARY_NAME)

export async function digestOf(path: string): Promise<string | undefined> {
  try {
    return createHash("sha256").update(await readFile(path)).digest("hex")
  } catch {
    return undefined
  }
}

/** True when the file is the pinned size and hash. */
export async function verifyEngineFile(path: string, asset: ReleaseAsset): Promise<boolean> {
  const info = await stat(path).catch(() => undefined)
  if (info === undefined || !info.isFile() || info.size !== asset.bytes) return false
  return (await digestOf(path)) === asset.sha256
}

export interface InstallEngineInput {
  readonly packageRoot: string
  readonly cacheRoot: string
  readonly platform?: string
  readonly arch?: string
  readonly signal: AbortSignal
  /** Injected by tests: the only network seam, and never called by status, dictation or read-aloud. */
  readonly fetchImpl?: typeof fetch
  readonly log?: (message: string) => void
}

export interface InstalledEngine {
  readonly path: string
  readonly asset: ReleaseAsset
  readonly downloaded: boolean
}

/**
 * Downloads the pinned Aurum binary for this platform into `<cache>/engine/bin`, verifies its exact size and SHA-256,
 * and renames it into place. An already-pinned file is kept. A wrong body never becomes the final path.
 */
export async function installEngine(input: InstallEngineInput): Promise<InstalledEngine> {
  const manifest = readRelease(input.packageRoot)
  if (manifest === undefined) throw new EngineError("ENGINE_MISSING", "The Aurum release manifest is missing from the package.")
  const found = assetFor(manifest, input.platform ?? process.platform, input.arch ?? process.arch)
  if (found === undefined) throw new EngineError("UNSUPPORTED_PLATFORM", `There is no Aurum 0.0.24 binary for ${platformLabel(input.platform ?? process.platform, input.arch ?? process.arch)}.`)
  const target = engineBinaryPath(input.cacheRoot)
  if (await verifyEngineFile(target, found.asset)) return { path: target, asset: found.asset, downloaded: false }

  await mkdir(join(input.cacheRoot, "engine", "bin"), { recursive: true, mode: 0o700 })
  const temp = `${target}.${randomUUID()}.tmp`
  const stall = new AbortController()
  const request = AbortSignal.any([input.signal, stall.signal])
  let watchdog = setTimeout(() => stall.abort(), STALL_MS)
  const handle = await open(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
  let renamed = false
  try {
    const response = await (input.fetchImpl ?? fetch)(found.asset.url, { signal: request, redirect: "follow" })
    if (!response.ok || response.body === null) {
      throw new EngineError("MODEL_DOWNLOAD_FAILED", `Downloading Aurum failed with HTTP status ${response.status}.`)
    }
    const hash = createHash("sha256")
    let received = 0
    for await (const chunk of response.body as AsyncIterable<Uint8Array>) {
      clearTimeout(watchdog)
      watchdog = setTimeout(() => stall.abort(), STALL_MS)
      received += chunk.byteLength
      if (received > found.asset.bytes) throw new EngineError("MODEL_DOWNLOAD_FAILED", "The Aurum download is larger than its pinned size.")
      hash.update(chunk)
      await handle.write(chunk)
    }
    if (received !== found.asset.bytes) throw new EngineError("MODEL_DOWNLOAD_FAILED", "The Aurum download has the wrong size.")
    if (hash.digest("hex") !== found.asset.sha256) {
      throw new EngineError("INTEGRITY_MISMATCH", "The downloaded Aurum binary does not match its pinned SHA-256 hash, so it was discarded.")
    }
    await handle.sync()
    await handle.close()
    if (input.signal.aborted) throw new EngineError("CANCELLED", "The download was cancelled.")
    await chmod(temp, 0o755)
    await rename(temp, target)
    renamed = true
    input.log?.(`downloaded ${found.asset.name} (${found.asset.bytes} bytes)`)
    return { path: target, asset: found.asset, downloaded: true }
  } catch (error) {
    if (error instanceof EngineError) throw error
    if (input.signal.aborted) throw new EngineError("CANCELLED", "The download was cancelled.")
    throw new EngineError("MODEL_DOWNLOAD_FAILED", stall.signal.aborted ? "Downloading Aurum stalled." : "Downloading Aurum was interrupted.")
  } finally {
    clearTimeout(watchdog)
    await handle.close().catch(() => undefined)
    if (!renamed) await rm(temp, { force: true })
  }
}
