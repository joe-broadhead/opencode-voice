import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { NEXT_STEPS } from "../../src/constants.js"

const root = new URL("../../", import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), "utf8")

describe("docs", () => {
  test("every error code has a README row and a configuration row", () => {
    const readme = read("README.md")
    const configuration = read("docs/configuration.md")
    for (const code of Object.keys(NEXT_STEPS)) {
      expect(readme).toContain(`\`${code}\``)
      expect(configuration).toContain(`\`${code}\``)
    }
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
