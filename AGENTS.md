# Agent notes

## Shape

- Two entries, `src/index.ts` (server) and `src/tui.tsx` (terminal UI), each bundled to one self-contained file.
  `scripts/build.mjs` fails on a relative import or a non-host external.
- One status model (`src/status.ts`) feeds the dialog, `/voice-status` and the status RPC (`voice.dictation`), and
  `voice_status`. The status RPC is the plugin's own read contract, not an app API.
- One dictation flow (`src/dictation/flow.ts`) and one pure state machine (`src/dictation/state.ts`).
- The engine is a pinned child process, never an in-process library: `aurum converse --stdio` for speech,
  `aurum record` for the microphone, `aurum play` for the speaker.

## Forbidden

- No `ctx.ui.slot` calls by default. The single opt-in footer row (`statusIndicator: "footer"`) is the documented S1
  exception; do not add another.
- No network call in status, dictation or read-aloud. Only `/voice-install` downloads, and only from the pinned
  manifest.
- No transcript, audio, key or path outside the plugin cache in status, errors, logs or commands.
- No `dependencies`, `optionalDependencies`, host `peerDependencies`, `engines` or lifecycle scripts. The engine comes
  from the GitHub release, not from a package.
- Do not edit the pinned kit files or the two pinned support copies in `test/support/`; `scripts/check-copies.mjs`
  pins their hashes. Voice's tools RPC part is `src/tools-rpc.ts`.
- Do not add a model provider, a cloud STT/TTS path, a second engine or a host engine RPC. Utilities owns file
  transcription.
- Do not add a compatibility path for an older OpenCode: the supported range is `>=2.4.1 <2.5.0`, tested on 2.4.1.
- Releases are not part of this repository's current work: never push a tag, create a release or change a workflow's
  release behaviour. The release workflow is unchanged until the contract rebuild rewrites it.
- Commits use the machine's configured identity. Do not change the global git identity, and do not author a release.

## Checks

`npm run check` is the gate: `build`, `typecheck`, `unit`, `kit`, `icons`, `copies`, `forbidden`, `evals`, `host` (each
stock release in `TESTED_HOSTS`), `pack`, `whitelist` and `actionlint`. The one tested host is 2.4.1.
`npm run stock:install` puts it in `.cache/stock`, and `OPENCODE_BIN_2_4_1` overrides it; with neither, the host stage
says so and skips, and in CI a gap is a failure. The eval pack's static tier (`node evals/check.mjs`) is part of the
check. Keep the namespace line at most 400 characters and each skill description at most 300.
