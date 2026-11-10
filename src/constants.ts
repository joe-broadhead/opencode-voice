/** The plugin's id: the status RPC's id, the tools RPC's prefix, and the stem of its commands. */
export const PLUGIN_ID = "voice.dictation"
/** The terminal UI part's id. */
export const TUI_ID = "voice.dictation.tui"
/** The name `/voice` and `/voice-status` are built from. */
export const COMMAND_STEM = "voice"
/** The engine RPC a host such as hey-jelly calls. It is not the tools RPC: it moves audio. */
export const ENGINE_RPC_ID = `${PLUGIN_ID}.engine`
/** The model-facing namespace: `voice_status`, `voice_speak`. */
export const NAMESPACE = "voice"

/** The OpenCode versions the plugin starts on. Equals `opencode.host` in package.json. */
export const SUPPORTED_HOST = ">=2.2.3 <2.3.0"
/** The OpenCode releases every check runs on: the one list. Status calls only these "tested". */
export const TESTED_HOSTS: readonly string[] = ["2.2.3", "2.2.4", "2.2.5", "2.2.6"]

/** The microphone key, per platform. macOS uses ctrl+space for input-source switching, so it takes the shift form. */
export const DEFAULT_KEYBIND_MAC = "ctrl+shift+space"
export const DEFAULT_KEYBIND_OTHER = "ctrl+space"

/** The one error shape: `CODE: what happened. Next step: What to do.` Both parts are sentences. */
export const errorText = (code: string, message: string, nextStep: string) => `${code}: ${message} Next step: ${nextStep}`

export function voiceError(code: string, message: string, nextStep: string) {
  return Object.assign(new Error(errorText(code, message, nextStep)), { code, nextStep })
}

/** The next step for a code, as the docs table gives it. One sentence, ending in a full stop. */
export const NEXT_STEPS: Readonly<Record<string, string>> = {
  ENGINE_MISSING: "Reinstall @joe-broadhead/opencode-voice with its optional platform package, then run /voice-status.",
  ENGINE_UNVERIFIED: "Reinstall @joe-broadhead/opencode-voice; if it persists, report it.",
  ENGINE_INCOMPATIBLE: "Install the Aurum version that /voice-status names.",
  UNSUPPORTED_PLATFORM: "Use macOS on Apple silicon or Linux, or set the aurumPath option to a local engine.",
  MODEL_MISSING: "Run /voice-install to download the speech model.",
  MODEL_DOWNLOAD_FAILED: "Retry /voice-install; if it persists, check the network or proxy.",
  INTEGRITY_MISMATCH: "Retry /voice-install; if it persists, report it.",
  MIC_DENIED: "Grant microphone access in System Settings → Privacy & Security → Microphone.",
  MIC_UNAVAILABLE: "Connect a microphone, then run /voice-dictate again.",
  AUDIO_DEVICE_MISSING: "Connect an output device, then try again.",
  NO_SPEECH: "Speak again, a little closer to the microphone.",
  AUDIO_TOO_LONG: "Shorten the recording or the text.",
  BAD_AUDIO: "Send a WAV file, 16 kHz, mono, 16-bit PCM.",
  BUSY: "Wait for the current dictation to finish, or press escape to cancel it.",
  TIMEOUT: "Try again, then run the doctor in /voice.",
  CANCELLED: "Nothing to do.",
  SIDECAR_FAILED: "Run the doctor in /voice, then try again.",
  PROVIDER_AUTH_REQUIRED: "Add the provider key, or choose a local model in /voice.",
  PROVIDER_FAILED: "Try again, or choose a local model in /voice.",
  HOST_UNTESTED: "Use OpenCode >=2.2.3 <2.3.0, or set the allowUntestedHost option to run anyway.",
  OPTIONS_INVALID: "Fix the named option in opencode.json.",
  STATUS_UNAVAILABLE: "Try again, then run the doctor in /voice.",
  SKILLS_INVALID: "Reinstall @joe-broadhead/opencode-voice.",
  ENGINE_EXITED: "Run the doctor in /voice, then try again.",
  UNSUPPORTED: "Use a supported platform and engine.",
  UNCHECKED: "Call it from a session, where its approval can be answered; never from a script.",
  INPUT_INVALID: "Fix the call's input as the message says, then call it again.",
}
