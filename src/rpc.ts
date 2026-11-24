import type { Plugin } from "@opencode/plugin"
import { Rpc } from "@opencode/plugin/rpc"
import { PLUGIN_ID } from "./constants.js"
import { STATUS_OUTPUT, unavailable, type Status } from "./status.js"

const string = { type: "string" } as const
const object = (properties: Record<string, object>, required: readonly string[]) =>
  ({ type: "object", properties, required, additionalProperties: false }) as const
const NO_INPUT = object({}, [])

/** The read-only status RPC: one method, the same model `/voice-status` and the dialog render. */
export const VoiceStatusRpc = Rpc.define({
  id: PLUGIN_ID,
  methods: {
    status: { input: NO_INPUT, output: STATUS_OUTPUT, errors: { unavailable: object({ nextStep: string }, ["nextStep"]) } },
  },
  events: {},
})

export function registerStatusRpc(rpc: Pick<Plugin.Context["rpc"], "register">, read: () => Promise<Status>) {
  const registration = rpc.register(VoiceStatusRpc, {
    status: (_input: unknown, { error }: { error: (type: "unavailable", message: string, data: { nextStep: string }) => unknown }) =>
      read().catch((cause: unknown) => {
        const failure = unavailable(cause)
        return error("unavailable", failure.message, { nextStep: failure.nextStep })
      }),
  } as never)
  return registration.then((registration) => registration.dispose)
}
