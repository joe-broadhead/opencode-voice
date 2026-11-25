import { describe, expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { renderGeneratedDocs } from "@we-the-rebel-alliance/plugin-contract/conformance"
import type { Manifest } from "@we-the-rebel-alliance/plugin-contract/manifest"

const root = fileURLToPath(new URL("../../", import.meta.url))
const read = (path: string) => readFileSync(`${root}${path}`, "utf8")
const manifest = (JSON.parse(read("package.json")) as { capabilities: Manifest }).capabilities

const FILES = [
  "README.md",
  "AGENTS.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "CHANGELOG.md",
  "LICENSE",
  "NOTICE",
  "docs/capabilities.md",
  "docs/configuration.md",
  "docs/accounts.md",
  "docs/architecture.md",
  "docs/security.md",
  "docs/automations.md",
]

const normalise = (text: string) => text.replace(/\r\n/g, "\n").split("\n").map((line) => line.trimEnd()).join("\n").trim()

/** The body between a generated section's markers. */
function block(file: string, section: string): string {
  const text = read(file)
  const start = `<!-- generated:${section} -->`
  const end = `<!-- /generated:${section} -->`
  const from = text.indexOf(start)
  expect(from, `${file} has ${start}`).toBeGreaterThanOrEqual(0)
  const to = text.indexOf(end)
  expect(to, `${file} has ${end}`).toBeGreaterThan(from)
  return text.slice(from + start.length, to)
}

describe("the documentation set", () => {
  test("has every file the standard requires", () => {
    for (const file of FILES) expect({ file, exists: existsSync(`${root}${file}`) }).toEqual({ file, exists: true })
  })

  test("the generated sections match the manifest", () => {
    const rendered = renderGeneratedDocs(manifest)
    expect(normalise(block("README.md", "capabilities"))).toBe(normalise(rendered.capabilities))
    expect(normalise(block("README.md", "errors"))).toBe(normalise(rendered.errors))
    expect(normalise(block("docs/capabilities.md", "capabilities"))).toBe(normalise(rendered.capabilities))
    expect(normalise(block("docs/configuration.md", "configuration"))).toBe(normalise(rendered.configuration))
  })

  test("the CHANGELOG carries the one section the release reads", () => {
    const changelog = read("CHANGELOG.md")
    expect(changelog).toMatch(/^# Changelog/m)
    expect(changelog).toContain("## 0.0.0 (2026-11-25)")
    expect(changelog.match(/^## /gm)?.length).toBe(1)
  })

  test("no doc claims an engine or model ships in the package", () => {
    for (const file of ["README.md", "docs/architecture.md"]) {
      const text = read(file)
      expect(text.toLowerCase()).not.toContain("ships the engine")
      expect(text).toContain("/voice-install")
    }
  })

  test("the docs name the voice-plugin cache root and not the old one", () => {
    expect(read("docs/configuration.md")).toContain("`voice-plugin`")
    expect(read("docs/architecture.md")).toContain("<cache>")
    // Built from parts so the old name is a negative assertion, not a literal the release scan would flag.
    const oldCache = ["opencode", "voice"].join("-")
    for (const file of ["README.md", "docs/architecture.md", "docs/configuration.md"]) expect(read(file)).not.toContain(oldCache)
  })

  test("the README names the release install line", () => {
    expect(read("README.md")).toContain("github:we-the-rebel-alliance/voice-plugin#v0.0.0")
  })

  test("the docs describe the one status shape and the doctor method", () => {
    expect(read("docs/capabilities.md")).toContain("doctor")
    expect(read("docs/architecture.md")).toContain("doctor")
    expect(read("README.md")).toContain("`doctor`")
  })

  test("no doc names a tool the manifest does not declare", () => {
    const declared = Object.keys(manifest.methods)
    for (const file of FILES.filter((name) => name.endsWith(".md"))) {
      const text = read(file)
      for (const match of text.matchAll(/tools\.voice\.([a-z_]+)/g)) expect(declared).toContain(match[1]!)
      for (const match of text.matchAll(/(?<![\w.])voice_([a-z_]+)/g)) expect(declared).toContain(match[1]!)
    }
  })
})
