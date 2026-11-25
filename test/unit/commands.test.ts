import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import type { Manifest } from "@we-the-rebel-alliance/plugin-contract/manifest"
import { registerCommands, type CommandHooks, type CommandInput } from "../../src/commands.js"
import { DEFAULTS, type Options } from "../../src/options.js"
import type { Provider } from "../../src/provider/create.js"

const manifest = (JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { capabilities: Manifest }).capabilities
const options = { ...(DEFAULTS as unknown as Options) }

function harness(overrides: { provider?: Partial<Provider>; hooks?: Partial<CommandHooks> } = {}) {
  const added: { name: string; description?: string; execute: (input: { sessionID: string }) => Promise<void> }[] = []
  const posted: { text: string; description: string }[] = []
  const asserted: { sessionID: string; action: string; resources: readonly string[] }[] = []
  const installed: number[] = []
  const provider = {
    facts: async () => ({ microphone: "authorized" }),
    installRequest: async () => ({ files: [], bytes: 0, hosts: [], engine: false }),
    install: async () => {
      installed.push(1)
      return { downloaded: ["tiny.bin"], bytes: 4 }
    },
    ...overrides.provider,
  } as unknown as Provider
  const input: CommandInput = {
    command: {
      transform: async (callback) => {
        callback({ add: (definition: { name: string; description?: string; execute: (input: { sessionID: string }) => Promise<void> }) => added.push(definition) } as never)
        return { dispose: async () => undefined }
      },
    },
    session: {
      synthetic: async ({ text, description }) => {
        posted.push({ text: text as string, description: description as string })
        return {} as never
      },
    },
    permission: {
      assert: async (request) => {
        asserted.push({ sessionID: request.sessionID as string, action: request.action, resources: [...request.resources] })
      },
    },
  }
  const hooks: CommandHooks = {
    provider,
    manifest,
    version: "0.0.0",
    options,
    keybind: "ctrl+space",
    hostVersion: "2.4.1",
    unguarded: async () => ({ ok: true, agents: [] }),
    ...overrides.hooks,
  }
  return { input, hooks, added, posted, asserted, installed }
}

describe("the server commands", () => {
  test("register /voice-status and /voice-install with descriptions", async () => {
    const h = harness()
    const dispose = await registerCommands(h.input as never, h.hooks)
    expect(h.added.map((command) => command.name)).toEqual(["voice-status", "voice-install"])
    expect(h.added[0]!.description).toContain("engine")
    expect(h.added[1]!.description).toContain("speech")
    await dispose()
  })

  test("/voice-status posts the doctor text, including an unreadable agent list", async () => {
    const h = harness({ hooks: { unguarded: async () => ({ ok: false, error: "The agent list could not be read." }) } })
    await registerCommands(h.input as never, h.hooks)
    await h.added[0]!.execute({ sessionID: "ses_1" })
    expect(h.posted).toHaveLength(1)
    expect(h.posted[0]!.description).toBe("Voice status")
    expect(h.posted[0]!.text).toContain("Voice 0.0.0")
    expect(h.posted[0]!.text).toContain("Next step:")
    expect(h.posted[0]!.text).toContain("Agent rules: The agent list could not be read.")
  })

  test("/voice-install posts that everything is installed when nothing is missing", async () => {
    const h = harness()
    await registerCommands(h.input as never, h.hooks)
    await h.added[1]!.execute({ sessionID: "ses_1" })
    expect(h.asserted).toEqual([])
    expect(h.installed).toEqual([])
    expect(h.posted[0]!.text).toContain("already installed and verified")
  })

  test("/voice-install asks for the hosts before it downloads", async () => {
    let installed = 0
    const h = harness({
      provider: {
        installRequest: async () => ({ files: ["aurum-linux-x64-gnu.gz"], bytes: 4, hosts: ["github.com"], engine: true }),
        install: async () => {
          installed += 1
          return { downloaded: ["aurum-linux-x64-gnu.gz"], bytes: 4 }
        },
      },
    })
    await registerCommands(h.input as never, h.hooks)
    await h.added[1]!.execute({ sessionID: "ses_1" })
    expect(h.asserted).toEqual([{ sessionID: "ses_1", action: "voice.install", resources: ["github.com"] }])
    expect(installed).toBe(1)
    expect(h.posted[0]!.text).toContain("Installed aurum-linux-x64-gnu.gz")
  })
})
