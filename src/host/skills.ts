import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { Plugin, Skill } from "@opencode/plugin"
import { errorText, NEXT_STEPS } from "../constants.js"

type SkillEditor = Parameters<Parameters<Plugin.Context["skill"]["transform"]>[0]>[0]

/** The one skill this plugin ships: `skills/voice/SKILL.md`, the file Jelly declares too. */
export const SKILL_ID = "voice"

/**
 * Reads `skills/voice/SKILL.md` for the host's skill list. A missing or malformed file is skipped with a SKILLS_INVALID
 * warning; setup carries on without the skill.
 */
export async function loadSkill(packageRoot: string, warn: (message: string) => void = console.warn): Promise<Skill.Info | undefined> {
  const path = join(packageRoot, "skills", SKILL_ID, "SKILL.md")
  try {
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(await readFile(path, "utf8"))
    const fields: Record<string, string> = {}
    for (const line of (match?.[1] ?? "").split(/\r?\n/)) {
      const field = /^(\w+):\s*(.+?)\s*$/.exec(line)
      if (field !== null) fields[field[1]!] = field[2]!
    }
    if (match === null || fields.name !== SKILL_ID || !fields.description) throw new Error("expected front matter with name and description")
    return { id: SKILL_ID, name: SKILL_ID, description: fields.description, path, content: match[2]!.trim(), autoinvoke: true } as Skill.Info
  } catch {
    warn(errorText("SKILLS_INVALID", `The skill ${SKILL_ID} is missing or malformed, so it was skipped.`, NEXT_STEPS.SKILLS_INVALID!))
    return undefined
  }
}

/** Adds the skill to the host's list, when it loaded. */
export function skillTransform(skill: Skill.Info | undefined) {
  return (editor: SkillEditor) => {
    if (skill !== undefined) editor.add(skill)
  }
}
