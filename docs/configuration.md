# Configuration

Every option is read from the plugin entry in `opencode.json`. An unknown option is refused with `OPTIONS_INVALID` and
the field's name; no option value is ever echoed in an error, a log or status.

| Option | Type | Default | Meaning |
|---|---|---|---|
| `submit` | `"send"` \| `"review"` | `"send"` | Send the transcript at once, or open a prefilled dialog first. |
| `keybind` | string | `ctrl+shift+space` on macOS, `ctrl+space` on Linux | The dictation key, in OpenCode's keymap syntax. |
| `autoSpeak` | boolean | `false` | Read every completed reply aloud. |
| `voice` | string | `"Luna"` | The local TTS voice. |
| `sttModel` | string | `"tiny-q5_1"` | The local STT model, as Aurum names it. |
| `language` | string | `"auto"` | A spoken language code, or `auto`. |
| `maxRecordSeconds` | integer 5–600 | `120` | The longest recording. |
| `statusIndicator` | `"toast"` \| `"footer"` | `"toast"` | A toast, or an opt-in row above the prompt while listening. |
| `keepTranscripts` | boolean | `false` | Keep the last 20 transcripts as text. Audio is never kept. |
| `allowUntestedHost` | boolean | `false` | Run on an OpenCode version outside the supported range. |
| `engine` | boolean | `true` | Register the `voice.dictation.engine` RPC a host such as Jelly calls. |
| `aurumPath` | string | — | A developer or organisation engine binary. It is labelled unverified unless it matches the pinned digest. |
| `assetsDir` | string | — | A pre-seeded model folder. Nothing is downloaded. |

## Permissions

The plugin adds these rules to every agent that has a base `* * allow`, after it and before the agent's own rules:

```
{ "action": "voice_*",      "resource": "*", "effect": "ask" },
{ "action": "voice_status", "resource": "*", "effect": "allow" },
```

`voice_status` is a read. `voice_speak` speaks on the machine, so it asks; from a script, an `ask` is refused with
`PERMISSION_DENIED`, and only an allow rule in the session or the agent runs it.

Agents without a base allow get no rules. An agent is listed as without default rules when it has a base allow, lacks
the block, and its own rules would run an unnamed `voice_*` tool without asking.

The paste-ready block for an agent that must never ask:

```json
{
  "agents": {
    "build": {
      "permissions": [
        { "action": "*", "resource": "*", "effect": "deny" },
        { "action": "read", "resource": "*", "effect": "allow" },
        { "action": "glob", "resource": "*", "effect": "allow" },
        { "action": "grep", "resource": "*", "effect": "allow" },
        { "action": "list", "resource": "*", "effect": "allow" },
        { "action": "voice_status", "resource": "*", "effect": "allow" }
      ]
    }
  }
}
```

## Errors

Every error is `CODE: what happened. Next step: What to do.` The codes are:

| Code | Meaning |
|---|---|
| `ENGINE_MISSING` | The pinned Aurum binary is absent. |
| `ENGINE_UNVERIFIED` | The binary's SHA-256 does not match the manifest. |
| `ENGINE_INCOMPATIBLE` | The binary lacks a required command or capability. |
| `ENGINE_EXITED` | The sidecar process exited. |
| `UNSUPPORTED_PLATFORM` | No engine package exists for this OS and architecture. |
| `UNSUPPORTED` | The platform or engine cannot run. |
| `MODEL_MISSING` | A model is not cached, or a pre-seeded folder lacks it. |
| `MODEL_DOWNLOAD_FAILED` | A download failed, stalled, or had the wrong size. |
| `INTEGRITY_MISMATCH` | A downloaded file does not match its pinned SHA-256. |
| `MIC_DENIED` | The OS refused microphone access. |
| `MIC_UNAVAILABLE` | No input device is available. |
| `AUDIO_DEVICE_MISSING` | A chosen output device disappeared. |
| `NO_SPEECH` | The recording held no speech, or under 160 ms of voiced audio. |
| `AUDIO_TOO_LONG` | Audio or text exceeded the wire limit. |
| `BAD_AUDIO` | Not a WAV, or not 16 kHz mono 16-bit PCM. |
| `BUSY` | A dictation, synthesis or playback is already running. |
| `TIMEOUT` | The engine did not answer in time. |
| `CANCELLED` | The user cancelled. |
| `SIDECAR_FAILED` | The engine failed or could not start. |
| `PROVIDER_AUTH_REQUIRED` | A cloud provider has no key. |
| `PROVIDER_FAILED` | A cloud provider returned an error. |
| `HOST_UNTESTED` | OpenCode is outside `>=2.2.3 <2.3.0`. |
| `OPTIONS_INVALID` | An option is malformed or unknown. |
| `STATUS_UNAVAILABLE` | The status model could not be read. |
| `SKILLS_INVALID` | A skill file is malformed. |

## Privacy

- Audio never leaves the machine: the default providers are local, and no cloud provider is part of this version.
- A recording is a temp WAV in the plugin's cache, mode 0600, deleted after transcription, on error, on cancel and on
  dispose. There is no audio history.
- Transcript text is kept only with `keepTranscripts`, as the last 20 entries, with a clear-all action.
- No transcript, audio, key or absolute path outside the plugin's cache appears in status, errors or logs.
- The microphone grant belongs to the process that started OpenCode (the terminal or the host app), not to the plugin.
  The status row reports what the engine's doctor sees and links to the OS setting; the plugin never bypasses it.
