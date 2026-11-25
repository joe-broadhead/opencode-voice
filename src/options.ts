/** How much the plugin's methods may do without asking. The contract's `access` option; a user's later rule wins. */
export type Access = "all" | "ask-changes" | "read-only"

export type SubmitMode = "send" | "review"
export type StatusIndicator = "toast" | "footer"

export interface Options {
  /** Developer or organisation override for the engine binary. It is labelled unverified unless its digest matches. */
  readonly aurumPath?: string
  /** A pre-seeded model directory: files are taken from here and nothing is downloaded. */
  readonly assetsDir?: string
  /** `send` submits the transcript at once; `review` opens a prefilled dialog first. */
  readonly submit: SubmitMode
  /** The microphone key, in OpenCode's keymap syntax. */
  readonly keybind?: string
  /** Read every completed reply aloud. Off by default. */
  readonly autoSpeak: boolean
  /** The local TTS voice. */
  readonly voice: string
  /** The local STT model, as Aurum names it. */
  readonly sttModel: string
  /** A spoken language code, or `auto`. */
  readonly language: string
  /** The longest recording, in seconds. */
  readonly maxRecordSeconds: number
  /** Where the listening state shows: a toast, or the opt-in footer slot. */
  readonly statusIndicator: StatusIndicator
  /** Keep the last 20 transcripts as text. Off by default; audio is never kept. */
  readonly keepTranscripts: boolean
  /** Run on an OpenCode version outside the supported range. */
  readonly allowUntestedHost: boolean
  /** What the plugin's own methods may do without asking: everything, ask for changes, or reads only. */
  readonly access: Access
}

export interface OptionsError {
  readonly code: "OPTIONS_INVALID"
  readonly field: string
  readonly message: string
  readonly next: string
}

export type ParsedOptions =
  | { readonly ok: true; readonly options: Options }
  | { readonly ok: false; readonly error: OptionsError }

const TOP_KEYS = [
  "aurumPath",
  "assetsDir",
  "submit",
  "keybind",
  "autoSpeak",
  "voice",
  "sttModel",
  "language",
  "maxRecordSeconds",
  "statusIndicator",
  "keepTranscripts",
  "allowUntestedHost",
  "access",
]

/** The defaults `capabilities.options` declares; a test asserts that every one parses. */
export const DEFAULTS: Readonly<Record<string, unknown>> = {
  submit: "send",
  autoSpeak: false,
  voice: "Luna",
  sttModel: "tiny-q5_1",
  language: "auto",
  maxRecordSeconds: 120,
  statusIndicator: "toast",
  keepTranscripts: false,
  allowUntestedHost: false,
  access: "all",
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const fail = (field: string, message: string, next: string): ParsedOptions => ({
  ok: false,
  error: { code: "OPTIONS_INVALID", field, message, next },
})

const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim() !== "" && !/\s/.test(value)

/** Parses the plugin's options, with the manifest's defaults. An unknown or malformed option is OPTIONS_INVALID. */
export function parseOptions(input: unknown): ParsedOptions {
  const raw = input ?? {}
  if (!isRecord(raw)) return fail("options", "Plugin options must be an object.", "Set options to an object, or remove them.")
  const unknown = Object.keys(raw).find((key) => !TOP_KEYS.includes(key))
  if (unknown !== undefined) return fail(unknown, "This option is not supported.", `Remove it. Supported options: ${TOP_KEYS.join(", ")}.`)

  const aurumPath = raw.aurumPath
  if (aurumPath !== undefined && (typeof aurumPath !== "string" || aurumPath.trim() === "")) {
    return fail("aurumPath", "Must be a non-empty path.", "Set it to the absolute path of an Aurum binary, or remove it.")
  }
  const assetsDir = raw.assetsDir
  if (assetsDir !== undefined && (typeof assetsDir !== "string" || assetsDir.trim() === "")) {
    return fail("assetsDir", "Must be a non-empty path.", "Set it to a folder holding the model files, or remove it.")
  }

  const submit = raw.submit ?? DEFAULTS.submit
  if (submit !== "send" && submit !== "review") {
    return fail("submit", 'Must be "send" or "review".', 'Set it to "send" to submit at once, or "review" to edit first.')
  }

  const keybind = raw.keybind
  if (keybind !== undefined && !nonEmpty(keybind)) {
    return fail("keybind", "Must be a key combination without spaces.", 'Set it to a combination such as "ctrl+shift+space".')
  }

  const autoSpeak = raw.autoSpeak ?? DEFAULTS.autoSpeak
  if (typeof autoSpeak !== "boolean") return fail("autoSpeak", "Must be true or false.", "Set it to true to read every completed reply aloud.")

  const voice = raw.voice ?? DEFAULTS.voice
  if (!nonEmpty(voice)) return fail("voice", "Must be a local voice name.", "Use a name from the status dialog, such as Luna.")

  const sttModel = raw.sttModel ?? DEFAULTS.sttModel
  if (!nonEmpty(sttModel)) return fail("sttModel", "Must be a model name.", "Use a name from the status dialog, such as tiny-q5_1.")

  const language = raw.language ?? DEFAULTS.language
  if (typeof language !== "string" || !/^(?:auto|[a-z]{2,3}(?:-[A-Z]{2})?)$/.test(language)) {
    return fail("language", "Must be auto or a language code such as en or pt-BR.", "Set it to auto, or an ISO language code.")
  }

  const maxRecordSeconds = raw.maxRecordSeconds ?? DEFAULTS.maxRecordSeconds
  if (typeof maxRecordSeconds !== "number" || !Number.isInteger(maxRecordSeconds) || maxRecordSeconds < 5 || maxRecordSeconds > 120) {
    return fail("maxRecordSeconds", "Must be a whole number from 5 to 120.", "Set the longest recording, in seconds.")
  }

  const statusIndicator = raw.statusIndicator ?? DEFAULTS.statusIndicator
  if (statusIndicator !== "toast" && statusIndicator !== "footer") {
    return fail("statusIndicator", 'Must be "toast" or "footer".', 'Leave it "toast", or set "footer" for a listening row above the prompt.')
  }

  const keepTranscripts = raw.keepTranscripts ?? DEFAULTS.keepTranscripts
  if (typeof keepTranscripts !== "boolean") {
    return fail("keepTranscripts", "Must be true or false.", "Set it to true to keep the last 20 transcripts as text.")
  }

  const allowUntestedHost = raw.allowUntestedHost ?? DEFAULTS.allowUntestedHost
  if (typeof allowUntestedHost !== "boolean") {
    return fail("allowUntestedHost", "Must be true or false.", "Set it to true only to run on an OpenCode version outside the supported range.")
  }

  const access = raw.access ?? DEFAULTS.access
  if (access !== "all" && access !== "ask-changes" && access !== "read-only") {
    return fail("access", 'Must be "all", "ask-changes" or "read-only".', 'Set it to "ask-changes" to be asked before each change, or "read-only" to turn changes off.')
  }

  return {
    ok: true,
    options: {
      ...(aurumPath === undefined ? {} : { aurumPath }),
      ...(assetsDir === undefined ? {} : { assetsDir }),
      submit,
      ...(keybind === undefined ? {} : { keybind }),
      autoSpeak,
      voice,
      sttModel,
      language,
      maxRecordSeconds,
      statusIndicator,
      keepTranscripts,
      allowUntestedHost,
      access,
    },
  }
}
