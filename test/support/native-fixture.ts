// A package root that carries a release manifest for the engine, as the release commit writes it: the gzip of a fake
// executable, pinned by its size and SHA-256 both as a download and as the executable. Tests change the pins to make a
// refusal happen, and serve the bytes they choose through a fake fetch.
import { createHash } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { gzipSync } from "node:zlib"

/** The release folder the manifest must name: this repository's v0.0.0 release. */
export const RELEASE = "https://github.com/joe-broadhead/opencode-voice/releases/download/v0.0.0/"
/** The fake executable's bytes, and the gzip the release serves for them. */
export const EXECUTABLE = new Uint8Array([1, 2, 3, 4])
export const GZ = new Uint8Array(gzipSync(EXECUTABLE))

export const sha = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex")

/** A fetch that answers with `bytes` as a successful download. */
export const serving = (bytes: Uint8Array) => (async () => new Response(bytes, { status: 200 })) as unknown as typeof fetch

/** Writes a manifest for the darwin-arm64 engine into `root`. `pins` replaces a pinned hash, so a test can make one wrong. */
export function packageWith(root: string, pins: { readonly asset?: string; readonly executable?: string } = {}): string {
  mkdirSync(join(root, "manifest"), { recursive: true })
  writeFileSync(
    join(root, "manifest", "aurum.json"),
    JSON.stringify({ version: "0.0.24", tag: "v0.0.24", commit: "1a3c28c00becd5bcf05a02cb920c8400f5cf8696", source: "test", licence: "MIT" }),
  )
  writeFileSync(
    join(root, "manifest", "native.json"),
    JSON.stringify({
      schema: 1,
      plugin: "opencode-voice",
      repository: "joe-broadhead/opencode-voice",
      tag: "v0.0.0",
      built: { commit: "a".repeat(40), run: 1, workflow: "native" },
      modules: {
        aurum: {
          "darwin-arm64": {
            name: "aurum-darwin-arm64.gz",
            url: `${RELEASE}aurum-darwin-arm64.gz`,
            bytes: GZ.length,
            sha256: pins.asset ?? sha(GZ),
            executable: { name: "aurum", bytes: EXECUTABLE.length, sha256: pins.executable ?? sha(EXECUTABLE) },
          },
        },
      },
    }),
  )
  return root
}
