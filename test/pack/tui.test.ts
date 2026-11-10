// The built terminal UI: its commands, the one dialog rendered from the status RPC, the close path, the per-open
// keymap layer, the conflict warning, and a refresh on the events S1 names.
import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { DEFAULT_KEYBIND_MAC, DEFAULT_KEYBIND_OTHER } from "../../src/constants.js"

/** The microphone key this platform defaults to: macOS and the other platforms differ, so the test asks the constants. */
const DEFAULT_BIND = process.platform === "darwin" ? DEFAULT_KEYBIND_MAC : DEFAULT_KEYBIND_OTHER


const root = mkdtempSync(join(realpathSync("/tmp"), "voice-tui-"))
writeFileSync(join(root, "models.json"), JSON.stringify({ version: "0.0.24", models: [] }))
const fake = join(root, "aurum")
writeFileSync(fake, "#!/bin/sh\necho '{\"checks\":[{\"id\":\"microphone\",\"ok\":true,\"detail\":\"authorized\"},{\"id\":\"input\",\"ok\":true,\"detail\":\"Fixture Mic\"}]}'\n", { mode: 0o755 })
mkdirSync(join(root, "home"), { recursive: true })
process.env.VOICE_AURUM_PATH = fake
process.env.VOICE_MODELS_MANIFEST = join(root, "models.json")
process.env.HOME = join(root, "home")

const { createElement, insert, testRender } = await import("@opentui/solid")

type Layer = { mode?: string; commands: { id?: string; title?: string; bind?: string; run: () => unknown }[] }
const layers: Layer[] = []
let dialog: { render: () => unknown; onClose?: () => void } | undefined
let cleared = 0
let dialogSize: string | undefined
const toasts: string[] = []
const listeners = new Map<string, Set<() => void>>()
const requests: { resolve: (status: unknown) => void; reject: (error: unknown) => void }[] = []
// Another plugin already owns the default key: the conflict must be reported once.
layers.push({ mode: "base", commands: [{ id: "other.command", title: "Other: Do", bind: DEFAULT_BIND, run: () => undefined }] })

function status(overrides: Record<string, unknown> = {}) {
  return {
    version: "0.0.0",
    state: "ready",
    host: { version: "2.2.3", range: ">=2.2.3 <2.3.0", tested: true },
    unguardedAgents: [],
    nextStep: "Nothing to do.",
    engine: { installed: true, version: "0.0.24", path: "/x/aurum", verified: true, compatible: true, platform: "darwin-arm64", source: "package" },
    models: {
      version: "0.0.24",
      stt: { name: "tiny-q5_1", bytes: 1024, licence: "MIT", state: "cached", path: "/x/tiny" },
      tts: { name: "kitten", bytes: 1024, licence: "Apache-2.0", state: "cached", path: "/x/kitten" },
    },
    microphone: { permission: "authorized", input: "Fixture Mic", output: "Fixture Speakers" },
    dictation: { keybind: DEFAULT_BIND, submit: "send", lastLatencyMs: null },
    tools: { registered: 2, readable: 1 },
    providers: { stt: "local", tts: "local" },
    privacy: { audioLeavesMachine: false, keepRecordings: false, transcriptHistory: false },
    problems: [],
    ...overrides,
  }
}

const context = {
  app: { version: "2.2.3", channel: "latest" },
  location: { directory: root },
  options: {},
  theme: { text: { base: "#fff", muted: "#888" } },
  keymap: {
    layer: (factory: () => Layer) => void layers.push(factory()),
    shortcuts: () => [DEFAULT_BIND],
    commands: () => layers.flatMap((layer) => layer.commands),
  },
  ui: {
    dialog: {
      show: (render: () => unknown, onClose?: () => void) => void (dialog = { render, ...(onClose === undefined ? {} : { onClose }) }),
      clear: () => {
        cleared += 1
        dialog?.onClose?.()
        dialog = undefined
      },
      set: (options: { size?: string }) => void (dialogSize = options.size),
      prompt: async () => undefined,
      confirm: async () => true,
    },
    toast: { show: (options: { message: string }) => void toasts.push(options.message) },
    router: { current: () => ({ type: "home" }) },
    slot: () => () => undefined,
  },
  storage: {
    store: <T extends object>(_key: string, options: { initial: T }) => [options.initial, () => Promise.resolve()] as const,
  },
  data: {
    on: (type: string, handler: () => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type)!.add(handler)
      return () => listeners.get(type)?.delete(handler)
    },
    location: { default: () => ({ directory: root }) },
    session: { message: { sync: async () => undefined, list: () => [] } },
  },
  client: {
    session: { prompt: async () => undefined, create: async () => ({ id: "ses_1" }) },
    rpc: () => ({
      status: () =>
        new Promise((resolve, reject) => {
          requests.push({ resolve, reject })
        }),
    }),
  },
  renderer: {},
}

let cleanup: (() => Promise<void> | void) | undefined
let view: Awaited<ReturnType<typeof testRender>> | undefined
const mount = async () => {
  view = await testRender(() => {
    const box = createElement("box")
    insert(box, dialog!.render() as never)
    return box
  }, { width: 140, height: 60 })
}
beforeAll(async () => {
  const plugin = (await import("../../dist/tui.js")).default
  cleanup = (await plugin.setup(context as never)) as (() => void | Promise<void>) | undefined
})
afterAll(async () => {
  await cleanup?.()
  rmSync(root, { recursive: true, force: true })
})

const frame = async () => {
  for (let index = 0; index < 5; index += 1) await Promise.resolve()
  await new Promise((resolve) => setTimeout(resolve, 100))
  await view!.flush()
  await view!.flush()
  return view!.captureCharFrame().replace(/\s+/g, "")
}

describe("the built terminal UI", () => {
  test("registers the four commands, with title case and the shortcut", () => {
    const global = layers.find((layer) => layer.mode === "global")
    expect(global?.commands.map((command) => command.title).filter(Boolean)).toEqual(["Voice: Dictate", "Voice: Status", "Voice: Speak last response", "Voice: Cancel"])
    expect(global?.commands.some((command) => command.bind === DEFAULT_BIND)).toBe(true)
  })

  test("opening the dialog adds no modal layer until its content renders", async () => {
    const statusCommand = layers.find((layer) => layer.mode === "global")?.commands.find((command) => command.id === "voice.dictation.status")
    const before = layers.filter((layer) => layer.mode === "modal").length
    await statusCommand!.run()
    expect(layers.filter((layer) => layer.mode === "modal").length).toBe(before)
    await mount()
    expect(layers.filter((layer) => layer.mode === "modal").length).toBe(before + 1)
    expect(dialogSize).toBe("large")
  })

  test("renders the one status model, and r refreshes it", async () => {
    expect(requests.length).toBe(1)
    requests[0]!.resolve(status())
    let shown = await frame()
    expect(shown).toContain("Voicestatus")
    expect(shown).toContain("Connection:Engine0.0.24(verified)")
    expect(shown).toContain("Access:Microphoneauthorized·FixtureMic")
    expect(shown).toContain("Tools:2registered·1readable")
    expect(shown).toContain("Nextstep:Nothingtodo.")
    const modal = layers.filter((layer) => layer.mode === "modal").at(-1)!
    modal.commands.find((command) => command.bind === "r")!.run()
    expect(requests.length).toBe(2)
  })

  test("the three S1 events refresh only while the dialog is open, and escape closes it", async () => {
    for (const type of ["server.connected", "mcp.status.changed", "agent.updated"]) expect(listeners.get(type)?.size).toBe(1)
    for (const handler of listeners.get("agent.updated") ?? []) handler()
    expect(requests.length).toBe(3)
    requests[2]!.resolve(status())
    await frame()
    const modal = layers.filter((layer) => layer.mode === "modal").at(-1)!
    modal.commands.find((command) => command.bind === "escape")!.run()
    expect(cleared).toBe(1)
    expect(dialog).toBeUndefined()
    for (const type of ["server.connected", "mcp.status.changed", "agent.updated"]) expect(listeners.get(type)?.size ?? 0).toBe(0)
  })

  test("a key another command owns is reported once", () => {
    expect(toasts.filter((message) => message.includes("also used by Other: Do"))).toHaveLength(1)
  })
})
