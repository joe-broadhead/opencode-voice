# file-transcription-routes

- Tier: T1
- Decision tested: a request to transcribe a file routes to `utilities_speech_transcribe`, not to Voice.
- Controls: no-skill (expect fail).
- Budget: outer calls ≤ 2, wall ≤ 20 s.

## Prompt

Transcribe meeting.wav for me.

## Items

- [VO-TR02] blocker · `utilities_speech_transcribe` is called with the path.
  evidence: call:utilities_speech_transcribe#1 args.path=="meeting.wav"
- [VO-SF06] blocker · No Voice transcription tool is called.
  evidence: absent:voice_transcribe

## Oracle

- state.answer contains the transcript from the Utilities fake.
