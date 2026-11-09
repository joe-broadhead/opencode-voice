// Install the packed plugin and its platform package into a clean folder, the way a user's `npm install` does, and check
// that the engine the plugin resolves is the pinned Aurum binary. This is the proof that a fresh install is not
// ENGINE_MISSING: without the platform package the install succeeds and status reports the engine missing.
import { afterAll, expect, test } from "bun:test"
import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { currentPlatform, packageName } from "../../scripts/build-bins.mjs"

const root = fileURLToPath(new URL("../..", import.meta.url))
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
const manifest = JSON.parse(readFileSync(join(root, "manifest", "aurum.json"), "utf8"))
const work = realpathSync(mkdtempSync(join(realpathSync("/tmp"), "voice-install-")))
afterAll(() => rmSync(work, { recursive: true, force: true }), { timeout: 120_000 })

const CI = process.env.CI === "true" || process.env.CI === "1"
const sha256 = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex")

function run(command: string, args: string[], cwd: string, env: Record<string, string> = {}): string {
  const result = spawnSync(command, args, { cwd, env: { ...process.env, ...env }, encoding: "utf8" })
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr || result.stdout}`)
  return result.stdout
}

test("a packed install carries the pinned engine in its platform package", () => {
  const key = currentPlatform()
  if (key === undefined) {
    console.log(`[pack] install: skipped, Voice pins no Aurum engine for ${process.platform}-${process.arch}`)
    return
  }
  const platformDir = join(root, "dist-packages", `opencode-voice-bin-${key}`)
  if (!existsSync(platformDir)) {
    const message = `${key}: dist-packages/ has no platform package; run npm run bin:packages first`
    if (CI) throw new Error(message)
    console.log(`[pack] install: skipped, ${message}`)
    return
  }
  const asset = manifest.assets[key]
  const env = { npm_config_cache: join(work, "npm-cache") }

  run("node", [join(root, "scripts", "check.mjs"), "build"], root)
  const plugin = JSON.parse(run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", work], root, env))[0].filename
  const platform = JSON.parse(run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", work], platformDir, env))[0].filename

  const consumer = join(work, "consumer")
  mkdirSync(consumer)
  writeFileSync(join(consumer, "package.json"), JSON.stringify({ name: "voice-consumer", private: true }))
  run("npm", ["install", "--no-audit", "--no-fund", join(work, plugin), join(work, platform)], consumer, env)

  const installed = join(consumer, "node_modules", ...packageName(key).split("/"))
  const bin = join(installed, "bin", "aurum")
  expect(existsSync(join(consumer, "node_modules", pkg.name, "dist", "index.js"))).toBe(true)
  expect(existsSync(bin)).toBe(true)
  expect(statSync(bin).mode & 0o111).not.toBe(0)
  expect(statSync(bin).size).toBe(asset.bytes)
  expect(sha256(bin)).toBe(asset.sha256)

  const pinned = JSON.parse(readFileSync(join(installed, "manifest", "aurum.json"), "utf8"))
  expect(pinned).toMatchObject({ version: manifest.version, sha256: asset.sha256, bytes: asset.bytes })
  expect(execFileSync(bin, ["--version"], { encoding: "utf8", timeout: 10_000 })).toContain(manifest.version)

  // The plugin's bundle finds the platform package by walking up from its own file, so resolve it from there too.
  const resolver = `console.log(createRequire(${JSON.stringify(join(consumer, "node_modules", pkg.name, "dist", "index.js"))}).resolve(${JSON.stringify(`${packageName(key)}/package.json`)}))`
  const resolved = run("node", ["--input-type=module", "-e", `import { createRequire } from "node:module"; ${resolver}`], consumer).trim()
  expect(resolved).toBe(join(installed, "package.json"))
}, 300_000)
