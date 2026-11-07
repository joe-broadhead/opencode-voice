#!/usr/bin/env node
// Freezes the case set: the count and a SHA-256 over every case file's bytes, in file-name order. A comparison across a
// changed case set is refused; start a new epoch deliberately with --epoch.
import { createHash } from "node:crypto"
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const dir = join(root, "evals", "cases")
const files = readdirSync(dir).filter((name) => name.endsWith(".md")).sort()
const hash = createHash("sha256")
for (const name of files) hash.update(name).update("\0").update(readFileSync(join(dir, name))).update("\0")
const previous = (() => {
  try {
    return JSON.parse(readFileSync(join(root, "evals", "evals.lock"), "utf8"))
  } catch {
    return undefined
  }
})()
const epochArg = process.argv.indexOf("--epoch")
const epoch = epochArg === -1 ? (previous?.epoch ?? 1) : Number(process.argv[epochArg + 1])
const lock = {
  epoch,
  cases: files.length,
  cases_sha256: hash.digest("hex"),
  compiled_at: new Date().toISOString(),
  harness_version: "1",
  grader_version: "1",
}
writeFileSync(join(root, "evals", "evals.lock"), `${JSON.stringify(lock, null, 2)}\n`)
console.log(`evals: locked ${lock.cases} cases at epoch ${lock.epoch}, ${lock.cases_sha256.slice(0, 12)}…`)
