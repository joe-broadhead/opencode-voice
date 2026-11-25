# Security

Voice is local. No account, no API key, no provider URL, and no network call in `status`, `doctor`, `speak` or
dictation. The only network calls are an install: the pinned engine from its upstream Aurum release, and the pinned
models from the hosts `manifest/models.json` names.

## What leaves the machine

Nothing but an install request. `/voice-install` (or the dialog's install) asks once, naming the files, the size and the
hosts, and then downloads:

- the engine from the upstream Aurum release, verified by size and SHA-256 against `manifest/aurum.json`;
- each model from the host its pin names, following at most three redirects on that host, verified by size and SHA-256
  against `manifest/models.json`, then hashed again in place before the engine reads it.

A redirect away from the pinned host is refused. A digest mismatch discards the file and reports it; it is never run.

## What is stored

- The engine and the models under `<cache>/voice-plugin`, on this machine.
- A recording in a private `0700` temp folder inside the same cache root, mode `0600` when it closes, deleted after the
  turn on success, failure and cancel.
- The last 20 transcripts, as text only, when `keepTranscripts: true`; they live in OpenCode's plugin storage for this
  plugin and are cleared with `c` in `/voice`. Audio is never kept.

## Redaction

Every error, status line and doctor field that can carry external text is reduced to one line and screened: control and
bidi characters removed, URL credentials/query/fragment removed, bearer/basic values, `key=value` secrets, JWTs,
vendor-prefixed keys and long key-shaped runs replaced, and the line cut to 160 characters. Device names and local
paths are kept in `doctor` because they are the person's own machine; a token is never printed.

`status` carries no local path and no device name: it is the contract's closed shape.

## Access and confirmation

`options.access` is the ceiling: `all`, `ask-changes` or `read-only`. The contract generates one rule per method after
each agent's base allow, so a later rule of the person's wins. `speak` asks under `ask-changes` and is off under
`read-only`; `status` and `doctor` always run. An agent that lacks the generated rules is named in `status` and never
patched.

`speak` is class `write`. Over RPC (door 3) it needs one of the contract's two confirmations: an answered permission ask
in a session, or a host-signed action grant; an allow rule alone is refused with `PERMISSION_DENIED`. A person's
`/voice-install` is their own command: it asks through the permission gate, naming the hosts and the size, before
anything is fetched.

## Reporting

Report a vulnerability through the process in [SECURITY.md](../SECURITY.md). Never put a credential in an issue, a
fixture or a log.
