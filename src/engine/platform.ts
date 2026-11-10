/** The platform keys the native packages use, and the package name for each. Windows has no engine yet. */
export type PlatformKey = "darwin-arm64" | "linux-x64-gnu" | "linux-arm64-gnu"

export const PACKAGE_FOR: Readonly<Record<PlatformKey, string>> = {
  "darwin-arm64": "@joe-broadhead/opencode-voice-bin-darwin-arm64",
  "linux-x64-gnu": "@joe-broadhead/opencode-voice-bin-linux-x64-gnu",
  "linux-arm64-gnu": "@joe-broadhead/opencode-voice-bin-linux-arm64-gnu",
}

export function platformKey(platform: string = process.platform, arch: string = process.arch): PlatformKey | undefined {
  if (platform === "darwin" && arch === "arm64") return "darwin-arm64"
  if (platform === "linux" && arch === "x64") return "linux-x64-gnu"
  if (platform === "linux" && arch === "arm64") return "linux-arm64-gnu"
  return undefined
}

export const platformLabel = (platform: string = process.platform, arch: string = process.arch) => `${platform}-${arch}`

/** The engine binary's name inside a platform package. */
export const BINARY_NAME = "aurum"
