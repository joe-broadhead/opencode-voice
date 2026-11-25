// One real host: the built bundle loads through OpenCode's own resolver in the embedded @opencode/sdk 2.4.1, registers
// its three tools, its one RPC id and its generated rules, answers a read, and refuses a write over RPC without a
// confirmation. The engine is absent, so nothing spawns and nothing reaches the network.
import { manifest } from "../../src/manifest.js"
import { afterAll, describe, expect, test } from "bun:test"
import { fileURLToPath } from "node:url"
import { createHost, type HostRun } from "@we-the-rebel-alliance/plugin-contract/kit"

const REPO = fileURLToPath(new URL("../..", import.meta.url))
const ALLOW = [{ action: "*", resource: "*", effect: "allow" as const }]

let run: HostRun | undefined
afterAll(async () => {
  await run?.close()
})

describe("voice in the embedded 2.4.1 host", () => {
  test("loads, registers the namespace, the three tools and the voice RPC id", async () => {
    run = await createHost({ directory: REPO, version: "2.4.1", pluginId: manifest.plugin.name, options: { access: "all" } })
    expect(run.failure).toBeUndefined()
    expect(run.refusal).toBeUndefined()
    expect(run.definition?.id).toBe("voice")
    expect(run.namespace).toBeDefined()
    expect(run.namespace?.name).toBe("voice")
    expect(run.namespace?.description).toBe(manifest.plugin.summary)
    expect(run.tools.map((tool) => `${tool.permission}:${tool.codemode === false ? "hidden" : "codemode"}`).sort()).toEqual([
      "voice.doctor:codemode",
      "voice.speak:codemode",
      "voice.status:codemode",
    ])
    expect(run.tools.map((tool) => tool.id).sort()).toEqual(["voice_doctor", "voice_speak", "voice_status"])
    expect(run.rpc).toEqual({ id: "voice", methods: ["status", "doctor", "speak"], events: [] })
  }, 180_000)

  test("status answers through the RPC door with the contract shape", async () => {
    expect(run).toBeDefined()
    const answer = await run!.call("status", {}, { rules: ALLOW })
    expect(answer.ok).toBe(true)
    if (!answer.ok) return
    const status = answer.output as Record<string, unknown>
    expect(status["name"]).toBe("voice")
    expect(status["accounts"]).toEqual([])
    expect(status["host"]).toMatchObject({ range: ">=2.4.1 <2.5.0", tested: ["2.4.1"] })
    expect(Array.isArray(status["unguardedAgents"])).toBe(true)
  }, 120_000)

  test("a write over RPC with an allow rule and no grant is refused", async () => {
    expect(run).toBeDefined()
    const answer = await run!.call("speak", { text: "hello" }, { rules: ALLOW })
    expect(answer.ok).toBe(false)
    if (answer.ok) return
    expect(answer.code).toBe("PERMISSION_DENIED")
  }, 120_000)
})
