// The real host proof for the skill loader: an empty project, the package's own server entry, and the host's skill list.
// The project is empty on purpose: OpenCode discovers `<project>/skills/` itself, so running on the repository root
// would pass without `registerSkills`. Every id, path, body and YAML description is checked.
import "./isolate.js"
import { expect, test } from "bun:test"
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { OpenCode } from "@opencode/sdk"
import type { Plugin } from "@opencode/plugin"
import { load, resolve } from "@opencode/plugin/host"
import { waitForActivation } from "@we-the-rebel-alliance/plugin-contract/kit"
import { parse as parseYaml } from "yaml"

const root = fileURLToPath(new URL("../..", import.meta.url))

/** The real host's domains this test reads, as `@opencode/plugin` exposes them to a plugin. */
interface Host {
  readonly sessions: {
    create(input: Record<string, unknown>): Promise<{ readonly id: string }>
    prompt(input: Record<string, unknown>): Promise<unknown>
  }
  readonly plugin: {
    list(input: Record<string, unknown>): Promise<{ readonly data: readonly { readonly id?: string }[] }>
  }
  readonly skill: {
    list(input: Record<string, unknown>): Promise<{
      readonly data: readonly { readonly id: string; readonly name: string; readonly description?: string; readonly path: string; readonly content: string }[]
    }>
  }
  close(): Promise<void>
}

test(
  "the real OpenCode 2.4.1 host registers every skills/<name>/SKILL.md after load",
  async () => {
    const entry = resolve({ directory: root }).server
    expect(entry).toBeDefined()
    const module = (await load(entry!)) as { readonly default?: Plugin.Plugin }
    const definition = module.default
    expect(definition).toBeDefined()

    const ids = readdirSync(join(root, "skills"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
    expect(ids.length).toBeGreaterThan(0)

    // An empty project: OpenCode discovers `<project>/skills/` itself, so using the repository root here would let
    // the test pass without `registerSkills`. The skills must come from the plugin's transform alone.
    const project = mkdtempSync(join(tmpdir(), "voice-skill-project-"))
    try {
      const host = (await OpenCode.create({
        plugins: [definition!],
        config: { directory: project },
        app: { name: "opencode", version: "2.4.1" },
        log: { level: "error", emit: () => undefined },
      })) as unknown as Host

      try {
        const session = await host.sessions.create({ location: { directory: project }, agent: "build", permissions: [] })
        await host.sessions.prompt({ sessionID: session.id, text: "activate the skill registration", delivery: "queue" }).catch(() => undefined)
        await waitForActivation({
          isActive: async () => {
            const list = await host.plugin.list({ location: { directory: project } }).catch(() => undefined)
            return list?.data.some((entry) => entry.id === definition!.id) ?? false
          },
          timeoutMs: 20_000,
        })
        const answer = await host.skill.list({ location: { directory: project } })
        for (const id of ids) {
          const skill = answer.data.find((candidate) => candidate.id === id)
          expect({ id, registered: skill !== undefined }).toEqual({ id, registered: true })
          if (skill === undefined) continue
          expect({ id, name: skill.name }).toEqual({ id, name: id })
          expect({ id, path: skill.path }).toEqual({ id, path: join(root, "skills", id, "SKILL.md") })
          expect({ id, body: skill.content.trim().length > 0 }).toEqual({ id, body: true })
          const text = readFileSync(skill.path, "utf8")
          const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)
          expect({ id, frontmatter: frontmatter !== null }).toEqual({ id, frontmatter: true })
          const parsed = parseYaml(frontmatter?.[1] ?? "") as { readonly description?: unknown }
          expect({ id, description: typeof parsed.description }).toEqual({ id, description: "string" })
          const expected = String(parsed.description ?? "")
          expect({ id, empty: expected.trim() === "" }).toEqual({ id, empty: false })
          for (const marker of [">", "|", ">-", "|-", ">+", "|+"]) expect({ id, marker, registered: expected.trim() === marker }).toEqual({ id, marker, registered: false })
          expect({ id, description: skill.description }).toEqual({ id, description: expected })
        }
      } finally {
        await host.close()
      }
    } finally {
      rmSync(project, { recursive: true, force: true })
    }
  },
  120_000,
)
