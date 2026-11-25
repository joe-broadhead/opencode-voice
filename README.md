# Voice for OpenCode

Local voice for OpenCode: read text aloud on this machine, and dictate into a session from the terminal UI. The speech
engine and the models run on the machine; audio and transcripts stay there, and a recording is never kept.

Voice is a plugin for [plugin-contract](https://github.com/we-the-rebel-alliance/plugin-contract) v0 on OpenCode 2.4.1.
It signs in to nothing: there is no account, no API key and no network call in the default path.

## Requirements

- OpenCode `>=2.4.1 <2.5.0`, tested on 2.4.1.
- macOS on Apple silicon or Linux (x64 or arm64). The pinned Linux engine needs glibc 2.39 or newer (Ubuntu 24.04,
  Debian 13) and the ALSA runtime (`libasound2`, or `libasound2t64` on Ubuntu 24.04).
- [Aurum](https://github.com/joe-broadhead/aurum) `0.0.24` or later. The engine is optional: `status` and `doctor` work
  without it, and nothing is downloaded until a person runs `/voice-install` or the dialog's install. The engine is the
  pinned build in this plugin's GitHub release, verified against its SHA-256 before it runs.
- No `ffmpeg`, `afplay` or Rust toolchain.

## Install

A release of the plugin is not published yet: the first release on plugin-contract is `v0.0.0`, and it is cut after the
contract tag. From a development checkout:

```bash
git clone https://github.com/we-the-rebel-alliance/voice-plugin
cd voice-plugin
npm ci
npm run build
opencode plugin add /absolute/path/to/voice-plugin
```

Once a release exists, install the tag that contains the built entry:
`opencode plugin add github:we-the-rebel-alliance/voice-plugin#v<version>`.

Run `opencode reload`, or restart OpenCode, then run `/voice-status`.

## Sign in

None. Voice is local: no account, no API key, no cloud speech provider.

## Use

- **Dictate:** press `ctrl+shift+space` (macOS) or `ctrl+space` (Linux), or run `/voice-dictate`. Speak, then pause; the
  transcript is sent to the active session, or opens a prefilled review dialog when `submit` is `review`. A second press
  ends the turn; `escape` cancels. Dictation is a terminal-UI action, not a tool.
- **Read aloud:** the `speak` method reads text on this machine. `/voice-speak` reads the last reply, and
  `autoSpeak: true` reads every completed reply.
- **Status:** `/voice` opens the dialog (engine, models, microphone, the next step; `r`, `i`, `d`, `s`, `a` and `c` act
  inside it). `/voice-status` prints the same model as a message. `/voice-install` downloads the pinned engine and the
  missing models after one ask.
- The dialog and the tools answer from one model: `status` is the contract's closed shape, and `doctor` is the full
  engine, model, device and access report.

Audio stays on the machine. A recording is written to a private `0700` folder under the plugin cache, made mode `0600`
when it closes, transcribed, and deleted on success, failure and cancel. Transcripts are not kept unless
`keepTranscripts: true`, which stores the last 20 texts in OpenCode's plugin storage and is cleared with `c` in `/voice`.

## Access levels

`access` is the person's ceiling; a later rule of their own still wins.

| Level | `read` (`status`, `doctor`) | `speak` |
|---|---|---|
| `all` (default) | runs | runs |
| `ask-changes` | runs | asks first |
| `read-only` | runs | off |

Agents whose own rules would let a generated rule run without asking are named in `status.unguardedAgents`, and never
patched behind the person's back. Speaking is local playback; on a shared machine or a screen share, set
`access: "ask-changes"` or `"read-only"`.

## Capabilities

<!-- generated:capabilities -->
### Methods

| Method | Class | Accounts | Operations |
|---|---|---|---|
| `status` | read | none | — |
| `doctor` | read | none | — |
| `speak` | write | none | — |

### Sources

| Source | Kind | Reads or output | Method | Cost |
|---|---|---|---|---|

### Actions

None.

### Bus events

None.
<!-- /generated:capabilities -->

## Errors

A method call fails with one of the contract's codes. Voice's internal speech codes never cross that door: an engine,
model or playback failure answers `UNAVAILABLE`, and its message carries the reason and the one next step (for example
"run /voice-install", or the ALSA library to install). `doctor` and `/voice-status` name the precise condition.

<!-- generated:errors -->
| Code | Meaning |
|---|---|
| `NEEDS_SIGN_IN` | the account is not signed in |
| `SCOPE_MISSING` | the call needs a scope the person has not confirmed |
| `ACCOUNT_REQUIRED` | the plugin serves several accounts and the call names none |
| `ACCOUNT_UNKNOWN` | the call names an alias the plugin does not serve |
| `ACCOUNT_MISMATCH` | the item belongs to another account |
| `CURSOR_INVALID` | the cursor is malformed, or belongs to another source, account or scope |
| `CURSOR_EXPIRED` | the provider no longer keeps the history the cursor names |
| `RATE_LIMITED` | the provider asked the plugin to slow down |
| `BUDGET_EXCEEDED` | the read would cost more than the person allows |
| `SOURCE_DISABLED` | the person turned this source or action off |
| `TOO_LARGE` | the answer is larger than the source's maxBytes |
| `INPUT_INVALID` | the input does not match the method's schema |
| `SOURCE_UNKNOWN` | the plugin declares no such source |
| `SCHEMA_VIOLATION` | an answer does not keep the contract's shape |
| `PERMISSION_DENIED` | the person's grant does not cover the call |
| `PLAN_INVALID` | the plan is missing, or belongs to another method |
| `PLAN_USED` | the plan was already used by an earlier commit |
| `GRANT_INVALID` | the action grant did not verify, or was already spent |
| `HOST_UNTESTED` | OpenCode is outside the plugin's tested range |
| `OPTIONS_INVALID` | the plugin's options do not match their schema |
| `UNAVAILABLE` | the provider could not be reached |
<!-- /generated:errors -->

## Troubleshooting

| What `doctor` says | What to do |
|---|---|
| The engine is not installed (`ENGINE_MISSING`, `not-installed`) | `/voice-install`; nothing downloads until a person asks. |
| A configured engine is missing (`aurumPath`, `VOICE_AURUM_PATH`) | Point the option at an existing binary, or remove it. |
| The engine does not match its digest (`ENGINE_UNVERIFIED`) | `/voice-install` replaces it; a binary that does not verify never runs. |
| The engine is older than 0.0.24 (`ENGINE_INCOMPATIBLE`) | `/voice-install` installs the pinned version. |
| The engine cannot load a library (`libasound.so.2`) | Install the ALSA runtime (`libasound2t64` on Ubuntu 24.04). |
| Models are missing (`MODEL_MISSING`) | `/voice-install`. |
| The microphone is denied or restricted | Grant it in System Settings → Privacy & Security → Microphone. |
| No output device | Connect one, then try again. |
| The engine is not built for this platform | Use macOS on Apple silicon or Linux, or set `aurumPath`. |

## Privacy

Audio, transcripts and the model cache stay on the machine. Nothing is sent to a provider. `docs/security.md` states
what is stored, where, and what is redacted.

## Links

- [Capabilities](https://github.com/we-the-rebel-alliance/voice-plugin/blob/master/docs/capabilities.md)
- [Configuration](https://github.com/we-the-rebel-alliance/voice-plugin/blob/master/docs/configuration.md)
- [Architecture](https://github.com/we-the-rebel-alliance/voice-plugin/blob/master/docs/architecture.md)
- [Security](https://github.com/we-the-rebel-alliance/voice-plugin/blob/master/docs/security.md)
- [Automations](https://github.com/we-the-rebel-alliance/voice-plugin/blob/master/docs/automations.md)
- [Changelog](https://github.com/we-the-rebel-alliance/voice-plugin/blob/master/CHANGELOG.md)
- [Licence](https://github.com/we-the-rebel-alliance/voice-plugin/blob/master/LICENSE) and
  [NOTICE](https://github.com/we-the-rebel-alliance/voice-plugin/blob/master/NOTICE)

Portions are adapted from [oc-aurum](https://github.com/cesar-alves/oc-aurum) by Cesar Alves, MIT; see NOTICE.
