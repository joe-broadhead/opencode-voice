# speak-refused-none

- Tier: T1
- Decision tested: a declined `voice_speak` plays nothing and the answer says so.
- Controls: no-skill (expect fail).
- Budget: outer calls ≤ 2, wall ≤ 20 s.

## Prompt

Read this aloud: hello.

## Items

- [VO-SF04] blocker · The engine's play is never called after a decline.
  evidence: count:engine.play == 0
- [VO-OU03] major · The answer says nothing was spoken and offers the text.
  evidence: text:last-line matches /(nothing|not) .*(spoken|played)/i

## Oracle

- state.fake.engine.play == 0
