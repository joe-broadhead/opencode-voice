# Engine contract: `voice.dictation.engine`

A host that runs OpenCode headless, such as [hey-jelly](https://github.com/joe-broadhead/hey-jelly), captures audio,
endpoints the turn and calls this RPC. The plugin owns the engine, the models, the silence check and the temp files; the
host owns the microphone, the submit mode, the conversation loop and playback.

This contract is shared word for word with `hey-jelly/VOICE.md`. Change it in both places, or bump `v`.

## Transport

- Register the RPC in the OpenCode server with `ctx.rpc.register({ id: "voice.dictation.engine", ... })`.
- Call it with `client.rpc({ id: "voice.dictation.engine", methods })[name](input, { location })`.
- Every input and output carries `v: 1`. The RPC schema refuses an unknown `v` with the host's validation error.
- Audio crosses as base64 inside JSON, never as device access. The plugin never opens a microphone or a speaker here.
- The HTTP envelope is `{"input": { ...the method input... }}`.

## Methods

| Method | Input | Output |
|---|---|---|
| `status` | `{ v }` | `{ v, ready, stt: { provider, model, language }, tts: { provider, model, voice }, models, caps, problems }` |
| `warmup` | `{ v }` | `{ v, ready, state }` — starts the sidecar and loads the model |
| `transcribe` | `{ v, audio, mime: "audio/wav", language? }` | `{ v, text, silent, ms, provider, model }` |
| `synthesize` | `{ v, text, markdown?, rate? }` | `{ v, audio, mime: "audio/wav", spokenText, truncated }` |
| `cancel` | `{ v }` | `{ v }` |

- Input audio is WAV, 16 kHz, mono, 16-bit PCM, at most 120 s. Anything else is `BAD_AUDIO`. A build without the
  `long_audio` capability accepts 30 s per utterance; `AUDIO_TOO_LONG` names it.
- `silent` is the speech gate: no sound, or under 160 ms of voiced audio. No transcription is attempted, and `text` is
  `""`.
- `caps` contains `transcribe`, `synthesize`, `warmup` and `cancel`, and `synthesize_speaking_rate` when the build can
  apply `rate`. A host checks caps; a `rate` other than 1 without that cap is refused with `UNSUPPORTED`.
- `engine.cancel` aborts the in-flight request and any queued request issued before it. A cancelled call rejects as
  `CANCELLED`. Requests are serialised: a host may overlap two calls, and each settles with its own payload.
- Streaming partial transcripts are not part of v1. A later `v: 2` adds them; the request and response methods stay.

## Errors

A failed call rejects with `{ type: "failed", message, data: { code, next } }`. `message` is the full
`CODE: what happened. Next step: What to do.`; `next` is the next step alone. Codes are the plugin's own
(`docs/configuration.md`), and the messages never carry audio, a transcript or a key.

## Ownership

| Concern | Owner |
|---|---|
| Microphone capture, device choice, permission prompts | The host |
| End of turn, live level, no-speech timeout | The host |
| Submit mode, conversation loop, playback | The host |
| The sidecar lifecycle, queueing, timeouts, restart | The plugin |
| STT/TTS providers, models, voices | The plugin |
| Silence check, speakable reduction, temp files, doctor | The plugin |
