// The release tarball ships NOTICE next to a bundle that inlines third-party code. This test builds the server entry
// with the same externals as scripts/bundle.mjs, collects the packages that actually end up in the bundle (including
// packages inlined by a bundled dist, such as zod inside plugin-contract), and requires a NOTICE section for each.
import { describe, expect, test } from "bun:test"
import { build } from "esbuild"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../../", import.meta.url))
const HOST = ["@opencode/plugin", "@opencode/plugin/*", "@opentui/*", "solid-js", "solid-js/*"]
const PLUGIN = "@we-the-rebel-alliance/voice-plugin"

/** A package name from an esbuild input path, or undefined for the plugin's own sources. */
function packageOf(path: string): string | undefined {
  const match = /^node_modules\/((?:@[^/]+\/)?[^/]+)\//.exec(path)
  return match?.[1]
}

function keep(name: string | undefined): name is string {
  return name !== undefined && name !== PLUGIN && !name.startsWith("@opencode/") && !name.startsWith(".")
}

function section(name: string): RegExp {
  return new RegExp(`^## ${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`, "m")
}

/** The packages a NOTICE does not name, in the order they were found. */
export function missingNoticeSections(notice: string, packages: readonly string[]): string[] {
  return packages.filter((name) => !section(name).test(notice))
}

/** Every package esbuild actually inlines into the server bundle. */
async function bundledPackages(): Promise<string[]> {
  const result = await build({
    absWorkingDir: root,
    entryPoints: ["src/index.ts"],
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    target: "es2023",
    external: HOST,
    legalComments: "none",
    metafile: true,
    logLevel: "silent",
  })
  const found = new Set<string>()
  const inputs = Object.keys(result.metafile.inputs)
  for (const path of inputs) {
    const name = packageOf(path)
    if (keep(name)) found.add(name)
  }
  // A bundled dist can inline its own dependencies; plugin-contract's chunks carry the original module path in a
  // comment (`// node_modules/zod/v4/...`). Those packages are redistributed by this bundle too.
  for (const path of inputs) {
    if (!path.startsWith("node_modules/")) continue
    const text = readFileSync(join(root, path), "utf8")
    for (const match of text.matchAll(/\/\/\s*node_modules\/((?:@[^/\s]+\/)?[^/\s]+)\//g)) {
      if (keep(match[1])) found.add(match[1])
    }
  }
  return [...found].sort()
}

describe("the bundled third-party notices", () => {
  test("every bundled package has a NOTICE section", async () => {
    const packages = await bundledPackages()
    expect(packages).toContain("yaml")
    expect(packages).toContain("zod")
    const notice = readFileSync(join(root, "NOTICE"), "utf8")
    expect(missingNoticeSections(notice, packages)).toEqual([])
  })

  test("a missing section is reported", () => {
    const notice = readFileSync(join(root, "NOTICE"), "utf8")
    const withoutYaml = notice.replace(/^## yaml[\s\S]*?(?=^## |\s*$)/m, "")
    expect(missingNoticeSections(withoutYaml, ["yaml"])).toEqual(["yaml"])
  })
})
