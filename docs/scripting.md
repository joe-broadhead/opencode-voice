# Scripting

Every plugin of this family answers a tools RPC, `<plugin id>.tools`. Voice's is `voice.dictation.tools`: `describe`,
plus one method per known tool, with a class. A script calls a tool with **no model**, as a session and its agent.

The session is created for the script with an agent (`opencode api post /api/session`, with `data.id` kept). The body is
`{"input":{"sessionID":"<id>","input":{…}}}`: both keys are required, and no other key is allowed.

```sh
opencode api post /api/rpc/voice.dictation.tools/voice_speak -H "x-opencode-directory:$PWD" -d '{"input":{"sessionID":"<id>","input":{"text":"Stand-up is at nine."}}}'
```

A `voice` result comes back as `{ output?, text }`: the tool's structured content when it has any, and its text parts
joined by newlines.

`describe` lists each method's class and — with a session — the permission resolved exactly as a call would resolve it:

```sh
opencode api post /api/rpc/voice.dictation.tools/describe -H "x-opencode-directory:$PWD" -d '{"input":{"sessionID":"<id>"}}'
```

## Methods

| Method | Class | What it does |
|---|---|---|
| `voice_status` | read | The engine, models, microphone and next step. |
| `voice_speak` | write | Speaks text on the machine. |

## The location

Run the command in the project whose agent you mean, and send the call to that location explicitly:

```sh
opencode api post /api/rpc/<id>/<method> -H "x-opencode-directory:$PWD" -d '{…}'
```

Without it the call goes to the service's default location and fails `rpc.unavailable` if the plugin is not loaded
there. The HTTP equivalents are the `location[directory]` query parameter and the same header. `describe` reports the
`location` that answered and a `locationHint`.

A location unloads after OpenCode's idle timeout. If a scheduled script gets `rpc.unavailable` from a location that was
loaded before, send the call again once: the request loads the location.

## Permissions

The rules are the agent's, then the session's, last match wins. Only an `allow` runs: an `ask` is refused with
`PERMISSION_DENIED`, with no prompt and no tool call; a `deny` is refused with no call.

**Every tool is allowed by default**, and a script gets the same default: the tools RPC resolves the rule before
dispatch, and the default allow *is* that allow. To restrict a script:

1. set the plugin's `access` option to `"ask-changes"` (speaking asks, and a script's ask is refused because no one can
   answer it) or `"read-only"` (speaking is denied);
2. give the script's agent its own `deny` rule for `voice_speak`.

A saved "Always allow" from an earlier interactive call does not authorize an ad-hoc script — a script's grant is a
rule in config, or a session whose `permissions` include it.

## Refusals

A failure is the RPC error `failed` with `data: { code, next }`. The plugin's own codes and their next steps are in
`docs/configuration.md`; the RPC's are:

| Code | When | What to do |
|---|---|---|
| `PERMISSION_DENIED` | the rule resolves to ask, or a deny hides the method | add an allow rule for the action to the session's agent or to the session |
| `SESSION_UNKNOWN` | the session is not known in this location | create the session in the location you mean, and pass its id |
| `SESSION_AGENT_REQUIRED` | the session names no agent | create a session that names an agent |
| `TOOL_UNAVAILABLE` | OpenCode does not list the method's tool now | call `describe` to see the methods there are |
| `CANCELLED` | the call was cancelled | call the method again if you still need the result |
| `UPSTREAM_ERROR` | the engine failed | its first line, redacted and cut to 300 characters, is in the message |

Upstream error text is cut to its first line, at most 300 characters, with tokens and signed URLs redacted.

## What scripts cannot do

- They cannot dictate: a microphone turn is a person's act in the terminal UI.
- They cannot transcribe a file: file transcription belongs to `utilities_speech_transcribe`.
