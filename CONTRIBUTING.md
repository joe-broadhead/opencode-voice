# Contributing

## Setup

Requires Node 24, Bun 1.4.x, and the ALSA runtime on Linux (`libasound2t64` on Ubuntu 24.04).

```bash
npm ci --ignore-scripts
npm run stock:install                 # the tested stock release, into .cache/stock
node scripts/build-native.mjs --ensure # the pinned engine for this computer, into .cache/bin, verified
npm run check
```

`npm run check` runs every stage: build, typecheck, unit tests, the release kit tests, the icons, the copy checks, the
forbidden scan, the eval pack's static tier, the host suite on the tested release, the pack test, the package whitelist
and actionlint. Run one stage with `node scripts/check.mjs <stage>`.

## Host tests

The host suite starts a real stock OpenCode server for the tested release, 2.4.1. `npm run stock:install` installs it
into `.cache/stock`. To use another binary, set `OPENCODE_BIN_2_4_1` for that release. With neither, the host stage is
skipped and says so; in CI a gap fails the build. The host tests use the same gate (`test/support/stock-gate.ts`): a
missing release skips with a notice on a laptop and fails in CI. The tests use an isolated `HOME`, `XDG_*` and
`TMPDIR`, a loopback server, a dead proxy, and the fake engine in `test/fixtures`; they never touch a real OpenCode, a
microphone or a provider.

## The engine

A real engine run on Linux needs glibc 2.39 or newer and the ALSA runtime (`libasound2`, or `libasound2t64` on Ubuntu
24.04). Development and tests use `test/fixtures/fake-aurum.mjs` through `VOICE_AURUM_PATH`. It answers the sidecar
protocol, the recorder, the player and the doctor. A real engine can be used with `aurumPath` or `VOICE_AURUM_PATH`.
The release files come from `node scripts/build-native.mjs --release <dir>`, which the `native` workflow runs: it
downloads each pinned binary named in `manifest/aurum.json`, checks its size and SHA-256, and gzips it. `.cache/` is
git-ignored and never committed.

## Rules

- Every bundle stays self-contained: no relative imports in `dist/`, and only the host's modules external.
- The tools RPC transport is the source-contract package, bundled into `dist/index.js`; Voice's part is
  `src/tools-rpc.ts`. The shared copies that remain are pinned by `scripts/check-copies.mjs`.
- The icon contract is enforced by `scripts/check-icons.mjs`; regenerate both PNGs from `assets/icon.svg`.
- Never add a provider call, a telemetry call or a network request to status, dictation or read-aloud.
- Every error code has a row in the README and `docs/configuration.md`; a test fails otherwise.
- The supported host range is `>=2.4.1 <2.5.0`, and the tested list is `["2.4.1"]`. Do not add a compatibility path for
  an older host.

## Releasing

Release automation is unchanged here and is not part of the current work: do not create a tag or a GitHub Release, and
do not change `release.yml` or `native.yml` beyond names and repository URLs. The next release starts at `v0.0.0`.
