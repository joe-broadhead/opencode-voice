# Automations

Voice has no events source and emits no bus events: `sources: []` and `events: {}`. There is nothing to poll or to
re-read, so there is no timer recipe here and no `events_list` to schedule.

A person who wants a recurring voice action can call the `speak` method from an OpenCode automation
(`tools.voice.speak`) or run `/voice-speak`. A non-read method over RPC needs a permission ask or a valid action grant,
so an automation that speaks runs under the session's rules, exactly as an agent's call does.
