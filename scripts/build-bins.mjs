// Builds the platform packages that carry the pinned Aurum speech engine, from manifest/aurum.json.
//   node scripts/build-bins.mjs                  download each pinned asset into .cache/bin, verify it, write dist-packages/
//   node scripts/build-bins.mjs --current        the same, for this computer's platform only
//   node scripts/build-bins.mjs --local <dir>    take the binaries from <dir>, under the manifest's asset names
// Each package ships bin/aurum (mode 755), manifest/aurum.json (the binary's version, SHA-256 and size), LICENSE.aurum
// and NOTICE. Every binary is checked against its pinned size and SHA-256 before it is copied, so a wrong file never
// reaches a package. The plugin resolves the engine from these packages (src/engine/binary.ts).
import { createHash } from "node:crypto"
import { createWriteStream, copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync, chmodSync } from "node:fs"
import { join } from "node:path"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const OUT = join(root, "dist-packages")
const CACHE = join(root, ".cache", "bin")
const release = JSON.parse(readFileSync(join(root, "manifest", "aurum.json"), "utf8"))
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))

/** The npm fields for each platform key the manifest pins. Linux packages name their glibc floor. */
export const PLATFORMS = {
  "darwin-arm64": { os: ["darwin"], cpu: ["arm64"] },
  "linux-x64-gnu": { os: ["linux"], cpu: ["x64"], libc: ["glibc"] },
  "linux-arm64-gnu": { os: ["linux"], cpu: ["arm64"], libc: ["glibc"] },
}

export const packageName = (platform) => `@joe-broadhead/opencode-voice-bin-${platform}`

/** The platform key of this computer, or undefined when Voice pins no engine for it. */
export function currentPlatform(platform = process.platform, arch = process.arch) {
  const key = platform === "darwin" ? `darwin-${arch}` : platform === "linux" ? `linux-${arch}-gnu` : undefined
  return key !== undefined && key in PLATFORMS ? key : undefined
}

const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex")

/** True when the file has the pinned size and SHA-256. A missing file is not verified. */
export function verified(path, asset) {
  try {
    return statSync(path).size === asset.bytes && sha256(path) === asset.sha256
  } catch {
    return false
  }
}

function assertManifest() {
  const keys = Object.keys(release.assets).sort()
  const known = Object.keys(PLATFORMS).sort()
  if (JSON.stringify(keys) !== JSON.stringify(known)) {
    throw new Error(`manifest/aurum.json pins ${keys.join(", ")}, but build-bins knows ${known.join(", ")}. Update PLATFORMS.`)
  }
}

/** Downloads one pinned asset into the cache, or keeps the cached copy when it verifies. */
async function fetchAsset(asset, dest) {
  if (verified(dest, asset)) return
  const response = await fetch(asset.url, { redirect: "follow", signal: AbortSignal.timeout(15 * 60_000) })
  if (!response.ok || response.body === null) throw new Error(`downloading ${asset.name} failed with HTTP ${response.status}`)
  const temp = `${dest}.${process.pid}.tmp`
  await pipeline(Readable.fromWeb(response.body), createWriteStream(temp, { mode: 0o600 }))
  if (!verified(temp, asset)) {
    rmSync(temp, { force: true })
    throw new Error(`${asset.name} does not match its pinned size and SHA-256, so it was discarded`)
  }
  renameSync(temp, dest)
}

function build(platform, fields, binary) {
  const asset = release.assets[platform]
  const dir = join(OUT, `opencode-voice-bin-${platform}`)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(join(dir, "bin"), { recursive: true })
  mkdirSync(join(dir, "manifest"), { recursive: true })
  copyFileSync(binary, join(dir, "bin", "aurum"))
  chmodSync(join(dir, "bin", "aurum"), 0o755)
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify(
      {
        name: packageName(platform),
        version,
        description: `The pinned Aurum ${release.version} speech engine for ${platform}, for @joe-broadhead/opencode-voice`,
        license: "MIT",
        repository: { type: "git", url: "git+https://github.com/joe-broadhead/opencode-voice.git" },
        os: fields.os,
        cpu: fields.cpu,
        ...(fields.libc ? { libc: fields.libc } : {}),
        files: ["bin", "manifest", "LICENSE.aurum", "NOTICE"],
      },
      null,
      2,
    )}\n`,
  )
  writeFileSync(
    join(dir, "manifest", "aurum.json"),
    `${JSON.stringify(
      {
        version: release.version,
        asset: asset.name,
        sha256: asset.sha256,
        bytes: asset.bytes,
        source: release.source,
        licence: release.licence,
      },
      null,
      2,
    )}\n`,
  )
  copyFileSync(join(root, "vendor", "LICENSE.aurum"), join(dir, "LICENSE.aurum"))
  copyFileSync(join(root, "NOTICE"), join(dir, "NOTICE"))
  return dir
}

async function main() {
  assertManifest()
  const args = process.argv.slice(2)
  const localIndex = args.indexOf("--local")
  const localDir = localIndex === -1 ? undefined : args[localIndex + 1]
  if (localIndex !== -1 && (localDir === undefined || localDir.startsWith("--"))) throw new Error("--local takes a directory")
  const only = args.includes("--current") ? currentPlatform() : undefined
  if (args.includes("--current") && only === undefined) {
    console.log(`build-bins: no Aurum ${release.version} engine is pinned for ${process.platform}-${process.arch}; nothing built.`)
    return
  }
  const platforms = Object.keys(PLATFORMS).filter((key) => only === undefined || key === only)

  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })
  mkdirSync(CACHE, { recursive: true })
  for (const platform of platforms) {
    const asset = release.assets[platform]
    const binary = join(CACHE, platform, asset.name)
    mkdirSync(join(CACHE, platform), { recursive: true })
    if (localDir !== undefined) {
      const source = join(localDir, asset.name)
      if (!verified(source, asset)) throw new Error(`${source} does not match the pinned ${asset.name} (size and SHA-256)`)
      copyFileSync(source, binary)
    } else {
      await fetchAsset(asset, binary)
    }
    const dir = build(platform, PLATFORMS[platform], binary)
    console.log(`built ${packageName(platform)}@${version} in ${dir.slice(root.length)}`)
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`build-bins: ${error.message}`)
    process.exit(1)
  })
}
