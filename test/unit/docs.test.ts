import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { NEXT_STEPS, TESTED_HOSTS } from "../../src/constants.js"
import { defaultRules } from "../../src/host/permissions.js"

const root = new URL("../../", import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), "utf8")

/** Every file under a folder, relative to the repository. */
function files(folder: string): string[] {
  return readdirSync(new URL(`../../${folder}`, import.meta.url), { withFileTypes: true }).flatMap((entry) => {
    const path = `${folder}/${entry.name}`
    return entry.isDirectory() ? files(path) : [path]
  })
}

describe("docs", () => {
  test("every error code has a README row and a configuration row", () => {
    const readme = read("README.md")
    const configuration = read("docs/configuration.md")
    for (const code of Object.keys(NEXT_STEPS)) {
      expect(readme).toContain(`\`${code}\``)
      expect(configuration).toContain(`\`${code}\``)
    }
  })

  test("every code raised in src/ is in the one table, including a \"CODE: message\" string", () => {
    const raised = [...new Set(files("src").flatMap((path) => [
      ...read(path).matchAll(/\b(?:voiceError|errorText|EngineError|fail)\(\s*"([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)"/g),
      ...read(path).matchAll(/["'`]([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+):\s/g),
    ].map((match) => match[1]!)))]
    expect(raised.length).toBeGreaterThan(10)
    // The RPC module's own codes are the family's and live in the scripting guide.
    const shared = ["PERMISSION_DENIED", "SESSION_UNKNOWN", "SESSION_AGENT_REQUIRED", "TOOL_UNAVAILABLE", "CANCELLED", "UPSTREAM_ERROR"]
    expect(raised.filter((code) => !(code in NEXT_STEPS) && !shared.includes(code))).toEqual([])
    for (const code of raised.filter((code) => code in NEXT_STEPS)) {
      expect({ code, readme: read("README.md").includes(`\`${code}\``) }).toEqual({ code, readme: true })
    }
  })

  test("prints the default block exactly as the code generates it, for every access value", () => {
    const block = /## Permissions\n[\s\S]*?```json\n(\[[^\]]*?\])\n```/.exec(read("README.md"))?.[1]
    expect(block).toBeDefined()
    expect(JSON.parse(block!)).toEqual(defaultRules("all").map((rule) => ({ ...rule })))
    const configuration = read("docs/configuration.md")
    for (const value of ["all", "ask-changes", "read-only"]) expect(configuration).toContain(`"${value}"`)
  })

  test("every \"tested on\" list in the docs is TESTED_HOSTS", () => {
    const expected = `${TESTED_HOSTS.slice(0, -1).join(", ")} and ${TESTED_HOSTS.at(-1)}`
    let found = 0
    for (const document of ["README.md", "AGENTS.md", "SECURITY.md", "docs/configuration.md", "CHANGELOG.md"]) {
      const text = read(document).replace(/\s+/g, " ")
      for (let at = text.indexOf("tested on "); at !== -1; at = text.indexOf("tested on ", at + 1)) {
        found += 1
        expect({ document, after: text.slice(at + 10, at + 10 + expected.length) }).toEqual({ document, after: expected })
      }
    }
    expect(found).toBeGreaterThan(2)
  })

  test("every scripting example is a body the RPC accepts, with the header and the envelope", () => {
    const scripting = read("docs/scripting.md")
    const examples = [...scripting.matchAll(/opencode api post \/api\/rpc\/voice\.dictation\.tools\/(\w+)([^\n]*-d '(\{[\s\S]*?\})')/g)]
    expect(examples.length).toBeGreaterThan(1)
    for (const [, method, , body] of examples) {
      expect({ method, known: ["describe", "voice_status", "voice_speak"].includes(method) }).toEqual({ method, known: true })
      const envelope = JSON.parse(body!) as { input?: { sessionID?: string; input?: unknown } }
      expect({ method, keys: Object.keys(envelope) }).toEqual({ method, keys: ["input"] })
      expect(typeof envelope.input?.sessionID).toBe("string")
    }
    for (const [, call] of scripting.matchAll(/^opencode api post([^\n]*)/gm)) expect(call).toContain("x-opencode-directory:$PWD")
    expect(scripting).toContain("## The location")
    expect(scripting).toContain("A `voice` result comes back as `{ output?, text }`")
  })

  test("the README follows the standard's order and links", () => {
    const readme = read("README.md")
    expect(readme.startsWith("# Voice for OpenCode")).toBe(true)
    const positions = ["## Requirements", "## Install", "## Sign in", "## Use", "## Permissions", "## Configure", "## Organisation rollout", "## Troubleshooting", "## Uninstall", "## Links"].map((heading) => readme.indexOf(heading))
    expect(positions.every((at) => at > 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })

  test("the engine contract names every method", () => {
    const engine = read("docs/engine.md")
    for (const method of ["status", "warmup", "transcribe", "synthesize", "cancel"]) expect(engine).toContain(`\`${method}\``)
    expect(engine).toContain("voice.dictation.engine")
  })

  test("the skill is short and routes file transcription to Utilities", () => {
    const skill = read("skills/voice/SKILL.md")
    expect(skill.split("\n").length).toBeLessThanOrEqual(100)
    expect(skill).toContain("utilities_speech_transcribe")
    expect(skill).toContain("voice_status")
  })

  test("the NOTICE keeps Cesar Alves's copyright and the MIT text", () => {
    const notice = read("NOTICE")
    expect(notice).toContain("Copyright (c) 2026 Cesar Alves")
    expect(notice).toContain("Permission is hereby granted, free of charge")
    expect(notice).toContain("oc-aurum")
  })
})
