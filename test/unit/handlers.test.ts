import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import type { Manifest } from "@we-the-rebel-alliance/plugin-contract/manifest"
import type { MethodCall } from "@we-the-rebel-alliance/plugin-contract/register"
import * as z from "zod"
import type { Provider } from "../../src/provider/create.js"
import { EngineError } from "../../src/provider/errors.js"
import { createHandlers } from "../../src/handlers/index.js"
import { readUnguarded } from "../../src/handlers/agents.js"
import { DEFAULTS, type Options } from "../../src/options.js"

const manifest = (JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { capabilities: Manifest }).capabilities
const options = { ...(DEFAULTS as unknown as Options) }

const call = (agents: readonly string[] = []): MethodCall =>
  ({
    sessionID: "ses",
    agent: "build",
    messageID: "msg",
    id: "call",
    signal: new AbortController().signal,
    progress: async () => undefined,
    account: "default",
    bus: { name: "voice", emit: async () => ({ ok: true }) },
    access: { level: "all", aliases: ["default"], rules: [], problems: [], dispose: async () => undefined },
    unguardedAgents: async () => agents,
    door: "tool",
  }) as unknown as MethodCall

interface Engine {
  synthesize(text: string, options?: { markdown?: boolean }): Promise<{ path: string; spoken: string; durationMs: number; voice: string }>
  play(path: string, options?: { signal?: AbortSignal }): Promise<void>
  release(path: string): Promise<void>
}

function provider(engine: Engine | undefined, facts: Awaited<ReturnType<Provider["facts"]>> = { microphone: "authorized" }): Provider {
  return {
    packageRoot: "/x",
    cacheRoot: "/cache",
    engineCacheDir: "/cache/engine",
    engine: engine as unknown as Provider["engine"],
    engineInfo: undefined,
    store: {} as Provider["store"],
    installRequest: async () => ({ files: [], bytes: 0, hosts: [], engine: false }),
    install: async () => ({ downloaded: [], bytes: 0 }),
    facts: async () => facts,
    dispose: async () => undefined,
  }
}

const handlers = (engine: Engine | undefined, facts?: Awaited<ReturnType<Provider["facts"]>>) =>
  createHandlers({ provider: provider(engine, facts), manifest, version: "0.0.0", options, keybind: "ctrl+space", hostVersion: "2.4.1" })

describe("speak", () => {
  test("synthesizes, plays and releases the temporary file", async () => {
    const calls: string[] = []
    const engine: Engine = {
      synthesize: async (text) => {
        calls.push(`synthesize:${text}`)
        return { path: "/tmp/speech.wav", spoken: text, durationMs: 1_500, voice: "Luna" }
      },
      play: async (path) => void calls.push(`play:${path}`),
      release: async (path) => void calls.push(`release:${path}`),
    }
    const answer = await handlers(engine).speak.run({ text: "hello" }, call())
    expect(answer).toEqual({ played: true, seconds: 1.5, voice: "Luna" })
    expect(calls).toEqual(["synthesize:hello", "play:/tmp/speech.wav", "release:/tmp/speech.wav"])
  })

  test("releases the file when playback fails, and refuses the call", async () => {
    const released: string[] = []
    const engine: Engine = {
      synthesize: async () => ({ path: "/tmp/speech.wav", spoken: "hello", durationMs: 100, voice: "Luna" }),
      play: async () => {
        throw new EngineError("SIDECAR_FAILED", "The reply could not be played.")
      },
      release: async (path) => void released.push(path),
    }
    const failure = await handlers(engine).speak.run({ text: "hello" }, call()).then(() => undefined, (error: unknown) => error)
    expect(String(failure)).toContain("UNAVAILABLE")
    expect(released).toEqual(["tmp/speech.wav"].map((path) => `/${path}`))
  })

  test("an absent engine is UNAVAILABLE with the install step", async () => {
    const failure = await handlers(undefined).speak.run({ text: "hello" }, call()).then(() => undefined, (error: unknown) => error)
    expect(String(failure)).toContain("UNAVAILABLE")
    expect(String(failure)).toContain("/voice-install")
  })

  test("whitespace is nothing to read", async () => {
    const engine: Engine = {
      synthesize: async () => ({ path: "/tmp/x.wav", spoken: "x", durationMs: 1, voice: "Luna" }),
      play: async () => undefined,
      release: async () => undefined,
    }
    const failure = await handlers(engine).speak.run({ text: "   " }, call()).then(() => undefined, (error: unknown) => error)
    expect(String(failure)).toContain("INPUT_INVALID")
  })

  test("the input schema takes one to 5,000 characters and nothing else", () => {
    const schema = z.fromJSONSchema(handlers(undefined).speak.input as never)
    expect(schema.safeParse({ text: "hello" }).success).toBe(true)
    expect(schema.safeParse({ text: "" }).success).toBe(false)
    expect(schema.safeParse({ text: "x".repeat(5_001) }).success).toBe(false)
    expect(schema.safeParse({ text: "hello", account: "work" }).success).toBe(false)
    expect(schema.safeParse({}).success).toBe(false)
  })
})

describe("status and doctor through the handler table", () => {
  test("status answers the strict shape with an empty account list", async () => {
    const answer = (await handlers(undefined).status.run({}, call(["build"]))) as Record<string, unknown>
    expect(Object.keys(answer).sort()).toEqual(["accounts", "host", "name", "nextStep", "state", "unguardedAgents", "version"])
    expect(answer["accounts"]).toEqual([])
    expect(answer["unguardedAgents"]).toEqual(["build"])
    expect(answer["state"]).toBe("error")
    expect(String(answer["nextStep"])).toContain("/voice-install")
  })

  test("doctor carries the engine facts and the empty account list is not repeated there", async () => {
    const answer = (await handlers(undefined).doctor.run({}, call([]))) as Record<string, unknown>
    expect(answer["name"]).toBe("voice")
    expect(answer["state"]).toBe("not_configured")
    expect(answer["engine"]).toMatchObject({ installed: false })
    expect(answer["host"]).toMatchObject({ version: "2.4.1" })
  })
})

describe("the unguarded agent adapter", () => {
  test("reads the current array and the freeze's { ok, agents } answer", async () => {
    expect(await readUnguarded({ unguardedAgents: async () => ["a"] } as unknown as MethodCall)).toEqual({ agents: ["a"] })
    expect(await readUnguarded({ unguardedAgents: async () => ({ ok: true, agents: ["b"] }) } as unknown as MethodCall)).toEqual({ agents: ["b"] })
    const failed = await readUnguarded({ unguardedAgents: async () => ({ ok: false, error: "no agents" }) } as unknown as MethodCall)
    expect(failed.agents).toEqual([])
    expect(failed.problem).toBe("no agents")
  })

  test("a throw is an unknown list, with its redacted reason", async () => {
    const failed = await readUnguarded({
      unguardedAgents: async () => {
        throw new Error("cannot list agents at /Users/x\nsecond")
      },
    } as unknown as MethodCall)
    expect(failed.agents).toEqual([])
    expect(failed.problem).not.toContain("\n")
  })
})
