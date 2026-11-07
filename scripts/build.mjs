// Bundles each entry the host loads into one self-contained file: src/index.ts to dist/index.js (the server part) and
// src/tui.tsx to dist/tui.js (the terminal UI part). Shared code, such as the status model and the RPC contract, is
// inlined into both. No chunks and no relative imports, because OpenCode reloads a plugin in place and reuses the
// module records it already holds for unchanged paths: a new entry must never import an older sibling module.
// Only the modules the host provides stay external. The build fails if an output imports anything else.
import { transformAsync } from "@babel/core"
import { build } from "esbuild"
import { readdirSync, readFileSync, rmSync } from "node:fs"
import { builtinModules } from "node:module"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const HOST = ["@opencode/plugin", "@opencode/plugin/*", "@opentui/*", "solid-js", "solid-js/*"]
const provided = (path) => path.startsWith("node:") || HOST.some((name) => (name.endsWith("/*") ? path.startsWith(name.slice(0, -1)) : path === name))

// A bundled library may ask for a Node built-in by its bare name (`process`, `buffer`). The host provides every one of
// them, so it stays external, written the way the rest of the repository imports them: `node:<name>`.
const BUILTINS = new Set(builtinModules)
const nodeBuiltins = {
  name: "node-builtins",
  setup(plugin) {
    plugin.onResolve({ filter: /^[a-z][\w/.-]*$/i }, (args) => (args.kind === "entry-point" || !BUILTINS.has(args.path) ? undefined : { path: `node:${args.path}`, external: true }))
  },
}

/** Solid's universal JSX transform for OpenTUI, after TypeScript stripping: esbuild alone would leave props static. */
const solid = {
  name: "solid",
  setup(plugin) {
    plugin.onLoad({ filter: /\.tsx$/ }, async ({ path }) => {
      const result = await transformAsync(readFileSync(path, "utf8"), {
        filename: path,
        configFile: false,
        babelrc: false,
        sourceMaps: false,
        presets: [
          ["babel-preset-solid", { moduleName: "@opentui/solid", generate: "universal" }],
          ["@babel/preset-typescript", { onlyRemoveTypeImports: false }],
        ],
      })
      if (!result?.code) throw new Error(`build: Babel produced no output for ${path}`)
      return { contents: result.code, loader: "js" }
    })
  },
}

/** The plugin's version, from package.json, as one string: the bundles carry nothing else of package.json. */
const version = {
  name: "version",
  setup(editor) {
    editor.onLoad({ filter: /[\\/]src[\\/]version\.ts$/ }, () => {
      const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
      return { contents: `export const VERSION = ${JSON.stringify(version)}`, loader: "ts" }
    })
  },
}

rmSync(join(root, "dist"), { recursive: true, force: true })
const result = await build({
  absWorkingDir: root,
  entryPoints: { index: "src/index.ts", tui: "src/tui.tsx" },
  outdir: "dist",
  bundle: true,
  splitting: false,
  format: "esm",
  platform: "node",
  target: "es2023",
  external: HOST,
  legalComments: "none",
  metafile: true,
  logLevel: "warning",
  plugins: [solid, nodeBuiltins, version],
})

const problems = Object.entries(result.metafile.outputs).flatMap(([file, output]) =>
  output.imports.filter((entry) => !entry.external || !provided(entry.path)).map((entry) => `${file} imports ${entry.path}`),
)
const files = readdirSync(join(root, "dist")).sort()
if (JSON.stringify(files) !== JSON.stringify(["index.js", "tui.js"])) problems.push(`dist/ must hold exactly index.js and tui.js, found ${files.join(", ")}`)
if (problems.length) {
  console.error(`build: the bundles are not self-contained:\n  ${problems.join("\n  ")}`)
  process.exit(1)
}
console.log("build: dist/index.js and dist/tui.js are self-contained.")
