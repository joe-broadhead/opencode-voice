import { describe, expect, test } from "bun:test"
import { defaultRules } from "../../src/host/permissions.js"
import { actionOf, TOOL_NAMES } from "../../src/host/tools.js"
import { type Declaration, type DeclaredTool, declarationProblems, docProblems, effectFromRules, readPackage } from "../support/jelly-kit.js"

const ROOT = new URL("../../", import.meta.url)
const pkg = readPackage(ROOT)
const jelly = pkg.jelly as Declaration & { tools: DeclaredTool[]; skills: string[]; rpc: unknown[]; views: unknown[]; signIns: unknown[]; contributes: unknown }

/** The rules as the plugin writes them, after an agent's base allow. */
const effectOf = effectFromRules(defaultRules().map((rule) => ({ action: rule.action, resource: rule.resource, effect: rule.effect })))

describe("the jelly declaration", () => {
  test("follows the plugin authors' standard with the effects the default rules give", () => {
    expect(declarationProblems(ROOT, { effectOf, registered: TOOL_NAMES.map(actionOf) })).toEqual([])
  })

  test("declares both tools once, and nothing else", () => {
    expect(jelly.tools.map((tool) => `${tool.name}:${tool.effect}:${tool.readOnly}`).sort()).toEqual(["voice_speak:allow:false", "voice_status:allow:true"])
    expect(jelly.tools).toHaveLength(TOOL_NAMES.length)
    for (const tool of jelly.tools) expect(Object.keys(tool).sort()).toEqual(["effect", "name", "permission", "readOnly"])
  })

  test("names the skill and declares no views, RPC, sign-ins or contributions", () => {
    expect(jelly.title).toBe("Voice")
    expect(jelly.skills).toEqual(["voice"])
    expect(jelly.rpc).toEqual([])
    expect(jelly.views).toEqual([])
    expect(jelly.signIns).toEqual([])
    expect(jelly.contributes).toEqual({ homeFeeds: [], homeWidgets: [], workKinds: [], settings: [] })
  })
})

describe("docs/jelly.md", () => {
  test("follows the plugin authors' standard", () => {
    expect(docProblems(ROOT)).toEqual([])
  })
})
