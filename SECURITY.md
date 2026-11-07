# Security

## Supported versions

Only the latest release is supported. Voice is tested on OpenCode 2.2.3, 2.2.4 and 2.2.5.

## Reporting a vulnerability

Report it through GitHub's private vulnerability reporting on
[github.com/joe-broadhead/opencode-voice](https://github.com/joe-broadhead/opencode-voice/security/advisories/new).
Do not open a public issue.

## Data handling

- **Audio never leaves the machine.** The speech providers are local. No cloud provider is part of this version.
- **Recordings are not kept.** A turn is a temp WAV in the plugin's cache, mode 0600, deleted after transcription, on
  error, on cancel and on dispose. There is no audio history.
- **Transcript text is not kept by default.** With `keepTranscripts`, the last 20 transcripts are stored as text in the
  plugin's own store and can be cleared.
- **No secrets in output.** Status, errors, commands and logs carry no transcript, no audio, no key and no absolute path
  outside the plugin's cache. `src/redact.ts` is applied to host and engine text.
- **Models are verified.** Every downloaded file is checked against an exact size and SHA-256 before it is renamed into
  the content-addressed cache; a mismatch is discarded.
- **The engine is pinned.** Each platform package ships a binary whose digest is checked against its manifest before
  it runs. `aurumPath` and `VOICE_AURUM_PATH` are developer seams and are labelled unverified in status.
- **The microphone is never bypassed.** The OS grant belongs to the responsible process; the plugin reports it and links
  to System Settings.

## Permissions

The plugin inserts two rules after each agent's base allow: `voice_*` asks, and `voice_status` is allowed. A read-only
block for agents that must not ask is printed by `/voice` and documented in `docs/configuration.md`.

`voice_speak` asserts its own permission inside its `execute`, because OpenCode does not enforce a plugin tool's declared
`ask`. From a script, an `ask` is refused with `PERMISSION_DENIED`, with no prompt and no tool call.

## Scripts

The tools RPC (`voice.dictation.tools`) runs only `allow` rules, refuses an `ask` before dispatch, and never runs a
`deny`. The shared module is pinned by `scripts/check-copies.mjs`; do not edit its shared part in this repository.
