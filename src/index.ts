import { fileURLToPath } from "node:url"
import { Plugin } from "@opencode/plugin"
import { unguardedAgents } from "@we-the-rebel-alliance/plugin-contract/access"
import { assertHost, refusal, register, RegisterError } from "@we-the-rebel-alliance/plugin-contract/register"
import { registerCommands } from "./commands.js"
import { defaultKeybind } from "./constants.js"
import { createHandlers } from "./handlers/index.js"
import { manifest, VERSION } from "./manifest.js"
import { parseOptions } from "./options.js"
import { createProvider } from "./provider/create.js"
import { shortReason } from "./redact.js"

const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url))

export default Plugin.define({
  id: manifest.plugin.name,
  async setup(ctx) {
    assertHost(ctx, manifest)
    const parsed = parseOptions(ctx.options)
    if (parsed.ok === false) {
      throw new RegisterError(refusal("OPTIONS_INVALID", `Option ${parsed.error.field}: ${parsed.error.message}`, parsed.error.next))
    }
    const options = parsed.options
    const keybind = options.keybind ?? defaultKeybind()
    const hostVersion = ctx.app.version
    const provider = createProvider({ packageRoot: PACKAGE_ROOT, options })

    const stops: (() => Promise<void> | void)[] = [() => provider.dispose()]
    try {
      const registration = await register(
        ctx,
        manifest,
        createHandlers({ provider, manifest, version: VERSION, options, keybind, hostVersion }),
      )
      stops.push(() => registration.dispose())
      stops.push(
        await registerCommands(ctx, {
          provider,
          manifest,
          version: VERSION,
          options,
          keybind,
          hostVersion,
          unguarded: async () => {
            try {
              const agents = await ctx.agent.list({ location: { directory: ctx.location.directory } })
              return { agents: unguardedAgents(agents.data, registration.access.rules) }
            } catch (error) {
              return { agents: [], problem: shortReason(error instanceof Error ? error.message : String(error)) ?? "The agent list could not be read." }
            }
          },
        }),
      )
    } catch (error) {
      for (const stop of stops.reverse()) await Promise.resolve(stop()).catch(() => undefined)
      throw error
    }

    return async () => {
      for (const stop of stops.reverse()) await Promise.resolve(stop()).catch(() => undefined)
    }
  },
})
