import type { MethodCall } from "@we-the-rebel-alliance/plugin-contract/register"
import { shortReason } from "../redact.js"

export interface UnguardedRead {
  readonly agents: readonly string[]
  readonly problem?: string
}

/**
 * The agents whose rules no longer give every generated rule its effect, and the reason when the host cannot say.
 *
 * The contract at the current pin throws from `call.unguardedAgents()`; the freeze makes it answer `{ ok, agents }` or
 * `{ ok, error }`. This adapter reads both shapes, so only this function changes at the tag.
 */
export async function readUnguarded(call: Pick<MethodCall, "unguardedAgents">): Promise<UnguardedRead> {
  try {
    const list: unknown = await call.unguardedAgents()
    if (Array.isArray(list)) return { agents: list.filter((agent): agent is string => typeof agent === "string") }
    const checked = list as { readonly ok?: unknown; readonly agents?: unknown; readonly error?: unknown }
    if (checked?.ok === true && Array.isArray(checked.agents)) {
      return { agents: checked.agents.filter((agent): agent is string => typeof agent === "string") }
    }
    if (checked?.ok === false) {
      return { agents: [], problem: shortReason(String(checked.error ?? "The agent list could not be read.")) ?? "The agent list could not be read." }
    }
    return { agents: [] }
  } catch (error) {
    return { agents: [], problem: shortReason(error instanceof Error ? error.message : String(error)) ?? "The agent list could not be read." }
  }
}
