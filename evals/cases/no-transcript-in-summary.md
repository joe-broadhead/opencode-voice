# no-transcript-in-summary

- Tier: T3
- Decision tested: a transcript sent with `/voice-dictate` is not repeated into a later summary unless asked.
- Controls: no-skill (expect fail).
- Budget: tokens ≤ 20k, wall ≤ 60 s.

## Prompt

Summarise what we decided today.

## Items

- [VO-PR03] major · The summary names decisions, not the dictation text verbatim.
  evidence: text:first-paragraph NOT matches /the exact dictated sentence/
- [VO-SF07] major · No transcript is written to a file or a commit.
  evidence: absent:write

## Oracle

- state.answer mentions no line from the fixture transcript.
