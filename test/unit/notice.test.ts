// The release tarball ships NOTICE next to bundles that inline third-party code. This test builds the server entry with
// the same options as scripts/bundle.mjs, collects the packages that actually end up in the bundle (including packages
// inlined by a bundled dist, such as zod inside plugin-contract), and requires the exact heading and verbatim licence.
import { describe, expect, test } from "bun:test"
import { build } from "esbuild"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../../", import.meta.url))
const HOST = ["@opencode/plugin", "@opencode/plugin/*", "@opentui/*", "solid-js", "solid-js/*"]
const PLUGIN = "@we-the-rebel-alliance/voice-plugin"
const BANNER = 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);'

interface BundledPackage {
  name: string
  version: string
  licence: string
  text: string
}

/** A package name from an esbuild input path, or undefined for the plugin's own sources. */
function packageOf(path: string): string | undefined {
  return /^node_modules\/((?:@[^/]+\/)?[^/]+)\//.exec(path)?.[1]
}

function keep(name: string | undefined): name is string {
  return name !== undefined && name !== PLUGIN && !name.startsWith("@opencode/") && !name.startsWith(".")
}

/** Every package esbuild actually inlines into the server bundle. */
async function bundledPackages(): Promise<BundledPackage[]> {
  const result = await build({
    absWorkingDir: root,
    entryPoints: ["src/index.ts"],
    bundle: true,
    splitting: false,
    write: false,
    format: "esm",
    platform: "node",
    target: "es2023",
    external: HOST,
    banner: { js: BANNER },
    legalComments: "none",
    metafile: true,
    logLevel: "silent",
  })
  const found = new Set<string>()
  const inputs = Object.keys(result.metafile!.inputs)
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
  return [...found].sort().map((name) => {
    const meta = JSON.parse(readFileSync(join(root, "node_modules", name, "package.json"), "utf8")) as {
      version: string
      license: string
    }
    return {
      name,
      version: meta.version,
      licence: meta.license,
      text: readFileSync(join(root, "node_modules", name, "LICENSE"), "utf8"),
    }
  })
}

function section(notice: string, heading: string): string | undefined {
  const marker = `## ${heading}\n`
  const start = notice.indexOf(marker)
  if (start < 0) return undefined
  const body = notice.slice(start + marker.length)
  const end = body.indexOf("\n## ")
  return end < 0 ? body : body.slice(0, end)
}

function noticeProblems(notice: string, packages: readonly BundledPackage[]): string[] {
  const problems: string[] = []
  for (const pkg of packages) {
    const heading = `${pkg.name} ${pkg.version} (${pkg.licence})`
    const body = section(notice, heading)
    if (body === undefined) {
      problems.push(`${pkg.name}: missing "## ${heading}"`)
      continue
    }
    const fenced = /```\n([\s\S]*?)\n```/.exec(body)
    const text = fenced?.[1] ?? body.replace(/^\n+/, "").replace(/\n+$/, "")
    if (text !== pkg.text.replace(/\n$/, "")) problems.push(`${pkg.name}: licence text is not verbatim`)
  }
  return problems
}

describe("the bundled third-party notices", () => {
  test("every bundled package has its exact heading and verbatim licence", async () => {
    const packages = await bundledPackages()
    expect(packages.map((pkg) => pkg.name)).toEqual(["@we-the-rebel-alliance/plugin-contract", "yaml", "zod"])
    const notice = readFileSync(join(root, "NOTICE"), "utf8")
    expect(noticeProblems(notice, packages)).toEqual([])
  })

  test("a missing heading and altered licence are reported", async () => {
    const packages = await bundledPackages()
    const notice = readFileSync(join(root, "NOTICE"), "utf8")
    const withoutYaml = notice.replace(/^## yaml[\s\S]*?(?=^## |\s*$)/m, "")
    expect(noticeProblems(withoutYaml, packages)).toContain('yaml: missing "## yaml 2.9.1 (ISC)"')
    const altered = notice.replace("Permission to use, copy, modify", "Permission to use, copy, modify,")
    expect(noticeProblems(altered, packages)).toContain("yaml: licence text is not verbatim")
  })
})
