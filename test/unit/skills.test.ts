import { describe, expect, test } from "bun:test"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import { readSkills, registerSkills, type SkillFile } from "../../src/skills.js"

const dir = () => mkdtempSync(join(tmpdir(), "voice-skill-"))

const writeSkill = (root: string, name: string, frontmatter: string, body = "# Voice\n\nBody.") => {
  mkdirSync(join(root, "skills", name), { recursive: true })
  writeFileSync(join(root, "skills", name, "SKILL.md"), `---\n${frontmatter}\n---\n${body}\n`)
}

describe("the skill loader", () => {
  test("reads every skills/<name>/SKILL.md by directory, with the YAML description", () => {
    const root = dir()
    try {
      writeSkill(root, "voice", "name: voice\ndescription: Local voice.")
      writeSkill(root, "voice-search", "name: voice-search\ndescription: Search the voice logs.")
      const skills = readSkills(join(root, "skills"))
      expect(skills.map((skill) => skill.id)).toEqual(["voice", "voice-search"])
      expect(skills[0]).toMatchObject({ id: "voice", name: "voice", description: "Local voice.", content: "# Voice\n\nBody." })
      expect(skills[0]!.path).toBe(join(root, "skills", "voice", "SKILL.md"))
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a block-scalar description is the folded text, never the marker", () => {
    const root = dir()
    try {
      writeSkill(root, "folded", "name: folded\ndescription: >\n  Local voice, folded.\n  Two lines become one.")
      writeSkill(root, "literal", "name: literal\ndescription: |\n  Local voice, literal.\n  Two lines stay two.")
      writeSkill(root, "chomped", "name: chomped\ndescription: >-\n  Local voice, chomped.")
      const skills = readSkills(join(root, "skills"))
      const byId = new Map(skills.map((skill) => [skill.id, skill.description.trim()]))
      expect(byId.get("folded")).toBe("Local voice, folded. Two lines become one.")
      expect(byId.get("literal")).toBe("Local voice, literal.\nTwo lines stay two.")
      expect(byId.get("chomped")).toBe("Local voice, chomped.")
      for (const marker of [">", "|", ">-", "|-"]) expect([...byId.values()]).not.toContain(marker)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("a bare block marker, a mismatched name, an empty description and no body are refused", () => {
    const cases: readonly [string, string, string][] = [
      ["bare", "name: bare\ndescription: >", "# Bare"],
      ["marker", "name: marker\ndescription: |-", "# Marker"],
      ["voice", "name: other\ndescription: Local voice.", "# Wrong name"],
      ["empty", "name: empty\ndescription:", "# Empty"],
      ["nobody", "name: nobody\ndescription: Local voice.", ""],
    ]
    for (const [name, frontmatter, body] of cases) {
      const root = dir()
      try {
        writeSkill(root, name, frontmatter, body)
        expect({ name, error: capture(() => readSkills(join(root, "skills"))) }).toMatchObject({ name, error: expect.stringContaining("SCHEMA_VIOLATION:") })
      } finally {
        rmSync(root, { recursive: true, force: true })
      }
    }
  })

  test("invalid YAML is a SCHEMA_VIOLATION with a next step", () => {
    const root = dir()
    try {
      writeSkill(root, "voice", "name: voice\ndescription: Local: voice")
      const error = capture(() => readSkills(join(root, "skills")))
      expect(error).toContain("SCHEMA_VIOLATION:")
      expect(error).toContain("Next step:")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("registerSkills adds every skill and returns the transform registration", async () => {
    const skills: readonly SkillFile[] = [
      { id: "voice", name: "voice", description: "Local voice.", path: "/skills/voice/SKILL.md", content: "Body." },
    ]
    const added: unknown[] = []
    let disposed = false
    const context = {
      skill: {
        transform: async (callback: (editor: { add: (skill: unknown) => void }) => void) => {
          callback({ add: (skill: unknown) => added.push(skill) })
          return {
            dispose: async () => {
              disposed = true
            },
          }
        },
      },
    }
    const registration = await registerSkills(context as never, skills)
    expect(added).toHaveLength(1)
    expect((added[0] as { id: string }).id).toBe("voice")
    await registration.dispose()
    expect(disposed).toBe(true)
  })

  test("the shipped skill is voice with a description within the fixed-context budget", () => {
    const root = fileURLToPath(new URL("../..", import.meta.url))
    const skills = readSkills(join(root, "skills"))
    expect(skills.map((skill) => skill.id)).toEqual(["voice"])
    const line = readFileSync(join(root, "skills", "voice", "SKILL.md"), "utf8").match(/^description: (.+)$/m)?.[1] ?? ""
    expect(skills[0]!.description).toBe(line)
    expect(Array.from(skills[0]!.description).length).toBeLessThanOrEqual(300)
    expect(skills[0]!.content.trim().length).toBeGreaterThan(0)
  })
})

function capture(run: () => unknown): string {
  try {
    run()
    return ""
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}
