# Configuration

Options live in the plugin's entry in `opencode.json`, under `options`. An unknown option, or one outside its set, is
refused with `OPTIONS_INVALID` at setup, and no option value is echoed in an error, a log or status.

<!-- generated:configuration -->
| Option | Type | Default | Description |
|---|---|---|---|
| `access` | `all` \| `ask-changes` \| `read-only` | `"all"` | How much the plugin's methods may do: everything, ask before a change, or reads only. |
| `allowUntestedHost` | boolean | `false` | Start outside the tested OpenCode range. |
| `aurumPath` | string | — | An Aurum binary to use instead of the pinned engine. It is labelled unverified unless its digest matches. |
| `assetsDir` | string | — | A pre-seeded model folder. Files are taken from here and nothing is downloaded. |
| `submit` | `send` \| `review` | `"send"` | Send a transcript at once, or open a prefilled review dialog first. |
| `keybind` | string | — | The dictation key, in OpenCode's keymap syntax. Defaults to ctrl+shift+space on macOS and ctrl+space elsewhere. |
| `autoSpeak` | boolean | `false` | Read every completed reply aloud. |
| `voice` | string | `"Luna"` | The local text-to-speech voice, passed to the engine as --voice. |
| `sttModel` | string | `"tiny-q5_1"` | The local speech-to-text model, as Aurum names it. |
| `language` | string | `"auto"` | A spoken language code such as en or pt-BR, or auto. |
| `maxRecordSeconds` | integer | `120` | The longest one recording may run, in whole seconds from 5 to 120. |
| `statusIndicator` | `toast` \| `footer` | `"toast"` | Where the listening state shows: a toast, or a row above the prompt. |
| `keepTranscripts` | boolean | `false` | Keep the last 20 transcripts as text in the plugin's storage. Audio is never kept. |
<!-- /generated:configuration -->

## Examples

The defaults read every tool aloud without asking, and dictation sends on pause:

```jsonc
{
  "plugins": [{ "package": "@we-the-rebel-alliance/voice-plugin" }]
}
```

Ask before speech on a shared machine:

```jsonc
{
  "plugins": [
    { "package": "@we-the-rebel-alliance/voice-plugin", "options": { "access": "ask-changes" } }
  ]
}
```

Review a transcript instead of sending it, keep the last 20 texts, and use a named local voice:

```jsonc
{
  "plugins": [
    {
      "package": "@we-the-rebel-alliance/voice-plugin",
      "options": { "submit": "review", "keepTranscripts": true, "voice": "Luna", "language": "pt-BR" }
    }
  ]
}
```

A pre-seeded model folder never downloads:

```jsonc
{
  "plugins": [
    { "package": "@we-the-rebel-alliance/voice-plugin", "options": { "assetsDir": "/srv/voice-models" } }
  ]
}
```

## Paths and the cache

The engine and the models live under the platform cache folder, in the folder `voice-plugin`:

- macOS: `~/Library/Caches/voice-plugin`
- Linux: `${XDG_CACHE_HOME:-~/.cache}/voice-plugin`

`<cache>/engine` holds the models in the layout Aurum expects (`models/` and `tts/`) and is passed to every engine
command as `--cache-dir`. The pinned engine itself goes under `<cache>/native/<tag>/aurum/<platform>/`. Deleting the
folder removes the engine and the models; the next install downloads them again.

## The engine overrides

- `aurumPath`: a binary the person or their organisation provides. It is used before the cache, is labelled unverified
  (its digest is not pinned), and needs no release manifest.
- `VOICE_AURUM_PATH`: the same override for development and tests. It is never a default; a project dependency named
  `aurum` on `PATH` is never used.
- `assetsDir`: a folder that already holds the model files. Nothing is downloaded, and a missing file is refused rather
  than fetched.
