# Changelog

## 0.0.0 (2026-11-25)

Voice is a local voice plugin for OpenCode on plugin-contract v0. It signs in to nothing, reads no source and emits no
bus event: it reports the speech engine, the models and the machine's microphone, and reads text aloud. Dictation and the
dialog stay in the terminal UI.

### Added

- The `capabilities` manifest: `status` and `doctor` (read) and `speak` (write), with no accounts, sources, actions or
  events.
- One `register` call wires the three methods as agent tools in the `voice` namespace, as `tools.voice.<method>` in Code
  Mode, and as `POST /api/rpc/voice/<method>`; the access rules are generated from `access` and the methods.
- `status` answers exactly the contract's status shape through `statusAnswer`, with the one next step: install the
  engine, install the models, grant the microphone, or nothing.
- `doctor` answers the engine's path, version, source and verification, each model's cache state, the microphone
  permission and input/output devices, the dictation key and submit mode, the access level, the tool counts and the
  problems.
- `speak` reads one to 5,000 characters on the local speaker, deletes the temporary WAV on every path, and answers
  `UNAVAILABLE` with the engine's next step when it cannot.
- The pinned Aurum 0.0.24 engine and the speech models are downloaded only by `/voice-install`, verified by size and
  SHA-256, and cached under `voice-plugin`; `status` and `doctor` work without them.
- The terminal UI keeps the keybind, `/voice-dictate`, `/voice-speak`, the `/voice` dialog, auto-speak and the opt-in
  transcript history.
- Docs, the `voice` skill and `AGENTS.md` written for this release; the generated sections come from the manifest.
