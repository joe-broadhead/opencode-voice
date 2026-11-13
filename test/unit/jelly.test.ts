import { describe, expect, test } from "bun:test"
import { defaultRules } from "../../src/host/permissions.js"
import { actionOf, TOOL_NAMES } from "../../src/host/tools.js"
import { parseOptions } from "../../src/options.js"
import { type Declaration, type DeclaredTool, declarationProblems, docProblems, effectFromRules, readPackage } from "../support/jelly-kit.js"
import { ACCESS_CHOICES, type PluginSetting, settingChoices, settingsProblems, settingValueIssue } from "../support/jelly-settings.js"

const ROOT = new URL("../../", import.meta.url)
const pkg = readPackage(ROOT)
const jelly = pkg.jelly as Declaration & {
  tools: DeclaredTool[]
  skills: string[]
  rpc: unknown[]
  views: unknown[]
  signIns: unknown[]
  contributes: { homeFeeds: unknown[]; homeWidgets: unknown[]; workKinds: unknown[]; settings: PluginSetting[] }
}

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

  test("names the skill, declares no views, RPC or sign-ins, and four settings", () => {
    expect(jelly.title).toBe("Voice")
    expect(jelly.skills).toEqual(["voice"])
    expect(jelly.rpc).toEqual([])
    expect(jelly.views).toEqual([])
    expect(jelly.signIns).toEqual([])
    expect({ homeFeeds: jelly.contributes.homeFeeds, homeWidgets: jelly.contributes.homeWidgets, workKinds: jelly.contributes.workKinds }).toEqual({
      homeFeeds: [],
      homeWidgets: [],
      workKinds: [],
    })
    expect(jelly.contributes.settings.map((setting) => [setting.key, setting.type, setting.default])).toEqual([
      ["access", "string", "all"],
      ["maxRecordSeconds", "number", 120],
    ])
  })
})

describe("the jelly settings", () => {
  const settings = jelly.contributes.settings
  const setting = (key: string) => settings.find((item) => item.key === key)!
  const parsed = (options: Record<string, unknown>) => {
    const result = parseOptions(options)
    if (!result.ok) throw new Error(result.error.code)
    return result.options as unknown as Record<string, unknown>
  }

  test("pass Jelly's setting contract, with access offering Jelly's three choices", () => {
    expect(settingsProblems(settings)).toEqual([])
    expect(setting("access").choices).toEqual([...ACCESS_CHOICES])
  })

  test("declare each default the parser applies", () => {
    const defaults = parsed({})
    for (const item of settings) expect([item.key, item.default] as unknown[]).toEqual([item.key, defaults[item.key]])
  })

  test("leave out the terminal-UI-only options, which do nothing in Jelly, while opencode.json still takes them", () => {
    for (const key of ["submit", "statusIndicator"]) expect(settings.map((item) => item.key)).not.toContain(key)
    expect(parsed({ submit: "review", statusIndicator: "footer" })).toMatchObject({ submit: "review", statusIndicator: "footer" })
  })

  test("offer only values the parser takes, and the parser refuses a value outside each set", () => {
    const sets: Record<string, string[]> = { access: ["all", "ask-changes", "read-only"] }
    for (const [key, accepted] of Object.entries(sets)) {
      const values = settingChoices(setting(key))!.map((choice) => choice.value)
      expect([key, values]).toEqual([key, accepted])
      for (const value of values) {
        expect(settingValueIssue(setting(key), value)).toBeNull()
        expect(parsed({ [key]: value })[key]).toBe(value)
      }
      for (const outside of ["write", "none", "", "Send"]) {
        expect(settingValueIssue(setting(key), outside)).not.toBeNull()
        expect(() => parsed({ [key]: outside })).toThrow("OPTIONS_INVALID")
      }
    }
  })

  test("bound maxRecordSeconds exactly as the parser does: its ends are taken, a step past either end or a fraction refused", () => {
    const seconds = setting("maxRecordSeconds")
    expect(seconds).toMatchObject({ integer: true, min: 5, max: 120 })
    for (const value of [seconds.min!, seconds.max!]) {
      expect(settingValueIssue(seconds, value)).toBeNull()
      expect(parsed({ maxRecordSeconds: value }).maxRecordSeconds).toBe(value)
    }
    for (const value of [seconds.min! - 1, seconds.max! + 1, seconds.min! + 0.5]) {
      expect(settingValueIssue(seconds, value)).not.toBeNull()
      expect(() => parsed({ maxRecordSeconds: value })).toThrow("OPTIONS_INVALID")
    }
  })

  test("leave voice, sttModel and language undeclared: the parser takes any name or code, so a closed set would narrow it", () => {
    for (const key of ["voice", "sttModel", "language"]) expect(settings.some((item) => item.key === key)).toBe(false)
  })
})

describe("docs/jelly.md", () => {
  test("follows the plugin authors' standard", () => {
    expect(docProblems(ROOT)).toEqual([])
  })
})
