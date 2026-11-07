import { createHash, randomUUID } from "node:crypto"
import { constants } from "node:fs"
import { open, mkdir, rename, rm, stat } from "node:fs/promises"
import { dirname, join } from "node:path"
import { EngineError } from "./errors.js"

export type AssetRole = "stt" | "tts-model" | "tts-voices" | "tts-config"

export interface ModelAsset {
  readonly role: AssetRole
  readonly name: string
  readonly file: string
  readonly url: string
  readonly sha256: string
  readonly bytes: number
  readonly licence: string
  readonly revision: string
}

export interface ModelManifest {
  readonly version: string
  readonly models: readonly ModelAsset[]
}

export type AssetState = "cached" | "pre-seeded" | "missing"

export interface InspectedAsset extends ModelAsset {
  readonly path: string
  readonly state: AssetState
}

const ROLES: readonly AssetRole[] = ["stt", "tts-model", "tts-voices", "tts-config"]
const HASH = /^[a-f0-9]{64}$/
const STALL_MS = 60_000

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/** Reads and validates the manifest the build writes. A malformed manifest is a build bug, so it fails closed. */
export function parseManifest(raw: unknown): ModelManifest {
  if (!isRecord(raw) || typeof raw.version !== "string" || !Array.isArray(raw.models)) {
    throw new EngineError("MODEL_MISSING", "The model manifest is malformed.")
  }
  const models = raw.models.map((entry: unknown): ModelAsset => {
    if (!isRecord(entry)) throw new EngineError("MODEL_MISSING", "The model manifest is malformed.")
    const { role, name, file, url, sha256, bytes, licence, revision } = entry
    if (
      typeof role !== "string" ||
      !ROLES.includes(role as AssetRole) ||
      typeof name !== "string" ||
      typeof file !== "string" ||
      typeof url !== "string" ||
      !url.startsWith("https://") ||
      typeof sha256 !== "string" ||
      !HASH.test(sha256) ||
      typeof bytes !== "number" ||
      !Number.isInteger(bytes) ||
      bytes <= 0 ||
      typeof licence !== "string" ||
      typeof revision !== "string"
    ) {
      throw new EngineError("MODEL_MISSING", "The model manifest has an entry the plugin cannot use.")
    }
    return { role: role as AssetRole, name, file, url, sha256, bytes, licence, revision }
  })
  if (new Set(models.map((model) => model.role)).size !== models.length) {
    throw new EngineError("MODEL_MISSING", "The model manifest names a role twice.")
  }
  return { version: raw.version, models }
}

export interface ModelStoreInput {
  readonly cacheRoot: string
  readonly manifestPath: string
  readonly assetsDir?: string
  /** Injected by tests: the only seam that can reach the network. Never called by status or transcription. */
  readonly fetchImpl?: typeof fetch
}

export function sha256File(path: string): Promise<string> {
  return stat(path).then(async (info) => {
    if (!info.isFile()) throw new EngineError("MODEL_MISSING", "A speech model is not a regular file.")
    const { readFile } = await import("node:fs/promises")
    return createHash("sha256").update(await readFile(path)).digest("hex")
  })
}

/** The pinned models, their cache and their one explicit download path. */
export class ModelStore {
  private cached: ModelManifest | undefined

  private readonly input: ModelStoreInput

  constructor(input: ModelStoreInput) {
    this.input = input
  }

  get cacheRoot() {
    return this.input.cacheRoot
  }

  async manifest(): Promise<ModelManifest> {
    if (this.cached !== undefined) return this.cached
    const { readFile } = await import("node:fs/promises")
    let raw: unknown
    try {
      raw = JSON.parse(await readFile(this.input.manifestPath, "utf8"))
    } catch {
      throw new EngineError("MODEL_MISSING", "The model manifest is missing from the package.")
    }
    this.cached = parseManifest(raw)
    return this.cached
  }

  /** Where the pinned copy of an asset lives: the pre-seeded folder when configured, else the content-addressed cache. */
  pathOf(asset: ModelAsset): string {
    if (this.input.assetsDir !== undefined) return join(this.input.assetsDir, asset.file)
    return join(this.input.cacheRoot, asset.sha256, asset.file)
  }

  /** Each asset, its path and whether a file of the pinned size is there. Status never hashes a model. */
  async inspect(): Promise<readonly InspectedAsset[]> {
    const manifest = await this.manifest()
    return Promise.all(
      manifest.models.map(async (asset): Promise<InspectedAsset> => {
        const path = this.pathOf(asset)
        const state: AssetState = await stat(path)
          .then((info) => (info.isFile() && info.size === asset.bytes ? (this.input.assetsDir !== undefined ? "pre-seeded" : "cached") : "missing"))
          .catch(() => "missing")
        return { ...asset, path, state }
      }),
    )
  }

  /** The missing assets, by role, for the install action. */
  async missing(): Promise<readonly InspectedAsset[]> {
    return (await this.inspect()).filter((asset) => asset.state === "missing")
  }

  /** True when the model's role is present at the pinned size. */
  async ready(role: AssetRole): Promise<boolean> {
    const found = (await this.inspect()).find((asset) => asset.role === role)
    return found !== undefined && found.state !== "missing"
  }

  /**
   * Downloads one missing asset: bytes to a private temporary file in the same directory, never above the pinned size,
   * a SHA-256 check, then a rename. A pre-seeded install never downloads.
   */
  async download(asset: ModelAsset, signal: AbortSignal): Promise<InspectedAsset> {
    if (this.input.assetsDir !== undefined) {
      throw new EngineError(
        "MODEL_MISSING",
        `The model ${asset.file} is missing from assetsDir, or does not match its pinned size.`,
      )
    }
    const target = this.pathOf(asset)
    await mkdir(dirname(target), { recursive: true, mode: 0o700 })
    const temp = join(dirname(target), `.download-${randomUUID()}`)
    const stall = new AbortController()
    const request = AbortSignal.any([signal, stall.signal])
    let watchdog = setTimeout(() => stall.abort(), STALL_MS)
    const handle = await open(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
    let renamed = false
    try {
      const response = await (this.input.fetchImpl ?? fetch)(asset.url, { signal: request, redirect: "follow" })
      if (!response.ok || response.body === null) {
        throw new EngineError("MODEL_DOWNLOAD_FAILED", `Downloading ${asset.file} failed with HTTP status ${response.status}.`)
      }
      const hash = createHash("sha256")
      let received = 0
      for await (const chunk of response.body as AsyncIterable<Uint8Array>) {
        clearTimeout(watchdog)
        watchdog = setTimeout(() => stall.abort(), STALL_MS)
        received += chunk.byteLength
        if (received > asset.bytes) throw new EngineError("MODEL_DOWNLOAD_FAILED", `The download of ${asset.file} is larger than its pinned size.`)
        hash.update(chunk)
        await handle.write(chunk)
      }
      if (received !== asset.bytes) throw new EngineError("MODEL_DOWNLOAD_FAILED", `The download of ${asset.file} has the wrong size.`)
      if (hash.digest("hex") !== asset.sha256) {
        throw new EngineError("INTEGRITY_MISMATCH", `The downloaded ${asset.file} does not match its pinned SHA-256 hash, so it was discarded.`)
      }
      await handle.sync()
      await handle.close()
      if (signal.aborted) throw new EngineError("CANCELLED", "The download was cancelled.")
      await rename(temp, target)
      renamed = true
      return { ...asset, path: target, state: "cached" }
    } catch (error) {
      if (error instanceof EngineError) throw error
      if (signal.aborted) throw new EngineError("CANCELLED", "The download was cancelled.")
      throw new EngineError("MODEL_DOWNLOAD_FAILED", stall.signal.aborted ? `Downloading ${asset.file} stalled.` : `Downloading ${asset.file} was interrupted.`)
    } finally {
      clearTimeout(watchdog)
      await handle.close().catch(() => undefined)
      if (!renamed) await rm(temp, { force: true })
    }
  }

  /** Fully verifies a model before the engine reads it; used after a download and by the doctor. */
  async verify(asset: ModelAsset): Promise<boolean> {
    const path = this.pathOf(asset)
    const info = await stat(path).catch(() => undefined)
    if (info === undefined || !info.isFile() || info.size !== asset.bytes) return false
    return (await sha256File(path)) === asset.sha256
  }
}

/** The cache directory for a user: the platform's cache root, then the plugin's folder. */
export function defaultCacheRoot(home: string, platform: string = process.platform, env: Readonly<Record<string, string | undefined>> = process.env): string {
  if (platform === "darwin") return join(home, "Library", "Caches", "opencode-voice")
  return join(env.XDG_CACHE_HOME ?? join(home, ".cache"), "opencode-voice")
}
