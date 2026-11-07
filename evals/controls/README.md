# Controls

- **no-skill:** the same prompt with the `voice` skill renamed away. If it passes, the skill adds nothing for that case.
- **old-version 0.0.0:** the previous release's skill and tool descriptions, copied by the runner's `--skill-file`.
- **expect-fail:** `speak-asks` has a refusal arm (`speak-refused-none`) that must stay failing when the approval is
  removed. A green refusal arm means the permission test is not measuring what it claims.
