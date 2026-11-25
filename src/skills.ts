import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { Plugin, Skill } from "@opencode/plugin"

/** The one skill this plugin ships: `skills/voice/SKILL.md`. */
export const SKILL_ID = "voice"

type SkillEditor = Parameters<Parameters<Plugin.Context["skill"]["transform"]>[0]>[0]

/**
 * Reads `skills/voice/SKILL.md` for the host's skill list. A missing or malformed file is skipped with a warning;
 * setup carries on without the skill, so a packaging fault never takes `status` and `speak` down with it.
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
    const description = fields.description?.trim() ?? ""
    // A block scalar (`>` or `|`, with or without chomping) is multi-line YAML the line reader cannot carry: it would
    // register the indicator itself. Refuse it, like an empty description, so a broken skill is skipped.
    if (match === null || fields.name !== SKILL_ID || description === "" || /^[>|]/.test(description)) {
      throw new Error("expected front matter with a one-line name and description")
    }
    return { id: SKILL_ID, name: SKILL_ID, description, path, content: match[2]!.trim(), autoinvoke: true } as Skill.Info
  } catch {
    warn(`voice: skills/${SKILL_ID}/SKILL.md is missing or malformed, so the skill was not registered.`)
    return undefined
  }
}

/** Adds the skill to the host's list, when it loaded. */
export function skillTransform(skill: Skill.Info | undefined) {
  return (editor: SkillEditor) => {
    if (skill !== undefined) editor.add(skill)
  }
}

/** Registers the packaged skill and returns its disposer; a skill that does not load is a warning, not a setup failure. */
export async function registerSkill(ctx: Pick<Plugin.Context, "skill">, packageRoot: string): Promise<() => Promise<void>> {
  const skill = await loadSkill(packageRoot)
  const registration = await ctx.skill.transform(skillTransform(skill)).catch((error: unknown) => {
    console.warn(`voice: the skill could not be registered: ${error instanceof Error ? error.message : String(error)}`)
    return undefined
  })
  return registration === undefined ? async () => undefined : registration.dispose
}
