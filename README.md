# Voice for OpenCode

Local voice dictation and read-aloud for OpenCode, powered by [Aurum](https://github.com/joe-broadhead/aurum): hold a key, speak, and the transcript is sent or reviewed, on device by default.

Unofficial; not affiliated with Aurum's distributor or any other vendor.

## Requirements

- OpenCode `>=2.2.3 <2.3.0`, tested on 2.2.3, 2.2.4 and 2.2.5.
- macOS on Apple silicon for the terminal UI; Linux is supported for engine mode (a host such as Jelly calls the plugin).
- The package installs the pinned Aurum engine for your platform. No `ffmpeg`, `afplay` or Rust toolchain is needed.

## Install

```bash
opencode plugin add @joe-broadhead/opencode-voice
```

Run `/voice` and press `i` to download the speech models. They are verified against their pinned SHA-256 hashes before use.

## Sign in

None. Voice is local: there is no account, no API key and no network call in the default path. A cloud speech provider is not part of this version.

## Use

- **Dictate:** press `ctrl+shift+space` (macOS) or `ctrl+space` (Linux), or run `/voice-dictate`. Speak, then pause; the transcript is sent to the active session. A second press ends the turn at once. `escape` cancels.
- **Review first:** set `"submit": "review"` to open a prefilled dialog instead of sending at once.
- **Read aloud:** run `/voice-speak` to hear the last reply, or set `"autoSpeak": true`.
- **Status:** run `/voice` or `/voice-status` for the engine, the models, the microphone and the one next step. `/voice-install` downloads missing models.
- **Engine mode:** a host such as hey-jelly calls `voice.dictation.engine` with audio and gets text; see [docs/engine.md](https://github.com/joe-broadhead/opencode-voice/blob/HEAD/docs/engine.md).

Audio stays on the machine. A recording is written to the plugin's private cache at mode 0600, transcribed, and deleted; transcripts are not kept unless `"keepTranscripts": true`.

## Permissions

The plugin inserts two rules after every agent's base `* * allow`:

```
{ "action": "voice_*",      "resource": "*", "effect": "ask" },
{ "action": "voice_status", "resource": "*", "effect": "allow" },
```

`voice_status` only reads; `voice_speak` speaks on your machine and asks first. An agent without a base allow gets no rules. `/voice` lists agents whose own rules would let a voice tool run without asking.

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

## Troubleshooting

| Code | What to do |
|---|---|
| `ENGINE_MISSING` | Reinstall `@joe-broadhead/opencode-voice`, then run `/voice-status`. |
| `ENGINE_UNVERIFIED` | Reinstall the package; if it persists, report it. |
| `ENGINE_INCOMPATIBLE` | Install the Aurum version that `/voice-status` names. |
| `ENGINE_EXITED` | Run the doctor in `/voice`, then try again. |
| `UNSUPPORTED_PLATFORM` | Use macOS on Apple silicon, or set `aurumPath` to a local engine. |
| `UNSUPPORTED` | Use a supported platform and engine. |
| `MODEL_MISSING` | Run `/voice-install`. |
| `MODEL_DOWNLOAD_FAILED` | Retry `/voice-install`; if it persists, check the network or proxy. |
| `INTEGRITY_MISMATCH` | Retry `/voice-install`; if it persists, report it. |
| `MIC_DENIED` | Grant microphone access in System Settings → Privacy & Security → Microphone. |
| `MIC_UNAVAILABLE` | Connect a microphone, or choose another input device in `/voice`. |
| `AUDIO_DEVICE_MISSING` | Choose another device in `/voice`. |
| `NO_SPEECH` | Speak again, a little closer to the microphone. |
| `AUDIO_TOO_LONG` | Send a shorter utterance. |
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
