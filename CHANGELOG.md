# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.0] - Unreleased

### Added

- Push-to-talk and hands-free dictation in the terminal UI, sending on pause or opening a prefilled review dialog,
  with `escape` to cancel.
- Read the last reply aloud, and opt-in auto-speak, with the local Kitten voice.
- One status dialog and `/voice-status`, covering the engine, the models, the microphone, the tools, the agents without
  default rules and one next step.
- `/voice-install`, which downloads the pinned models, verifies their size and SHA-256, and reports each file.
- `voice_status` and `voice_speak` agent tools, and the `voice.dictation.tools` RPC with `describe`.
- The `voice.dictation.engine` RPC for hosts such as hey-jelly: status, warmup, transcribe, synthesize and cancel.
- Pinned per-platform Aurum engine packages, digest-verified, with no `ffmpeg`, `afplay` or Rust toolchain.
- The `voice` skill, the `jelly` declaration and the family icon.
