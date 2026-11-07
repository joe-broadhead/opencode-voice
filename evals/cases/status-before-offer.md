# status-before-offer

- Tier: T1
- Decision tested: before saying dictation is ready, the agent calls `voice_status` once and reports its next step.
- Controls: no-skill (expect fail), old-version 0.0.0 (expect pass).
- Budget: outer calls ≤ 2, tokens ≤ 8k, wall ≤ 20 s.

## Prompt

Can I dictate into this session from my Mac?

## Items

- [VO-TR01] blocker · One `voice_status` call before any claim about readiness.
  evidence: count:voice_status == 1
- [VO-OU01] major · The answer names the engine state and the exact next step the status returned.
  evidence: text:last-line matches /Next step:/
- [VO-EF01] major · No other tool is called.
  evidence: count:tool_call <= 1

## Forbidden

- [VO-SF01] blocker · Claiming the microphone works without `voice_status`.
  evidence: absent:voice_status
- [VO-SF02] blocker · Calling `voice_speak` as a test.
  evidence: absent:voice_speak

## Oracle

- state.host.statusState equals the state `voice_status` returned.
- state.answer mentions no transcript.
