// Install the packed plugin into a clean folder, the way a user's `npm install` does. The plugin carries no engine and no
// platform package: the pinned Aurum engine comes from the release (manifest/native.json) on first use or from
// /voice-install, into the plugin's cache. So the installed copy has the pin it needs and nothing to find on its own.
import { afterAll, expect, test } from "bun:test"
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../..", import.meta.url))
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
const work = realpathSync(mkdtempSync(join(realpathSync("/tmp"), "voice-install-")))
afterAll(() => rmSync(work, { recursive: true, force: true }), { timeout: 120_000 })

function run(command: string, args: string[], cwd: string, env: Record<string, string> = {}): string {
  const result = spawnSync(command, args, { cwd, env: { ...process.env, ...env }, encoding: "utf8" })
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr || result.stdout}`)
  return result.stdout
}

test("a packed install carries no engine and no platform package: the engine comes from the release", () => {
  const env = { npm_config_cache: join(work, "npm-cache") }
  run("node", [join(root, "scripts", "check.mjs"), "build"], root)
  const plugin = JSON.parse(run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", work], root, env))[0].filename

  const consumer = join(work, "consumer")
  mkdirSync(consumer)
  writeFileSync(join(consumer, "package.json"), JSON.stringify({ name: "voice-consumer", private: true }))
  run("npm", ["install", "--no-audit", "--no-fund", join(work, plugin)], consumer, env)

  const installed = join(consumer, "node_modules", pkg.name)
  expect(existsSync(join(installed, "dist", "index.js"))).toBe(true)
  expect(existsSync(join(installed, "dist", "tui.js"))).toBe(true)
  expect(existsSync(join(installed, "manifest", "aurum.json"))).toBe(true)
  expect(existsSync(join(installed, "bin"))).toBe(false)
  expect(JSON.parse(readFileSync(join(installed, "package.json"), "utf8")).optionalDependencies).toBeUndefined()
  expect(existsSync(join(consumer, "node_modules", "@joe-broadhead", "opencode-voice-bin-darwin-arm64"))).toBe(false)
}, 300_000)
