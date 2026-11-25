# Capabilities

Voice is a tools-only plugin: three methods, no sources, no actions and no bus events.

<!-- generated:capabilities -->
### Methods

| Method | Class | Accounts | Operations |
|---|---|---|---|
| `status` | read | none | — |
| `doctor` | read | none | — |
| `speak` | write | none | — |

### Sources

| Source | Kind | Reads or output | Method | Cost |
|---|---|---|---|---|

### Actions

None.

### Bus events

None.
<!-- /generated:capabilities -->

## The methods

- **`status`** is the contract's closed shape (contract §11) and nothing else: the name, the version, the host range,
  the state, the empty account list, the agents whose rules miss the generated ones, and one next step. Voice signs in
  to nothing, so `accounts` is always `[]` and `needs_sign_in` never applies. While something still needs doing — the
  engine, the models, a microphone grant — the next step is the one problem and the state is `error`; when nothing is
  left, the state is `ready` and the next step is `null`.
- **`doctor`** is the rich report behind the dialog and `/voice-status`: the engine's path, version, source and
  verification, the model cache and each model's state, the microphone permission and the input/output device names, the
  dictation key and submit mode, the access level, the tool counts, the unguarded agents and the one next step. It is a
  read: local paths and device names are the person's own machine. It never prints a token.
- **`speak`** reads text aloud on this machine: `{ text }`, one to 5,000 characters. It synthesizes to a temporary file
  in the plugin cache, plays it, and deletes it on every path. It sends nothing to a model and keeps nothing.

## Why there is no plan/commit and no bus event

`speak` changes nothing an app could re-read: it plays audio on the local speaker and keeps no record. There is no
preview to show (the text is the change, and it is already in the call), no provider write to confirm, and no capability
to nudge. The access level still governs it: it asks under `ask-changes` and is off under `read-only`, through the
contract's generated rules, and a non-read RPC call needs an ask or an action grant.

## Not methods

Dictation (`/voice-dictate`, the keybind), `/voice-speak`, `/voice-status`, `/voice-install` and the `/voice` dialog are
the person's own actions in the terminal UI. They are documented in the README and the skill, and are deliberately
outside `capabilities`: `methods` classifies what an agent or app can call.

## Accounts and sources

None. The plugin declares no account mechanism and no sources: `sources: []`, `actions: []`, `events: {}`.
