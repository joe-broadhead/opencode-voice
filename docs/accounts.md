# Accounts

Voice signs in to nothing. There is no integration, no MCP server, no OAuth and no API key, so the plugin declares no
`accounts` key in `capabilities` and answers `accounts: []` from `status`.

- `options` has no `accounts` map; there is nothing to configure per person.
- Every method is declared `accounts: "none"`, and no method takes an `account`.
- `doctor` is the account-free equivalent of a probe: it reports the local engine and the machine's own microphone and
  speaker, never another account's data.
- The contract's `ACCOUNT_REQUIRED`, `ACCOUNT_UNKNOWN` and `ACCOUNT_MISMATCH` do not arise here.

A second voice would be a second machine or a second OS user, not a second account in this plugin.
