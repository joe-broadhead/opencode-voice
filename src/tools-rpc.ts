/**
 * Voice's part of the tools RPC (`voice.dictation.tools`): the plugin value and the method table that the source
 * contract's `tools-rpc` module takes. The module (`@we-the-rebel-alliance/source-contract/tools-rpc`, bundled into
 * `dist/index.js`) is the transport the plugin family shares:
 *
 *   POST /api/rpc/voice.dictation.tools/<method>
 *   { "input": { "sessionID": "<session>", "input": <the method's input> } }
 *
 * A script runs as a session and the agent it names; the rule for the method's permission action is resolved before
 * dispatch, and only `allow` runs. Voice has no MCP server: both tools are plugin-owned and built in setup.
 */
import { toolsRpcId, type Failure, type McpResult, type MethodSpec, type NextSteps, type ShapeCall, type ToolsRpcPlugin } from "@we-the-rebel-alliance/source-contract/tools-rpc"

/** The plugin's id. The RPC id is `<PLUGIN_ID>.tools`. */
export const PLUGIN_ID = "voice.dictation"

/** The RPC's id: the plugin's id and `.tools`. Scripts call it by name, so it never changes. */
export const TOOLS_RPC_ID = toolsRpcId(PLUGIN_ID)

/**
 * The plugin owns both its tools, so this table is empty: the owned methods are built in setup, where they have a
 * context, and appended to it. An allowlist still governs: a tool not classified there is never a method.
 */
export const METHODS: readonly MethodSpec[] = []

/** Voice has no MCP server and no execute.before hook. */
export function shapeInput(_method: string, input: unknown, _call: ShapeCall): unknown {
  return input
}

/** Voice has no MCP server and no execute.after hook. */
export function shapeResult(_method: string, result: McpResult, _call: ShapeCall): McpResult {
  return result
}

/** The next step for each code. Each is one sentence that ends with a full stop. */
export const NEXT_STEPS: NextSteps = {
  SESSION_UNKNOWN: `Create a session in the location you mean, such as POST /api/session with {"agent":"build"} sent with the header "x-opencode-directory: <dir>" or the location[directory] query, and pass its id.`,
  SESSION_AGENT_REQUIRED: `Create a session that names an agent this project has, with its project as the location, such as POST /api/session with {"agent":"build","location":{"directory":"/path/to/project"}}, and pass its id.`,
  PERMISSION_DENIED: "Add an allow rule for the tool to the session's agent or to the session, or use a session whose agent allows it.",
  CANCELLED: "Call the method again if you still need the result.",
}

/** Voice's own errors, as a code, what happened and the next step. */
export function pluginError(error: unknown): Failure | undefined {
  if (typeof error !== "object" || error === null) return undefined
  const code = (error as { code?: unknown }).code
  const next = (error as { next?: unknown }).next
  const message = error instanceof Error ? error.message : undefined
  if (typeof code !== "string" || typeof next !== "string" || message === undefined) return undefined
  // The coded message is `CODE: what happened. Next step: ...`; keep only what happened.
  const what = message.replace(new RegExp(`^${code}: `), "").replace(/ Next step: [\s\S]*$/, "")
  return { code, what, next }
}

/** The plugin value the transport takes. */
export const PLUGIN: ToolsRpcPlugin = { id: PLUGIN_ID, nextSteps: NEXT_STEPS, shapeInput, shapeResult, pluginError }
