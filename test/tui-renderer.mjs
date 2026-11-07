// Render smoke test of the built TUI part, dist/tui.js, on OpenTUI 0.8's test renderer with a fake TUI context.
// test/unit/tui.test.ts builds the bundle and runs this:
//   bun --conditions=browser test/tui-renderer.mjs
// The browser condition loads Solid's reactive build, as the OpenCode TUI does. It covers the three states the exit
// check names: empty, healthy and stopped, plus r, esc, the palette's pause command and the event subscription that
// lasts only while it is open.
import assert from "node:assert/strict"

const { createComponent, createSignal, Show } = await import("solid-js")
const { createElement, insert, testRender } = await import("@opentui/solid")
const { default: plugin } = await import("../dist/tui.js")

const HOST = { version: "2.2.3", range: ">=2.2.3 <2.3.0", tested: true }
const RULE = { action: "*", resource: "*", effect: "deny" }
const status = (overrides = {}) => ({
  version: "0.0.0-test",
  state: "ready",
  host: HOST,
  jobs: { total: 0, paused: 0, expiring: 0, invalidFiles: 0 },
  runner: null,
  liveness: { everyMinutes: 20 },
  nextRuns: [],
  recentRuns: [],
  failures: [],
  unguardedAgents: [],
  missingAgents: [],
  problems: [],
  nextStep: "Nothing to do.",
  ...overrides,
})
const empty = status()
const healthy = status({
  jobs: { total: 2, paused: 0, expiring: 0, invalidFiles: 0 },
  runner: { location: "/fixture/project", pid: 41, since: Date.UTC(2026, 11, 6, 8, 0, 0) },
  liveness: { everyMinutes: 20, lastBeatAt: Date.UTC(2026, 11, 6, 8, 20, 0), lastBeatOk: true },
  nextRuns: [{ id: "morning", name: "Morning brief", at: Date.UTC(2026, 11, 7, 7, 0, 0) }],
  recentRuns: [{ job: "morning", name: "Morning brief", slot: "2026-12-06T08:00:00.000Z", status: "succeeded", late: false, attempt: 1, durationMs: 4_200 }],
})
const stopped = status({
  jobs: { total: 2, paused: 1, expiring: 0, invalidFiles: 0 },
  runner: { location: "/fixture/project", pid: 41, since: Date.UTC(2026, 11, 6, 8, 0, 0), stoppedAt: Date.UTC(2026, 11, 6, 9, 30, 0) },
  paused: { at: Date.UTC(2026, 11, 6, 9, 35, 0) },
  unguardedAgents: ["build"],
  permissionsBlock: [RULE],
  nextStep: "Run /jobs-pause again to resume every job.",
})

const requests = []
const commands = []
const created = []
const removed = []
const handlers = new Map()
const layers = []
let dialogSize
const confirms = []
const [dialog, setDialog] = createSignal()
const theme = {
  text: { base: "#ffffff", muted: "#888888", faint: "#666666", feedback: { success: { base: "#00ff00" }, warning: { base: "#ffff00" }, error: { base: "#ff0000" } } },
}
theme.surface = () => theme
const context = {
  location: { directory: "/fixture/project" },
  theme,
  client: {
    rpc: () => ({
      status: (input, options) => new Promise((resolve, reject) => requests.push({ input, options, resolve, reject })),
    }),
    session: {
      create: async (input) => {
        created.push(input)
        return { id: `ses_tui_${created.length}` }
      },
      command: async (input) => void commands.push(input),
      remove: async ({ sessionID }) => void removed.push(sessionID),
    },
  },
  data: {
    location: { default: () => ({ directory: "/fixture/default" }) },
    on: (type, handler) => {
      if (!handlers.has(type)) handlers.set(type, new Set())
      handlers.get(type).add(handler)
      return () => handlers.get(type).delete(handler)
    },
  },
  keymap: { layer: (factory) => layers.push(factory()) },
  ui: {
    dialog: {
      show: (render, onClose) => {
        const before = dialog()
        setDialog(() => ({ render, onClose }))
        before?.onClose?.()
      },
      set: (options) => (dialogSize = options.size),
      confirm: async (options) => {
        confirms.push(options)
        return true
      },
      clear: () => {
        const open = dialog()
        setDialog(undefined)
        open?.onClose?.()
      },
    },
  },
}
const emit = (type, data = {}) => {
  for (const handler of [...(handlers.get(type) ?? [])]) handler({ type, data })
}
const settle = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve()
}
const squash = (text) => text.replace(/\s+/g, "")
const listeners = () => [...handlers.values()].reduce((sum, set) => sum + set.size, 0)

const cleanup = plugin.setup(context)
// Nothing is read or watched until the dialog opens.
assert.equal(requests.length, 0)
assert.equal(listeners(), 0)

const palette = layers.flatMap((layer) => (layer.mode === "global" ? layer.commands : []))
assert.equal(palette.length, 2)
assert.equal(palette[0].title, "Jobs: Status")
assert.equal(palette[0].palette, true)
assert.deepEqual(palette[0].slash, { name: "jobs" })
assert.equal(palette[1].title, "Jobs: Pause or resume every job")

let view
try {
  view = await testRender(() => {
    const root = createElement("box")
    insert(root, createComponent(Show, { get when() { return dialog() }, children: (open) => open().render() }))
    return root
  }, { width: 120, height: 80 })
  const frame = async () => {
    await settle()
    await view.flush()
    return view.captureCharFrame()
  }
  const modal = () => layers.filter((layer) => layer.mode === "modal").at(-1).commands

  // Empty: the palette command opens the dialog, reads the status and shows the report.
  palette[0].run()
  assert.equal(dialogSize, "large")
  assert.equal(requests.length, 1)
  assert.match(await frame(), /Reading the job status…/)
  requests[0].resolve(empty)
  let shown = squash(await frame())
  assert.ok(shown.includes(squash("Jobs status")), "title")
  assert.ok(shown.includes(squash("- Runner: no leader yet")), "empty runner")
  assert.ok(shown.includes(squash("- Jobs: none yet")), "empty jobs")
  assert.ok(shown.includes(squash("r refresh · esc close")), "key hint")

  // Healthy: the leader, the beat, the next run and the last run are the model's own rows.
  modal().find((command) => command.bind === "r").run()
  assert.equal(requests.length, 2)
  requests[1].resolve(healthy)
  shown = squash(await frame())
  assert.ok(shown.includes(squash("leader in /fixture/project (pid 41)")), "leader")
  assert.ok(shown.includes(squash("last beat 2026-12-06T08:20:00.000Z ok")), "beat")
  assert.ok(shown.includes(squash("Next runs: Morning brief at 2026-12-07T07:00:00.000Z")), "next run")
  assert.ok(shown.includes(squash("Recent runs: Morning brief succeeded 4 s")), "recent run")

  // Stopped: every job paused, the leader stopped, an agent that needs the block, and p now resumes.
  requests.length = 0
  modal().find((command) => command.bind === "r").run()
  requests[0].resolve(stopped)
  shown = squash(await frame())
  assert.ok(shown.includes(squash("paused since 2026-12-06T09:35:00.000Z")), "pause")
  assert.ok(shown.includes(squash("stopped from 2026-12-06T09:30:00.000Z")), "stopped runner")
  assert.ok(shown.includes(squash("Agents without default rules: build")), "unguarded agent")
  assert.ok(shown.includes(squash('Paste this for "build" into opencode.json:')), "the block to paste")
  assert.ok(shown.includes(squash("Run /jobs-pause again to resume every job.")), "pause next step")
  assert.ok(shown.includes(squash("r refresh · esc close")), "key hint")

  // The palette's kill switch asks first, then runs the same /jobs-pause command a person types, in a session it makes
  // and removes, and refreshes. The dialog itself only reads.
  const before = requests.length
  assert.deepEqual(modal().map((command) => command.bind), ["r", "escape"])
  await palette[1].run()
  await settle()
  assert.equal(confirms.length, 1)
  assert.match(confirms[0].message, /every job/)
  assert.deepEqual(created[0], { location: context.location, title: "Jobs status" })
  assert.deepEqual(commands, [{ sessionID: "ses_tui_1", name: "jobs-pause", text: "" }])
  assert.deepEqual(removed, ["ses_tui_1"])
  assert.equal(requests.length, before + 1)
  requests.at(-1).resolve(empty)
  await frame()

  // Only while open: reconnect, agent and idle events refresh; closing releases every listener.
  emit("server.connected")
  emit("agent.updated")
  emit("session.idle")
  assert.equal(requests.length, before + 4)
  for (const request of requests.slice(before + 1)) request.resolve(empty)
  await frame()
  assert.equal(listeners(), 3)
  modal().find((command) => command.bind === "escape").run()
  assert.equal(listeners(), 0)
  assert.doesNotMatch(await frame(), /Jobs status/)
  const closed = requests.length
  emit("server.connected")
  assert.equal(requests.length, closed)

  // A failure while open says why and what to do.
  palette[0].run()
  requests.at(-1).reject({ type: "unavailable", message: "STATUS_UNAVAILABLE: Could not read the job status (boom).", data: { nextStep: "Restart OpenCode, then run /jobs-status again." } })
  shown = squash(await frame())
  assert.ok(shown.includes(squash("STATUS_UNAVAILABLE: Could not read the job status (boom).")), "error message")
  assert.ok(shown.includes(squash("Next step: Restart OpenCode, then run /jobs-status again.")), "error next step")

  cleanup()
  cleanup()
  assert.equal(listeners(), 0)
  assert.equal(dialog(), undefined)
  console.log("PASS dist/tui.js renders the empty, healthy and stopped states on OpenTUI 0.8")
} finally {
  cleanup?.()
  await view?.dispose()
}
