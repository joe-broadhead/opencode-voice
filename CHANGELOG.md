# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.5] - 2026-11-23

### Changed

- The tools RPC transport is source-contract's `tools-rpc` module, pinned at
  `github:we-the-rebel-alliance/source-contract#v0.3.0` and bundled into `dist/index.js`. The vendored copy of the module
  and its `check-copies` entry are gone. The RPC method names, their classes and permission actions are unchanged when
  registered. The answers are not all unchanged: `voice_status` now answers without an engine (status only), and
  `voice_speak` stopped with Stop rejects `CANCELLED` instead of reporting `played: true`; the lifecycle changes are
  described under Fixed below. source-contract's MIT notice is in `NOTICE`, and the forbidden scan allows the transport's
  one evaluate hook in the bundle it is inlined into.
- CI runs actionlint 1.7.12, installed from its release and checked against the published SHA-256 sums, and a run by
  hand no longer shares a concurrency group with a push on the same ref.
- No host-support change: still tested on 2.2.3, 2.2.4, 2.2.5, 2.2.6, 2.2.7, 2.3.0, 2.3.1 and 2.3.2, with the supported range
  unchanged (`>=2.2.3 <2.4.0`).

### Fixed

- `voice_status` is registered whenever the options are readable, including a fresh install with no engine. An empty
  release cache with a valid manifest reports `not_configured` with an optional install step; a broken manifest or a
  missing `aurumPath` or `VOICE_AURUM_PATH` override stays `failed` with its own actionable step. `voice_speak` and the
  engine RPC still wait for the engine.
- A Stop during playback is a `CANCELLED` rejection, not a completed read: `voice_speak` no longer returns
  `played: true` after the reply was stopped. Each playback owns its child, settlement and abort listener, so a failed,
  completed or stopped call's signal cannot stop or settle the next one. A stopped playback keeps the exclusive player
  slot until its child actually exits; a SIGTERM-resistant child is killed after the bounded grace, so a second playback
  cannot spawn concurrently.
- Stop or disposal cancels an in-flight render. A stale render cannot call play or reset a newer dictation's state, and
  `SpeechEngine.play` refuses after disposal, so a held tool render cannot report `played: true`. Disposal during the
  awaited version/model preflight starts no sidecar and dispatches no render; a pending sidecar start is fenced and its
  waiters reject.
- A cancelled synthesis cannot settle a newer render: the sidecar that may still emit the cancelled event is retired
  before a new request starts, so its stale event and metadata cannot cross. The playback escalation timer is cleared
  when its own child exits.

## [0.0.4] - 2026-11-18

### Changed

- The plugin is tested on 2.2.3, 2.2.4, 2.2.5, 2.2.6, 2.2.7, 2.3.0, 2.3.1 and 2.3.2. The supported range is unchanged (`>=2.2.3 <2.4.0`).

## [0.0.3] - 2026-11-15

### Changed

- The plugin admits OpenCode 2.3: the host range is `>=2.2.3 <2.4.0` (`opencode.host` and `SUPPORTED_HOST`), tested on 2.2.3, 2.2.4, 2.2.5, 2.2.6, 2.2.7 and 2.3.0 (`TESTED_HOSTS`); the host stage, CI and the release's install check run every one. Below 2.2.3 or from 2.4.0 the plugin refuses with `HOST_UNTESTED`. Nothing in the plugin relied on what 2.3 changes: it starts no subagent and reads no `session.tool.failed` event. 2.3's terminal UI still has no composer API, so dictation reaches the prompt as before.

### Fixed

- `voice_speak` stops when the call is stopped: it hands the call's `signal`, from the tool and from the tools RPC, to playback, so on OpenCode 2.3, where Stop aborts it, reading aloud ends at once (`CANCELLED`). A call stopped before playback plays nothing.

## [0.0.2] - 2026-11-14

### Changed

- `package.json` is `"private": true`, so nothing can be published to npm; installs from the GitHub tag are unaffected.
- `docs/jelly.md` no longer says that Jelly writes each declared effect as that tool's default. It says what Jelly does:
  it applies the `access` setting itself from each tool's `readOnly`, so `voice_status` runs at every setting and
  `voice_speak` runs at Allowed, asks at Ask before changes and is denied at Read only. It also says how Jelly decides
  the undeclared `voice_install` consent that `/voice-install` asks. The declaration is unchanged.

## [0.0.1] - 2026-11-13

### Added

- The `jelly` settings declare their choices: `access` offers Jelly's three choices, **Allowed**, **Ask before
  changes** and **Read only**, and `maxRecordSeconds` is declared as a whole number from 5 to 120, the options
  parser's own set and bounds (needs a jelly that includes app#1301). `submit` and `statusIndicator` are not declared:
  they apply only to OpenCode's terminal UI and do nothing in Jelly; they stay options in `opencode.json`.

## [0.0.0] - 2026-11-10
<!-- kit-release: the GitHub release v0.0.0 -->

### Added

- Push-to-talk and hands-free dictation in the terminal UI, sending on pause or opening a prefilled review dialog,
  with `escape` to cancel.
- Read the last reply aloud, and opt-in auto-speak, with the local Kitten voice.
- One status dialog and `/voice-status`, covering the engine, the models, the microphone, the tools, the agents without
  default rules and one next step.
- `/voice-install`, which downloads the pinned models, verifies their size and SHA-256, and reports each file.
- `voice_status` and `voice_speak` agent tools, and the `voice.dictation.tools` RPC with `describe`.
- The `voice.dictation.engine` RPC for hosts such as hey-jelly: status, warmup, transcribe, synthesize and cancel.
- The pinned Aurum 0.0.24 engine for macOS on Apple silicon and for Linux x64 and arm64 (glibc), downloaded by
  `/voice-install` from this plugin's GitHub release, verified by SHA-256 before it runs, with no `ffmpeg`, `afplay` or
  Rust toolchain.
- The `voice` skill, the `jelly` declaration and the family icon.
- A Jelly `access` setting, with `all`, `ask-changes` and `read-only`, as the other plugins declare it.

### Changed

- Every tool is allowed by default: the plugin inserts one `allow` rule for the `voice_*` pattern and one for each of
  `voice_status` and `voice_speak` after every agent's base rule, so speaking a reply aloud runs with no prompt and a
  tool Voice adds later runs at once. An agent's own rules, your `permissions` and a saved approval still win.
- The `access` option restricts that in one line: `"all"` (the default), `"ask-changes"` (status runs, speaking asks)
  and `"read-only"` (status runs, speaking is denied). The README prints the block for each value, and `/voice-status`
  shows the one in force.
- A missing engine says to run `/voice-install`, which downloads the pinned engine into the plugin cache; a reinstall is
  not needed.
- Windows reports `UNSUPPORTED_PLATFORM`, not a missing install, and the next step names Linux as well as macOS.
- An Aurum binary set with `aurumPath` or `VOICE_AURUM_PATH` runs on Intel Macs, which have no pinned engine; status no
  longer calls it unsupported, and no longer tells you to reinstall a binary you chose.
- On Linux, an engine that cannot load its ALSA runtime library, or that needs a newer C library than the system has, is
  reported by name with the next step, instead of as an incompatible engine.
