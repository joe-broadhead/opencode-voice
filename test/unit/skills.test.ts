import { describe, expect, test } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { loadSkill, skillTransform } from "../../src/host/skills.js"

const repo = fileURLToPath(new URL("../..", import.meta.url))

describe("the voice skill the host lists", () => {
  test("the shipped SKILL.md loads as the skill voice, without its front matter", async () => {
    const warnings: string[] = []
    const loaded = await loadSkill(repo, (message) => warnings.push(message))
    const skill = loaded as unknown as Record<string, unknown> | undefined
    expect(warnings).toEqual([])
    expect(skill?.id).toBe("voice")
    expect(skill?.name).toBe("voice")
    expect(skill?.autoinvoke).toBe(true)
    expect(String(skill?.description ?? "").length).toBeGreaterThan(0)
    expect(String(skill?.content ?? "").startsWith("---")).toBe(false)
    expect(String(skill?.path ?? "").endsWith(join("skills", "voice", "SKILL.md"))).toBe(true)
  })

  test("a missing skill is skipped with SKILLS_INVALID, and setup carries on", async () => {
    const root = mkdtempSync(join(tmpdir(), "voice-skill-"))
    const warnings: string[] = []
    try {
      expect(await loadSkill(root, (message) => warnings.push(message))).toBeUndefined()
      expect(warnings).toHaveLength(1)
      expect(warnings[0]).toContain("SKILLS_INVALID")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a skill whose name is not voice is malformed and skipped", async () => {
    const root = mkdtempSync(join(tmpdir(), "voice-skill-"))
    mkdirSync(join(root, "skills", "voice"), { recursive: true })
    writeFileSync(join(root, "skills", "voice", "SKILL.md"), "---\nname: other\ndescription: a skill\n---\nbody\n")
    const warnings: string[] = []
    try {
      expect(await loadSkill(root, (message) => warnings.push(message))).toBeUndefined()
      expect(warnings[0]).toContain("SKILLS_INVALID")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("the transform adds the loaded skill, and adds nothing when it did not load", async () => {
    const added: unknown[] = []
    const editor = { add: (skill: unknown) => added.push(skill) } as never
    skillTransform(undefined)(editor)
    expect(added).toEqual([])
    const info = { id: "voice" } as never
    skillTransform(info)(editor)
    expect(added).toEqual([info])
  })
})
