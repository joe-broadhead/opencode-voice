import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import type { Manifest } from "@we-the-rebel-alliance/plugin-contract/manifest"
import { DEFAULTS, type Options } from "../../src/options.js"
import { createHandlers } from "../../src/handlers/index.js"

const manifest = (JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { capabilities: Manifest }).capabilities

describe("the fixed context", () => {
  test("the namespace line is the manifest summary, one line of at most 400 characters", () => {
    expect(manifest.plugin.summary).not.toContain("\n")
    expect(Array.from(manifest.plugin.summary).length).toBeLessThanOrEqual(400)
    expect(manifest.plugin.summary.toLowerCase()).toContain("local")
    expect(manifest.plugin.summary.toLowerCase()).toContain("dictation")
    expect(manifest.plugin.summary.toLowerCase()).toContain("not for transcribing")
  })

  test("every skill description is at most 300 characters and names its skill", () => {
    const text = readFileSync(new URL("../../skills/voice/SKILL.md", import.meta.url), "utf8")
    const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? ""
    const name = /^name:\s*(.+)$/m.exec(front)?.[1]?.trim()
    const description = /^description:\s*(.+)$/m.exec(front)?.[1]?.trim() ?? ""
    expect(name).toBe("voice")
    expect(Array.from(description).length).toBeLessThanOrEqual(300)
    expect(description.length).toBeGreaterThan(40)
  })

  test("nothing is pinned and no method leaves Code Mode", () => {
    for (const [method, item] of Object.entries(manifest.methods)) {
      expect({ method, pinned: item.pinned }).toEqual({ method, pinned: undefined })
    }
  })

  test("the handler descriptions state what runs under the default access", () => {
    const table = createHandlers({
      provider: {} as never,
      manifest,
      version: "0.0.0",
      options: DEFAULTS as unknown as Options,
      keybind: "ctrl+space",
      hostVersion: "2.4.1",
    })
    expect(table.speak.description).toContain("runs without asking by default")
    expect(table.speak.description).toContain("ask-changes")
    expect(table.status.description).toContain("doctor")
  })
})
