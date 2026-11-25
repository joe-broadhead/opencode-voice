import type { ModelStore } from "./assets.js"
import { EngineError } from "./errors.js"
import { cachedEngine, installEngine, pinnedEngine } from "./release.js"

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

/**
 * What an install will fetch: the engine if it is absent or altered, then the missing models. It asks for nothing and
 * fetches nothing; it also refuses a platform with no pinned build before anything is downloaded.
 */
export async function installRequest(target: InstallTarget): Promise<InstallRequest> {
  const pinned = pinnedEngine(target.packageRoot, target.platform, target.arch)
  // An altered cached engine counts as missing, so the install replaces it.
  const engineMissing = (() => {
    try {
      return cachedEngine(target.cacheRoot, pinned) === undefined
    } catch {
      return true
    }
  })()
  const missing = await target.store.missing()
  return {
    files: [...(engineMissing ? [pinned.entry.name] : []), ...missing.map((item) => item.file)],
    bytes: (engineMissing ? pinned.entry.bytes : 0) + missing.reduce((total, item) => total + item.bytes, 0),
    hosts: [...new Set([...(engineMissing ? [new URL(pinned.entry.url).host] : []), ...missing.map((item) => new URL(item.url).host)])],
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
 * The one install: the pinned speech engine when it is absent or altered, then the missing models, after one ask. The
 * engine download is verified against the upstream engine pin; the models against theirs, and again in place.
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
