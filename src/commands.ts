import type { Plugin } from "@opencode/plugin"
import { buildDoctor, formatDoctor, type DoctorAnswer, type DoctorInput } from "./handlers/doctor.js"
import type { UnguardedRead } from "./handlers/agents.js"
import { shortReason } from "./redact.js"
import type { Provider } from "./provider/create.js"
import { asEngineError } from "./provider/errors.js"

export interface CommandInput {
  readonly command: Pick<Plugin.Context["command"], "transform">
  readonly session: Pick<Plugin.Context["session"], "synthetic">
  readonly permission: Pick<Plugin.Context["permission"], "assert">
}

export interface CommandHooks extends Omit<DoctorInput, "provider"> {
  readonly provider: Provider
  /** The agents whose own rules would let a generated rule run without asking, and why when unknown. */
  readonly unguarded: () => Promise<UnguardedRead>
}

/**
 * `/voice-status` renders the doctor model; `/voice-install` asks once, downloads the pinned engine and models, and
 * verifies every file it wrote. Commands stay outside `capabilities`: they are the person's own actions, not methods.
 */
export function registerCommands(ctx: CommandInput, hooks: CommandHooks): Promise<() => Promise<void>> {
  const post = (sessionID: string, text: string, description: string) =>
    ctx.session.synthetic({ sessionID, text, description, resume: false })

  const readDoctor = async (): Promise<{ readonly answer: DoctorAnswer; readonly problem?: string }> => {
    const facts = await hooks.provider.facts()
    const list = await hooks.unguarded()
    const answer = buildDoctor(hooks, facts, list.agents)
    return list.problem === undefined ? { answer } : { answer, problem: list.problem }
  }

  const registration = ctx.command.transform((editor) => {
    editor.add({
      name: "voice-status",
      description: "Show the voice engine, models, microphone and the one next step",
      execute: async ({ sessionID }) => {
        const text = await readDoctor().then(
          ({ answer, problem }) => `${formatDoctor(answer)}${problem === undefined ? "" : `\nAgent rules: ${problem}`}`,
          (error: unknown) => asEngineError(error).message,
        )
        await post(sessionID, text, "Voice status")
      },
    })
    editor.add({
      name: "voice-install",
      description: "Download and verify the pinned speech engine and the speech models",
      execute: async ({ sessionID }) => {
        let failure: string | undefined
        const request = await hooks.provider.installRequest().catch((error: unknown) => {
          failure = shortReason(asEngineError(error).message) ?? "The install failed."
          return undefined
        })
        if (request === undefined) {
          await post(sessionID, failure ?? "The install failed.", "Voice install")
          return
        }
        if (request.files.length === 0) {
          await post(sessionID, "The speech engine and every speech model are already installed and verified.", "Voice install")
          return
        }
        const controller = new AbortController()
        const result = await (async () => {
          await ctx.permission.assert({
            sessionID,
            action: "voice.install",
            resources: [...request.hosts],
            save: [...request.hosts],
            metadata: { bytes: request.bytes, files: [...request.files] },
          })
          return hooks.provider.install(controller.signal, async () => undefined)
        })().then(
          (installed) =>
            installed.downloaded.length === 0
              ? "The speech engine and every speech model are already installed and verified."
              : `Installed ${installed.downloaded.join(", ")} (${Math.round(installed.bytes / (1024 * 1024))} MB), verified against their pinned hashes.`,
          (error: unknown) => shortReason(asEngineError(error).message) ?? "The install failed.",
        )
        await post(sessionID, result, "Voice install")
      },
    })
  })
  return registration.then((registration) => registration.dispose)
}
