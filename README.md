# Voice for OpenCode

Local voice dictation and read-aloud for OpenCode, powered by [Aurum](https://github.com/joe-broadhead/aurum): hold a key, speak, and the transcript is sent or reviewed, on device by default.

Unofficial; not affiliated with OpenCode or Anomaly.

## Requirements

- OpenCode `>=2.2.3 <2.3.0`, tested on 2.2.3, 2.2.4, 2.2.5 and 2.2.6.
- macOS on Apple silicon for the terminal UI; Linux (x64 or arm64) for engine mode (a host such as Jelly calls the plugin). The pinned Linux engine needs glibc 2.39 or newer (Ubuntu 24.04, Debian 13) and the ALSA runtime library (`libasound2`, or `libasound2t64` on Ubuntu 24.04). Status names what is missing.
- Aurum `0.0.24` or later. The engine ships in its platform package, which npm installs with the plugin, and is verified against its SHA-256 before it runs. `/voice-install` can also fetch the same pinned engine from the [Aurum 0.0.24 release](https://github.com/joe-broadhead/aurum/releases/tag/v0.0.24) into the plugin cache when it is missing. No `ffmpeg`, `afplay` or Rust toolchain is needed.

## Install

```bash
opencode plugin add @joe-broadhead/opencode-voice
```

Run `/voice` and press `i`, or run `/voice-install`, to download the speech models and, when it is not already in the plugin cache, the pinned Aurum engine. The download asks first, names the size and hosts, and every file is verified against its pinned SHA-256 before the engine reads it. `/voice-install` from a script asks through the permission prompt; the dialog asks with a yes/no confirmation. The models are stored under the plugin cache (`~/Library/Caches/opencode-voice/engine` on macOS) and passed to Aurum as `--cache-dir`.

## Sign in

None. Voice is local: there is no account, no API key and no network call in the default path. A cloud speech provider is not part of this version.

## Use

- **Dictate:** press `ctrl+shift+space` (macOS) or `ctrl+space` (Linux), or run `/voice-dictate`. Speak, then pause; the transcript is sent to the active session. A second press ends the turn at once. `escape` cancels.
- **Review first:** set `"submit": "review"` to open a prefilled dialog instead of sending at once.
- **Read aloud:** run `/voice-speak` to hear the last reply, or set `"autoSpeak": true`.
- **Status:** run `/voice` or `/voice-status` for the engine, the models, the microphone and the one next step. `/voice-install` downloads missing models. In the dialog, `r` refreshes, `d` runs the doctor, `s` toggles send/review, `a` toggles auto-speak and `c` clears the opt-in history.
- **Engine mode:** a host such as hey-jelly calls `voice.dictation.engine` with audio and gets text; see [docs/engine.md](https://github.com/joe-broadhead/opencode-voice/blob/HEAD/docs/engine.md).

Audio stays on the machine. A recording is written to a private 0700 folder in the plugin cache, made mode 0600 when it closes, transcribed, and deleted on success, failure and cancel; transcripts are not kept unless `"keepTranscripts": true`, which stores the last 20 texts in OpenCode's plugin storage for Voice and is cleared with `c` in `/voice`.

## Permissions

**Every tool is allowed by default.** The plugin inserts this block after every agent's base `* * allow`. `access: "all"`
is the default, so this is the block in force:

<!-- rules:all -->
```json
[
  {"action": "voice_*", "resource": "*", "effect": "allow"},
  {"action": "voice_status", "resource": "*", "effect": "allow"},
  {"action": "voice_speak", "resource": "*", "effect": "allow"}
]
```
<!-- /rules:all -->

With `access: "ask-changes"`, status still runs and speaking asks:

<!-- rules:ask-changes -->
```json
[
  {"action": "voice_*", "resource": "*", "effect": "ask"},
  {"action": "voice_status", "resource": "*", "effect": "allow"},
  {"action": "voice_speak", "resource": "*", "effect": "ask"}
]
```
<!-- /rules:ask-changes -->

With `access: "read-only"`, status still runs and speaking is denied:

<!-- rules:read-only -->
```json
[
  {"action": "voice_*", "resource": "*", "effect": "deny"},
  {"action": "voice_status", "resource": "*", "effect": "allow"},
  {"action": "voice_speak", "resource": "*", "effect": "deny"}
]
```
<!-- /rules:read-only -->

So `voice_speak` reads text aloud on this machine whenever an agent decides to, with no prompt. That is sound on a
laptop whose speakers only you can hear; on a shared machine or a screen share, restrict it.

To restrict, choose one of three:

1. **`access`**, one option for the plugin: `"all"` (the default), `"ask-changes"` (status runs, speaking asks) or
   `"read-only"` (status runs, speaking is denied).
2. **An agent's own rules**, such as a silent agent:
   `"permissions": [{ "action": "voice_*", "resource": "*", "effect": "deny" }, { "action": "voice_status", "resource": "*", "effect": "allow" }]`.
3. **A per-tool rule** in your `opencode.json`: `{ "action": "voice_speak", "resource": "*", "effect": "ask" }`, or
   `"deny"` to turn speaking off.

An agent without a base allow gets no rules. `/voice` lists agents whose own rules would let a voice tool run without
asking, and prints the block for the access value in force.

## Configure

Options live in the plugin entry in `opencode.json`; every option and its error code is in [docs/configuration.md](https://github.com/joe-broadhead/opencode-voice/blob/HEAD/docs/configuration.md).

```json
{
  "plugins": [
    {
      "package": "@joe-broadhead/opencode-voice",
      "options": { "submit": "review", "autoSpeak": true, "voice": "Luna", "keybind": "ctrl+shift+space" }
    }
  ]
}
```

## Organisation rollout

A managed config can pre-set the options and point at a pre-seeded model folder:

```json
{
  "plugins": [
    {
      "package": "@joe-broadhead/opencode-voice",
      "options": { "assetsDir": "/opt/voice/models", "submit": "review" }
    }
  ]
}
```

The system config paths are `/etc/opencode/opencode.json` on Linux and `/Library/Application Support/opencode/opencode.json` on macOS. With `assetsDir`, the plugin never downloads; a missing or altered file is reported by `/voice`.

## Known limits

- Voice speaks through Aurum's local Kitten voice; a cloud provider is not part of this version.
- The microphone grant belongs to the terminal or host app that started OpenCode, not to the plugin. The `Access` row reports what the engine's doctor sees.
- A recording is at most 120 seconds. Aurum 0.0.24 accepts long audio; an older build without the `long_audio` capability accepts 30 seconds per utterance and the plugin says so.
- Voice has no engine for Intel Macs (x64) or Windows; status reports `UNSUPPORTED_PLATFORM`. Use macOS on Apple silicon or
  Linux, or set `aurumPath` to a local engine.
- Linux systems with glibc older than 2.39 (Ubuntu 22.04, Debian 12) cannot run the pinned engine. Status names the
  symbol version it needs and the systems that have it.

## Troubleshooting

| Code | What to do |
|---|---|
| `ENGINE_MISSING` | Reinstall `@joe-broadhead/opencode-voice` with its optional platform package, then run `/voice-status`. |
| `ENGINE_UNVERIFIED` | Reinstall the package; a binary whose digest does not match is never run. |
| `ENGINE_INCOMPATIBLE` | Install Aurum 0.0.24 or later. |
| `ENGINE_EXITED` | Run the doctor in `/voice`, then try again. |
| `UNSUPPORTED_PLATFORM` | Use macOS on Apple silicon or Linux, or set `aurumPath` to a local engine. |
| `UNSUPPORTED` | Use a supported platform and engine. |
| `MODEL_MISSING` | Run `/voice-install` and approve the download. |
| `MODEL_DOWNLOAD_FAILED` | Retry `/voice-install`; if it persists, check the network or proxy. |
| `INTEGRITY_MISMATCH` | Retry `/voice-install`; a model that does not match its hash is never used. |
| `MIC_DENIED` | Grant microphone access in System Settings → Privacy & Security → Microphone. |
| `MIC_UNAVAILABLE` | Connect a microphone, then run `/voice-dictate` again. |
| `AUDIO_DEVICE_MISSING` | Connect an output device, then try again. |
| `NO_SPEECH` | Speak again, a little closer to the microphone. |
| `AUDIO_TOO_LONG` | Shorten the recording or the text. |
| `INPUT_INVALID` | Fix the call's input as the message says, then call it again. |
| `UNCHECKED` | Call it from a session, where its approval can be answered. |
| `BAD_AUDIO` | Send a WAV file, 16 kHz, mono, 16-bit PCM. |
| `BUSY` | Wait for the current dictation, or press `escape`. |
| `TIMEOUT` | Try again, then run the doctor in `/voice`. |
| `CANCELLED` | Nothing to do. |
| `SIDECAR_FAILED` | Run the doctor in `/voice`, then try again. |
| `PROVIDER_AUTH_REQUIRED` | Add the provider key, or choose a local model in `/voice`. |
| `PROVIDER_FAILED` | Try again, or choose a local model in `/voice`. |
| `HOST_UNTESTED` | Use OpenCode `>=2.2.3 <2.3.0`, or set `allowUntestedHost`. |
| `OPTIONS_INVALID` | Fix the named option in `opencode.json`. |
| `STATUS_UNAVAILABLE` | Try again, then run the doctor in `/voice`. |
| `SKILLS_INVALID` | Reinstall `@joe-broadhead/opencode-voice`. |

## Uninstall

```bash
opencode plugin remove @joe-broadhead/opencode-voice
```

The model cache stays under the platform cache folder (`~/Library/Caches/opencode-voice` on macOS, `~/.cache/opencode-voice` on Linux); delete it to remove the models too.

## Links

- [Configuration](https://github.com/joe-broadhead/opencode-voice/blob/HEAD/docs/configuration.md)
- [Architecture](https://github.com/joe-broadhead/opencode-voice/blob/HEAD/docs/architecture.md)
- [Engine contract](https://github.com/joe-broadhead/opencode-voice/blob/HEAD/docs/engine.md)
- [Scripting](https://github.com/joe-broadhead/opencode-voice/blob/HEAD/docs/scripting.md)
- [Changelog](https://github.com/joe-broadhead/opencode-voice/blob/HEAD/CHANGELOG.md)
- [Licence](https://github.com/joe-broadhead/opencode-voice/blob/HEAD/LICENSE) and [NOTICE](https://github.com/joe-broadhead/opencode-voice/blob/HEAD/NOTICE)

Portions are adapted from [oc-aurum](https://github.com/cesar-alves/oc-aurum) by Cesar Alves, MIT; see NOTICE.
