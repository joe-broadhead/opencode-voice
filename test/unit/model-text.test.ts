import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { DESCRIPTIONS } from "../../src/host/tools.js"
import { defaultRules } from "../../src/host/permissions.js"

// Item 16: every string the model sees states what happens under the default. Under `access: "all"` no tool asks, so a
// string may only mention asking when it also names the option that makes it ask.
const root = new URL("../../", import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), "utf8")
const MODEL_TEXT: { name: string; text: string }[] = [
  { name: "src/host/tools.ts DESCRIPTIONS.status", text: DESCRIPTIONS.status },
  { name: "src/host/tools.ts DESCRIPTIONS.speak", text: DESCRIPTIONS.speak },
  { name: "skills/voice/SKILL.md", text: read("skills/voice/SKILL.md") },
  { name: "README.md", text: read("README.md") },
  { name: "SECURITY.md", text: read("SECURITY.md") },
  { name: "docs/jelly.md", text: read("docs/jelly.md") },
  { name: "docs/scripting.md", text: read("docs/scripting.md") },
]

describe("the model-facing text", () => {
  test("every tool runs by default, and no string says one asks unless it names the option that makes it ask", () => {
    for (const rule of defaultRules("all")) expect(rule.effect).toBe("allow")
    for (const document of MODEL_TEXT) {
      if (!/\basks?\b/i.test(document.text)) continue
      const guarded = document.text.includes("ask-changes") || document.text.includes("by default")
      expect({ doc: document.name, guarded }).toEqual({ doc: document.name, guarded: true })
    }
  })

  test("the speak description says it runs by default, and says where asking comes from", () => {
    expect(DESCRIPTIONS.speak).toContain("runs without asking by default")
    expect(DESCRIPTIONS.speak).toContain('with access "ask-changes" it asks first')
    expect(DESCRIPTIONS.speak).not.toContain("It asks before speaking")
  })

  test("the skill says speaking runs by default", () => {
    const skill = read("skills/voice/SKILL.md")
    expect(skill).toContain("Every tool runs without asking by default")
    expect(skill).not.toContain("It asks first")
  })
})
