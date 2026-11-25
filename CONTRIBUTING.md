# Contributing

Voice is a plugin for [plugin-contract](https://github.com/we-the-rebel-alliance/plugin-contract) v0 and follows the
[plugin standard](https://github.com/we-the-rebel-alliance/plugin-contract/blob/master/docs/plugin-standard.md). Read
`AGENTS.md` before changing anything.

## Setup

Requires Node 24 and Bun 1.4.x; a real engine run on Linux also needs glibc 2.39 or newer and the ALSA runtime
(`libasound2t64` on Ubuntu 24.04).

```bash
npm ci
npm run build
npm run check
```

`npm run check` runs every gate in order: build, typecheck, unit tests, the host test, the conformance recording,
`plugin-kit check` (T0, T1 on 2.4.1, the unsupported-host refusal, docs drift, forbidden text, no bundled kit) and the
pack test. Run the
full check under the machine's lock when another check may be running:

```bash
flock -w 7200 /tmp/opencode/kit-check.lock -c 'npm run check'
```

## The engine

Development and tests use `test/fixtures/fake-aurum.mjs` through `VOICE_AURUM_PATH`; it answers the sidecar protocol,
the recorder, the player and the doctor. A real engine can be used with `aurumPath` or `VOICE_AURUM_PATH`, and the
pinned one is fetched with `node scripts/build-native.mjs --ensure`. `.cache/` is git-ignored and never committed.

## Checks a review runs

- `npm run check` from a clean tree, with the counts recorded.
- The diff against the standard: manifest completeness, one `register` call, contract-only errors, closed `status`,
  fresh docs, skills within 400/300 characters, no pinned method, no app name.
- `npx plugin-kit docs --check` and `npx plugin-kit record --check` when docs or the fixture changed.

## Releasing

The owner cuts releases after merge: `npx plugin-kit release 0.0.0` on a clean `master`, then push the tag; CI publishes
the GitHub release. Do not create a tag or a release yourself.
