import type { Plugin } from "@opencode/plugin"
import type { MethodClass } from "./tools-rpc.js"

/** One permission rule, as an agent's `permissions` hold it. */
export interface Rule {
  readonly action: string
  readonly resource: string
  readonly effect: "allow" | "deny" | "ask"
}

export type AgentInfo = Awaited<ReturnType<Plugin.Context["agent"]["get"]>>["data"]

/** How much the plugin's own tools may do without asking. A user's later rules always win. */
export type Access = "all" | "ask-changes" | "read-only"

export const ACCESS_VALUES: readonly Access[] = ["all", "ask-changes", "read-only"]

/** The tools this plugin registers, with their class: the one list the block and the tests share. */
export const TOOL_CLASSES: Readonly<Record<string, MethodClass>> = { voice_status: "read", voice_speak: "write" }

/** The effect a tool's class gets under one access value. A read always runs; the rest follow the option. */
export const accessEffect = (cls: MethodClass, access: Access): Rule["effect"] =>
  cls === "read" ? "allow" : access === "ask-changes" ? "ask" : access === "read-only" ? "deny" : "allow"

/**
 * The rules this plugin inserts into every agent after its base allow, generated from the tool table and the
 * `access` option. Every tool is allowed by default, and so is the `voice_*` pattern, so a tool a later release adds
 * is usable at once. `ask-changes` asks for speaking; `read-only` denies it.
 */
export const defaultRules = (access: Access = "all"): Rule[] => [
  { action: "voice_*", resource: "*", effect: access === "all" ? "allow" : access === "ask-changes" ? "ask" : "deny" },
  ...Object.entries(TOOL_CLASSES).map(([action, cls]) => ({ action, resource: "*", effect: accessEffect(cls, access) })),
]

const BASE_ALLOW: Rule = { action: "*", resource: "*", effect: "allow" }
const same = (left: Rule, right: Rule) => left.action === right.action && left.resource === right.resource && left.effect === right.effect

/** True when the block for this access value appears as one contiguous run anywhere after the agent's first base allow. */
export function hasDefaultRules(rules: readonly Rule[], access: Access = "all"): boolean {
  const base = rules.findIndex((rule) => same(rule, BASE_ALLOW))
  if (base === -1) return false
  const block = defaultRules(access)
  return rules.some((_, start) => start > base && block.every((rule, offset) => rules[start + offset] !== undefined && same(rules[start + offset]!, rule)))
}

/** Inserts the default rules once, right after the first base allow; a later rule still wins. A block for another access value is replaced. */
export function insertDefaultRules(rules: Rule[], access: Access = "all"): void {
  if (hasDefaultRules(rules, access)) return
  let base = rules.findIndex((rule) => same(rule, BASE_ALLOW))
  if (base === -1) return
  for (const value of ACCESS_VALUES) {
    if (value === access) continue
    const stale = defaultRules(value)
    for (let start = 0; start + stale.length <= rules.length; start += 1) {
      if (stale.every((rule, offset) => same(rules[start + offset]!, rule))) {
        rules.splice(start, stale.length)
        break
      }
    }
  }
  base = rules.findIndex((rule) => same(rule, BASE_ALLOW))
  rules.splice(base + 1, 0, ...defaultRules(access).map((rule) => ({ ...rule })))
}

/** Host wildcards: `*` matches any run of characters and `?` one character, over the whole string. */
const matches = (pattern: string, value: string) =>
  new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".")}$`).test(value)

/** The effect of `rules` for a call with no resource: the last matching rule wins, and no match asks. */
export function evaluate(rules: readonly Rule[], action: string): Rule["effect"] {
  return rules.findLast((rule) => matches(rule.action, action))?.effect ?? "ask"
}

/** A tool no agent block names, so the effect for one a later release adds. */
const UNNAMED = "voice_new_tool"

/**
 * Agents with a base allow where this plugin's block is missing and a tool the plugin adds later would run without
 * asking. An agent whose own rules already ask or deny for every voice tool needs no fix and is not named.
 */
export const unguardedAgents = (agents: readonly { readonly id: string; readonly permissions: readonly Rule[] }[], access: Access = "all") =>
  agents
    .filter((agent) => agent.permissions.some((rule) => same(rule, BASE_ALLOW)) && !hasDefaultRules(agent.permissions, access) && evaluate(agent.permissions, UNNAMED) === "allow")
    .map((agent) => agent.id)

/** Registers the block for the access value on every agent. Synchronous in the transform and never throws. */
export function registerDefaultRules(agent: Pick<Plugin.Context["agent"], "transform">, access: Access = "all") {
  return agent.transform((editor) => {
    for (const { id } of editor.list()) editor.update(id, (info) => void insertDefaultRules(info.permissions, access))
  })
}
