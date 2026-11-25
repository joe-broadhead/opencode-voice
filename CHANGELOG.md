# Changelog

Every release gets one section, newest first. The format is [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the versions follow semver from `0.0.0`.

## [0.0.0]

The first release on plugin-contract v0. It is a greenfield rebuild: the old tools-RPC transport, the copied kit, the
fixed status RPC and the app-specific declaration are gone.

### Added

- The `capabilities` manifest: `status`, `doctor` and `speak`, no accounts, no sources, no actions and no bus events.
- `status`: exactly the contract's status shape, with the one next step (install the engine, install the models, grant
  the microphone, nothing).
- `doctor`: the full engine, model, microphone, device, dictation-key and access report behind the dialog and
  `/voice-status`.
- `speak`: local read-aloud, one to 5,000 characters, through the contract's doors with the generated access rules.
- The TUI plugin `voice-tui`: the dialog, the keybind, `/voice-dictate`, `/voice-speak`, auto-speak and the opt-in
  transcript history.
- `npm run check` and the `ci` workflow run typecheck, build, unit tests, the conformance recording, `plugin-kit check`
  (T0 and T1 on 2.4.1) and the pack test.

### Changed

- The plugin id, namespace, RPC id and permission actions are `voice` and `voice.<method>`.
- The engine and models live under the platform cache folder `voice-plugin`.
- Errors use the contract's table. The internal speech codes stay inside the provider and travel as the what and next
  step of `UNAVAILABLE`, and in `doctor`.
- Docs, the skill and `AGENTS.md` are written for v0.0.0; generated sections come from the manifest.

### Removed

- The tools-RPC transport and the fixed status RPC.
- The copied release, drift, icons, copies, forbidden and tested-hosts scripts, and the app-named support files.
- The old app-specific manifest keys.
