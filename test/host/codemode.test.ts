// The Code Mode path on an in-process host from the public @opencode/sdk: the same host the stock suite uses, built in
// this process so no provider and no server child are needed. A probe plugin registers a loopback OpenAI-compatible
// model and makes it the default, so one turn can run a program through the host's `execute` tool, which is how a model
// reaches a plugin's tools. It never leaves 127.0.0.1, and the fake Aurum engine answers the speech calls.
import { afterAll, describe, expect, setDefaultTimeout, test } from "bun:test"
import { HOST_SDK_DIR, ROOT as root } from "./isolate.js"
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { Model, Plugin, Provider } from "@opencode/plugin"

setDefaultTimeout(120_000)

const SDK = HOST_SDK_DIR ? join(HOST_SDK_DIR, "node_modules", "@opencode", "sdk") : fileURLToPath(new URL("../../node_modules/@opencode/sdk", import.meta.url))
const HOST_VERSION = (JSON.parse(readFileSync(join(SDK, "package.json"), "utf8")) as { version: string }).version
const FIXTURES = fileURLToPath(new URL("../fixtures/", import.meta.url))

// The package the host loads to talk to an OpenAI-compatible endpoint: a value it resolves, not an import.
const OPENAI_COMPATIBLE = ["@opencode", "ai", "providers", "openai-compatible"].join("/")

/** A scriptable model on loopback: `[[mock:tool:execute:<json>]]` runs a program, a tool result gets a short answer. */
function startMockModel() {
  const chunk = (delta: Record<string, unknown>, finish: string | null = null) =>
    `data: ${JSON.stringify({ id: "mock", object: "chat.completion.chunk", created: 0, model: "m1", choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`
  const stream = (write: (send: (line: string) => void) => void) =>
    new Response(new ReadableStream({ start(controller) { const encoder = new TextEncoder(); const send = (line: string) => controller.enqueue(encoder.encode(line)); try { write(send); controller.close() } catch { /* aborted */ } } }), { headers: { "content-type": "text/event-stream", "cache-control": "no-cache" } })
  const answer = (value: string) => stream((send) => { send(chunk({ role: "assistant", content: "" })); send(chunk({ content: value })); send(chunk({}, "stop")); send("data: [DONE]\n\n") })
  const text = (content: unknown): string => (typeof content === "string" ? content : Array.isArray(content) ? content.map((part) => (part as { text?: string }).text ?? "").join("") : "")
  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    idleTimeout: 0,
    async fetch(request) {
      const url = new URL(request.url)
      if (url.pathname.endsWith("/models")) return Response.json({ object: "list", data: [{ id: "m1", object: "model", owned_by: "mock" }] })
      if (!url.pathname.endsWith("/chat/completions")) return new Response("not found", { status: 404 })
      const body = (await request.json()) as { messages?: { role: string; content?: unknown }[]; tools?: unknown[] }
      const messages = body.messages ?? []
      const last = messages[messages.length - 1]
      if ((body.tools ?? []).length === 0) return answer("Mock title")
      if (last?.role === "tool") return answer(`after-tool: ${text(last.content).slice(0, 400)}`)
      const prompt = text([...messages].reverse().find((message) => message.role === "user")?.content)
      const directive = /\[\[mock:tool:([^:\]]+):?([^\]]*)\]\]/.exec(prompt)
      if (directive) {
        const [name, args] = [directive[1]!, directive[2] ?? "{}"]
        return stream((send) => {
          send(chunk({ role: "assistant", content: null, tool_calls: [{ index: 0, id: "call_1", type: "function", function: { name, arguments: "" } }] }))
          send(chunk({ tool_calls: [{ index: 0, function: { arguments: args } }] }))
          send(chunk({}, "tool_calls"))
          send("data: [DONE]\n\n")
        })
      }
      return answer("ok")
    },
  })
  return { baseURL: `http://127.0.0.1:${server.port}/v1`, stop: () => void server.stop(true) }
}

/** The fake engine and a model cache the plugin accepts, as the stock harness builds them. */
function fakeEngine() {
  const home = process.env.HOME!
  const log = join(root, "fake-aurum.jsonl")
  const manifest = join(root, "models.json")
  const body = new Uint8Array([1, 2, 3, 4])
  const modelDir = join(home, "Library", "Caches", "opencode-voice", "engine", "models")
  mkdirSync(modelDir, { recursive: true })
  writeFileSync(join(modelDir, "tiny.bin"), body)
  writeFileSync(
    manifest,
    JSON.stringify({
      version: "0.0.24",
      models: [{ role: "stt", name: "tiny-q5_1", file: "tiny.bin", url: "https://example.invalid/tiny.bin", sha256: createHash("sha256").update(body).digest("hex"), bytes: body.length, licence: "MIT", revision: "fixture" }],
    }),
  )
  const wrapper = join(root, "aurum")
  writeFileSync(wrapper, `#!/bin/sh\nexec ${JSON.stringify(process.execPath)} ${JSON.stringify(join(FIXTURES, "fake-aurum.mjs"))} "$@"\n`)
  chmodSync(wrapper, 0o755)
  process.env.VOICE_AURUM_PATH = wrapper
  process.env.VOICE_MODELS_MANIFEST = manifest
  process.env.FAKE_AURUM_LOG = log
  process.env.HTTPS_PROXY = "http://127.0.0.1:1"
  process.env.HTTP_PROXY = "http://127.0.0.1:1"
  process.env.NO_PROXY = "127.0.0.1,localhost"
  return { log, wrapper }
}

interface Host {
  readonly client: unknown
  readonly location: { readonly directory: string }
  readonly mock: { readonly baseURL: string; stop(): void }
  readonly engine: { readonly log: string; readonly wrapper: string }
  readonly until: (what: string, check: () => Promise<boolean>, ms?: number) => Promise<void>
}
const hosts: Host[] = []

async function startHost(): Promise<Host> {
  const mock = startMockModel()
  const engine = fakeEngine()
  const pluginPath = fileURLToPath(new URL("../../dist/index.js", import.meta.url))
  const voice = (await import(pathToFileURL(pluginPath).href)).default as Plugin.Plugin
  const probes: Plugin.Context[] = []
  const probe = Plugin.define({
    id: "voice.host-test.probe",
    async setup(ctx) {
      const providerID = Provider.ID.make("mock")
      await ctx.provider.transform((editor) => {
        editor.add({
          info: { ...Provider.Info.empty(providerID), name: "Mock", activation: "enabled", package: OPENAI_COMPATIBLE, settings: { baseURL: mock.baseURL, apiKey: "mock" } } as never,
          models: [{ ...Model.Info.default(providerID, Model.ID.make("m1")), name: "Mock 1" }],
        })
      })
      await ctx.model.transform((editor) => editor.default.set("mock", "m1"))
      probes.push(ctx)
    },
  })
  const work = join(root, "work")
  mkdirSync(work, { recursive: true })
  const { OpenCode } = (await import(pathToFileURL(join(SDK, "dist", "index.js")).href)) as typeof import("@opencode/sdk")
  const client: unknown = await OpenCode.create({
    plugins: [voice, probe],
    app: { version: HOST_VERSION },
    config: {
      content: JSON.stringify({
        providers: { lmstudio: { settings: { baseURL: "" } }, ollama: { settings: { baseURL: "" } }, vllm: { settings: { baseURL: "" } } },
      }),
      directory: join(root, "config"),
      project: false,
      claude: false,
    },
    database: { path: join(root, `opencode-${hosts.length + 1}.db`) },
    models: { fetch: false },
    fs: { filewatcher: false },
    log: { level: "error" },
  } as never)
  const location = { directory: work }
  const until = async (what: string, check: () => Promise<boolean>, ms = 60_000) => {
    const deadline = Date.now() + ms
    for (;;) {
      if (await check()) return
      if (Date.now() > deadline) throw new Error(`timed out waiting until ${what}`)
      await Bun.sleep(50)
    }
  }
  await until("the voice plugin and the probe are active", async () => {
    const { data } = await (client as never as { plugin: { list: (input: unknown) => Promise<{ data: { id: string; state?: { status?: string; error?: unknown } }[] }> } }).plugin.list({ location })
    const found = data.find((entry) => entry.id === voice.id)
    if (found?.state?.status === "failed") throw new Error(`the voice plugin failed: ${JSON.stringify(found.state.error)}`)
    return found?.state?.status === "active" && probes.length > 0
  })
  const host: Host = { client, location, mock, engine, until }
  hosts.push(host)
  return host
}

afterAll(async () => {
  await Promise.all(hosts.map((host) => (host.client as { close: () => Promise<void> }).close().catch(() => undefined)))
  hosts.length = 0
})

/** One turn in a fresh session: the program runs inside Code Mode, and the model's answer is returned. */
async function code(host: Host, program: string, expected: string, permissions?: { action: string; resource: string; effect: "allow" | "ask" | "deny" }[]) {
  const client = host.client as {
    session: { create: (input: unknown) => Promise<{ id: string }>; prompt: (input: unknown) => Promise<unknown>; context: (input: unknown) => Promise<unknown> }
  }
  const session = await client.session.create({ location: host.location, agent: "build", ...(permissions ? { permissions } : {}) })
  await client.session.prompt({ sessionID: session.id, text: `[[mock:tool:execute:${JSON.stringify({ code: program })}]]` })
  let text = ""
  await host.until("the Code Mode program answers", async () => {
    const context = (await client.session.context({ sessionID: session.id })) as { content?: { type?: string; text?: string }[] }[]
    text = context.flatMap((message) => message.content ?? []).map((part) => part.text ?? "").join("\n")
    return text.includes("after-tool:") && text.includes(expected)
  })
  return { sessionID: session.id, text }
}

describe("the Code Mode path", () => {
  test("a read runs inside a program, and speaking runs under the default allow", async () => {
    const host = await startHost()
    const read = await code(host, "const r = await tools.voice.status({}); return JSON.stringify(r)", '"state"')
    expect(read.text).toContain("after-tool:")
    // Every tool is allowed by default (R18), so a program speaks through the fake engine with no prompt.
    const spoken = await code(host, "return await tools.voice.speak({ text: 'Stand-up is at nine.' })", "played")
    expect(spoken.text).toContain("after-tool:")
  })

  test("an agent that denies speaking refuses it with no engine call, and an unknown name is refused", async () => {
    const host = await startHost()
    const before = readFileSync(host.engine.log, "utf8").split("\n").filter((line) => line.includes('"play"')).length
    const denied = await code(host, "try { await tools.voice.speak({ text: 'hello' }); return 'ran' } catch (error) { return 'refused' }", "refused", [
      { action: "voice_speak", resource: "*", effect: "deny" },
    ])
    expect(denied.text).toContain("after-tool: refused")
    const after = readFileSync(host.engine.log, "utf8").split("\n").filter((line) => line.includes('"play"')).length
    expect(after).toBe(before)

    const unknown = await code(host, "try { await tools.voice.no_such_tool({}); return 'ran' } catch (error) { return 'refused' }", "refused")
    expect(unknown.text).toContain("after-tool: refused")
  })
})
