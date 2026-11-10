// A stock OpenCode server for the host suite: the real binary from OPENCODE_BIN, isolated in its own temp root, with
// this package loaded from dist/ and the fake Aurum engine on PATH. No model provider is configured and every
// non-loopback request is refused by the test's environment, so a host test can never spend money or reach the network.
import { spawn, type ChildProcess } from "node:child_process"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { createServer } from "node:net"
import { join } from "node:path"
import { realpathSync } from "node:fs"
import { OpenCode } from "@opencode/client"
import { defaultCacheRoot } from "../../src/engine/assets.js"
import { HOST_ENV } from "./isolate.js"

export const VERSION = HOST_ENV.VOICE_TEST_VERSION ?? "2.2.3"
/** The stock binary for VERSION, from OPENCODE_BIN. The test file's gate decides whether a missing one skips or fails. */
export const BIN: string | undefined = HOST_ENV.OPENCODE_BIN

const FIXTURES = new URL("../fixtures/", import.meta.url).pathname
export const FAKE_AURUM = join(FIXTURES, "fake-aurum.mjs")

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      const port = typeof address === "object" && address !== null ? address.port : 0
      server.close(() => resolve(port))
    })
  })
}

export interface StockHost {
  readonly client: ReturnType<typeof OpenCode.make>
  readonly url: string
  readonly location: { readonly directory: string }
  readonly root: string
  readonly log: string
  /** Where the plugin keeps the engine cache whose models the sidecar must read. */
  readonly cacheEngine: string
  stop(): Promise<void>
}

/** Starts one stock server. `root` is removed on stop unless KEEP=1. */
export async function startStock(): Promise<StockHost> {
  const root = join(realpathSync("/tmp"), `voice-host-${process.pid}-${Math.random().toString(36).slice(2)}`)
  const home = join(root, "home")
  const work = join(root, "work")
  for (const dir of [home, work, join(root, "config", "opencode"), join(root, "data"), join(root, "state"), join(root, "cache"), join(root, "tmp")]) {
    mkdirSync(dir, { recursive: true })
  }
  const log = process.env.FAKE_AURUM_LOG ?? join(root, "fake-aurum.jsonl")
  const manifest = join(root, "models.json")
  const body = new Uint8Array([1, 2, 3, 4])
  // The plugin's own cache root for this platform and this server's environment: macOS keeps it under Library/Caches,
  // Linux under XDG_CACHE_HOME. The fixture model goes exactly where the plugin will look.
  const cacheRoot = defaultCacheRoot(home, process.platform, { XDG_CACHE_HOME: join(root, "cache") })
  const modelDir = join(cacheRoot, "engine", "models")
  mkdirSync(modelDir, { recursive: true })
  writeFileSync(join(modelDir, "tiny.bin"), body)
  writeFileSync(
    manifest,
    JSON.stringify({
      version: "0.0.24",
      models: [
        {
          role: "stt",
          name: "tiny-q5_1",
          file: "tiny.bin",
          url: "https://example.invalid/tiny.bin",
          sha256: createHash("sha256").update(body).digest("hex"),
          bytes: body.length,
          licence: "MIT",
          revision: "fixture",
        },
      ],
    }),
  )
  writeFileSync(
    join(root, "config", "opencode", "opencode.json"),
    JSON.stringify({
      $schema: "https://opencode.ai/config.json",
      plugins: [{ package: new URL("../../", import.meta.url).pathname.replace(/\/$/, "") }],
      providers: {
        lmstudio: { settings: { baseURL: "" } },
        ollama: { settings: { baseURL: "" } },
        vllm: { settings: { baseURL: "" } },
      },
    }),
  )
  const wrapper = join(root, "aurum")
  writeFileSync(wrapper, `#!/bin/sh\nexec ${JSON.stringify(process.execPath)} ${JSON.stringify(FAKE_AURUM)} "$@"\n`, { mode: 0o755 })
  const password = `voice-${Math.random().toString(36).slice(2)}`
  const port = await freePort()
  const env: NodeJS.ProcessEnv = {
    PATH: `/usr/bin:/bin:/usr/sbin:/sbin`,
    HOME: home,
    XDG_CONFIG_HOME: join(root, "config"),
    XDG_DATA_HOME: join(root, "data"),
    XDG_STATE_HOME: join(root, "state"),
    XDG_CACHE_HOME: join(root, "cache"),
    TMPDIR: join(root, "tmp"),
    OPENCODE_PASSWORD: password,
    VOICE_AURUM_PATH: wrapper,
    VOICE_MODELS_MANIFEST: manifest,
    FAKE_AURUM_LOG: log,
    // A dead proxy: any attempt to leave the machine fails loudly instead of reaching a provider.
    HTTPS_PROXY: "http://127.0.0.1:1",
    HTTP_PROXY: "http://127.0.0.1:1",
    NO_PROXY: "127.0.0.1,localhost",
  }
  if (BIN === undefined) throw new Error(`OPENCODE_BIN_${VERSION.replaceAll(".", "_")} is not set, so the stock ${VERSION} host cannot start`)
  const child: ChildProcess = spawn(BIN, ["serve", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: work,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  })
  let stderr = ""
  child.stderr?.on("data", (chunk: Buffer) => (stderr += chunk.toString("utf8")))
  const url = `http://127.0.0.1:${port}`
  const headers = { Authorization: `Basic ${Buffer.from(`opencode:${password}`).toString("base64")}` }
  const client = OpenCode.make({ baseUrl: url, headers })
  const deadline = Date.now() + 40_000
  for (;;) {
    try {
      await client.server.info({ signal: AbortSignal.timeout(1000) })
      break
    } catch (error) {
      if (child.exitCode !== null) {
        throw new Error(`the stock server exited with ${child.exitCode}: ${stderr.slice(-2000)}`)
      }
      if (Date.now() > deadline) {
        child.kill("SIGTERM")
        throw new Error(`the stock server did not start: ${String(error)}\n${stderr.slice(-2000)}`)
      }
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }
  return {
    client,
    url,
    location: { directory: work },
    root,
    log,
    cacheEngine: join(cacheRoot, "engine"),
    async stop() {
      if (child.exitCode === null) child.kill("SIGTERM")
      await new Promise<void>((resolve) => {
        if (child.exitCode !== null) return resolve()
        child.once("exit", () => resolve())
        setTimeout(() => {
          if (child.exitCode === null) child.kill("SIGKILL")
          resolve()
        }, 10_000)
      })
      if (process.env.KEEP !== "1") rmSync(root, { recursive: true, force: true })
    },
  }
}

/** Every event the fake engine logged, for the tests that assert what ran. */
export function fakeEvents(log: string): readonly Record<string, unknown>[] {
  try {
    return readFileSync(log, "utf8")
      .split("\n")
      .filter((line) => line !== "")
      .map((line) => JSON.parse(line) as Record<string, unknown>)
  } catch {
    return []
  }
}
