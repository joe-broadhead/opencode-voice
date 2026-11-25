/** The plugin's contract name: its id, tool namespace, RPC id, permission action stem and command stem. */
export const PLUGIN_NAME = "voice"
/** The terminal UI part's id. The TUI is a second plugin definition, outside the manifest's methods. */
export const TUI_ID = "voice-tui"
/** The name `/voice`, `/voice-status` and the other commands are built from. */
export const COMMAND_STEM = "voice"

/** The microphone key, per platform. macOS uses ctrl+space for input-source switching, so it takes the shift form. */
export const DEFAULT_KEYBIND_MAC = "ctrl+shift+space"
export const DEFAULT_KEYBIND_OTHER = "ctrl+space"

/** The dictation key this platform defaults to. */
export const defaultKeybind = (platform: string = process.platform) =>
  platform === "darwin" ? DEFAULT_KEYBIND_MAC : DEFAULT_KEYBIND_OTHER
