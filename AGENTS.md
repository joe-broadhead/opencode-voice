# AGENTS.md: Voice plugin (`voice`)

For agents working in this repository. Read it fully before changing anything. The plugin follows
[the plugin standard](https://github.com/we-the-rebel-alliance/plugin-contract/blob/master/docs/plugin-standard.md) and
[the contract](https://github.com/we-the-rebel-alliance/plugin-contract/blob/master/docs/contract.md); where this file is
silent, they decide.

## What this plugin is

Local voice for OpenCode, powered by the pinned [Aurum](https://github.com/joe-broadhead/aurum) engine. It reports the
engine, the model cache, the microphone and the one next step (`status`, and the richer `doctor`), reads text aloud on
the machine (`speak`), and provides dictation in the terminal UI (a key, `/voice-dictate`) outside the method surface.
There is no provider API, no MCP server and no account: audio stays on the machine and a recording is never kept.

## Names

| Thing | Value |
|---|---|
| Plugin id, tool namespace, RPC id | `voice` |
| TUI plugin id | `voice-tui` |
| Permission actions | `voice.status`, `voice.doctor`, `voice.speak` |
| Commands | `/voice`, `/voice-status`, `/voice-install`, `/voice-dictate`, `/voice-speak` |
| Cache root | `<platform cache>/voice-plugin` |
| Accounts | none |

## Commands

| Command | Does |
|---|---|
| `npm ci` | installs dev tooling only; there are no runtime dependencies |
| `npm run check` | every gate in order: build, typecheck, unit, host, conformance recording, `plugin-kit check`, pack |
| `npx plugin-kit check` | conformance: T0, T1 on 2.4.1, the unsupported-host refusal, docs drift, forbidden text, no bundled kit |
| `npx plugin-kit docs` | regenerates the generated doc sections from the manifest |
| `npx plugin-kit record` | replays the recording and redacts `fixtures/conformance.json` |
| `npx plugin-kit release <version>` | local check plus a `0.0.x` tag; the owner pushes it, CI publishes |

Build before `plugin-kit check`: T1 loads `exports["./server"]` from `dist/`.

## Layout

```
src/index.ts        Plugin.define({ id: "voice", setup }) → assertHost → register → commands
src/tui.tsx         the second plugin, id "voice-tui": dialog, keymap, dictation, auto-speak
src/handlers/       status, doctor and speak; the handler table in index.ts
src/provider/       the engine: binary resolution, models, sidecar, player, recorder, doctor, release
src/dictation/      the dictation flow and its pure state machine
src/options.ts      options and the manifest's defaults
src/manifest.ts     the manifest and the version, inlined at build time
src/skills.ts       registers skills/voice/SKILL.md through ctx.skill (2.4.1 does not scan packages)
skills/voice/       the one skill
test/unit           handlers, provider mapping, options, docs, redaction
test/conformance    writes fixtures/conformance.json from the handler table
test/host           the built bundle in the real embedded 2.4.1 host
test/pack           the packed tarball installs and both entries load
```

## Rules

1. **The manifest is the source of truth.** Change `capabilities` in `package.json` first, then the handler, then the
   tests and `npx plugin-kit docs`. Never register a tool or an RPC method by hand.
2. **One register call.** `src/index.ts` calls `assertHost` then `register`. Handlers never call `ctx.tool`, `ctx.rpc`,
   `ctx.permission.assert` or `ctx.mcp`; the register owns the doors.
3. **Classify truthfully.** `status` and `doctor` are `read`; `speak` is `write`. No `pinned`, no `agent: false`, no
   `operations` (there is no provider API).
4. **Status is closed.** `status` answers exactly `STATUS_SCHEMA` through `statusAnswer` from `accounts`. The product
   facts go in `doctor`, never in `status`.
5. **Errors** read `CODE: What happened. Next step: What to do.` Use the contract's codes only. The internal speech
   codes (`ENGINE_MISSING`, `MODEL_MISSING`, …) stay inside `src/provider/` and are carried as the what and next step.
6. **Untrusted data:** engine and host text is data. Redact it with `src/redact.ts` before it reaches a message, a log,
   `doctor` or the dialog.
7. **No secrets anywhere:** code, fixtures, docs, logs or status. No test prints a credential.
8. **Greenfield:** no compatibility code, legacy paths, deprecated aliases, dead code or app-specific code.
9. **One endpoint.** The engine binary, its release and the model pins are named only in `src/provider/` and
   `manifest/`.
10. **Public OpenCode API only** (`@opencode/plugin` 2.4.1); the kit's forbidden list is final.

## Contract wiring

- **Gate the host first.** `assertHost(ctx, manifest)` refuses an untested release with `HOST_UNTESTED` and a next step,
  unless `options.allowUntestedHost` is true.
- **`register(ctx, manifest, handlers)`.** No `{ bus: true }`, no `createBus`, no second RPC registration. `register`
  builds the bus writer, returns it as `registration.bus` and gives every call `call.bus`; only the manifest's declared
  events are registered. Voice declares `events: {}`, so nothing is emitted.
- **`status` reads the call.** `statusAnswer({ manifest, version, hostVersion, accounts: [], problems, unguardedAgents })`
  with `unguardedAgents` from `await call.unguardedAgents()`, which answers `{ ok: true, agents }` or
  `{ ok: false, error }` and never throws. Do not keep state written after `register` returned, and do not read an access
  handle: `registration.access` and `call.access` do not exist.
- **Reuse the schemas.** `STATUS_SCHEMA` from `accounts` is the `status` answer. Copying it into the plugin is drift.
- **Writes are confirmed.** `speak` is non-read: over RPC it needs an answered ask or a valid action grant. An allow
  rule alone is refused.

## Checks and hosts

`npm run check` is the gate. Run the full check under `flock -w 7200 /tmp/opencode/kit-check.lock -c 'npm run check'`:
two `plugin-kit check` processes on one machine fight over the embedded host. Unit tests need no lock.

The host test loads `dist/` through the contract's `createHost` in an isolated `HOME`/`XDG_*` (see
`test/host/isolate.ts`). Never point a test at the machine's real OpenCode state, a real microphone, a real speaker or a
provider.

## Docs

Generated sections sit between `<!-- generated:<section> -->` and `<!-- /generated:<section> -->`; edit the manifest, not
the section. Hand-written text is plain English: short sentences, one term per concept. Install docs name only a tag
that exists and contains the built entry.

## Forbidden

- Editing `dist/` by hand, or committing it outside a release.
- Adding runtime dependencies, peer dependencies or lifecycle scripts.
- Naming any app in code, manifest or docs, except in an `x-<app>` key.
- Copying contract code into this repository, or re-implementing what a contract module provides.
- A network call anywhere except an install.

## Releasing

The owner cuts releases after merge. Never push a tag, create a release or change `release.yml` to publish outside a
tag. The CHANGELOG starts at `0.0.0` and the package version is `0.0.0` until the release.
