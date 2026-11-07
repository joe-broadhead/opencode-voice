// Pack and load the published shape: the tarball holds exactly the whitelist, installs with lifecycle scripts disabled,
// and both entry points import from the installed package. No native binary is in the main package.
import { afterAll, describe, expect, test } from "bun:test"
import { spawnSync } from "node:child_process"
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs"
import { basename, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../..", import.meta.url))
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
const work = realpathSync(mkdtempSync(join(realpathSync("/tmp"), "voice-pack-")))
afterAll(() => rmSync(work, { recursive: true, force: true }), { timeout: 120_000 })

const MAX_FILES = 20
const MAX_BYTES = 1.2 * 1024 * 1024
const DIST = ["dist/index.js", "dist/tui.js"]

function run(command: string, args: string[], cwd = root, env: Record<string, string | undefined> = {}) {
  const result = spawnSync(command, args, { cwd, env: { ...process.env, ...env }, encoding: "utf8" })
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr || result.stdout}`)
  return result.stdout
}

type Packed = { filename: string; size: number; entryCount: number; files: { path: string }[] }
let packed: Packed | undefined
function pack() {
  if (packed) return packed
  const given = process.env.PACK_TARBALL
  if (given !== undefined) {
    const tarball = resolve(given)
    copyFileSync(tarball, join(work, basename(tarball)))
    const files = run("tar", ["-tzf", tarball]).trim().split("\n").filter((path) => !path.endsWith("/")).map((path) => ({ path: path.replace(/^package\//, "") }))
    packed = { filename: basename(tarball), size: statSync(tarball).size, entryCount: files.length, files }
    return packed
  }
  run("node", [join(root, "scripts", "check.mjs"), "build"])
  const result = run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", work])
  packed = (JSON.parse(result) as Packed[])[0]!
  return packed
}

function whitelisted(entry: string): string[] {
  const path = join(root, entry)
  try {
    if (!statSync(path).isDirectory()) return [entry]
  } catch {
    return [entry]
  }
  return readdirSync(path).flatMap((name) => whitelisted(`${entry}/${name}`))
}

function relativeImports(source: string): string[] {
  return [...source.matchAll(/(?:from\s*|import\s*\()\s*["'](\.{1,2}\/[^"']+)["']/g)].map((match) => match[1]!)
}

describe("the package tarball", () => {
  test("holds exactly the whitelist, under the size and file caps, with no binary and no declarations", () => {
    const { files, entryCount, size, filename } = pack()
    const paths = files.map((file) => file.path).sort()
    const expected = ["package.json", ...pkg.files.flatMap((entry: string) => whitelisted(entry))].sort()
    expect(paths).toEqual(expected)
    expect(entryCount).toBeLessThan(MAX_FILES)
    expect(size).toBeLessThanOrEqual(MAX_BYTES)
    expect(paths.filter((path) => path.endsWith(".d.ts"))).toEqual([])
    expect(paths.filter((path) => /(?:^|\/)bin\/aurum(?:\.exe)?$/.test(path))).toEqual([])
    for (const target of Object.values(pkg.exports) as string[]) expect(paths).toContain(target.replace(/^\.\//, ""))
    expect(filename.endsWith(".tgz")).toBe(true)
  }, 120_000)

  test("dist holds only the two self-contained bundles, with no relative import", () => {
    for (const file of DIST) {
      const source = readFileSync(join(root, file), "utf8")
      expect(relativeImports(source)).toEqual([])
    }
    expect(readdirSync(join(root, "dist")).sort()).toEqual(["index.js", "tui.js"])
  })

  test("installs with scripts disabled and loads both entries under Bun", () => {
    const dir = join(work, "consumer")
    mkdirSync(dir)
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "voice-consumer", private: true, type: "module" }))
    const hosts = ["@opencode/plugin", "@opentui/core", "@opentui/solid", "solid-js"].map((name) => `${name}@${pkg.devDependencies[name]}`)
    run("npm", ["install", join(work, pack().filename), ...hosts, "--ignore-scripts", "--no-audit", "--no-fund", "--prefer-offline"], dir)
    const probe = join(dir, "probe.mjs")
    writeFileSync(
      probe,
      [
        "const out = {}",
        `for (const [part, specifier] of [["server", ${JSON.stringify(pkg.name)}], ["tui", ${JSON.stringify(`${pkg.name}/tui`)}]]) {`,
        "  const plugin = (await import(specifier)).default",
        "  out[part] = { id: plugin?.id, setup: typeof plugin?.setup }",
        "}",
        "console.log(JSON.stringify(out))",
      ].join("\n"),
    )
    const output = run("bun", [probe], dir, { HOME: join(work, "home"), XDG_CACHE_HOME: join(work, "cache") })
    expect(JSON.parse(output.trim().split("\n").at(-1)!)).toEqual({
      server: { id: "voice.dictation", setup: "function" },
      tui: { id: "voice.dictation.tui", setup: "function" },
    })
  }, 300_000)
})

