/** The platform keys the native packages use, and the package name for each. */
export type PlatformKey = "darwin-arm64" | "linux-x64-gnu" | "linux-arm64-gnu" | "win32-x64"

export const PACKAGE_FOR: Readonly<Record<PlatformKey, string>> = {
  "darwin-arm64": "@joe-broadhead/opencode-voice-bin-darwin-arm64",
  "linux-x64-gnu": "@joe-broadhead/opencode-voice-bin-linux-x64-gnu",
  "linux-arm64-gnu": "@joe-broadhead/opencode-voice-bin-linux-arm64-gnu",
  "win32-x64": "@joe-broadhead/opencode-voice-bin-win32-x64",
}

export function platformKey(platform: string = process.platform, arch: string = process.arch): PlatformKey | undefined {
  if (platform === "darwin" && arch === "arm64") return "darwin-arm64"
  if (platform === "linux" && arch === "x64") return "linux-x64-gnu"
  if (platform === "linux" && arch === "arm64") return "linux-arm64-gnu"
  if (platform === "win32" && arch === "x64") return "win32-x64"
  return undefined
}

export const platformLabel = (platform: string = process.platform, arch: string = process.arch) => `${platform}-${arch}`

/** The engine binary's name inside a platform package. */
export const BINARY_NAME = process.platform === "win32" ? "aurum.exe" : "aurum"
