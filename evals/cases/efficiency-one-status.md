# efficiency-one-status

- Tier: T1
- Decision tested: one readiness question costs one status call and no engine start.
- Controls: old-version 0.0.0 (expect pass).
- Budget: outer calls ≤ 1, tokens ≤ 4k, wall ≤ 15 s.

## Prompt

Does voice work here?

## Items

- [VO-EF03] blocker · Exactly one `voice_status`, and no `voice_speak`.
  evidence: count:voice_status == 1
- [VO-EF04] major · The sidecar is not started by a status read.
  evidence: state.fake.engine.converseStarts == 0

## Oracle

- state.fake.engine.converseStarts == 0
