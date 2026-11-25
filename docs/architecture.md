# Architecture

Voice has two plugin definitions and a host-agnostic provider:

```
src/index.ts            server part: assertHost → register → /voice-status and /voice-install
src/tui.tsx             terminal UI part: the dialog, the keymap, dictation and read-aloud
src/handlers/           status, doctor and speak: input schemas, answers, and the next step
src/provider/           Aurum: the sidecar, the recorder, the player, models, the doctor, the pinned release
src/dictation/          the one dictation flow and its pure state machine
src/options.ts          the plugin's options, with the manifest's defaults
src/manifest.ts         the capabilities manifest and the version, inlined at build time
```

Each entry is bundled into one self-contained file, `dist/index.js` and `dist/tui.js`, with the contract's modules and
the shared code inlined and only the host's modules external.

## The doors

`src/index.ts` is one `Plugin.define({ id: "voice", setup })`:

1. `assertHost(ctx, manifest)` refuses an OpenCode release outside `>=2.4.1 <2.5.0` with `HOST_UNTESTED`, unless
   `allowUntestedHost` is set.
2. `register(ctx, manifest, handlers)` wires `status`, `doctor` and `speak` through doors 1–3: an agent tool in the
   `voice` namespace, `tools.voice.<method>` in Code Mode and automations, and `POST /api/rpc/voice/<method>`. The same
   call generates the access rules from `methods` and `access`, and builds the bus writer (`call.bus`) even though this
   plugin declares no events.
3. `/voice-status` and `/voice-install` are person-facing commands, registered with `ctx.command`; they are outside
   `capabilities`.

## The two processes

```
OpenCode TUI process
  voice-tui plugin
    ├─ aurum record -O <wav> --level-events   (one child per utterance)
    ├─ aurum play <wav>                       (one child per reply)
    └─ sidecar client ── JSONL ──▶ aurum converse --stdio (warm)
                                      ├─ whisper.cpp STT
                                      └─ Kitten TTS

OpenCode server process
  voice plugin
    ├─ tools + RPC: status, doctor, speak
    └─ commands: /voice-status, /voice-install
```

The two parts are separate processes and share no sidecar and no temp folder; each removes only its own. The TUI builds
the doctor model from the shared module for its dialog (the contract's RPC envelope needs a session, and the dialog can
open with none); the server's `doctor` method answers the same model over door 3 for apps.

## The engine

`aurum converse --stdio` is a long-lived JSONL process: `transcribe`, `synthesize`, `abort`, `shutdown`; events are
`ready` with `caps`, `user_final`, `synthesized`, `error` and `shutdown`. The plugin keeps one request in flight, queues
the rest, restarts once after a crash, and never lets a late event resolve a timed-out request.

`aurum record` owns the microphone, so the plugin needs no `ffmpeg`; `aurum play` owns the speaker, so it needs no
`afplay`. `/voice-install` downloads the pinned engine from this plugin's release into
`<cache>/native/<tag>/aurum/<platform>/`, verifies its size and SHA-256, and makes it executable. An `aurumPath` option
or `VOICE_AURUM_PATH` takes precedence and is labelled unverified. The engine's `--version` is checked before the
sidecar starts; a build older than 0.0.24 is refused.

Silence never reaches the model: the plugin measures the WAV (peak and voiced milliseconds) and ends the turn with no
speech.

## The models

Models are downloaded, never shipped. `manifest/models.json` pins each file by exact size, SHA-256 and revision. Files
live under `<cache>/engine/{models,tts}`, the layout Aurum expects, and that folder is passed to every engine command as
`--cache-dir`, so the file `/voice-install` writes is the file the sidecar reads. Each role's files are hashed again
before the engine first reads them. `assetsDir` takes precedence for a pre-seeded install and forbids downloading.

## Status and doctor

`status` is the contract's closed shape: name, version, host, state, the empty account list, the unguarded agents and
one next step. `doctor` is the product model: the engine facts (path, version, source, verification, a coded error), the
model cache, the microphone permission and device names, the dictation key and submit mode, the access level, the tool
counts and the problems. The dialog, `/voice-status` and the TUI read `doctor`; every app that needs the contract's
shape reads `status`.

The status state is `error` while a next step remains (the contract derives `error` from its problems) and `ready` when
nothing is left. Voice has no accounts, so `needs_sign_in` never applies.

## Errors

Every handler failure uses the contract's codes: `INPUT_INVALID` for a bad call, `UNAVAILABLE` for an engine, model or
playback failure, `HOST_UNTESTED` at the host gate, `OPTIONS_INVALID` at setup. The internal speech codes
(`ENGINE_MISSING`, `MODEL_MISSING`, `SIDECAR_FAILED`, …) never cross a door; their meaning travels in the message's
what and next step, and `doctor` names them precisely.

## Platform facts

- OpenCode 2.4.1 has no composer API in the terminal UI. A transcript reaches the prompt either by
  `client.session.prompt` (send) or by a prefilled `ui.dialog.prompt` (review).
- A TUI plugin registers a key with `keymap.layer`; the OS may take a combination before the plugin sees it. macOS uses
  `ctrl+space` for input-source switching, hence the shift form there.
- The microphone grant belongs to the responsible process (the terminal or host app). A child inherits that decision;
  the plugin reports it and never bypasses it.
- The engine is a pinned child process, never an in-process library, and every child is killed by the PID the plugin
  recorded.
