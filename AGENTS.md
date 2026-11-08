# Agent notes

## Shape

- Two entries, `src/index.ts` (server) and `src/tui.tsx` (terminal UI), each bundled to one self-contained file.
  `scripts/build.mjs` fails on a relative import or a non-host external.
- One status model (`src/status.ts`) feeds the dialog, `/voice-status`, the status RPC and `voice_status`.
- One dictation flow (`src/dictation/flow.ts`) and one pure state machine (`src/dictation/state.ts`).
- The engine is a pinned child process, never an in-process library: `aurum converse --stdio` for speech,
  `aurum record` for the microphone, `aurum play` for the speaker.

## Forbidden

- No `ctx.ui.slot` calls by default. The single opt-in footer row (`statusIndicator: "footer"`) is the documented S1
  exception; do not add another.
- No network call in status, dictation, read-aloud or the engine RPC. Only `/voice-install` downloads, and only from
  the pinned manifest.
- No transcript, audio, key or path outside the plugin cache in status, errors, logs or commands.
- No `dependencies`, host `peerDependencies`, `engines` or lifecycle scripts. The three platform packages are the only
  `optionalDependencies`.
- Do not edit the shared part of `src/host/tools-rpc.ts` (outside its PLUGIN-SPECIFIC block) or
  `scripts/check-icons.mjs`; both are pinned by copy checks.
- Do not add a model provider, a cloud STT/TTS path or a second engine. Utilities owns file transcription.

## Checks

`npm run check` is the gate: `build`, `typecheck`, `unit`, `icons`, `copies`, `forbidden`, `evals`, `host` (each stock binary
in `TESTED_HOSTS`), `pack` and `whitelist`. The tested hosts are tested on 2.2.3, 2.2.4, 2.2.5 and 2.2.6; with no
`OPENCODE_BIN_*` set the host stage says so and skips, and in CI a gap is a failure. The eval pack's static tier
(`node evals/check.mjs`) is part of the check.
