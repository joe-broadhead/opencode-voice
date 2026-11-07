import { homedir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { Plugin } from "@opencode/plugin/tui"
import { TextAttributes } from "@opentui/core"
import { createSignal } from "solid-js"
import { COMMAND_STEM, DEFAULT_KEYBIND_MAC, DEFAULT_KEYBIND_OTHER, PLUGIN_ID, TUI_ID } from "./constants.js"
import { installAll, installRequest } from "./commands.js"
import { DictationFlow } from "./dictation/flow.js"
import { TranscriptHistory, type HistoryEntry } from "./dictation/history.js"
import { label, type Phase } from "./dictation/state.js"
import { ModelStore, defaultCacheRoot } from "./engine/assets.js"
import { resolveEngine, type EngineInfo } from "./engine/binary.js"
import { runDoctor } from "./engine/doctor.js"
import { SpeechEngine } from "./engine/index.js"
import { asEngineError } from "./engine/errors.js"
import { parseOptions } from "./options.js"
import { oneLine, cut } from "./redact.js"
import { formatStatus, type Status } from "./status.js"

const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url))
const TITLE = "Voice status"
const STATUS_METHODS = { status: { input: { type: "object" }, output: { type: "object" } } }

type ToastKind = "info" | "success" | "warning" | "error"

interface Settings {
  submit: "send" | "review"
  autoSpeak: boolean
}

interface HistoryState {
  entries: HistoryEntry[]
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
    const keybind = options.keybind ?? (process.platform === "darwin" ? DEFAULT_KEYBIND_MAC : DEFAULT_KEYBIND_OTHER)

    const [stored, updateStored] = context.storage.store<Settings>("settings", {
      initial: { submit: options.submit, autoSpeak: options.autoSpeak },
    })
    const settings = (): Settings => ({
      submit: stored.submit === "review" ? "review" : "send",
      autoSpeak: stored.autoSpeak === true,
    })

    const [historyState, updateHistoryState] = context.storage.store<HistoryState>("history", { initial: { entries: [] } })
    const history = new TranscriptHistory({
      read: () => (Array.isArray(historyState.entries) ? historyState.entries : []),
      write: async (entries) => updateHistoryState((draft) => void (draft.entries = [...entries])),
    })

    const cacheRoot = defaultCacheRoot(homedir(), process.platform)
    const engineCacheDir = join(cacheRoot, "engine")
    let engineInfo: EngineInfo | undefined
    try {
      engineInfo = resolveEngine({ packageRoot: PACKAGE_ROOT, cacheRoot, ...(options.aurumPath === undefined ? {} : { optionPath: options.aurumPath }) })
    } catch {
      engineInfo = undefined
    }
    const modelStore = new ModelStore({
      cacheRoot,
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
            cacheRoot,
            voice: options.voice,
            maxRecordSeconds: options.maxRecordSeconds,
            preflight: (role: "stt" | "tts") => modelStore.verifyRoles(role === "stt" ? ["stt"] : ["tts-model", "tts-voices", "tts-config"]),
          })

    const [, setPhase] = createSignal<Phase>("idle")
    const [line, setLine] = createSignal<string | undefined>(undefined)
    const [conflict, setConflict] = createSignal<{ key: string; command: string } | undefined>(undefined)

    const toast = (message: string, variant: ToastKind = "info") => context.ui.toast.show({ message, variant })
    const status = (next: Phase, text?: string) => {
      if (next === "idle") {
        setPhase("idle")
        setLine(undefined)
      } else {
        setPhase(next)
        setLine(text === undefined ? label(next) : `${label(next)}${text === "pause" ? " · pause" : ""}`)
      }
    }

    const flow = new DictationFlow({
      engine: engine as SpeechEngine,
      activeSession: () => activeSession(context),
      submit: (sessionID, text) => context.client.session.prompt({ sessionID, text }).then(() => undefined),
      review: (text) => context.ui.dialog.prompt({ title: "Voice transcript", description: "Edit before sending", value: text }),
      toast,
      status,
      submitMode: () => settings().submit,
      record: (text) => {
        if (options.keepTranscripts) void history.add(text)
      },
    })

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

    /** The one status model: the same RPC the server registers, never a second copy here. */
    const readStatus = async (): Promise<Status> => {
      const client = context.client.rpc({ id: PLUGIN_ID, methods: STATUS_METHODS, events: {} } as never) as unknown as {
        status: (input: unknown, options: unknown) => Promise<Status>
      }
      return client.status({}, { location: context.location ?? context.data.location.default() })
    }

    const openStatus = () => {
      const [text, setText] = createSignal("Reading the voice status…")
      const [busy, setBusy] = createSignal(false)
      const [current, setCurrent] = createSignal<Status | undefined>(undefined)
      let stopped = false
      const stops: (() => void)[] = []

      const refresh = () => {
        if (stopped) return
        setBusy(true)
        void readStatus()
          .then((status) => {
            if (stopped) return
            setCurrent(status)
            const rows = formatStatus(status).split("\n").slice(1).join("\n")
            setText(conflict() === undefined ? rows : `Keybind: ${conflict()!.key} is also used by ${conflict()!.command}\n${rows}`)
          }, (error: unknown) => setText(cut(oneLine(asEngineError(error).message), 400)))
          .then(() => setBusy(false))
      }

      const install = async () => {
        const target = { packageRoot: PACKAGE_ROOT, cacheRoot, store: modelStore }
        const request = await installRequest(target)
        if (request.files.length === 0) {
          toast("The engine and every speech model are already installed", "info")
          refresh()
          return
        }
        const confirmed = await context.ui.dialog.confirm({
          title: "Voice",
          message: `Download ${request.engine ? "the Aurum engine and " : ""}${request.files.length} file${request.files.length === 1 ? "" : "s"} (${Math.round(request.bytes / (1024 * 1024))} MB) from ${request.hosts.join(", ")}?`,
          label: { confirm: "Download", cancel: "Cancel" },
        })
        if (confirmed !== true) return
        setText("Downloading the engine and speech models…")
        void installAll(target, new AbortController().signal, async () => undefined).then(
          (result) => {
            toast(result.downloaded.length === 0 ? "Everything is already installed" : "Speech installed", "success")
            refresh()
          },
          (error: unknown) => setText(cut(oneLine(asEngineError(error).message), 400)),
        )
      }

      const doctor = async () => {
        if (engineInfo === undefined) {
          setText("ENGINE_MISSING: The speech engine is not installed.")
          return
        }
        setText("Running the voice doctor…")
        const checks = await runDoctor(engineInfo.path, { cacheDir: engineCacheDir }).catch((error: unknown) => asEngineError(error))
        if (checks instanceof Error) {
          setText(cut(oneLine(checks.message), 400))
          return
        }
        const probe = await import("./engine/binary.js").then(({ probeEngine }) => probeEngine(engineInfo!.path))
        const lines = [
          `Engine: ${probe.version ?? "unknown"} (${probe.compatible ? "compatible" : "too old"})`,
          ...checks.map((check) => `${check.ok ? "ok" : "failed"} · ${check.id}: ${cut(oneLine(check.detail), 120)}`),
          `Models: ${(await modelStore.inspect().catch(() => [])).map((asset) => `${asset.name} ${asset.state}`).join(", ") || "none"}`,
        ]
        setText(lines.join("\n"))
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
      const clearHistory = () => {
        void history.clear().then(() => {
          toast("Voice: transcript history cleared", "info")
          refresh()
        })
      }

      const StatusDialog = () => {
        context.keymap.layer(() => ({
          mode: "modal",
          commands: [
            { title: "Refresh the voice status", group: "Voice", bind: "r", run: () => refresh() },
            { title: "Install the speech models", group: "Voice", bind: "i", run: () => void install() },
            { title: "Run the voice doctor", group: "Voice", bind: "d", run: () => void doctor() },
            { title: "Toggle review before sending", group: "Voice", bind: "s", run: () => toggleSubmit() },
            { title: "Toggle auto-speak", group: "Voice", bind: "a", run: () => toggleAutoSpeak() },
            { title: "Clear the transcript history", group: "Voice", bind: "c", run: () => clearHistory() },
            { title: "Close the voice status", group: "Voice", bind: "escape", run: () => context.ui.dialog.clear() },
          ],
        }))
        const theme = context.theme.text
        return (
          <box flexDirection="column" gap={1} paddingLeft={2} paddingRight={2} paddingBottom={1}>
            <box flexDirection="row" justifyContent="space-between">
              <text fg={theme.base} attributes={TextAttributes.BOLD}>
                {TITLE}
              </text>
              <text fg={theme.muted}>{busy() ? "refreshing…" : "r refresh · esc close"}</text>
            </box>
            <text fg={theme.base} wrapMode="word">
              {text()}
            </text>
            <text fg={theme.muted}>
              {`i install · d doctor · s send/review · a auto-speak · c clear history${current() === undefined ? "" : ` · ${historySummary(current()!, history.count())}`}`}
            </text>
          </box>
        )
      }

      const subscribed = ["server.connected", "mcp.status.changed", "agent.updated"].flatMap((type) =>
        [context.data.on(type as never, () => refresh())],
      )
      stops.push(...subscribed)
      context.ui.dialog.show(() => <StatusDialog />, () => {
        stopped = true
        for (const stop of stops.splice(0)) stop()
      })
      context.ui.dialog.set({ size: "large" })
      refresh()
    }

    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: `${PLUGIN_ID}.dictate`,
          title: "Voice: Dictate",
          description: "Start dictation; a pause or a second press sends it",
          group: "Voice",
          palette: true,
          bind: keybind,
          slash: { name: `${COMMAND_STEM}-dictate` },
          run: () => void dictate(),
        },
        {
          id: `${PLUGIN_ID}.status`,
          title: "Voice: Status",
          description: "The engine, the models, the microphone and the next step",
          group: "Voice",
          palette: true,
          slash: { name: COMMAND_STEM },
          run: () => openStatus(),
        },
        {
          id: `${PLUGIN_ID}.speak`,
          title: "Voice: Speak last response",
          description: "Read the last assistant reply aloud",
          group: "Voice",
          palette: true,
          slash: { name: `${COMMAND_STEM}-speak` },
          run: () => void speakLast(),
        },
        {
          id: `${PLUGIN_ID}.cancel`,
          title: "Voice: Cancel",
          description: "Stop the recording, transcription or playback",
          group: "Voice",
          bind: "escape",
          enabled: () => flow.active || flow.state === "playing",
          run: () => flow.cancel(),
        },
      ],
    }))

    // A key another plugin already owns is reported, once, and in the dialog: registering it is silent otherwise.
    const owner = context.keymap.commands().find((command) => command.bind === keybind && command.id !== `${PLUGIN_ID}.dictate`)
    if (owner !== undefined) {
      const found = { key: keybind, command: owner.title ?? owner.id ?? "another command" }
      setConflict(found)
      toast(`Voice: ${keybind} is also used by ${found.command}`, "warning")
    }

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

/** The dialog's footer names the history state and its count. */
function historySummary(status: Status, count: number): string {
  return status.privacy.transcriptHistory ? `history ${count}/${20}` : "history off"
}
