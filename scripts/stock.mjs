// The stock OpenCode CLI each host test runs on, one per release in TESTED_HOSTS, installed from npm into .cache/stock.
//   node scripts/stock.mjs      install every tested release for this computer, then check each binary runs
// The host stage (scripts/check.mjs) uses OPENCODE_BIN_<version> when that is set, and otherwise these binaries.
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))

/** Where the stock release for one version is installed. */
export const stockDir = (version) => join(root, ".cache", "stock", version)

/** The binary inside that install: the npm package for this computer's platform, as `@opencode/cli` names it. */
export function stockBinary(version) {
  const exe = process.platform === "win32" ? "opencode.exe" : "opencode"
  return join(stockDir(version), "node_modules", "@opencode", `cli-${process.platform}-${process.arch}`, "bin", exe)
}

/** Installs one stock release with npm and returns its binary, or throws when this computer has no build of it. */
export function installStock(version) {
  const dir = stockDir(version)
  mkdirSync(dir, { recursive: true })
  execFileSync("npm", ["install", "--prefix", dir, "--no-save", "--no-audit", "--no-fund", "--ignore-scripts", `@opencode/cli@${version}`], {
    stdio: "inherit",
  })
  const bin = stockBinary(version)
  if (!existsSync(bin)) throw new Error(`@opencode/cli@${version} has no build for ${process.platform}-${process.arch}`)
  return bin
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { TESTED_HOSTS } = await import(new URL("../src/constants.ts", import.meta.url).href)
  for (const version of TESTED_HOSTS) {
    const bin = installStock(version)
    console.log(`stock ${version}: ${bin.slice(root.length)}`)
  }
}
