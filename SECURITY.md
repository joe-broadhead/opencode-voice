# Security

## Supported versions

Only the latest release is supported. Voice is tested on 2.2.3, 2.2.4, 2.2.5 and 2.2.6.

## Reporting a vulnerability

Report it through GitHub's private vulnerability reporting on
[github.com/joe-broadhead/opencode-voice](https://github.com/joe-broadhead/opencode-voice/security/advisories/new).
Do not open a public issue.

## Data handling

- **Audio never leaves the machine.** The speech providers are local. No cloud provider is part of this version.
- **Recordings are not kept.** A turn is a temp WAV in the plugin's cache, mode 0600, deleted after transcription, on
  error, on cancel and on dispose. There is no audio history.
- **Transcript text is not kept by default.** With `keepTranscripts`, the last 20 transcripts are stored as text in
  OpenCode's plugin storage for Voice and can be cleared with `c` in `/voice`.
- **No secrets in output.** Status, errors, commands and logs carry no transcript, no audio, no key and no absolute path
  outside the plugin's cache. `src/redact.ts` is applied to host and engine text.
- **Models are verified.** Every downloaded file is checked against an exact size and SHA-256 before it is renamed into
  the engine cache. Each role's files are verified again before the engine first reads them, and `/voice-install`
  verifies every file it wrote; a mismatch is `INTEGRITY_MISMATCH` and the file is never used.
- **The engine is pinned.** Each platform package ships a binary whose digest is checked against its manifest before
  it runs; a mismatch is `ENGINE_UNVERIFIED` and nothing starts. The engine must report Aurum 0.0.24 or later and its
  sidecar must advertise `transcribe`, or the plugin refuses with `ENGINE_INCOMPATIBLE`. `aurumPath` is a developer and
  organisation seam; `VOICE_AURUM_PATH` is the test seam. A binary found only on `PATH` is never run. The engine `/voice-install` downloads is checked against the SHA-256 in the pinned release manifest before it is made executable or started.
- **The install asks.** `/voice-install` asserts `voice_install` with the asset names, hosts and total size before the
  first request; the dialog asks with a yes/no confirmation. Installers serialise on a lock file, and a download
  follows redirects only to the pinned host over HTTPS.
- **Text is redacted.** Engine and host text that reaches status, the dialog, an error or the RPC is reduced to one line
  with token shapes removed; a status failure never echoes a path.
- **The microphone is never bypassed.** The OS grant belongs to the responsible process; the plugin reports it and links
  to System Settings.

## Permissions

**Every tool is allowed by default.** The plugin inserts a block after each agent's base allow that allows both tools,
so an agent can make the machine speak — out loud, on your speakers or a screen share — with no prompt. The `access`
option restricts that in one line (`"ask-changes"` asks each time, `"read-only"` denies speaking), and a per-tool rule
does it for `voice_speak` alone. The paste-ready block for an agent that must not ask is in `docs/configuration.md`.

`voice_speak` asserts its own permission inside its `execute`, because OpenCode does not enforce a plugin tool's declared
`ask`. From a script, an `ask` is refused with `PERMISSION_DENIED`, with no prompt and no tool call.

Voice writes audio, recordings and models only under its own cache (`~/Library/Caches/opencode-voice` on macOS, the
equivalent elsewhere): no tool, command or RPC takes a file path from you or from an agent, so no `external_directory`
rule is involved on either side.

## Scripts

The tools RPC (`voice.dictation.tools`) runs only `allow` rules, refuses an `ask` before dispatch, and never runs a
`deny`. The shared module is pinned by `scripts/check-copies.mjs`; do not edit its shared part in this repository.
