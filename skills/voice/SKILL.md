---
name: voice
description: Load when the user asks to dictate, to speak or read something aloud, to check the microphone or the voice engine, or why dictation is not working. Covers `voice_status`, `voice_speak` and the terminal shortcuts. Not for transcribing an audio file, which is `utilities_speech_transcribe`, and not for meetings or cloud voice calls.
---
# Voice

Local dictation and read-aloud, powered by Aurum. Audio stays on this machine; a recording is never kept.

## Check before you offer

Call `voice_status` before telling the user dictation is available. It reports the engine, the models, the microphone
permission and one next step. Do not claim any of them from memory or from an earlier call in the session: the engine
can be missing, a model can be absent, and the microphone can be denied.

- If the next step is `/voice-install`, say that models are missing and offer the command. Do not run a download
  yourself.
- If the microphone is denied, name System Settings → Privacy & Security → Microphone. Never suggest a workaround.
- If the engine is missing, say to run `/voice-install`. If it is unverified, say to run `/voice-install` again, which replaces it.

## Speak

`voice_speak` reads text aloud on the user's machine. Every tool runs without asking by default, so it just speaks; if
the user set `access: "ask-changes"` the approval is the yes, so do not ask in chat as well. Pass the text the user
asked for, up to 5,000 characters; a long reply is cut with `…`.

A refusal or a decline means nothing was spoken. Say that and offer the text instead.

Do not call `voice_speak` to "test" the voice, to read your own reasoning, or on every reply. Use it when the user asks
for it, or when `autoSpeak` is on, which the plugin handles itself.

## Dictation is the user's act

Dictation happens in the terminal UI: a key, `/voice-dictate`, or the palette's **Voice: dictate**. You cannot start a
microphone turn, and you must not pretend one happened. If the user asks how to dictate, tell them the key from
`voice_status` and that a pause sends the transcript, or opens a review dialog when `submit` is `review`.

## Not this plugin

- Transcribing an audio file: `utilities_speech_transcribe`.
- Meetings, calls or cloud realtime voice: not supported here.
- Reading a file aloud is `voice_speak` with the text, after the file is read with the file tools.

## Privacy

Never quote a transcript into a summary, a commit or a message unless the user asks. Audio and transcripts are local,
and the plugin keeps neither by default. A recording is a temp file deleted after the turn; do not look for it.
