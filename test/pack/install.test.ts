// Install the packed plugin into a clean folder, the way a user's `npm install` does. The plugin carries no engine and no
// platform package: `/voice-install` downloads the pinned Aurum engine from the upstream address in manifest/aurum.json
// on first use, into the plugin's cache. So the installed copy has the pin it needs and nothing to find on its own.
import { afterAll, expect, test } from "bun:test"
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { pinnedEngine, readRelease } from "../../src/provider/release.js"

const root = fileURLToPath(new URL("../..", import.meta.url))
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
const work = realpathSync(mkdtempSync(join(realpathSync("/tmp"), "voice-install-")))
afterAll(() => rmSync(work, { recursive: true, force: true }), { timeout: 120_000 })

function run(command: string, args: string[], cwd: string, env: Record<string, string> = {}): string {
  const result = spawnSync(command, args, { cwd, env: { ...process.env, ...env }, encoding: "utf8" })
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr || result.stdout}`)
  return result.stdout
}

test("a packed install carries no engine and no platform package: the engine comes from the upstream pin", () => {
  const env = { npm_config_cache: join(work, "npm-cache") }
  run("node", [join(root, "scripts", "bundle.mjs")], root)
  const plugin = JSON.parse(run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", work], root, env))[0].filename

  const consumer = join(work, "consumer")
  mkdirSync(consumer)
  writeFileSync(join(consumer, "package.json"), JSON.stringify({ name: "voice-consumer", private: true }))
  run("npm", ["install", "--no-audit", "--no-fund", join(work, plugin)], consumer, env)

  const installed = join(consumer, "node_modules", pkg.name)
  expect(existsSync(join(installed, "dist", "index.js"))).toBe(true)
  expect(existsSync(join(installed, "dist", "tui.js"))).toBe(true)
  expect(existsSync(join(installed, "manifest", "aurum.json"))).toBe(true)
  // The upstream pin is part of the package; there is no re-hosted native manifest.
  expect(existsSync(join(installed, "manifest", "native.json"))).toBe(false)
  const pin = readRelease(installed)
  expect(pin?.tag).toBe("v0.0.24")
  expect(pin?.source).toBe("https://github.com/joe-broadhead/aurum/releases/tag/v0.0.24")
  expect(Object.keys(pin?.assets ?? {}).sort()).toEqual(["darwin-arm64", "linux-arm64-gnu", "linux-x64-gnu"])
  for (const asset of Object.values(pin?.assets ?? {})) {
    expect(asset.url).toBe(`https://github.com/joe-broadhead/aurum/releases/download/v0.0.24/${asset.name}`)
  }
  const pinned = pinnedEngine(installed, "darwin", "arm64")
  expect(pinned.entry.name).toBe("aurum-macos-arm64")
  expect(existsSync(join(installed, "bin"))).toBe(false)
  expect(JSON.parse(readFileSync(join(installed, "package.json"), "utf8")).optionalDependencies).toBeUndefined()
  expect(existsSync(join(consumer, "node_modules", "@we-the-rebel-alliance", "voice-plugin-bin-darwin-arm64"))).toBe(false)
}, 300_000)
