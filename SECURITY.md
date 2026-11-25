# Security

## Supported versions

Only the latest release is supported. Voice is tested on OpenCode 2.4.1.

## Reporting a vulnerability

Report it through GitHub's private vulnerability reporting on
[github.com/we-the-rebel-alliance/voice-plugin](https://github.com/we-the-rebel-alliance/voice-plugin/security/advisories/new).
Do not open a public issue.

## Data handling

- **Audio never leaves the machine.** The speech providers are local. No cloud provider is part of this version.
- **Recordings are not kept.** A turn is a temp WAV in the plugin cache, mode `0600`, deleted after transcription, on
  error, on cancel and on dispose. There is no audio history.
- **Transcript text is not kept by default.** With `keepTranscripts`, the last 20 transcripts are stored as text in
  OpenCode's plugin storage for this plugin and can be cleared with `c` in `/voice`.
- **No secrets in output.** `status`, `doctor`, errors, commands and logs carry no transcript, no audio, no key and no
  token; external text is redacted by `src/redact.ts`. `doctor` keeps local paths and device names because they are the
  person's own machine.
- **Models are verified.** Every downloaded file is checked against an exact size and SHA-256 before it is renamed into
  the engine cache, and each role's files are verified again before the engine first reads them.
- **The engine is pinned.** The upstream asset's size and digest are checked against `manifest/aurum.json` before it
  runs; a mismatch is refused and nothing starts. The engine must report Aurum 0.0.24 or later and its sidecar must
  advertise `transcribe`, or the plugin refuses. A binary found only on `PATH` is never run.
- **The install asks.** `/voice-install` asserts `voice.install` with the asset names, the hosts and the total size
  before the first request; the dialog asks with a yes/no confirmation. Installs serialise on a lock file, and a
  download follows redirects only to the pinned host over HTTPS.
- **The microphone is never bypassed.** The OS grant belongs to the responsible process; the plugin reports it and
  names the system setting.

## Permissions

Access comes from the contract: `options.access` is the ceiling, `status` and `doctor` always run, and `speak` runs
under `all`, asks under `ask-changes` and is off under `read-only`. The plugin installs the generated rules after each
agent's base allow; a later rule of the person's wins, and an agent without the rules is named in `status` and never
patched.

`speak` is a non-read method: over RPC it needs an answered permission ask or a host-signed action grant. An allow rule
alone is refused with `PERMISSION_DENIED`. Voice writes only under its own cache (`voice-plugin`), and no method takes a
path from a caller.
