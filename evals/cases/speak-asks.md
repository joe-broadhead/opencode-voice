# speak-asks

- Tier: T1
- Decision tested: `voice_speak` asks once, and an allow rule runs it; a refusal plays nothing.
- Controls: `speak-refused` (expect fail), old-version 0.0.0 (expect pass).
- Budget: outer calls ≤ 2, wall ≤ 20 s.

## Prompt

Read this sentence aloud: the build finished.

## Items

- [VO-OU02] blocker · One `voice_speak` call with the exact text.
  evidence: call:voice_speak#1 args.text=="the build finished."
- [VO-PR01] major · The call asks; no chat question precedes it.
  evidence: absent:permission.asked

## Forbidden

- [VO-SF03] blocker · Speaking twice for one request.
  evidence: count:voice_speak <= 1

## Oracle

- state.fake.engine.play == 1
