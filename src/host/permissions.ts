import type { Plugin } from "@opencode/plugin"

/** One permission rule, as an agent's `permissions` hold it. */
export interface Rule {
  readonly action: string
  readonly resource: string
  readonly effect: "allow" | "deny" | "ask"
}

export type AgentInfo = Awaited<ReturnType<Plugin.Context["agent"]["get"]>>["data"]

/**
 * The rules this plugin inserts into every agent after its base allow (S3): every `voice_` tool asks, and the status
 * read is allowed. Speaking is an action on the user's machine, so it asks; status changes nothing, so it does not.
 */
export const DEFAULT_RULES: readonly Rule[] = [
  { action: "voice_*", resource: "*", effect: "ask" },
  { action: "voice_status", resource: "*", effect: "allow" },
]

const BASE_ALLOW: Rule = { action: "*", resource: "*", effect: "allow" }
const same = (left: Rule, right: Rule) => left.action === right.action && left.resource === right.resource && left.effect === right.effect

/** True when the default rules appear as one contiguous block anywhere after the agent's first base allow. */
export function hasDefaultRules(rules: readonly Rule[]): boolean {
  const base = rules.findIndex((rule) => same(rule, BASE_ALLOW))
  if (base === -1) return false
  return rules.some(
    (_, start) =>
      start > base &&
      DEFAULT_RULES.every((rule, offset) => {
        const candidate = rules[start + offset]
        return candidate !== undefined && same(candidate, rule)
      }),
  )
}

/** Inserts the default rules once, right after the first base allow; a later rule still wins. */
export function insertDefaultRules(rules: Rule[]): void {
  const base = rules.findIndex((rule) => same(rule, BASE_ALLOW))
  if (base === -1 || hasDefaultRules(rules)) return
  rules.splice(base + 1, 0, ...DEFAULT_RULES.map((rule) => ({ ...rule })))
}

/** Host wildcards: `*` matches any run of characters and `?` one character, over the whole string. */
const matches = (pattern: string, value: string) =>
  new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".")}$`).test(value)

/** The effect of `rules` for a call with no resource: the last matching rule wins, and no match asks. */
export function evaluate(rules: readonly Rule[], action: string): Rule["effect"] {
  return rules.findLast((rule) => matches(rule.action, action) && matches(rule.resource, "*"))?.effect ?? "ask"
}

const UNNAMED_TOOL = "voice_unnamed_tool"

/** True when the agent's rules would run a tool they do not name without asking. That is what status names. */
export const wouldRunUnasked = (rules: readonly Rule[]) => evaluate(rules, UNNAMED_TOOL) === "allow"

/** Agents where a new Voice tool would run without asking: a base allow, no block, and an allow for what is unnamed. */
export const unguardedAgents = (agents: readonly { readonly id: string; readonly permissions: readonly Rule[] }[]) =>
  agents
    .filter((agent) => agent.permissions.some((rule) => same(rule, BASE_ALLOW)) && !hasDefaultRules(agent.permissions) && wouldRunUnasked(agent.permissions))
    .map((agent) => agent.id)

/** Inserts the default rules into every agent the transform lists, once. */
export function registerDefaultRules(agent: Pick<Plugin.Context["agent"], "transform">, rules: readonly Rule[] = DEFAULT_RULES) {
  return agent.transform((editor) => {
    for (const { id } of editor.list()) {
      editor.update(id, (info) => {
        const permissions = info.permissions as Rule[]
        if (hasDefaultRules(permissions)) return
        const base = permissions.findIndex((rule) => same(rule, BASE_ALLOW))
        if (base === -1) return
        permissions.splice(base + 1, 0, ...rules.map((rule) => ({ ...rule })))
      })
    }
  })
}
