// A package root that carries the upstream engine pin, as manifest/aurum.json does: the raw executable, pinned by its
// size and SHA-256 at its upstream release address. Tests change the pin to make a refusal happen, and serve the bytes
// they choose through a fake fetch.
import { createHash } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

/** The upstream release folder the pin must name. */
export const RELEASE = "https://github.com/joe-broadhead/aurum/releases/download/v0.0.24/"
/** The upstream asset name for an Apple-silicon Mac. */
export const ASSET = "aurum-macos-arm64"
/** The fake executable's bytes. */
export const EXECUTABLE = new Uint8Array([1, 2, 3, 4])

export const sha = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex")

/** A fetch that answers with `bytes` as a successful download. */
export const serving = (bytes: Uint8Array) => (async () => new Response(bytes, { status: 200 })) as unknown as typeof fetch

/** Writes the upstream pin for the darwin-arm64 engine into `root`. `pins.asset` replaces the hash, so a test can make it wrong. */
export function packageWith(root: string, pins: { readonly asset?: string } = {}): string {
  mkdirSync(join(root, "manifest"), { recursive: true })
  writeFileSync(
    join(root, "manifest", "aurum.json"),
    JSON.stringify({
      version: "0.0.24",
      tag: "v0.0.24",
      commit: "1a3c28c00becd5bcf05a02cb920c8400f5cf8696",
      source: "https://github.com/joe-broadhead/aurum/releases/tag/v0.0.24",
      licence: "MIT",
      assets: {
        "darwin-arm64": {
          name: ASSET,
          url: `${RELEASE}${ASSET}`,
          sha256: pins.asset ?? sha(EXECUTABLE),
          bytes: EXECUTABLE.length,
        },
      },
    }),
  )
  return root
}
