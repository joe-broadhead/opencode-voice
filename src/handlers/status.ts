import { NO_ACCOUNTS, STATUS_SCHEMA, statusAnswer, type StatusAnswer } from "@we-the-rebel-alliance/plugin-contract/accounts"
import type { UnguardedAgentsResult } from "@we-the-rebel-alliance/plugin-contract/access"
import type { Manifest } from "@we-the-rebel-alliance/plugin-contract/manifest"
import type { MethodHandler } from "@we-the-rebel-alliance/plugin-contract/register"
import type { EngineFacts, Provider } from "../provider/create.js"
import { buildDoctor, type DoctorInput } from "./doctor.js"

const hostOf = (input: StatusInput) => (input.hostVersion === "" ? "unknown" : input.hostVersion)

export interface StatusInput {
  readonly provider: Pick<Provider, "facts">
  readonly manifest: Manifest
  readonly version: string
  readonly options: DoctorInput["options"]
  readonly keybind: string
  readonly hostVersion: string
}

/**
 * The contract's status answer from the same facts `doctor` answers in full. Voice signs in to nothing, so `accounts`
 * is empty and `needs_sign_in` never applies. A plugin that still needs an install, a model or a microphone grant
 * reports the one next action as its problem, which is the contract's `error` state; when nothing is left to do it
 * answers `ready` with no next step. An unreadable agent list is passed straight through: `statusAnswer` turns it into
 * one more problem and an empty list, never a zero it did not read.
 */
export function buildStatus(input: StatusInput, facts: EngineFacts, unguarded: UnguardedAgentsResult): StatusAnswer {
  const doctor = buildDoctor(input, facts, unguarded.ok ? unguarded.agents : [])
  return statusAnswer({
    manifest: input.manifest,
    version: input.version,
    hostVersion: hostOf(input),
    accounts: NO_ACCOUNTS,
    problems: doctor.nextStep === null ? [] : [doctor.nextStep],
    unguardedAgents: unguarded,
  })
}

/** The `status` handler: the contract's status answer, and nothing else. The product facts are in `doctor`. */
export function statusHandler(input: StatusInput): MethodHandler {
  return {
    description:
      "Read the voice plugin's state, its host range and its (empty) account list. Use doctor for the engine, models and microphone facts.",
    input: { type: "object", properties: {}, additionalProperties: false },
    output: STATUS_SCHEMA,
    async run(_raw, call) {
      const facts = await input.provider.facts()
      return buildStatus(input, facts, await call.unguardedAgents())
    },
  }
}
