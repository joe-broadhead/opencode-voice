// The one local entry point: `npm run check` runs every stage in order and stops at the first failure.
// `node scripts/check.mjs <stage>...` runs only the named stages, in the order given.
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { delimiter, join } from "node:path"
import { fileURLToPath } from "node:url"
import { homedir } from "node:os"

const root = fileURLToPath(new URL("..", import.meta.url))
const env = { ...process.env, PATH: `${join(root, "node_modules", ".bin")}${delimiter}${process.env.PATH ?? ""}` }
const { TESTED_HOSTS } = await import(new URL("../src/constants.ts", import.meta.url).href)

// The approved package shape. Voice is the one family package with native platform dependencies, so the native list is
// asserted exactly instead of being forbidden.
const FILES = ["dist", "manifest", "skills", "assets/icon.svg", "assets/icon-128.png", "assets/icon-256.png", "NOTICE", "README.md", "LICENSE", "CHANGELOG.md"]
const EXPORTS = { ".": "index", "./tui": "tui" }
const ASSET_EXPORTS = { "./icon.svg": "assets/icon.svg", "./icon-128.png": "assets/icon-128.png", "./icon-256.png": "assets/icon-256.png" }
const DIST = Object.values(EXPORTS).map((base) => `${base}.js`).sort()
const HOST_RANGE = ">=2.2.3 <2.3.0"
const HOST_DEV_PIN = "2.2.3"
const ABSENT_FIELDS = ["dependencies", "bundleDependencies", "bundledDependencies", "peerDependencies", "peerDependenciesMeta", "engines", "overrides"]
const NATIVE = {
  "@joe-broadhead/opencode-voice-bin-darwin-arm64": "0.0.0",
  "@joe-broadhead/opencode-voice-bin-linux-x64-gnu": "0.0.0",
  "@joe-broadhead/opencode-voice-bin-linux-arm64-gnu": "0.0.0",
}
const LIFECYCLE_SCRIPTS = ["preinstall", "install", "postinstall", "preprepare", "prepare", "postprepare", "prepublish", "prepublishOnly", "prepack", "postpack", "publish", "postpublish"]

const stages = {
  typecheck: () => run("tsc", ["--noEmit", "-p", "tsconfig.json"]),
  unit: () => run("bun", ["test", "./test/unit"]),
  build: () => run("node", ["scripts/build.mjs"]),
  icons: () => run("node", ["scripts/check-icons.mjs"]),
  copies: () => run("node", ["scripts/check-copies.mjs"]),
  forbidden: () => run("node", ["scripts/check-forbidden.mjs"]),
  evals: () => run("bun", ["evals/check.mjs"]),
  host: host,
  pack: () => run("bun", ["--conditions=browser", "test", "./test/pack"]),
  whitelist: whitelist,
}

const selected = process.argv.slice(2)
const unknown = selected.filter((name) => !Object.hasOwn(stages, name))
if (unknown.length) {
  console.error(`check: unknown stage ${unknown.map((name) => `"${name}"`).join(", ")}. Stages: ${Object.keys(stages).join(", ")}.`)
  process.exit(2)
}
const order = selected.length ? selected : Object.keys(stages)
for (const name of order) {
  console.log(`\n[check] ${name}`)
  const code = stages[name]()
  if (code !== 0) {
    console.error(`\n[check] FAILED at stage "${name}". Fix it, then rerun: node scripts/check.mjs ${name}`)
    process.exit(code || 1)
  }
}
console.log(`\n[check] passed: ${order.join(", ")}`)

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: options.cwd ?? root, env: { ...env, ...options.env }, stdio: "inherit" })
  if (result.error?.code === "ENOENT") {
    console.error(`${command} was not found. Run npm ci first; install Bun from https://bun.sh if bun is missing.`)
    return 127
  }
  if (result.error) throw result.error
  return result.status ?? 1
}

/** The stock binaries the host suite runs on: the environment first, then the machine's usual places. */
function stockBin(version) {
  const key = `OPENCODE_BIN_${version.replaceAll(".", "_")}`
  const fromEnv = process.env[key]
  if (fromEnv !== undefined && existsSync(fromEnv)) return fromEnv
  const candidates = [
    join(homedir(), "opencode-release/qa/stock", version, "node_modules/@opencode/cli-darwin-arm64/bin/opencode"),
  ]
  return candidates.find((candidate) => existsSync(candidate))
}

/**
 * The host suite on each tested stock release. A missing binary skips that release with a notice, so `npm run check`
 * passes from a fresh clone with nothing set; with the three OPENCODE_BIN_* set, every release runs.
 */
function host() {
  const only = process.env.VOICE_TEST_VERSION
  let ran = 0
  for (const version of TESTED_HOSTS) {
    if (only !== undefined && only !== version) continue
    const bin = stockBin(version)
    if (bin === undefined) {
      console.log(`\n[check] host ${version}: skipped, no stock binary (set OPENCODE_BIN_${version.replaceAll(".", "_")})`)
      continue
    }
    console.log(`\n[check] host on stock OpenCode ${version}`)
    const code = run("bun", ["test", "./test/host"], { env: { OPENCODE_BIN: bin, VOICE_TEST_VERSION: version } })
    if (code !== 0) return code
    ran += 1
  }
  if (ran === 0) console.log("[check] host: no stock binaries found; skipped.")
  return 0
}

function whitelist() {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
  const problems = []
  if (JSON.stringify(pkg.files) !== JSON.stringify(FILES)) problems.push(`"files" must be exactly ${JSON.stringify(FILES)}.`)
  for (const field of ABSENT_FIELDS) if (field in pkg) problems.push(`Remove "${field}": the package ships no JS runtime dependencies and no host peers.`)
  if (JSON.stringify(pkg.optionalDependencies) !== JSON.stringify(NATIVE)) problems.push(`"optionalDependencies" must be exactly the three pinned platform packages.`)
  for (const script of LIFECYCLE_SCRIPTS) if (pkg.scripts?.[script] !== undefined) problems.push(`Remove the "${script}" script: OpenCode installs with lifecycle scripts disabled.`)
  if (pkg.opencode?.host !== HOST_RANGE) problems.push(`"opencode.host" must be "${HOST_RANGE}", the tested OpenCode line.`)
  for (const name of ["@opencode/client", "@opencode/plugin", "@opencode/sdk"]) {
    if (pkg.devDependencies?.[name] !== HOST_DEV_PIN) problems.push(`devDependency "${name}" must be exactly ${HOST_DEV_PIN}, the tested host.`)
  }
  const exportsSeen = Object.keys(pkg.exports ?? {})
  for (const key of Object.keys(EXPORTS)) if (!exportsSeen.includes(key)) problems.push(`"exports" is missing "${key}".`)
  for (const key of exportsSeen) {
    const base = EXPORTS[key]
    if (base) {
      const want = `./dist/${base}.js`
      if (pkg.exports[key] !== want) problems.push(`"exports"["${key}"] must be ${JSON.stringify(want)}.`)
      continue
    }
    const asset = ASSET_EXPORTS[key]
    if (asset) {
      if (pkg.exports[key] !== `./${asset}`) problems.push(`"exports"["${key}"] must be ${JSON.stringify(`./${asset}`)}.`)
      continue
    }
    problems.push(`"exports" must not contain "${key}".`)
  }
  for (const key of Object.keys(ASSET_EXPORTS)) if (!exportsSeen.includes(key)) problems.push(`"exports" is missing "${key}".`)
  for (const field of ["main", "types", "module", "bin"]) if (field in pkg) problems.push(`Remove "${field}": "exports" is the only entry map.`)
  if (pkg.scripts?.build !== "node scripts/check.mjs build") problems.push(`"scripts"."build" must be "node scripts/check.mjs build", which runs the esbuild bundle.`)
  const dist = join(root, "dist")
  const built = existsSync(dist) ? readdirSync(dist).sort() : DIST
  if (JSON.stringify(built) !== JSON.stringify(DIST)) problems.push(`dist/ must hold exactly ${DIST.join(" and ")}, found ${built.join(", ")}. Run npm run build.`)
  for (const problem of problems) console.error(`package: ${problem}`)
  if (!problems.length) console.log("package.json and dist/ match the approved package shape.")
  return problems.length ? 1 : 0
}
