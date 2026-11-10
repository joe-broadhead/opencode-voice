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
- No `dependencies`, `optionalDependencies`, host `peerDependencies`, `engines` or lifecycle scripts. The engine comes from
  the GitHub release, not from a package.
- Do not edit the shared part of `src/host/tools-rpc.ts` (outside its PLUGIN-SPECIFIC block) or
  `scripts/check-icons.mjs`; both are pinned by copy checks.
- Do not add a model provider, a cloud STT/TTS path or a second engine. Utilities owns file transcription.
- No personal email in anything we publish. Every commit, tag and package is authored and committed as
  `joe-broadhead <91376460+joe-broadhead@users.noreply.github.com>`. Before committing or tagging, check that
  `git config user.email` is that address: a fresh clone inherits the machine's global identity, which is not that
  address. Never commit, tag or publish with a work or personal address, or with a local hostname.

## Checks

`npm run check` is the gate: `build`, `typecheck`, `unit`, `icons`, `copies`, `forbidden`, `evals`, `host` (each stock release
in `TESTED_HOSTS`), `pack` (the packed install, which carries no engine), `whitelist`
and `actionlint`. The tested hosts are tested on 2.2.3, 2.2.4, 2.2.5 and 2.2.6. `npm run stock:install` puts each stock release in
`.cache/stock`, and `OPENCODE_BIN_<version>` overrides one; with neither, the host stage says so and skips, and in CI a gap
is a failure. The eval pack's static tier (`node evals/check.mjs`) is part of the check.
