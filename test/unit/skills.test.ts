import { describe, expect, test } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { loadSkill, registerSkill } from "../../src/skills.js"

const dir = () => mkdtempSync(join(tmpdir(), "voice-skill-"))

describe("the packaged skill", () => {
  test("loads skills/voice/SKILL.md as the skill voice, without its front matter", async () => {
    const root = dir()
    try {
      mkdirSync(join(root, "skills", "voice"), { recursive: true })
      writeFileSync(join(root, "skills", "voice", "SKILL.md"), "---\nname: voice\ndescription: Local voice.\n---\n# Voice\n\nBody.\n")
      const skill = (await loadSkill(root)) as unknown as Record<string, unknown> | undefined
      expect(skill).toBeDefined()
      expect(skill!["id"]).toBe("voice")
      expect(skill!["name"]).toBe("voice")
      expect(skill!["description"]).toBe("Local voice.")
      expect(skill!["content"]).toBe("# Voice\n\nBody.")
      expect(String(skill!["path"]).endsWith("skills/voice/SKILL.md")).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a missing or malformed file warns and registers nothing", async () => {
    const root = dir()
    const warnings: string[] = []
    try {
      expect(await loadSkill(root, (message) => warnings.push(message))).toBeUndefined()
      mkdirSync(join(root, "skills", "voice"), { recursive: true })
      writeFileSync(join(root, "skills", "voice", "SKILL.md"), "---\nname: other\n---\n")
      expect(await loadSkill(root, (message) => warnings.push(message))).toBeUndefined()
      expect(warnings).toHaveLength(2)
      expect(warnings[0]).not.toContain("\n")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("registerSkill adds the loaded skill and returns its disposer", async () => {
    const root = dir()
    try {
      mkdirSync(join(root, "skills", "voice"), { recursive: true })
      writeFileSync(join(root, "skills", "voice", "SKILL.md"), "---\nname: voice\ndescription: Local voice.\n---\nBody.\n")
      const added: unknown[] = []
      let disposed = false
      const ctx = {
        skill: {
          transform: async (callback: (editor: { add: (skill: unknown) => void }) => void) => {
            callback({ add: (skill: unknown) => added.push(skill) })
            return { dispose: async () => void (disposed = true) }
          },
        },
      }
      const dispose = await registerSkill(ctx as never, root)
      expect(added).toHaveLength(1)
      expect((added[0] as { id: string }).id).toBe("voice")
      await dispose()
      expect(disposed).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("the shipped skill is the one this test expects", async () => {
    const root = new URL("../..", import.meta.url).pathname
    const skill = (await loadSkill(root)) as unknown as Record<string, unknown> | undefined
    expect(skill).toBeDefined()
    expect(skill!["id"]).toBe("voice")
    expect(Array.from(String(skill!["description"])).length).toBeLessThanOrEqual(300)
  })
})
