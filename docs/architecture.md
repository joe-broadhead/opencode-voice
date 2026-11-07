# Architecture

Voice has the family's two entries and a host-agnostic engine core:

```
src/index.ts       server part: tools, tools RPC, status RPC, engine RPC, commands, rules
src/tui.tsx        terminal UI part: one dialog, the keymap, dictation and read-aloud
src/engine/        Aurum: the sidecar, the recorder, the player, WAV, models, the doctor
src/dictation/     the state machine and the one dictation flow
src/status.ts      the one status model
src/host/          the shared tools RPC, the default rules, the tools
```

Each entry is bundled into one self-contained file, `dist/index.js` and `dist/tui.js`, with shared code inlined and only
the host's modules external. The tools RPC contract is plain JSON Schema; `dist/tui.js` carries no zod.

## Processes

```
OpenCode TUI process
  plugin TUI part
    ├─ aurum record -O <wav> --level-events   (one child per utterance)
    ├─ aurum play <wav>                       (one child per reply)
    └─ sidecar client ── JSONL ──▶ aurum converse --stdio (warm)
                                      ├─ whisper.cpp STT
                                      └─ Kitten TTS

OpenCode server process
  plugin server part
    ├─ voice.dictation.tools   (voice_status, voice_speak)
    ├─ voice.dictation.status  (the status model)
    └─ voice.dictation.engine  (a host such as Jelly)
```

The two parts are separate processes and do not share a sidecar. Each starts its own only when used. Under a host such
as Jelly only the server part loads, so there is one.

## Platform facts

- OpenCode 2.2.3, 2.2.4 and 2.2.5 have **no composer API in the terminal UI**. A transcript reaches the prompt either by
  `client.session.prompt` (send) or by a prefilled `ui.dialog.prompt` (review). The desktop GUI entry does have
  `screen.composer.insert`, which is a later surface.
- A TUI plugin registers a key with `keymap.layer`; `keymap.shortcuts` reports the binding. The OS may still take a
  combination before the plugin sees it; macOS uses `ctrl+space` for input-source switching, which is why the default
  there is `ctrl+shift+space`.
- The microphone grant belongs to the responsible process (the terminal or the host app). A child of OpenCode inherits
  that decision; the plugin reports it and never bypasses it.
- The engine is not run in the host's process: it is a pinned binary, verified by digest, and every child is killed by
  the PID the plugin recorded.

## The engine

`aurum converse --stdio` is a long-lived JSONL process. Commands: `transcribe {path}`, `synthesize {text, path}`,
`abort`, `shutdown`. Events: `ready` with `caps`, `user_final`, `synthesized`, `error`, `shutdown`. The plugin keeps one
request in flight, queues the rest, restarts once after a crash, and never lets a late event resolve a timed-out request.

`aurum record` owns the microphone so the plugin needs no `ffmpeg`; `aurum play` owns the speaker so it needs no
`afplay`. Both are part of the Aurum release this plugin pins. A one-shot `aurum transcribe` fallback is not used.

Silence never reaches the model: the plugin measures the WAV (peak and voiced milliseconds) and returns `NO_SPEECH`.

## The models

Models are downloaded, never shipped. The manifest (`manifest/models.json`) is built from Aurum's reviewed catalogue and
pinned by exact size, SHA-256 and revision. Files live content-addressed under the platform cache, mode 0600, and are
verified before use. `assetsDir` takes precedence for a pre-seeded install and forbids downloading.

## Errors and status

One status model drives the dialog, `/voice-status`, the status RPC and `voice_status`. Its shared fields are `version`,
`host`, `state`, `unguardedAgents` and `nextStep`; the rest are Voice's. Errors use the family shape, and each code has a
row in `docs/configuration.md` and the README, enforced by a test.
