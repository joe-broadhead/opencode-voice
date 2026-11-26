/** The platform keys the upstream engine pin names. Windows and Intel Macs have no engine build. */
export type PlatformKey = "darwin-arm64" | "linux-x64-gnu" | "linux-arm64-gnu"

/** The Aurum release this plugin requires: the first one that ships `record`, `play`, `converse --stdio` and `--cache-dir`. */
export const MINIMUM_ENGINE = "0.0.24"

/** The module folder the cache uses for the engine. */
export const MODULE = "aurum"

/** The engine executable's name in the cache. */
export const BINARY_NAME = "aurum"

export function platformKey(platform: string = process.platform, arch: string = process.arch): PlatformKey | undefined {
  if (platform === "darwin" && arch === "arm64") return "darwin-arm64"
  if (platform === "linux" && arch === "x64") return "linux-x64-gnu"
  if (platform === "linux" && arch === "arm64") return "linux-arm64-gnu"
  return undefined
}

export const platformLabel = (platform: string = process.platform, arch: string = process.arch) => `${platform}-${arch}`
