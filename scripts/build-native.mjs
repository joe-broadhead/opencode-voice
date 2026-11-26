// Verifies this computer's pinned Aurum engine from manifest/aurum.json. It downloads the upstream asset into .cache/bin
// and keeps it only when its size and SHA-256 match the pin. It never builds, gzips or mirrors release assets:
// /voice-install reads the same pin and downloads from the same upstream address.
//   node scripts/build-native.mjs --ensure
import { createHash } from "node:crypto"
import { chmodSync, createWriteStream, mkdirSync, readFileSync, renameSync, rmSync, statSync } from "node:fs"
import { join } from "node:path"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const CACHE = join(root, ".cache", "bin")
const pin = JSON.parse(readFileSync(join(root, "manifest", "aurum.json"), "utf8"))

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex")

/** True when the file has the expected size and SHA-256. A missing file is not verified. */
export function verified(path, expected) {
  try {
    return statSync(path).size === expected.bytes && sha256(readFileSync(path)) === expected.sha256
  } catch {
    return false
  }
}

/**
 * Statuses that are worth another attempt. The release service has answered 416 (range not satisfiable) to a plain GET
 * from a CI runner, once, for one file that a second request served; a retry is the honest answer to that.
 */
const RETRY_STATUS = new Set([408, 416, 425, 429, 500, 502, 503, 504])

/** Downloads one URL to `dest` and keeps it only when it has the expected size and SHA-256. Transient failures retry. */
export async function download(url, dest, expected, { attempts = 3, retryDelayMs = 2000 } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    const failure = await attemptDownload(url, dest, expected)
    if (failure === undefined) return
    if (!failure.retry || attempt >= attempts) throw new Error(`${failure.message} (after ${attempt} attempt${attempt === 1 ? "" : "s"})`)
    await new Promise((resolveDelay) => setTimeout(resolveDelay, retryDelayMs * attempt))
  }
}

async function attemptDownload(url, dest, expected) {
  let response
  try {
    response = await fetch(url, { redirect: "follow", headers: { "user-agent": "voice-plugin/0.0.0" }, signal: AbortSignal.timeout(15 * 60_000) })
  } catch (error) {
    return { retry: true, message: `downloading ${url} failed: ${error instanceof Error ? error.message : String(error)}` }
  }
  if (!response.ok || response.body === null) {
    await response.body?.cancel().catch(() => undefined)
    const served = ["server", "x-cache", "content-range"].map((name) => (response.headers.get(name) ? `${name} ${response.headers.get(name)}` : "")).filter(Boolean)
    return { retry: RETRY_STATUS.has(response.status), message: `downloading ${url} failed with HTTP ${response.status}${served.length ? ` (${served.join(", ")})` : ""}` }
  }
  const temp = `${dest}.${process.pid}.tmp`
  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(temp, { mode: 0o600 }))
  } catch (error) {
    rmSync(temp, { force: true })
    return { retry: true, message: `downloading ${url} was interrupted: ${error instanceof Error ? error.message : String(error)}` }
  }
  if (!verified(temp, expected)) {
    rmSync(temp, { force: true })
    return { retry: true, message: `${url} does not match the pinned size and SHA-256, so it was discarded` }
  }
  renameSync(temp, dest)
  return undefined
}

/** The pinned engine for one platform, in the cache: kept when it verifies, otherwise downloaded and verified. */
export async function ensureBinary(platform) {
  const asset = pin.assets[platform]
  if (asset === undefined) throw new Error(`manifest/aurum.json has no ${platform}`)
  const dir = join(CACHE, platform)
  const binary = join(dir, "aurum")
  if (verified(binary, asset)) return binary
  mkdirSync(dir, { recursive: true })
  await download(asset.url, binary, { bytes: asset.bytes, sha256: asset.sha256 })
  chmodSync(binary, 0o755)
  return binary
}

/** The platform key of this computer, or undefined when the pin names no Aurum build for it. */
export function currentPlatform(platform = process.platform, arch = process.arch) {
  const key = platform === "darwin" ? `darwin-${arch}` : platform === "linux" ? `linux-${arch}-gnu` : undefined
  return key !== undefined && key in pin.assets ? key : undefined
}

async function main() {
  if (process.argv.length !== 3 || process.argv[2] !== "--ensure") throw new Error("usage: node scripts/build-native.mjs --ensure")
  const key = currentPlatform()
  if (key === undefined) throw new Error(`no pinned Aurum build for ${process.platform}-${process.arch}`)
  console.log(`ensured ${await ensureBinary(key)}`)
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`build-native: ${error.message}`)
    process.exit(1)
  })
}
