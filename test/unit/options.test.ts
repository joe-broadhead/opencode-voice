import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { DEFAULTS, parseOptions } from "../../src/options.js"

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  capabilities: { options: { properties: Record<string, { default?: unknown }> } }
}

describe("options", () => {
  test("the defaults are local, send-on-pause and safe", () => {
    const parsed = parseOptions({})
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.options.submit).toBe("send")
    expect(parsed.options.autoSpeak).toBe(false)
    expect(parsed.options.keepTranscripts).toBe(false)
    expect(parsed.options.allowUntestedHost).toBe(false)
    expect(parsed.options.access).toBe("all")
    expect(parsed.options.voice).toBe("Luna")
    expect(parsed.options.sttModel).toBe("tiny-q5_1")
    expect(parsed.options.language).toBe("auto")
    expect(parsed.options.maxRecordSeconds).toBe(120)
  })

  test("every default the manifest declares is the one the parser uses, and parses", () => {
    for (const [name, schema] of Object.entries(pkg.capabilities.options.properties)) {
      if (schema.default === undefined) continue
      expect(DEFAULTS[name]).toEqual(schema.default)
      expect(parseOptions({ [name]: schema.default }).ok).toBe(true)
    }
  })

  test("the schema names every option the parser reads", () => {
    const declared = Object.keys(pkg.capabilities.options.properties).sort()
    expect(declared).toEqual([...Object.keys(DEFAULTS), "aurumPath", "assetsDir", "keybind"].sort())
  })

  test("a value outside an option's set is refused, never widened", () => {
    expect(parseOptions({ access: "sometimes" }).ok).toBe(false)
    expect(parseOptions({ submit: "later" }).ok).toBe(false)
    expect(parseOptions({ statusIndicator: "sidebar" }).ok).toBe(false)
    expect(parseOptions({ autoSpeak: "yes" }).ok).toBe(false)
    expect(parseOptions({ keepTranscripts: 1 }).ok).toBe(false)
    expect(parseOptions({ allowUntestedHost: "true" }).ok).toBe(false)
  })

  test("maxRecordSeconds is a whole number from 5 to 120", () => {
    expect(parseOptions({ maxRecordSeconds: 300 }).ok).toBe(false)
    expect(parseOptions({ maxRecordSeconds: 4 }).ok).toBe(false)
    expect(parseOptions({ maxRecordSeconds: 5.5 }).ok).toBe(false)
    expect(parseOptions({ maxRecordSeconds: 5 }).ok).toBe(true)
    expect(parseOptions({ maxRecordSeconds: 120 }).ok).toBe(true)
  })

  test("an unknown option names itself and the supported set", () => {
    const parsed = parseOptions({ mic: "on" })
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.error.code).toBe("OPTIONS_INVALID")
    expect(parsed.error.field).toBe("mic")
    expect(parsed.error.next).toContain("maxRecordSeconds")
  })

  test("a keybind is one combination without spaces", () => {
    expect(parseOptions({ keybind: "ctrl+shift+space" }).ok).toBe(true)
    expect(parseOptions({ keybind: "ctrl space" }).ok).toBe(false)
    expect(parseOptions({ keybind: "" }).ok).toBe(false)
  })

  test("a language is auto or a code such as en or pt-BR", () => {
    expect(parseOptions({ language: "auto" }).ok).toBe(true)
    expect(parseOptions({ language: "en" }).ok).toBe(true)
    expect(parseOptions({ language: "pt-BR" }).ok).toBe(true)
    expect(parseOptions({ language: "english please" }).ok).toBe(false)
  })
})
