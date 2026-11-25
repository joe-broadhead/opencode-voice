---
name: voice
description: Local dictation and read-aloud with the pinned Aurum engine, its engine and model status and the terminal shortcuts. Not for transcribing an audio file (a collector plugin) or meetings.
---
# Voice

Local dictation and read-aloud, powered by Aurum. Audio stays on this machine; a recording is never kept. The plugin
signs in to nothing.

## Check before you offer

Call `tools.voice.status` before telling the user dictation or read-aloud is available. It is the contract's status
shape: the state, the empty account list and one next step. When you need the engine, the models, the microphone
permission or the dictation key, call `tools.voice.doctor`; it is a read and never downloads anything.

Do not claim any of them from memory or from an earlier call in the session: the engine can be missing, a model can be
absent, and the microphone can be denied.

- If the next step is `/voice-install`, say that the speech files are missing and offer the command. Do not run a
  download yourself.
- If the microphone is denied, name System Settings → Privacy & Security → Microphone. Never suggest a workaround.
- If the engine is missing, report the next step. An empty cache is optional and nothing downloads by itself, so offer
  `/voice-install` only if the user wants dictation or read-aloud.

## Speak

`tools.voice.speak` reads text aloud on the user's machine. Every method runs without asking by default, so it just
speaks; if the user set `access: "ask-changes"` the approval is the yes, so do not ask in chat as well. Pass the text
the user asked for, up to 5,000 characters.

A refusal means nothing was spoken: `UNAVAILABLE` names the engine, model or playback problem and its next step, and
`INPUT_INVALID` means the text was empty or over the limit. Say that and offer the text instead.

Do not call `tools.voice.speak` to "test" the voice, to read your own reasoning, or on every reply. Use it when the user
asks for it, or when `autoSpeak` is on, which the plugin handles itself.

## Dictation is the user's act

Dictation happens in the terminal UI: a key, `/voice-dictate`, or the palette's **Voice: dictate**. You cannot start a
microphone turn, and you must not pretend one happened. If the user asks how to dictate, tell them the key from
`tools.voice.doctor` and that a pause sends the transcript, or opens a review dialog when `submit` is `review`.

## Access levels

`all` (the default) runs every method; `ask-changes` asks before `speak` and runs the reads; `read-only` turns `speak`
off. A later rule of the user's wins. `PERMISSION_DENIED` means the level or the session's rules refuse it: say so, and
do not look for a way around it.

## Not this plugin

- Transcribing an audio file: another plugin's collector.
- Meetings, calls or cloud realtime voice: not supported here.
- Reading a file aloud is `tools.voice.speak` with the text, after the file is read with the file tools.

## Privacy

Never quote a transcript into a summary, a commit or a message unless the user asks. Audio and transcripts are local,
and the plugin keeps neither by default. A recording is a temp file deleted after the turn; do not look for it.
