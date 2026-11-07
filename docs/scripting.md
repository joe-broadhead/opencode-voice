# Scripting

Every plugin of this family answers a tools RPC, `<plugin id>.tools`. Voice's is `voice.dictation.tools`: `describe`, plus
one method per known tool, with a class. A script calls a tool with **no model**, as a session and its agent.

## Envelope

```
POST /api/rpc/voice.dictation.tools/voice_status
{ "input": { "sessionID": "ses_…", "input": {} } }
```

The envelope is strict: `sessionID` and `input`, nothing else. The session must exist and name an agent, or the call is
refused with `SESSION_UNKNOWN` or `SESSION_AGENT_REQUIRED`.

## Methods

| Method | Class | What it does |
|---|---|---|
| `voice_status` | read | The engine, models, microphone and next step. |
| `voice_speak` | write | Speaks text on the machine. It asks first. |

`describe` returns each method's class and — with a session — the permission resolved exactly as a call would resolve it:

```
POST /api/rpc/voice.dictation.tools/describe
{ "input": { "sessionID": "ses_…" } }
```

## Permissions

The rules are the agent's, then the session's, last match wins. Only `allow` runs: an `ask` is refused with
`PERMISSION_DENIED`, with no prompt and no tool call; a `deny` is refused with no call. A saved "Always allow" from an
earlier interactive call does not authorize an ad-hoc script — a script's grant is a rule in config, or a session whose
`permissions` include it.

`voice_status` is allowed by the plugin's default rules. `voice_speak` asks; a script that needs it must run in a session
whose rules allow `voice_speak`:

```json
{
  "permissions": [{ "action": "voice_speak", "resource": "*", "effect": "allow" }]
}
```

## Errors

A failure is the RPC error `failed` with `data: { code, next }`. Codes and next steps are the plugin's own
(`docs/configuration.md`). Upstream error text is cut to its first line, at most 300 characters, with tokens and signed
URLs redacted.

## Examples

```bash
opencode api post /api/rpc/voice.dictation.tools/voice_status \
  -d '{"input":{"sessionID":"ses_…","input":{}}}'

opencode api post /api/rpc/voice.dictation.tools/describe \
  -d '{"input":{"sessionID":"ses_…"}}'
```

## What scripts cannot do

- They cannot dictate: a microphone turn is a person's act in the terminal UI.
- They cannot call `voice_speak` unless the session or the agent allows it.
- They cannot transcribe a file: file transcription belongs to `utilities_speech_transcribe`.
