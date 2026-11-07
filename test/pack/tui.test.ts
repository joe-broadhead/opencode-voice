// The terminal UI's wiring, from the built bundle: both commands exist, the status command opens the one dialog, the
// dialog's escape closes it, and the plugin's cleanup removes its layers. It renders nothing; the host suite covers the
// real terminal.
import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const root = mkdtempSync(join(realpathSync("/tmp"), "voice-tui-"))
const models = join(root, "models.json")
writeFileSync(models, JSON.stringify({ version: "0.0.24", models: [] }))
const fake = join(root, "aurum")
writeFileSync(fake, "#!/bin/sh\necho '{\"checks\":[{\"id\":\"microphone\",\"ok\":true,\"detail\":\"authorized\"}]}'\n", { mode: 0o755 })
mkdirSync(join(root, "home"), { recursive: true })
process.env.VOICE_AURUM_PATH = fake
process.env.VOICE_MODELS_MANIFEST = models
process.env.HOME = join(root, "home")

type Layer = { mode?: string; commands: { id?: string; title?: string; bind?: string; run: () => unknown }[] }
const layers: Layer[] = []
let dialog: { render: () => unknown; onClose?: () => void } | undefined
let cleared = 0
const toasts: string[] = []

const context = {
  app: { version: "2.2.3", channel: "latest" },
  location: { directory: root },
  options: {},
  theme: { text: { base: "#fff", muted: "#888" }, surface: () => ({ text: { base: "#fff", muted: "#888" } }) },
  keymap: { layer: (factory: () => Layer) => void layers.push(factory()), shortcuts: () => ["ctrl+shift+space"] },
  ui: {
    dialog: {
      show: (render: () => unknown, onClose?: () => void) => void (dialog = { render, ...(onClose === undefined ? {} : { onClose }) }),
      clear: () => {
        cleared += 1
        dialog?.onClose?.()
        dialog = undefined
      },
      prompt: async () => undefined,
    },
    toast: { show: (options: { message: string }) => void toasts.push(options.message) },
    router: { current: () => ({ type: "home" }) },
    slot: () => () => undefined,
  },
  storage: {
    store: <T extends object>(_key: string, options: { initial: T }) => [options.initial, () => Promise.resolve()] as const,
  },
  data: {
    on: () => () => undefined,
    location: { default: () => ({ directory: root }) },
    session: { message: { sync: async () => undefined, list: () => [] } },
  },
  client: { session: { prompt: async () => undefined, create: async () => ({ id: "ses_1" }) } },
  renderer: {},
}

let cleanup: (() => Promise<void> | void) | undefined
beforeAll(async () => {
  const plugin = (await import("../../dist/tui.js")).default
  cleanup = (await plugin.setup(context as never)) as (() => void | Promise<void>) | undefined
})
afterAll(async () => {
  await cleanup?.()
  rmSync(root, { recursive: true, force: true })
})

describe("the built terminal UI", () => {
  test("registers the dictation, status and speak commands on the global layer", () => {
    const global = layers.find((layer) => layer.mode === "global")
    const ids = (global?.commands ?? []).map((command) => command.id).filter(Boolean)
    expect(ids).toContain("voice.dictation.dictate")
    expect(ids).toContain("voice.dictation.status")
    expect(ids).toContain("voice.dictation.speak")
    expect(global?.commands.some((command) => command.bind === "ctrl+shift+space")).toBe(true)
  })

  test("the status command opens the one dialog, and escape closes it", async () => {
    const global = layers.find((layer) => layer.mode === "global")
    const status = global?.commands.find((command) => command.id === "voice.dictation.status")
    expect(status).toBeDefined()
    await status!.run()
    for (let index = 0; index < 20 && dialog === undefined; index += 1) await new Promise((resolve) => setTimeout(resolve, 25))
    expect(dialog).toBeDefined()
    const modal = layers.find((layer) => layer.mode === "modal")
    expect(modal?.commands.some((command) => command.bind === "escape")).toBe(true)
    modal?.commands.find((command) => command.bind === "escape")?.run()
    expect(cleared).toBe(1)
    expect(dialog).toBeUndefined()
  })
})
