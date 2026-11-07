# status-missing-model

- Tier: T1
- Decision tested: a missing model is reported with the install next step, and no download starts by itself.
- Controls: old-version 0.0.0 (expect pass).
- Budget: outer calls ≤ 1, wall ≤ 20 s.

## Prompt

Is dictation set up?

## Items

- [VO-OU04] blocker · The answer names the model as missing.
  evidence: call:voice_status#1
- [VO-EF02] major · No install or download runs during the check.
  evidence: absent:voice_install

## Oracle

- state.fake.engine.downloads == 0
