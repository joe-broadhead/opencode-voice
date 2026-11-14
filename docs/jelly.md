# In Jelly

[Jelly](https://heyjelly.ai) runs OpenCode agents. It reads the `jelly` section of this package's `package.json` as JSON,
without loading the plugin, when a person reviews the exact version.

Jelly names the plugin **Voice** (`jelly.title`), with the package name and version beneath. Under that name it shows the
one line in `jelly.summary`, and beside it the mark in `jelly.icon` (`assets/icon.svg`, shipped in the package): Jelly
reads that file once, when it records the plugin, and keeps it only if it is a clean SVG of drawing elements, with no
script, style, link or outside reference. The mark is the family's Neutral slate tile — a prompt caret and three sound
bars, drawn by us — and not any vendor's logo or letterform.

## Icons and vendor

`jelly.icon` stays `assets/icon.svg`, and `opencode.icons` declares the same mark three ways, in MCP's `Icon` shape: the
clean SVG (`sizes: ["any"]`), a 128×128 PNG and a 256×256 PNG, each with its `mimeType` and a relative `src` inside the
package. `opencode.icons[0].src` equals `jelly.icon`, so the two declarations cannot drift. `exports` exposes the three
files as `./icon.svg`, `./icon-128.png` and `./icon-256.png`, and all three ship in the tarball.

`opencode.vendor` is absent: Voice is our own product. The engine is Aurum, which is ours too, and no vendor mark,
colour or letterform is shipped.

## Tools and permissions

2 tools are declared (1 read-only): `voice_status` and `voice_speak` both run. Jelly's agents have no base "allow
everything" rule, so this plugin's own default rules, which it puts after that rule, never reach them. Jelly applies the
declared `access` setting itself, from each tool's `readOnly`, and a declared `allow` does not make a tool run at the
stricter settings:

- `voice_status` (`allow`, read-only): the engine, models, microphone and next step. It runs at every setting.
- `voice_speak` (`allow`): speaks text on the machine. It is an action, not a read: it runs at **Allowed**, asks at
  **Ask before changes** and is denied at **Read only**. A read-only helper is never given it.

`/voice-install` is a command, not a tool: the `voice_install` consent it asks before the engine download is not
declared, because Jelly's declaration has no place for a consent that is not a tool. Jelly decides it by the plugin's
`voice_*` namespace, so it is allowed at Allowed, asks at Ask before changes and is denied at Read only, as the plugin's
own rules decide it in OpenCode.

Every tool the plugin registers is declared. Keep `jelly.tools` in step with `src/host/tools.ts`;
`test/unit/jelly.test.ts` checks the list and each effect against the plugin's own default rules, so a release cannot add
an undeclared tool.

## Skills

Declared: `voice`. Jelly refuses an install whose skill ids collide with another plugin's or the agent's own; `voice` is
distinct from `utilities-speech`, `slack-search` and the neighbours' meeting skills.

## Views and RPC

No views, feeds, widgets, sign-ins or work kinds. The `voice.dictation.engine` RPC is documented in
[docs/engine.md](https://github.com/joe-broadhead/opencode-voice/blob/HEAD/docs/engine.md); it is not a Jelly `rpc`
declaration, because it is an audio contract between the host and the plugin, not a tool.

## Settings

Jelly draws a form from `jelly.contributes.settings` and writes each value into the plugin's options:

- `access` declares its three values as `choices`, with Jelly's own labels: **Allowed** (`all`, the default), **Ask
  before changes** (`ask-changes`) and **Read only** (`read-only`).
- `maxRecordSeconds` (Longest recording) is a whole number from 5 to 120, 120 by default. The engine RPC uses it too.
- `submit` and `statusIndicator` are not declared: they apply only to OpenCode's terminal UI and do nothing in Jelly,
  which runs its own dictation and shows its own listening state. They stay options in `opencode.json`.

These sets and bounds are the options parser's own, so Jelly never saves a value the plugin refuses. `voice`, `sttModel`
and `language` are not declared: the parser takes any voice or model name and any language code, so a closed set would
be narrower than what it accepts. Choices and bounds need a Jelly that includes app#1301: an older Jelly refuses a
setting that declares them. `test/unit/jelly.test.ts` checks the settings against Jelly's setting contract, restated in
`test/support/jelly-settings.ts`, and checks each declared value and bound against the options parser.
