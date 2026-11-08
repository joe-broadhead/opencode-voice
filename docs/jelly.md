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
everything" rule, so this plugin's own default rules, which it puts after that rule, never reach them. Jelly writes each
declared effect as that tool's default instead (the person's own choice replaces it).

- `voice_status` (`allow`, read-only): the engine, models, microphone and next step.
- `voice_speak` (`allow`): speaks text on the machine. It is an action, not a read, so `access: "ask-changes"` or a
  rule of the person's can make it ask.

A tool Voice adds later is not declared, so in Jelly it is not asked about until a new version declares it. Keep
`jelly.tools` in step with `src/host/tools.ts`; `test/unit/jelly.test.ts` checks the list and each effect against the
plugin's own default rules.

## Skills

Declared: `voice`. Jelly refuses an install whose skill ids collide with another plugin's or the agent's own; `voice` is
distinct from `utilities-speech`, `slack-search` and the neighbours' meeting skills.

## Views and RPC

No views, feeds, widgets, sign-ins or work kinds. The `voice.dictation.engine` RPC is documented in
[docs/engine.md](https://github.com/joe-broadhead/opencode-voice/blob/HEAD/docs/engine.md); it is not a Jelly `rpc`
declaration, because it is an audio contract between the host and the plugin, not a tool.
