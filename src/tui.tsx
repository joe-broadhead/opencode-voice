import { homedir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { Plugin } from "@opencode/plugin/tui"
import { TextAttributes } from "@opentui/core"
import { createSignal } from "solid-js"
import { COMMAND_STEM, PLUGIN_ID, TUI_ID } from "./constants.js"
import { DictationFlow } from "./dictation/flow.js"
import { label, type Phase } from "./dictation/state.js"
import { ModelStore, defaultCacheRoot } from "./engine/assets.js"
import { resolveEngine, type EngineInfo } from "./engine/binary.js"
import { runDoctor } from "./engine/doctor.js"
import { SpeechEngine } from "./engine/index.js"
import { asEngineError } from "./engine/errors.js"
import { installModels } from "./commands.js"
import { parseOptions } from "./options.js"
import { buildStatus, formatStatus, type Status } from "./status.js"

const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url))
const TITLE = "Voice status"

type ToastKind = "info" | "success" | "warning" | "error"

interface Settings {
  submit: "send" | "review"
  autoSpeak: boolean
}

/** The session the prompt is routed to, if the route is a session. */
function activeSession(context: Plugin.Context): string | undefined {
  const route = context.ui.router.current()
  return typeof route === "object" && route !== null && route.type === "session" ? route.sessionID : undefined
}

export default Plugin.define({
  id: TUI_ID,
  async setup(context) {
    const parsed = parseOptions(context.options)
    if (parsed.ok === false) {
      context.ui.toast.show({ message: `${parsed.error.code}: ${parsed.error.message}`, variant: "error" })
      return
    }
    const options = parsed.options
    const keybind = options.keybind ?? (process.platform === "darwin" ? "ctrl+shift+space" : "ctrl+space")

    const [stored, updateStored] = context.storage.store<Settings>("settings", {
      initial: { submit: options.submit, autoSpeak: options.autoSpeak },
    })
    const settings = (): Settings => ({
      submit: stored.submit === "review" ? "review" : "send",
      autoSpeak: stored.autoSpeak === true,
    })

    let engineInfo: EngineInfo | undefined
    try {
      engineInfo = resolveEngine({ packageRoot: PACKAGE_ROOT, ...(options.aurumPath === undefined ? {} : { optionPath: options.aurumPath }) })
    } catch {
      engineInfo = undefined
    }
    const modelStore = new ModelStore({
      cacheRoot: defaultCacheRoot(homedir(), process.platform),
      manifestPath: process.env.VOICE_MODELS_MANIFEST ?? join(PACKAGE_ROOT, "manifest", "models.json"),
      ...(options.assetsDir === undefined ? {} : { assetsDir: options.assetsDir }),
    })
    const engine =
      engineInfo === undefined
        ? undefined
        : new SpeechEngine({
            bin: engineInfo.path,
            model: options.sttModel,
            language: options.language,
            cacheRoot: defaultCacheRoot(homedir(), process.platform),
            voice: options.voice,
            maxRecordSeconds: options.maxRecordSeconds,
          })

    const [, setPhase] = createSignal<Phase>("idle")
    const [line, setLine] = createSignal<string | undefined>(undefined)
    const [, setLastTranscript] = createSignal<string | undefined>(undefined)

    const toast = (message: string, variant: ToastKind = "info") => context.ui.toast.show({ message, variant })
    const status = (next: Phase, text?: string) => {
      if (next === "idle") {
        setPhase("idle")
        setLine(undefined)
      } else {
        setPhase(next)
        setLine(text === undefined ? label(next) : `${label(next)}${text === "pause" ? " · pause" : ""}`)
      }
      if (options.statusIndicator === "toast" && next !== "idle" && next !== "preparing") {
        // The toast is the only always-available surface S1 permits; it is transient by design.
      }
    }

    const flow = new DictationFlow({
      engine: engine as SpeechEngine,
      activeSession: () => activeSession(context),
      submit: (sessionID, text) =>
        context.client.session.prompt({ sessionID, text }).then(() => undefined),
      review: (text) => context.ui.dialog.prompt({ title: "Voice transcript", description: "Edit before sending", value: text }),
      toast,
      status,
      submitMode: () => settings().submit,
      record: (text) => setLastTranscript(text),
    })

    // The opt-in footer row (an S1 exception): one line, only while a turn is active.
    let footerDispose: (() => void) | undefined
    if (options.statusIndicator === "footer") {
      footerDispose = context.ui.slot({
        append: "prompt.footer.status",
        render: () => {
          const text = line()
          return text === undefined ? <text> </text> : <text fg={context.theme.text.muted}>{`Voice: ${text}`}</text>
        },
      })
    }

    const requireEngine = (): SpeechEngine | undefined => {
      if (engine === undefined) {
        toast("ENGINE_MISSING: The speech engine is not installed. Reinstall the package.", "error")
        return undefined
      }
      return engine
    }

    const dictate = async () => {
      if (requireEngine() === undefined) return
      await flow.start()
    }
    const speakLast = async () => {
      if (requireEngine() === undefined) return
      const sessionID = activeSession(context)
      if (sessionID === undefined) {
        toast("Open a session first", "warning")
        return
      }
      await context.data.session.message.sync(sessionID)
      const messages = context.data.session.message.list(sessionID)
      for (let index = messages.length - 1; index >= 0; index -= 1) {
        const message = messages[index] as { type?: string; content?: { type?: string; text?: string }[] }
        if (message?.type !== "assistant") continue
        const text = (message.content ?? []).filter((part) => part.type === "text").map((part) => part.text ?? "").join("\n")
        if (text.trim() === "") continue
        await flow.speak(text, { markdown: true })
        return
      }
      toast("There is no reply to read aloud", "info")
    }

    const readStatus = async (): Promise<Status> => {
      const models = await modelStore.inspect().catch(() => undefined)
      const manifest = await modelStore.manifest().catch(() => undefined)
      const check = engineInfo === undefined ? undefined : await runDoctor(engineInfo.path).catch(() => undefined)
      const missing = check?.filter((entry) => !entry.ok).length ?? 0
      const microphone =
        check === undefined
          ? "unknown"
          : (() => {
              const entry = check.find((item) => item.id === "microphone" || item.id === "mic")
              if (entry === undefined) return "unknown"
              const text = `${entry.detail} ${entry.next ?? ""}`.toLowerCase()
              if (/not determined|notdetermined|not yet/.test(text)) return "not_determined"
              if (/denied/.test(text)) return "denied"
              if (/restricted/.test(text)) return "restricted"
              return entry.ok ? "authorized" : "unknown"
            })()
      return buildStatus({
        host: { version: context.app.version, range: ">=2.2.3 <2.3.0", tested: ["2.2.3", "2.2.4", "2.2.5"].includes(context.app.version) },
        ...(engineInfo === undefined ? {} : { engine: engineInfo }),
        ...(models === undefined ? {} : { models }),
        ...(manifest === undefined ? {} : { modelsVersion: manifest.version }),
        ...(check === undefined ? {} : { doctor: check }),
        microphone: microphone as Status["microphone"]["permission"],
        options: { ...options, submit: settings().submit, autoSpeak: settings().autoSpeak },
        keybind,
        sidecar: flow.state,
        unguardedAgents: [],
        ...(missing === 0 ? {} : { problems: [`${missing} doctor check${missing === 1 ? "" : "s"} failed.`] }),
      })
    }

    const openStatus = () => {
      const [reading, setReading] = createSignal(true)
      const [text, setText] = createSignal("Reading the voice status…")
      const refresh = () => {
        setReading(true)
        void readStatus()
          .then((status) => {
            setText(formatStatus(status).split("\n").slice(1).join("\n"))
          }, (error: unknown) => setText(asEngineError(error).message))
          .then(() => setReading(false))
      }
      context.keymap.layer(() => ({
        mode: "modal",
        commands: [
          { title: "Refresh the voice status", group: "Voice", bind: "r", run: () => refresh() },
          { title: "Install the speech models", group: "Voice", bind: "i", run: () => install() },
          { title: "Run the voice doctor", group: "Voice", bind: "d", run: () => doctor() },
          { title: "Toggle review before sending", group: "Voice", bind: "s", run: () => toggleSubmit() },
          { title: "Toggle auto-speak", group: "Voice", bind: "a", run: () => toggleAutoSpeak() },
          { title: "Close the voice status", group: "Voice", bind: "escape", run: () => context.ui.dialog.clear() },
        ],
      }))
      const install = () => {
        setText("Downloading the speech models…")
        void installModels(modelStore, new AbortController().signal).then(
          (result) => {
            toast(result.downloaded.length === 0 ? "Every speech model is already installed" : "Speech models installed", "success")
            refresh()
          },
          (error: unknown) => setText(asEngineError(error).message),
        )
      }
      const doctor = () => {
        if (engineInfo === undefined) {
          setText("ENGINE_MISSING: The speech engine is not installed.")
          return
        }
        setText("Running the voice doctor…")
        void runDoctor(engineInfo.path).then(
          (checks) => setText(checks.map((check) => `${check.ok ? "ok" : "failed"} · ${check.id}: ${check.detail}`).join("\n")),
          (error: unknown) => setText(asEngineError(error).message),
        )
      }
      const toggleSubmit = () => {
        const next = settings().submit === "send" ? "review" : "send"
        updateStored((draft) => void (draft.submit = next))
        toast(next === "review" ? "Voice: review before sending" : "Voice: send on pause", "info")
        refresh()
      }
      const toggleAutoSpeak = () => {
        const next = !settings().autoSpeak
        updateStored((draft) => void (draft.autoSpeak = next))
        toast(next ? "Voice: read replies aloud" : "Voice: auto-speak off", "info")
        refresh()
      }
      context.ui.dialog.show(
        () => (
          <box flexDirection="column" gap={1} paddingLeft={2} paddingRight={2} paddingBottom={1}>
            <box flexDirection="row" justifyContent="space-between">
              <text fg={context.theme.text.base} attributes={TextAttributes.BOLD}>
                {TITLE}
              </text>
              <text fg={context.theme.text.muted}>{reading() ? "refreshing…" : "r refresh · esc close"}</text>
            </box>
            <text fg={context.theme.text.base} wrapMode="word">
              {text()}
            </text>
            <text fg={context.theme.text.muted}>i install · d doctor · s send/review · a auto-speak</text>
          </box>
        ),
      )
      refresh()
    }

    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: `${PLUGIN_ID}.dictate`,
          title: "Voice: dictate",
          description: "Start dictation; a pause or a second press sends it",
          group: "Voice",
          palette: true,
          bind: keybind,
          slash: { name: `${COMMAND_STEM}-dictate` },
          run: () => void dictate(),
        },
        {
          id: `${PLUGIN_ID}.status`,
          title: "Voice: status",
          description: "The engine, the models, the microphone and the next step",
          group: "Voice",
          palette: true,
          slash: { name: COMMAND_STEM },
          run: () => openStatus(),
        },
        {
          id: `${PLUGIN_ID}.speak`,
          title: "Voice: speak last response",
          description: "Read the last assistant reply aloud",
          group: "Voice",
          palette: true,
          slash: { name: `${COMMAND_STEM}-speak` },
          run: () => void speakLast(),
        },
        {
          id: `${PLUGIN_ID}.cancel`,
          title: "Voice: cancel",
          description: "Stop the recording, transcription or playback",
          group: "Voice",
          bind: "escape",
          enabled: () => flow.active || flow.state === "playing",
          run: () => flow.cancel(),
        },
      ],
    }))

    // Auto-speak: one reply per completed run in the active session, unless it was already spoken.
    const stops: (() => void)[] = []
    let spoken = new Set<string>()
    stops.push(
      context.data.on("session.execution.succeeded", (event) => {
        if (!settings().autoSpeak) return
        const data = event.data as { sessionID?: string } | undefined
        if (data?.sessionID === undefined || data.sessionID !== activeSession(context)) return
        void context.data.session.message.sync(data.sessionID).then(() => {
          const messages = context.data.session.message.list(data.sessionID!)
          for (let index = messages.length - 1; index >= 0; index -= 1) {
            const message = messages[index] as { id?: string; type?: string; content?: { type?: string; text?: string }[] }
            if (message?.type !== "assistant" || message.id === undefined || spoken.has(message.id)) continue
            const text = (message.content ?? []).filter((part) => part.type === "text").map((part) => part.text ?? "").join("\n")
            if (text.trim() === "") continue
            spoken.add(message.id)
            if (spoken.size > 100) spoken = new Set([...spoken].slice(-50))
            void flow.speak(text, { markdown: true })
            return
          }
        })
      }),
    )

    return async () => {
      for (const stop of stops) stop()
      footerDispose?.()
      flow.cancel()
      await engine?.dispose()
    }
  },
})
