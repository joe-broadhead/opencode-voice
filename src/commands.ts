import type { Plugin } from "@opencode/plugin"
import { COMMAND_STEM } from "./constants.js"
import type { ModelStore } from "./engine/assets.js"
import { asEngineError } from "./engine/errors.js"
import { formatStatus, unavailable, type Status } from "./status.js"

export interface CommandInput {
  readonly command: Pick<Plugin.Context["command"], "transform">
  readonly session: Pick<Plugin.Context["session"], "synthetic">
}

export interface CommandHooks {
  readonly status: () => Promise<Status>
  readonly install: (signal: AbortSignal) => Promise<{ readonly downloaded: readonly string[]; readonly bytes: number }>
}

/** `/voice-status` renders the model; `/voice-install` downloads the missing pinned models. */
export function registerCommands(ctx: CommandInput, hooks: CommandHooks): Promise<() => Promise<void>> {
  const post = (sessionID: string, text: string, description: string) =>
    ctx.session.synthetic({ sessionID, text, description, resume: false })
  const registration = ctx.command.transform((editor) => {
    editor.add({
      name: `${COMMAND_STEM}-status`,
      description: "Show the voice engine, models, microphone and the one next step",
      execute: async ({ sessionID }) => {
        const text = await hooks.status().then(formatStatus, (error: unknown) => unavailable(error).message)
        await post(sessionID, text, "Voice status")
      },
    })
    editor.add({
      name: `${COMMAND_STEM}-install`,
      description: "Download and verify the speech models the engine needs",
      execute: async ({ sessionID }) => {
        const controller = new AbortController()
        const text = await hooks.install(controller.signal).then(
          (result) =>
            result.downloaded.length === 0
              ? "Every speech model is already installed and verified."
              : `Installed ${result.downloaded.join(", ")} (${Math.round(result.bytes / (1024 * 1024))} MB), verified against their pinned hashes.`,
          (error: unknown) => asEngineError(error).message,
        )
        await post(sessionID, text, "Voice install")
      },
    })
  })
  return registration.then((registration) => registration.dispose)
}

/** Downloads every missing asset, one at a time, and reports what landed. */
export async function installModels(store: ModelStore, signal: AbortSignal): Promise<{ downloaded: string[]; bytes: number }> {
  const missing = await store.missing()
  const downloaded: string[] = []
  let bytes = 0
  for (const asset of missing) {
    if (signal.aborted) break
    await store.download(asset, signal)
    downloaded.push(asset.file)
    bytes += asset.bytes
  }
  return { downloaded, bytes }
}
