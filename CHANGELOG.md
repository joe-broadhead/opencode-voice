# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.0.0 (unreleased)

### Changed

- The plugin is `@we-the-rebel-alliance/voice-plugin` at `0.0.0`, and every repository link, badge and install line
  points to `we-the-rebel-alliance/voice-plugin`.
- OpenCode `>=2.4.1 <2.5.0`, tested on 2.4.1 only. The old host matrices and the per-release SDK path are gone.
- The host engine RPC (`voice.dictation.engine`), its `engine` option and its docs are removed. Voice keeps its own
  read-only status RPC (`voice.dictation`) for `/voice-status`, the dialog and the terminal UI.
- The namespace line is within the fixed-context budget, names the Utilities plugin instead of its tool, and marks
  results as untrusted data.

### Removed

- The Jelly engine contract (`docs/engine.md`) and the app guide (`docs/jelly.md`).
