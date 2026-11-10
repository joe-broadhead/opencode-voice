# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Push-to-talk and hands-free dictation in the terminal UI, sending on pause or opening a prefilled review dialog,
  with `escape` to cancel.
- Read the last reply aloud, and opt-in auto-speak, with the local Kitten voice.
- One status dialog and `/voice-status`, covering the engine, the models, the microphone, the tools, the agents without
  default rules and one next step.
- `/voice-install`, which downloads the pinned models, verifies their size and SHA-256, and reports each file.
- `voice_status` and `voice_speak` agent tools, and the `voice.dictation.tools` RPC with `describe`.
- The `voice.dictation.engine` RPC for hosts such as hey-jelly: status, warmup, transcribe, synthesize and cancel.
- The pinned Aurum 0.0.24 engine, in a platform package for macOS on Apple silicon and for Linux x64 and arm64 (glibc),
  verified by SHA-256 before it runs, with no `ffmpeg`, `afplay` or Rust toolchain. `/voice-install` can also fetch the
  same pinned binary into the plugin cache.
- The `voice` skill, the `jelly` declaration and the family icon.
- A Jelly `access` setting, with `all`, `ask-changes` and `read-only`, as the other plugins declare it.

### Changed

- Every tool is allowed by default: the plugin inserts one `allow` rule for the `voice_*` pattern and one for each of
  `voice_status` and `voice_speak` after every agent's base rule, so speaking a reply aloud runs with no prompt and a
  tool Voice adds later runs at once. An agent's own rules, your `permissions` and a saved approval still win.
- The `access` option restricts that in one line: `"all"` (the default), `"ask-changes"` (status runs, speaking asks)
  and `"read-only"` (status runs, speaking is denied). The README prints the block for each value, and `/voice-status`
  shows the one in force.
- A missing engine says to reinstall with the optional platform package, because a reinstall alone does not restore an
  optional dependency that npm skipped.
- `/voice-install` no longer downloads a second copy of the engine when the platform package carries the pinned one.
- Windows reports `UNSUPPORTED_PLATFORM`, not a missing install, and the next step names Linux as well as macOS.
- On Linux, an engine that cannot load its ALSA runtime library is reported by name, with the package to install, instead
  of as an incompatible engine.
