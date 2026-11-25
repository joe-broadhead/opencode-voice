// The standard's pack row: the packed plugin installs with OpenCode's own plugin manager from a local path and starts.
// `opencode plugin add` takes an npm or Git specifier, so the path is a Git checkout with `dist/` committed (a release
// checkout), installed as `git+file://<checkout>#<sha>` on the stock 2.4.1 CLI in an isolated HOME. The service then
// answers the plugin's status RPC and lists its skill.
//
// The checkout mirrors a release: the built `dist/` is committed and the `build` script is gone. A checkout that still
// declares `build` sends the 2.4.1 CLI's git-dependency preparation through a package-manager path it cannot run
// (`Unrecognized flag: --force in command opencode`), which is why a release carries the build output instead.
import { describe, expect, test } from "bun:test"
import { spawnSync } from "node:child_process"
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../..", import.meta.url))
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  capabilities: { plugin: { name: string; host: { tested: string[] } } }
}
const HOST = pkg.capabilities.plugin.host.tested[0]!
const NAME = pkg.capabilities.plugin.name
const KEEP = process.env.KEEP === "1"

function run(command: string, args: string[], options: { cwd?: string; env?: Record<string, string | undefined> } = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    env: { ...process.env, ...options.env },
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

        // A release-like checkout: the built entry committed, and no `build` script (see the header).
        ok("git", ["clone", "-q", "--no-hardlinks", root, checkout], { env })
        if (!existsSync(join(root, "dist", "index.js")) || !existsSync(join(root, "dist", "tui.js"))) {
          ok("node", [join(root, "scripts", "build.mjs")], { env })
        }
        const manifest = JSON.parse(readFileSync(join(checkout, "package.json"), "utf8"))
        delete manifest.scripts.build
        writeFileSync(join(checkout, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`)
        mkdirSync(join(checkout, "dist"), { recursive: true })
        copyFileSync(join(root, "dist", "index.js"), join(checkout, "dist", "index.js"))
        copyFileSync(join(root, "dist", "tui.js"), join(checkout, "dist", "tui.js"))
        ok("git", ["add", "-f", "dist", "package.json"], { cwd: checkout, env })
        ok("git", ["-c", "user.name=voice-plugin-test", "-c", "user.email=test@example.test", "commit", "-q", "-m", "test: a release checkout"], { cwd: checkout, env })
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
