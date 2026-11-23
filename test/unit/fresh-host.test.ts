// A fresh host: no engine in the cache, no VOICE_AURUM_PATH, and a clean HOME. `voice_status` must still be registered,
// must answer with an optional install, and must not download or write anything.
import { afterAll, describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import plugin from "../../src/plugin.js"
import type { Plugin } from "@opencode/plugin"

const dir = mkdtempSync(join(tmpdir(), "voice-fresh-"))
afterAll(() => rmSync(dir, { recursive: true, force: true }))

interface Captured {
  readonly tools: Map<string, { execute: (input: unknown, call: Record<string, unknown>) => Promise<{ output: Record<string, unknown>; content: string }> }>
  readonly namespaces: string[]
  readonly commands: string[]
  readonly rpcs: { id: string; methods: Record<string, unknown> }[]
  readonly skills: string[]
  readonly hooks: string[]
  readonly rules: { action: string; resource: string; effect: string }[]
  readonly states: { synthetic: number; asserted: number }
}

/** A public-context fake: only the domains setup touches, and every registration captured for the assertions. */
function context(options: Record<string, unknown> = {}): { ctx: Plugin.Context; seen: Captured } {
  const tools: Captured["tools"] = new Map()
  const namespaces: string[] = []
  const commands: string[] = []
  const rpcs: Captured["rpcs"] = []
  const skills: string[] = []
  const hooks: string[] = []
  const rules: Captured["rules"] = []
  const states = { synthetic: 0, asserted: 0 }
  const agents = [{ id: "build", permissions: [{ action: "*", resource: "*", effect: "allow" }] }]

  const registration = async () => ({ dispose: async () => undefined })
  const ctx = {
    app: { version: "2.3.2" },
    location: { directory: dir },
    options,
    agent: {
      list: async () => ({ data: agents }),
      transform: async (edit: (editor: { list: () => typeof agents; update: (id: string, change: (info: { permissions: Captured["rules"] }) => void) => void }) => void) => {
        edit({
          list: () => agents,
          update: (id, change) => {
            const found = agents.find((agent) => agent.id === id)
            if (found !== undefined) change(found)
          },
        })
        const own = agents.find((agent) => agent.id === "build")?.permissions ?? []
        rules.splice(0, rules.length, ...own.map((rule) => ({ ...rule })))
        return registration()
      },
    },
    command: {
      transform: async (edit: (editor: { add: (command: { name: string }) => void }) => void) => {
        edit({ add: (command) => void commands.push(command.name) })
        return registration()
      },
    },
    session: {
      synthetic: async () => {
        states.synthetic += 1
      },
    },
    rpc: {
      register: async (definition: { id: string }, methods: Record<string, unknown>) => {
        rpcs.push({ id: definition.id, methods })
        return registration()
      },
    },
    skill: {
      transform: async (edit: (editor: { add: (skill: { id: string }) => void }) => void) => {
        edit({ add: (skill) => void skills.push(skill.id) })
        return registration()
      },
    },
    tool: {
      transform: async (edit: (editor: { namespace: (value: { name: string }) => void; add: (tool: { name: string }) => void }) => void) => {
        edit({
          namespace: (value) => void namespaces.push(value.name),
          add: (tool) => void tools.set(tool.name, tool as never),
        })
        return registration()
      },
    },
    permission: {
      hook: async (name: string) => {
        hooks.push(name)
        return registration()
      },
      assert: async () => {
        states.asserted += 1
      },
    },
  } as unknown as Plugin.Context
  return { ctx, seen: { tools, namespaces, commands, rpcs, skills, hooks, rules, states } }
}

function emptyFolder(path: string): boolean {
  if (!existsSync(path)) return true
  return readdirSync(path, { withFileTypes: true }).every((entry) => entry.isDirectory() && emptyFolder(join(path, entry.name)))
}

describe("a fresh host with no engine", () => {
  test("voice_status is registered, voice_speak is not, and nothing is downloaded or written", async () => {
    const home = join(dir, "home")
    const cache = join(dir, "cache")
    const saved = { HOME: process.env.HOME, XDG_CACHE_HOME: process.env.XDG_CACHE_HOME, VOICE_AURUM_PATH: process.env.VOICE_AURUM_PATH, VOICE_MODELS_MANIFEST: process.env.VOICE_MODELS_MANIFEST }
    process.env.HOME = home
    process.env.XDG_CACHE_HOME = cache
    delete process.env.VOICE_AURUM_PATH
    delete process.env.VOICE_MODELS_MANIFEST
    const original = globalThis.fetch
    let fetches = 0
    globalThis.fetch = (async () => {
      fetches += 1
      throw new Error("a fresh host's status must not reach the network")
    }) as unknown as typeof fetch
    try {
      // A development checkout has no manifest/native.json, so this path makes the engine deterministically absent, as
      // it is on a fresh install whose cache is empty. The registration path is the same for either ENGINE_MISSING.
      const { ctx, seen } = context({ aurumPath: join(dir, "not-installed-aurum") })
      const stop = await plugin.setup(ctx)
      expect(seen.tools.has("status")).toBe(true)
      expect(seen.tools.has("speak")).toBe(false)
      expect(seen.namespaces).toEqual(["voice"])
      expect(seen.commands.sort()).toEqual(["voice-install", "voice-status"])
      expect(seen.skills).toEqual(["voice"])
      expect(seen.hooks).toEqual(["evaluate"])
      expect(seen.rpcs.map((rpc) => rpc.id).sort()).toEqual(["voice.dictation", "voice.dictation.tools"])
      const tools = seen.rpcs.find((rpc) => rpc.id === "voice.dictation.tools")
      expect(Object.keys(tools?.methods ?? {}).sort()).toEqual(["describe", "voice_status"])
      expect(seen.rules.map((rule) => `${rule.action}:${rule.effect}`)).toContain("voice_status:allow")
      expect(seen.rules.map((rule) => `${rule.action}:${rule.effect}`)).toContain("voice_speak:allow")

      const status = await seen.tools.get("status")!.execute({}, { sessionID: "ses_fresh", agent: "build", messageID: "msg_fresh", id: "call_fresh", signal: new AbortController().signal })
      // A configured override that points nowhere is a fault, not the optional empty release cache.
      expect(status.output.state).toBe("failed")
      expect(status.output.engine).toEqual({ installed: false, verified: false, version: null })
      expect(String(status.output.nextStep)).toContain("aurumPath")
      expect(String(status.output.nextStep)).not.toContain(dir)
      expect(status.content).toContain("not installed")
      expect(seen.states.asserted).toBe(0)
      expect(seen.states.synthetic).toBe(0)
      // The only writer is `/voice-install`; status leaves the fresh cache and home empty.
      expect(emptyFolder(home) && emptyFolder(cache)).toBe(true)
      expect(fetches).toBe(0)
      await stop?.()
    } finally {
      globalThis.fetch = original
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    }
  })

  test("invalid options register no tools and keep the status RPC", async () => {
    const { ctx, seen } = context({ maxRecordSeconds: 0 })
    const stop = await plugin.setup(ctx)
    expect(seen.tools.size).toBe(0)
    expect(seen.rpcs.map((rpc) => rpc.id)).toEqual(["voice.dictation"])
    expect(seen.commands.sort()).toEqual(["voice-install", "voice-status"])
    await stop?.()
  })
})
