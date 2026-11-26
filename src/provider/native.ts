// The raw-binary installer for the pinned Aurum engine. It imports only Node built-ins. The plugin passes in its cache
// root and its install command; the policy (who may download, and when) is enforced at the call site.
//
// `manifest/aurum.json` pins the upstream release and, for each platform, the asset's upstream URL, size and sha256. The
// binary is downloaded from that address and kept only when both match; nothing runs before the check passes.
import { createHash, randomUUID } from "node:crypto"
import { constants, createReadStream } from "node:fs"
import { chmod, mkdir, open, readFile, rename, rm, stat } from "node:fs/promises"
import { dirname, join } from "node:path"
import { BINARY_NAME, MODULE } from "./platform.js"

export type NativeCode =
  | "NATIVE_MANIFEST_MISSING"
  | "NATIVE_MANIFEST_INVALID"
  | "NATIVE_UNSUPPORTED_PLATFORM"
  | "NATIVE_NOT_INSTALLED"
  | "NATIVE_NETWORK"
  | "NATIVE_NOT_FOUND"
  | "NATIVE_HASH_MISMATCH"
  | "NATIVE_SIZE_MISMATCH"
  | "NATIVE_STALLED"
  | "NATIVE_CANCELLED"
  | "NATIVE_WRITE_FAILED"

/** A refusal with a code, what happened, and the next step. The plugin wraps it in its own error shape. */
export class NativeError extends Error {
  readonly code: NativeCode
  readonly next: string
  constructor(code: NativeCode, what: string, next: string) {
    super(`${code}: ${what}`)
    this.name = "NativeError"
    this.code = code
    this.next = next
  }
}

export interface NativeAsset {
  readonly name: string
  readonly url: string
  readonly bytes: number
  readonly sha256: string
}

export interface NativeManifest {
  readonly version: string
  readonly tag: string
  readonly commit: string
  readonly source: string
  readonly licence: string
  readonly assets: Readonly<Record<string, NativeAsset>>
}

export interface NativeOptions {
  readonly manifest: NativeManifest
  /** The platform key in the manifest, for example `darwin-arm64` or `linux-x64-gnu`. */
  readonly key: string
  /** The plugin's cache folder. The executable goes in `<cacheRoot>/native/<tag>/aurum/<key>/`. */
  readonly cacheRoot: string
  /** The command a person runs to download it, named in the next step, for example `/voice-install`. */
  readonly installCommand: string
  readonly signal?: AbortSignal
  /** The network seam. Tests pass a fake; the default is the global fetch. */
  readonly fetchImpl?: typeof fetch
  /** Longest silence, in milliseconds, before a download is abandoned. */
  readonly stallMs?: number
  readonly log?: (message: string) => void
}

const HEX64 = /^[a-f0-9]{64}$/
const HEX40 = /^[a-f0-9]{40}$/
const PLATFORM_KEY = /^[a-z0-9-]+$/
const DEFAULT_STALL_MS = 120_000

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const invalid = (what: string): never => {
  throw new NativeError("NATIVE_MANIFEST_INVALID", `the engine pin ${what}`, "Reinstall the plugin from a copy whose manifest/aurum.json is valid.")
}

const text = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value === "") invalid(`has a bad ${field}`)
  return value as string
}

const plain = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value === "" || value.includes("/") || value.includes("\\") || value === "." || value === "..") invalid(`has a bad file name in ${field}`)
  return value as string
}

const positive = (value: unknown, field: string): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) invalid(`has a bad size in ${field}`)
  return value as number
}

const digest = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !HEX64.test(value)) invalid(`has a bad sha256 in ${field}`)
  return value as string
}

const webUrl = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value === "") invalid(`has a bad URL in ${field}`)
  const parsed = (() => {
    try {
      return new URL(value as string)
    } catch {
      return invalid(`has a bad URL in ${field}`)
    }
  })()
  if (parsed.protocol !== "https:") invalid(`has a non-HTTPS URL in ${field}`)
  return value as string
}

/** Validates a parsed `manifest/aurum.json`: the upstream pin, with one HTTPS asset URL per platform. */
export function parseNativeManifest(raw: unknown): NativeManifest {
  if (!isRecord(raw)) return invalid("is not an object")
  const version = text(raw.version, "version")
  const tag = text(raw.tag, "tag")
  const commit = text(raw.commit, "commit")
  if (!HEX40.test(commit)) invalid("has a bad commit")
  const source = webUrl(raw.source, "source")
  const licence = text(raw.licence, "licence")
  if (!isRecord(raw.assets)) invalid("has no assets")
  const assets: Record<string, NativeAsset> = {}
  for (const [key, value] of Object.entries(raw.assets as Record<string, unknown>)) {
    if (!PLATFORM_KEY.test(key) || !isRecord(value)) return invalid(`has a bad entry for ${key}`)
    const name = plain(value.name, key)
    const url = webUrl(value.url, key)
    if (!url.endsWith(`/${name}`)) invalid(`names a URL that is not the ${key} asset`)
    assets[key] = { name, url, bytes: positive(value.bytes, key), sha256: digest(value.sha256, key) }
  }
  return { version, tag, commit, source, licence, assets }
}

/** The package's engine pin, or undefined when this copy has none (a development checkout). */
export async function readNativeManifest(packageRoot: string): Promise<NativeManifest | undefined> {
  let text: string
  try {
    text = await readFile(join(packageRoot, "manifest", "aurum.json"), "utf8")
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined
    throw error
  }
  try {
    return parseNativeManifest(JSON.parse(text))
  } catch (error) {
    if (error instanceof NativeError) throw error
    return invalid("is not JSON")
  }
}

/** The manifest entry for this platform key. */
export function entryFor(options: Pick<NativeOptions, "manifest" | "key">): NativeAsset {
  const entry = options.manifest.assets[options.key]
  if (entry === undefined) {
    throw new NativeError(
      "NATIVE_UNSUPPORTED_PLATFORM",
      `the pin has no ${options.key} engine`,
      "Set the plugin's binary path option to an executable of the pinned version, or use a supported platform.",
    )
  }
  return entry
}

/** Where the verified executable lives. */
export function cachePath(options: NativeOptions): string {
  return join(options.cacheRoot, "native", options.manifest.tag, MODULE, options.key, BINARY_NAME)
}

async function sha256File(path: string): Promise<{ bytes: number; sha256: string }> {
  const hash = createHash("sha256")
  let bytes = 0
  for await (const chunk of createReadStream(path)) {
    bytes += (chunk as Buffer).byteLength
    hash.update(chunk as Buffer)
  }
  return { bytes, sha256: hash.digest("hex") }
}

/** True when the file is the pinned size and sha256. A missing or unreadable file is not verified. */
export async function verifiedFile(path: string, expected: { bytes: number; sha256: string }): Promise<boolean> {
  try {
    const info = await stat(path)
    if (!info.isFile() || info.size !== expected.bytes) return false
    return (await sha256File(path)).sha256 === expected.sha256
  } catch {
    return false
  }
}

/** The cached, verified executable's path, or undefined when it must be downloaded. Downloads nothing. */
export async function cachedNative(options: NativeOptions): Promise<string | undefined> {
  const entry = entryFor(options)
  const path = cachePath(options)
  return (await verifiedFile(path, { bytes: entry.bytes, sha256: entry.sha256 })) ? path : undefined
}

function fail(code: NativeCode, what: string, options: NativeOptions): never {
  const next: Record<NativeCode, string> = {
    NATIVE_MANIFEST_MISSING: "Set the plugin's binary path option to an executable of the pinned version, or install a release of the plugin.",
    NATIVE_MANIFEST_INVALID: "Reinstall the plugin from a copy whose manifest/aurum.json is valid.",
    NATIVE_UNSUPPORTED_PLATFORM: "Set the plugin's binary path option to an executable of the pinned version, or use a supported platform.",
    NATIVE_NOT_INSTALLED: `Run ${options.installCommand}, which downloads and verifies it.`,
    NATIVE_NETWORK: "Check the network or proxy, then call the tool again.",
    NATIVE_NOT_FOUND: "The pinned upstream release is missing this file. Report it; do not retry.",
    NATIVE_HASH_MISMATCH: "The download was discarded. Call the tool again; if it persists, report that the upstream asset does not match its pin.",
    NATIVE_SIZE_MISMATCH: "Call the tool again; if it persists, report that the upstream asset does not match its pin.",
    NATIVE_STALLED: "Call the tool again.",
    NATIVE_CANCELLED: "Call the tool again if you still need the result.",
    NATIVE_WRITE_FAILED: "Check that the plugin's cache folder is writable, then call the tool again.",
  }
  throw new NativeError(code, what, next[code])
}

/**
 * Makes the executable available: the verified cached copy, or a download from the pinned upstream URL. The download is
 * checked against the asset's size and sha256 as it arrives, and renamed into the cache only after both match.
 */
export async function installNative(options: NativeOptions): Promise<{ path: string; downloaded: boolean }> {
  const entry = entryFor(options)
  const target = cachePath(options)
  if (await verifiedFile(target, { bytes: entry.bytes, sha256: entry.sha256 })) return { path: target, downloaded: false }

  if (options.signal?.aborted) fail("NATIVE_CANCELLED", `the download of ${entry.name} was cancelled before it started`, options)
  const dir = dirname(target)
  try {
    await mkdir(dir, { recursive: true, mode: 0o700 })
  } catch {
    fail("NATIVE_WRITE_FAILED", `the cache folder ${dir} cannot be created`, options)
  }
  const partial = `${target}.${randomUUID()}.part`
  try {
    await download(options, entry, partial)
    await chmod(partial, 0o755)
    await rename(partial, target)
    options.log?.(`installed ${entry.name} (${entry.bytes} bytes) for ${MODULE}`)
    return { path: target, downloaded: true }
  } finally {
    await rm(partial, { force: true })
  }
}

async function download(options: NativeOptions, entry: NativeAsset, path: string): Promise<void> {
  const stall = new AbortController()
  const request = options.signal ? AbortSignal.any([options.signal, stall.signal]) : stall.signal
  const limit = options.stallMs ?? DEFAULT_STALL_MS
  let watchdog = setTimeout(() => stall.abort(), limit)
  const reset = () => {
    clearTimeout(watchdog)
    watchdog = setTimeout(() => stall.abort(), limit)
  }
  const failure = (error: unknown): never => {
    if (error instanceof NativeError) throw error
    if (stall.signal.aborted) fail("NATIVE_STALLED", `the download of ${entry.name} stopped for ${Math.round(limit / 1000)} seconds`, options)
    if (options.signal?.aborted) fail("NATIVE_CANCELLED", `the download of ${entry.name} was cancelled`, options)
    fail("NATIVE_NETWORK", `the download of ${entry.name} failed (${(error as Error).message})`, options)
  }
  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    const response = await (options.fetchImpl ?? fetch)(entry.url, { signal: request, redirect: "follow" }).catch(failure)
    if (response.status === 404) fail("NATIVE_NOT_FOUND", `${entry.name} is not at the pinned upstream address`, options)
    if (!response.ok || response.body === null) fail("NATIVE_NETWORK", `the download of ${entry.name} returned HTTP ${response.status}`, options)
    handle = await open(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
    const hash = createHash("sha256")
    let received = 0
    for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
      reset()
      received += chunk.byteLength
      if (received > entry.bytes) fail("NATIVE_SIZE_MISMATCH", `${entry.name} is larger than its pinned ${entry.bytes} bytes`, options)
      hash.update(chunk)
      await handle.write(chunk)
    }
    if (received !== entry.bytes) fail("NATIVE_SIZE_MISMATCH", `${entry.name} is ${received} bytes, not the pinned ${entry.bytes}`, options)
    if (hash.digest("hex") !== entry.sha256) fail("NATIVE_HASH_MISMATCH", `${entry.name} does not match its pinned sha256, so it was discarded`, options)
    await handle.sync()
  } catch (error) {
    failure(error)
  } finally {
    clearTimeout(watchdog)
    await handle?.close().catch(() => undefined)
  }
}
