// The standard's pack row: the packed plugin installs with OpenCode's own plugin manager from a local path and starts.
// `opencode plugin add` takes an npm or Git specifier, so the path is a Git checkout with the committed `dist/`,
// installed as `git+file://<checkout>#<sha>` on the stock 2.4.1 CLI in an isolated HOME. The service then answers the
// plugin's status RPC and lists its skill.
//
// npm "prepares" a git dependency that declares `build`, `prepack`, `prepare`, `preinstall`, `install` or `postinstall`
// by running `npm install` inside it, and that fails in the 2.4.1 CLI ("git dep preparation failed"). The committed
// bundle is what makes a checkout installable, so the test also asserts none of those scripts is declared.
import { describe, expect, test } from "bun:test"
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../..", import.meta.url))
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  capabilities: { plugin: { name: string; host: { tested: string[] } } }
}
const HOST = pkg.capabilities.plugin.host.tested[0]!
const NAME = pkg.capabilities.plugin.name
const KEEP = process.env.KEEP === "1"

// A hermetic child environment: the system essentials only. This shell is an OpenCode session, and an inherited
// `OPENCODE*` variable (`OPENCODE_PASSWORD`, `OPENCODE_SESSION_ID`, …) makes the stock CLI talk to this session's
// service instead of the isolated one the test started, so `plugin list` answers from the wrong server.
const BASE_ENV: Record<string, string> = Object.fromEntries(
  [
    "PATH",
    "LANG",
    "TZ",
    "TERM",
    "SHELL",
    "SYSTEMROOT",
    "WINDIR",
    "COMSPEC",
    "PATHEXT",
    "USERPROFILE",
    "APPDATA",
    "LOCALAPPDATA",
    "PROGRAMFILES",
    "PROGRAMDATA",
  ]
    .filter((key) => process.env[key] !== undefined)
    .map((key) => [key, process.env[key]!]),
)

function childEnv(overrides: Record<string, string | undefined>): Record<string, string> {
  const env: Record<string, string> = { ...BASE_ENV }
  for (const [key, value] of Object.entries(overrides)) if (value !== undefined) env[key] = value
  for (const key of Object.keys(env)) if (key.startsWith("OPENCODE")) delete env[key]
  return env
}

function run(command: string, args: string[], options: { cwd?: string; env?: Record<string, string | undefined> } = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    env: childEnv(options.env ?? {}),
    encoding: "utf8",
    timeout: 180_000,
  })
  if (result.error !== undefined) throw result.error
  return result
}

function ok(command: string, args: string[], options: { cwd?: string; env?: Record<string, string | undefined> } = {}) {
  const result = run(command, args, options)
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed (${result.status}): ${result.stderr || result.stdout}`)
  return result.stdout
}

function freePort(): number {
  const result = run("node", ["-e", 'const s = require("node:net").createServer(); s.listen(0, "127.0.0.1", () => { console.log(s.address().port); s.close() })'])
  if (result.status !== 0) throw new Error(`could not find a free port: ${result.stderr}`)
  return Number(result.stdout.trim())
}

describe("the standard's pack install path", () => {
  test(
    "opencode plugin add installs the checkout as a Git plugin, and its status and skill answer",
    () => {
      const work = realpathSync(mkdtempSync(join(realpathSync("/tmp"), "voice-plugin-add-")))
      const home = join(work, "home")
      const project = join(work, "project")
      const stock = join(work, "stock")
      const checkout = join(work, "checkout")
      for (const dir of [home, project, stock]) mkdirSync(dir, { recursive: true })
      ok("git", ["init", "-q"], { cwd: project })

      const env = {
        HOME: home,
        XDG_CONFIG_HOME: join(home, ".config"),
        XDG_DATA_HOME: join(home, ".local", "share"),
        XDG_CACHE_HOME: join(home, ".cache"),
        XDG_STATE_HOME: join(home, ".local", "state"),
        TMPDIR: join(work, "tmp"),
      }
      mkdirSync(env.TMPDIR, { recursive: true })
      // The test's own guard: no inherited OpenCode session variable may reach a child.
      expect(Object.keys(childEnv(env)).filter((key) => key.startsWith("OPENCODE"))).toEqual([])

      const cli = () => {
        const platform = process.platform + "-" + process.arch
        const bin = join(stock, "node_modules", `@opencode/cli-${platform}`, "bin", "opencode")
        if (!existsSync(bin)) throw new Error(`no @opencode/cli-${platform} binary at ${bin}`)
        return bin
      }
      let started = false
      try {
        // The stock host, exactly the release in the manifest's tested list.
        ok("npm", ["install", "--prefix", stock, "--ignore-scripts", "--no-audit", "--no-fund", `@opencode/cli@${HOST}`], { env })
        const bin = cli()

        // The checkout is the branch head: the committed dist is the installable entry, and no script makes npm prepare it.
        ok("git", ["clone", "-q", "--no-hardlinks", root, checkout], { env })
        expect(existsSync(join(checkout, "dist", "index.js"))).toBe(true)
        expect(existsSync(join(checkout, "dist", "tui.js"))).toBe(true)
        const manifest = JSON.parse(readFileSync(join(checkout, "package.json"), "utf8")) as { scripts?: Record<string, string> }
        for (const name of ["build", "prepack", "prepare", "preinstall", "install", "postinstall"]) expect(manifest.scripts?.[name]).toBeUndefined()
        const ref = ok("git", ["rev-parse", "HEAD"], { cwd: checkout, env }).trim()

        const port = freePort()
        ok(bin, ["service", "set", "port", String(port)], { cwd: project, env })
        ok(bin, ["plugin", "add", `git+file://${checkout}#${ref}`], { cwd: project, env })
        ok(bin, ["service", "start"], { cwd: project, env })
        started = true

        const session = JSON.parse(ok(bin, ["api", "POST", "/api/session", "-H", `x-opencode-directory: ${project}`, "-d", '{"agent":"build"}'], { cwd: project, env })) as { data?: { id?: string } }
        const sessionID = session.data?.id
        expect(sessionID).toBeString()

        // The plugin loads after the service answers, so the status RPC is the wait.
        let answer = ""
        for (let attempt = 0; attempt < 90; attempt += 1) {
          const body = JSON.stringify({ input: { sessionID, input: {} } })
          const call = run(bin, ["api", "POST", `/api/rpc/${NAME}/status`, "-H", `x-opencode-directory: ${project}`, "-d", body], { cwd: project, env })
          answer = call.stdout.trim() || call.stderr.trim()
          if (answer.includes(`"name":"${NAME}"`)) break
          Bun.sleepSync(1_000)
        }
        const status = JSON.parse(answer) as { output?: Record<string, unknown> }
        expect(status.output).toBeDefined()
        expect(status.output!["name"]).toBe(NAME)
        expect(status.output!["accounts"]).toEqual([])
        expect(typeof status.output!["state"]).toBe("string")

        const listed = ok(bin, ["plugin", "list"], { cwd: project, env })
        expect(listed).toContain(ref)

        const skills = ok(bin, ["api", "GET", "/api/skill", "-H", `x-opencode-directory: ${project}`], { cwd: project, env })
        expect(skills).toContain(`"id":"${NAME}"`)
      } finally {
        if (started && existsSync(cli())) run(cli(), ["service", "stop"], { cwd: project, env })
        if (!KEEP) rmSync(work, { recursive: true, force: true })
      }
    },
    600_000,
  )
})
