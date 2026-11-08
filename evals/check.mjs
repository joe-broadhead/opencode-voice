#!/usr/bin/env node
// T0: the static eval tier. It fails an empty pack, a declaration that disagrees with the tool table, an error code
// without a docs row, a skill that is missing or over its line cap, and a case without evidence.
import { readdirSync, readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
const { NEXT_STEPS } = await import(new URL("../src/constants.ts", import.meta.url).href)
const { TOOL_NAMES, actionOf } = await import(new URL("../src/host/tools.ts", import.meta.url).href)
const { defaultRules } = await import(new URL("../src/host/permissions.ts", import.meta.url).href)

const problems = []
const need = (condition, message) => {
  if (!condition) problems.push(message)
}

// 1. The jelly declaration agrees with the code: every tool once, and the effect the default rules give it.
const declared = pkg.jelly?.tools ?? []
need(declared.length === TOOL_NAMES.length, `jelly.tools declares ${declared.length} tools; the code has ${TOOL_NAMES.length}.`)
for (const short of TOOL_NAMES) {
  const name = actionOf(short)
  const found = declared.filter((tool) => tool.name === name)
  need(found.length === 1, `jelly.tools must declare ${name} once.`)
  const effect = [...defaultRules()].reverse().find((rule) => rule.action === name)?.effect ?? "ask"
  need(found[0]?.effect === effect, `${name} must be declared ${effect}, as the default rules give it.`)
  need(found[0]?.permission === name, `${name} must use its own name as the permission.`)
}

// 2. Every error code has a row in the README and in docs/configuration.md.
const readme = readFileSync(join(root, "README.md"), "utf8")
const configuration = readFileSync(join(root, "docs/configuration.md"), "utf8")
for (const code of Object.keys(NEXT_STEPS)) {
  need(readme.includes(`\`${code}\``), `README.md has no row for ${code}.`)
  need(configuration.includes(`\`${code}\``), `docs/configuration.md has no row for ${code}.`)
}

// 3. The skill: present, named, described, under 100 lines.
const skillPath = join(root, "skills", "voice", "SKILL.md")
need(existsSync(skillPath), "skills/voice/SKILL.md is missing.")
if (existsSync(skillPath)) {
  const skill = readFileSync(skillPath, "utf8")
  const lines = skill.split("\n").length
  need(lines <= 100, `skills/voice/SKILL.md is ${lines} lines; the cap is 100.`)
  need(/^---\nname: voice\ndescription: \S/.test(skill), "skills/voice/SKILL.md needs front matter with name and description.")
  need(skill.includes("voice_status"), "the skill must name voice_status.")
  need(skill.includes("utilities_speech_transcribe"), "the skill must route file transcription to Utilities.")
}

// 4. The cases: one screen each, with a tier, a prompt, items with evidence, and an oracle.
const casesDir = join(root, "evals", "cases")
const cases = existsSync(casesDir) ? readdirSync(casesDir).filter((name) => name.endsWith(".md")) : []
need(cases.length >= 8, `evals/cases has ${cases.length} cases; the minimum pack needs 8.`)
for (const name of cases) {
  const text = readFileSync(join(casesDir, name), "utf8")
  need(/^- Tier: T[0-4]$/m.test(text), `${name} has no "- Tier: Tn" line.`)
  need(/^## Prompt$/m.test(text), `${name} has no "## Prompt" section.`)
  need(/^## Items$/m.test(text), `${name} has no "## Items" section.`)
  need(/^## Oracle$/m.test(text), `${name} has no "## Oracle" section.`)
  need(/evidence: [a-z]+:/.test(text), `${name} has an item without an evidence clause.`)
}

// 5. The lock records the case set, so a comparison cannot run across a changed pack.
const lockPath = join(root, "evals", "evals.lock")
need(existsSync(lockPath), "evals/evals.lock is missing; run node evals/lock.mjs.")
if (existsSync(lockPath)) {
  const lock = JSON.parse(readFileSync(lockPath, "utf8"))
  need(lock.cases === cases.length, `evals.lock records ${lock.cases} cases; there are ${cases.length}. Run node evals/lock.mjs.`)
  need(typeof lock.cases_sha256 === "string" && lock.cases_sha256.length === 64, "evals.lock has no cases hash.")
}

// 6. The engine contract names every method the RPC defines.
const engineDoc = readFileSync(join(root, "docs", "engine.md"), "utf8")
for (const method of ["status", "warmup", "transcribe", "synthesize", "cancel"]) {
  need(engineDoc.includes(`\`${method}\``), `docs/engine.md does not name the ${method} method.`)
}

if (problems.length) {
  for (const problem of problems) console.error(`evals: ${problem}`)
  process.exit(1)
}
console.log(`evals: T0 passed (${cases.length} cases, ${declared.length} declared tools, ${Object.keys(NEXT_STEPS).length} codes).`)
