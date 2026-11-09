# Contributing

## Setup

Requires Node 24 and Bun 1.4.4 (the Bun inside stock OpenCode 2.2.3–2.2.6).

```bash
npm ci --ignore-scripts
npm run stock:install                 # the four tested stock releases, into .cache/stock
node scripts/build-bins.mjs --current # the pinned engine for this computer, for the packed-install test
npm run check
```

`npm run check` runs every stage: typecheck, unit tests, the build, the icons, the copy checks, the forbidden scan, the
eval pack's static tier, the host suite on each stock release and the pack test. Run one stage with
`node scripts/check.mjs <stage>`.

## Host tests

The host suite starts a real stock OpenCode server for each tested release. `npm run stock:install` installs the four
releases into `.cache/stock`. To use other binaries, set `OPENCODE_BIN_<version>` for one release, for example
`OPENCODE_BIN_2_2_5=/path/to/opencode npm run check`. With neither, the host stage is skipped and says so; in CI a gap
fails the build. The tests use an isolated `HOME`, `XDG_*` and
`TMPDIR`, a loopback server, a dead proxy, and the fake engine in `test/fixtures`; they never touch a real OpenCode, a
microphone or a provider.

## The engine

Development and tests use `test/fixtures/fake-aurum.mjs` through `VOICE_AURUM_PATH`. It answers the sidecar protocol, the
recorder, the player and the doctor. A real engine can be used with `aurumPath` or `VOICE_AURUM_PATH`. The platform
packages come from `node scripts/build-bins.mjs`, which downloads the pinned binaries named in `manifest/aurum.json`,
checks each size and SHA-256, and writes `dist-packages/`; both folders are git-ignored and never committed.

## Rules

- Every bundle stays self-contained: no relative imports in `dist/`, and only the host's modules external.
- The shared tools RPC (`src/host/tools-rpc.ts`) is copied from the family's shared source; edit only its
  PLUGIN-SPECIFIC block, and run `node scripts/check-copies.mjs`.
- The icon contract is enforced by `scripts/check-icons.mjs`; regenerate both PNGs from `assets/icon.svg`.
- Never add a provider call, a telemetry call or a network request to status, dictation or read-aloud.
- Every error code has a row in the README and `docs/configuration.md`; a test fails otherwise.

## Release

The release workflow is the family's: a tag `v*`, the `release` environment, `npm run check`, pack, the pack test on that
exact tarball, then trusted publishing with provenance. Platform packages publish first. `package.json` carries
`"private": true` and version `0.0.0` until the release commit; no test asserts `private`.
