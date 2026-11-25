/** The terminal UI part's id. The TUI is a second plugin definition, outside the manifest's methods. */
export const TUI_ID = "voice-tui"

/** The microphone key, per platform. macOS uses ctrl+space for input-source switching, so it takes the shift form. */
export const DEFAULT_KEYBIND_MAC = "ctrl+shift+space"
export const DEFAULT_KEYBIND_OTHER = "ctrl+space"

/** The dictation key this platform defaults to. */
export const defaultKeybind = (platform: string = process.platform) =>
  platform === "darwin" ? DEFAULT_KEYBIND_MAC : DEFAULT_KEYBIND_OTHER
