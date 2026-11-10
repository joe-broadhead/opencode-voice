// Fails when a forbidden API, legacy surface, private host reference or machine-local path appears
// in src/, test/, scripts/ or dist/. The list is the "Forbidden in this repository" list in AGENTS.md. APIs that the
// public @opencode/plugin 2.2.3 types already reject fail the typecheck instead.
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs"
import { extname, join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { execFileSync } from "node:child_process"

const self = fileURLToPath(import.meta.url)
export const ROOTS = ["src", "test", "scripts", "dist"]
const MEMBER = String.raw`\s*(?:\?\.|\.)\s*`
const PERMISSION_HOOK = new RegExp(String.raw`\bpermission${MEMBER}hook\b`)
const EVALUATE_HOOK = /\bhook\s*\(\s*["']evaluate["']/

/**
 * The only files allowed a `permission.hook`, and how many each holds. Both are the documented exceptions: the shared
 * tools-RPC module turns an ask on one of its own script calls in flight into a deny, and `src/jobs/safety.ts` does the
 * same for a job session, where nobody can answer a prompt. The server bundle inlines both, so it holds two. Any other
 * file, and any extra hook in these, is a finding.
 */
export const HOOK_FILES = new Map([
  ["src/host/tools-rpc.ts", 1],
  ["dist/index.js", 1],
])

export const RULES = [
  { id: "fork-marker", pattern: /dispatch[-_ ]?lease|catalog[-_ ]?ownership|text[-_ ]?only[-_ ]?respons/i, why: "dispatch-lease, ownership and text-only markers are fork-only" },
  { id: "tool-options-mcp", pattern: new RegExp(String.raw`\boptions${MEMBER}mcp\b|\boptions\s*:\s*\{\s*mcp\s*:|\boptions\b[^\n;,]{0,80}\)${MEMBER}mcp\b`), why: "tool options.mcp delegation is fork-only" },
  { id: "plugin-image", pattern: new RegExp(String.raw`\bPlugin${MEMBER}image\b|\bPROFILE_IMAGE\b|profile[-_]?image|profile\.png`, "i"), why: "Plugin.image and profile images were dropped" },
  { id: "imported-oauth", pattern: /\bimported[-_]?(?:gh[-_]?)?oauth\b|\bimportedOAuth\b/i, why: "imported OAuth grants are not allowed" },
  { id: "v1-plugin-api", pattern: /@opencode-ai\//, why: "@opencode-ai/* is the V1 plugin API" },
  { id: "v1-hook", pattern: /["'`](?:tool\.execute\.(?:before|after)|chat\.(?:message|params)|permission\.ask)["'`]/, why: "V1 plugin hooks are not allowed" },
  { id: "generate-text", pattern: new RegExp(String.raw`\bgenerate${MEMBER}text\b`), why: "ctx.generate.text is deprecated" },
  { id: "experimental-policies", pattern: new RegExp(String.raw`\bexperimental${MEMBER}policies\b`), why: "experimental.policies is deprecated" },
  { id: "opencode-ai-import", pattern: /["'`]@opencode\/ai(?:\/[^"'`]*)?["'`]/, why: "@opencode/ai breaks between patch releases; import only @opencode/plugin" },
  { id: "permission-hook", pattern: PERMISSION_HOOK, why: "no escalating permission hook; the only two are the tools RPC's and the job session's", except: [...HOOK_FILES.keys()] },
  { id: "host-source", pattern: /packages\/(?:core|plugin|schema)\/src\b|opencode-[\w-]*-host\b|\bconsumer-host\b/, why: "never reference or import private host source or host checkouts" },
  // Internal wording: a shipped doc or comment states behaviour, not who decided it.
  { id: "internal-wording", pattern: /owner'?s? (?:decision|ruling)|\bthe lead'?s?\b|hey-jelly #|\blanes?\b/i, why: "internal wording (an owner decision, a lead, a lane) does not belong in a shipped doc or comment" },
  { id: "absolute-path", pattern: /\/Users\/[^/\s"'`]+\/|\/home\/[^/\s"'`]+\/|\/(?:private\/)?var\/folders\/|(?<![\w.:/-])\/tmp\/|[A-Za-z]:\\\\?Users\\/, why: "machine-local home and temp paths do not belong in the repository; make temp folders with mkdtemp under realpathSync(\"/tmp\"), or use a relative path" },
]

// The family's working folders never reach a public file. This rule reads every git-tracked file, so a note in a doc,
// a skill or a fixture is caught as well as code. AGENTS.md and this script name the folder on purpose and are skipped.
const WORKING_FOLDER = /opencode-release\//
const WORKING_FOLDER_SKIP = new Set(["AGENTS.md", "scripts/check-forbidden.mjs"])

/** Every git-tracked path under the root. Outside a git checkout, such as a packed tarball, there are none to read. */
function trackedFiles(root) {
  try {
    return execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\0").filter(Boolean)
  } catch {
    return []
  }
}

/** Lines that name a working folder, in any tracked file. */
function workingFolderFindings(root) {
  const findings = []
  for (const path of trackedFiles(root)) {
    if (WORKING_FOLDER_SKIP.has(path)) continue
    const file = join(root, path)
    if (!existsSync(file)) continue
    const buffer = readFileSync(file)
    if (buffer.includes(0)) continue
    buffer.toString("utf8").split(/\r?\n/).forEach((text, index) => {
      if (WORKING_FOLDER.test(text)) findings.push({ path, line: index + 1, id: "working-folder", why: "the family's internal working folders must not appear in a public file", text })
    })
  }
  return findings
}

/** Every finding under one repository root, in path order. */
export function findForbidden(root) {
  const findings = []
  for (const top of ROOTS) {
    const dir = join(root, top)
    if (!existsSync(dir)) continue
    for (const file of walk(dir)) {
      // This script holds the patterns themselves, so it never reports on itself.
      if (realpathSync(file) === realpathSync(self)) continue
      const path = relative(root, file).split(sep).join("/")
      if (top === "dist" && [".tsx", ".jsx"].includes(extname(file))) findings.push({ path, line: 0, id: "dist-jsx-source", why: "no .tsx or .jsx ships; the TUI is prebuilt" })
      const buffer = readFileSync(file)
      if (buffer.includes(0)) continue
      const lines = buffer.toString("utf8").split(/\r?\n/)
      const allowed = HOOK_FILES.get(path)
      if (allowed !== undefined) {
        const hooks = lines.filter((text) => PERMISSION_HOOK.test(text))
        if (hooks.length !== allowed) {
          findings.push({ path, line: 0, id: "permission-hook", why: `${path} must hold exactly ${allowed} permission hook${allowed === 1 ? "" : "s"}, found ${hooks.length}` })
        }
        // The documented exceptions are both `evaluate` hooks: a hook of any other kind is never allowed.
        for (const text of hooks) if (!EVALUATE_HOOK.test(text)) findings.push({ path, line: 0, id: "permission-hook", why: `${path} holds a permission hook that is not an evaluate hook` })
      }
      for (const rule of RULES) {
        if (rule.except?.includes(path)) continue
        lines.forEach((text, index) => {
          if (rule.pattern.test(text)) findings.push({ path, line: index + 1, id: rule.id, why: rule.why, text })
        })
      }
    }
  }
  findings.push(...workingFolderFindings(root))
  return findings
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else if (entry.isFile()) yield path
  }
}

const invoked = process.argv[1] === undefined ? "" : realpathSync(process.argv[1])
if (invoked === realpathSync(self)) {
  const findings = findForbidden(fileURLToPath(new URL("..", import.meta.url)))
  for (const { path, line, id, why, text } of findings) {
    console.error(`${path}${line ? `:${line}` : ""}: [${id}] ${why}${text ? `\n    ${text.trim().slice(0, 160)}` : ""}`)
  }
  if (findings.length) {
    console.error(`\n${findings.length} forbidden reference(s) found. Remove them; see the forbidden list in AGENTS.md.`)
    process.exit(1)
  }
  console.log(`No forbidden references in ${ROOTS.filter((top) => existsSync(join(fileURLToPath(new URL("..", import.meta.url)), top))).join(", ")}.`)
}
