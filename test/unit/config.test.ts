import { describe, expect, test } from "bun:test"
import { parseOptions } from "../../src/options.js"
import { checkHost, isSupportedHost, isTestedHost } from "../../src/host-version.js"
import { ACCESS_VALUES, defaultRules, evaluate, hasDefaultRules, insertDefaultRules, unguardedAgents, type Rule } from "../../src/host/permissions.js"
import { shortReason } from "../../src/redact.js"

describe("options", () => {
  test("defaults are local, send-on-pause and safe", () => {
    const parsed = parseOptions({})
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.options.submit).toBe("send")
    expect(parsed.options.autoSpeak).toBe(false)
    expect(parsed.options.keepTranscripts).toBe(false)
    expect(parsed.options.engine).toBe(true)
    expect(parsed.options.voice).toBe("Luna")
    expect(parsed.options.access).toBe("all")
  })

  test("a bad option names the field and never echoes a secret", () => {
    const parsed = parseOptions({ submit: "sometimes" })
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.error.field).toBe("submit")
    expect(parsed.error.message).toContain("send")
    expect(parseOptions({ nope: "x" }).ok).toBe(false)
    expect(parseOptions({ maxRecordSeconds: 2 }).ok).toBe(false)
    expect(parseOptions({ access: "write" }).ok).toBe(false)
  })

  test("review, a keybind and a local path are accepted", () => {
    const parsed = parseOptions({ submit: "review", keybind: "ctrl+shift+space", aurumPath: ["", "tmp", "aurum"].join("/"), assetsDir: ["", "tmp", "models"].join("/") })
    expect(parsed.ok).toBe(true)
  })
})

describe("the host guard", () => {
  test("accepts the tested line and calls only its releases tested", () => {
    expect(isSupportedHost("2.2.3")).toBe(true)
    expect(isSupportedHost("2.2.5")).toBe(true)
    expect(isSupportedHost("2.3.0")).toBe(false)
    expect(isTestedHost("2.2.4")).toBe(true)
    expect(checkHost("2.2.4", false)).toEqual({ version: "2.2.4", range: ">=2.2.3 <2.3.0", tested: true })
    expect(() => checkHost("3.0.0", false)).toThrow(/HOST_UNTESTED/)
    expect(checkHost("3.0.0", true).tested).toBe(false)
  })
})

describe("permission rules", () => {
  const base = { action: "*", resource: "*", effect: "allow" as const }

  test("are inserted once after the base allow, and an agent without one gets nothing", () => {
    const rules: Rule[] = [{ ...base }]
    insertDefaultRules(rules)
    expect(rules.slice(1)).toEqual(defaultRules())
    insertDefaultRules(rules)
    expect(rules.filter((rule) => rule.action === "voice_*")).toHaveLength(1)
    expect(hasDefaultRules(rules)).toBe(true)
    const denied: Rule[] = [{ action: "*", resource: "*", effect: "deny" }]
    insertDefaultRules(denied)
    expect(denied).toHaveLength(1)
  })

  test("every tool is allowed by default, and each access value narrows the writes", () => {
    for (const access of ACCESS_VALUES) {
      const rules = [{ ...base }, ...defaultRules(access)]
      expect(evaluate(rules, "voice_status")).toBe("allow")
    }
    expect(evaluate([base, ...defaultRules("all")], "voice_speak")).toBe("allow")
    expect(evaluate([base, ...defaultRules("ask-changes")], "voice_speak")).toBe("ask")
    expect(evaluate([base, ...defaultRules("read-only")], "voice_speak")).toBe("deny")
    // The namespace rule follows the option, so a tool a later release adds cannot slip past a restriction.
    expect(evaluate([base, ...defaultRules("all")], "voice_new_tool")).toBe("allow")
    expect(evaluate([base, ...defaultRules("ask-changes")], "voice_new_tool")).toBe("ask")
    expect(evaluate([base, ...defaultRules("read-only")], "voice_new_tool")).toBe("deny")
  })

  test("changing the access value replaces the block instead of stacking one", () => {
    const rules: Rule[] = [{ ...base }]
    insertDefaultRules(rules, "all")
    insertDefaultRules(rules, "read-only")
    expect(rules.filter((rule) => rule.action === "voice_*")).toHaveLength(1)
    expect(hasDefaultRules(rules, "read-only")).toBe(true)
    expect(hasDefaultRules(rules, "all")).toBe(false)
  })

  test("an agent that allows an unnamed voice tool is unguarded", () => {
    expect(unguardedAgents([{ id: "build", permissions: [base] }])).toEqual(["build"])
    expect(unguardedAgents([{ id: "build", permissions: [base, ...defaultRules()] }])).toEqual([])
  })
})

describe("redaction", () => {
  test("removes token shapes and URL credentials", () => {
    expect(shortReason("failed with sk-abcdefghijklmnop")).not.toContain("sk-abcdefghijklmnop")
    expect(shortReason("see https://user:pass@example.com/x?token=abc")).not.toContain("pass")
    expect(shortReason("line\nbreak")).toBe("line break")
  })
})
