import type { Plugin } from "@opencode/plugin"
import { COMMAND_STEM } from "./constants.js"
import type { ModelStore } from "./engine/assets.js"
import { engineBinaryPath, installEngine, readRelease, verifyEngineFile } from "./engine/release.js"
import { platformKey } from "./engine/platform.js"
import { asEngineError, EngineError } from "./engine/errors.js"
import { formatStatus, unavailable, type Status } from "./status.js"

export interface CommandInput {
  readonly command: Pick<Plugin.Context["command"], "transform">
  readonly session: Pick<Plugin.Context["session"], "synthetic">
}

export interface CommandHooks {
  readonly status: () => Promise<Status>
  /** Downloads the missing models after the permission check, and verifies every file it wrote. */
  readonly install: (sessionID: string, signal: AbortSignal) => Promise<{ readonly downloaded: readonly string[]; readonly bytes: number }>
}

/** `/voice-status` renders the model; `/voice-install` asks, downloads and verifies the pinned models. */
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
        const text = await hooks.install(sessionID, controller.signal).then(
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

export interface InstallRequest {
  readonly files: readonly string[]
  readonly bytes: number
  readonly hosts: readonly string[]
  readonly engine: boolean
}

export interface InstallTarget {
  readonly packageRoot: string
  readonly cacheRoot: string
  readonly platform?: string
  readonly arch?: string
  readonly store: ModelStore
}

/** What an install will fetch — the engine if it is absent or altered, then the missing models — for the ask. */
export async function installRequest(target: InstallTarget): Promise<InstallRequest> {
  const release = readRelease(target.packageRoot)
  const key = platformKey(target.platform ?? process.platform, target.arch ?? process.arch)
  const asset = release !== undefined && key !== undefined ? release.assets[key] : undefined
  const engineMissing = asset !== undefined && !(await verifyEngineFile(engineBinaryPath(target.cacheRoot), asset))
  const missing = await target.store.missing()
  return {
    files: [...(engineMissing && asset !== undefined ? [asset.name] : []), ...missing.map((item) => item.file)],
    bytes: (engineMissing && asset !== undefined ? asset.bytes : 0) + missing.reduce((total, item) => total + item.bytes, 0),
    hosts: [
      ...new Set([
        ...(engineMissing && asset !== undefined ? [new URL(asset.url).host] : []),
        ...missing.map((item) => new URL(item.url).host),
      ]),
    ],
    engine: engineMissing,
  }
}

/**
 * Downloads every missing asset, one at a time, after one explicit ask, then verifies the files in place. A caller
 * that cannot ask (no session) must pass an ask that asks the person directly, such as the dialog's confirm.
 */
export async function installModels(
  store: ModelStore,
  signal: AbortSignal,
  ask: () => Promise<void> = async () => undefined,
): Promise<{ downloaded: string[]; bytes: number }> {
  const missing = await store.missing()
  if (missing.length === 0) return { downloaded: [], bytes: 0 }
  await ask()
  return store.withInstallLock(signal, async () => {
    const downloaded: string[] = []
    let bytes = 0
    for (const asset of missing) {
      if (signal.aborted) break
      await store.download(asset, signal)
      if (!(await store.verify(asset))) {
        throw new EngineError("INTEGRITY_MISMATCH", `The downloaded ${asset.file} did not verify after it was written.`)
      }
      downloaded.push(asset.file)
      bytes += asset.bytes
    }
    return { downloaded, bytes }
  })
}

/**
 * The one install: the pinned Aurum binary when it is absent or altered, then the missing models, after one ask. The
 * engine download is verified against the release manifest; the models against theirs, and again in place.
 */
export async function installAll(
  target: InstallTarget,
  signal: AbortSignal,
  ask: (request: InstallRequest) => Promise<void>,
): Promise<{ downloaded: string[]; bytes: number }> {
  const request = await installRequest(target)
  if (request.files.length === 0) return { downloaded: [], bytes: 0 }
  await ask(request)
  let bytes = 0
  const downloaded: string[] = []
  if (request.engine) {
    const installed = await installEngine({
      packageRoot: target.packageRoot,
      cacheRoot: target.cacheRoot,
      ...(target.platform === undefined ? {} : { platform: target.platform }),
      ...(target.arch === undefined ? {} : { arch: target.arch }),
      signal,
    })
    downloaded.push(installed.asset.name)
    bytes += installed.asset.bytes
  }
  const models = await installModels(target.store, signal)
  downloaded.push(...models.downloaded)
  bytes += models.bytes
  return { downloaded, bytes }
}
