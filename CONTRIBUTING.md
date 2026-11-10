# Contributing

## Setup

Requires Node 24 and Bun 1.4.4 (the Bun inside stock OpenCode 2.2.3–2.2.6).

```bash
npm ci --ignore-scripts
npm run stock:install                 # the four tested stock releases, into .cache/stock
node scripts/build-native.mjs --ensure # the pinned engine for this computer, into .cache/bin, verified
npm run check
```

`npm run check` runs every stage: typecheck, unit tests, the build, the icons, the copy checks, the forbidden scan, the
eval pack's static tier, the host suite on each stock release and the pack test. Run one stage with
`node scripts/check.mjs <stage>`.

## Host tests

The host suite starts a real stock OpenCode server for each tested release. `npm run stock:install` installs the four
releases into `.cache/stock`. To use other binaries, set `OPENCODE_BIN_<version>` for one release, for example
`OPENCODE_BIN_2_2_5=/path/to/opencode npm run check`. With neither, the host stage is skipped and says so; in CI a gap
fails the build. The host tests use the same gate (`test/support/stock-gate.ts`): a missing release skips with a notice
on a laptop and fails in CI. The CI workflow installs the four releases and exports `OPENCODE_BIN_<version>`. The tests use
an isolated `HOME`, `XDG_*` and
`TMPDIR`, a loopback server, a dead proxy, and the fake engine in `test/fixtures`; they never touch a real OpenCode, a
microphone or a provider.

## The engine

A real engine run on Linux needs glibc 2.39 or newer and the ALSA runtime (`libasound2`,
or `libasound2t64` on Ubuntu 24.04). The CI runners are Ubuntu 24.04 and have both.
Development and tests use `test/fixtures/fake-aurum.mjs` through `VOICE_AURUM_PATH`. It answers the sidecar protocol, the
recorder, the player and the doctor. A real engine can be used with `aurumPath` or `VOICE_AURUM_PATH`. The release
files come from `node scripts/build-native.mjs --release <dir>`, which the `native` workflow runs: it downloads each pinned
binary named in `manifest/aurum.json`, checks its size and SHA-256, and gzips it. `.cache/` is git-ignored and never committed.

## Rules

- Every bundle stays self-contained: no relative imports in `dist/`, and only the host's modules external.
- The shared tools RPC (`src/host/tools-rpc.ts`) is copied from the family's shared source; edit only its
  PLUGIN-SPECIFIC block, and run `node scripts/check-copies.mjs`.
- The icon contract is enforced by `scripts/check-icons.mjs`; regenerate both PNGs from `assets/icon.svg`.
- Never add a provider call, a telemetry call or a network request to status, dictation or read-aloud.
- Every error code has a row in the README and `docs/configuration.md`; a test fails otherwise.

## Releasing

Every plugin releases as `v0.0.0`, and it installs from that GitHub tag. The release is one commit on top of a `master`
head that CI passed, and the tag points at it.

1. Set `version` to `0.0.0` in `package.json`, date the `## [0.0.0]` entry in `CHANGELOG.md`, then run `npm run check`.
2. Push that commit to `master`, and wait for CI to pass on it.
3. In a clean checkout of `master` at that commit, run `node scripts/release-commit.mjs --ci-sha <its full sha>`. It builds
   `dist/`, removes the lifecycle scripts, and creates the signed commit and the signed annotated tag `v0.0.0`. It never
   pushes; `--dry-run` shows the change first.
4. Push the tag only: `git push origin v0.0.0`.
5. Approve the run in the `release` environment. The release workflow checks the tag and its commit, installs the tag on
   each stock OpenCode host (2.2.3 to 2.2.6), packs it, and creates the GitHub Release with the notes, the tarball and
   `SHA256SUMS`.

A tag that already exists stops step 3. Delete the old tag and its Release first, then start again.


Each release has its own tag, and a Git install does not update by itself. To move to a newer release, remove the old entry with `opencode plugin remove github:joe-broadhead/opencode-voice#v0.0.0`, then add the new tag with `opencode plugin add github:joe-broadhead/opencode-voice#v<version>`.

Or add the plugin to `opencode.json` instead, with the same spec:

```json
{ "plugins": [{ "package": "github:joe-broadhead/opencode-voice#v0.0.0" }] }
```
