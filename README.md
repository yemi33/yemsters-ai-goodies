# yemsters-ai-goodies

A personal Claude Code plugin marketplace with skills for Teams notifications, plan tracking, and automated monitoring workflows.

## Installation

Add this marketplace to Claude Code:

```
/plugin marketplace add yemi33/yemsters-ai-goodies
```

Then install individual plugins:

```
/plugin install <plugin-name>@yemsters-ai-goodies
```

---

## Available Plugins

### `monitor-loop`

> Generic background polling orchestrator — bring your own check/act/done logic.

Spawns a background coordinator agent that repeatedly checks a set of items, acts on anything needing attention, logs progress each round, and stops when a done condition is met.

**Usage:**
```
/monitor-loop <description> [--interval <minutes>]
```

**Install:**
```
/plugin install monitor-loop@yemsters-ai-goodies
```

Designed to be composed — build thin wrappers that pre-fill the check/act/done logic and delegate all orchestration here. See the [README](plugins/monitor-loop/README.md) for details.

---

### `teams-notifier`

> Send a Teams notification when a task is complete.

Sends a formatted message to a Microsoft Teams channel via Power Automate webhook. Claude uses this automatically at the end of sessions or when significant work is finished.

**Usage:**
```
/teams-notifier <message>
```

**Install:**
```
/plugin install teams-notifier@yemsters-ai-goodies
```

Requires `TEAMS_WEBHOOK_URL` in `~/.claude/settings.json`. See the [README](plugins/teams-notifier/README.md) for Power Automate setup.

---

### `teams-plan-tracker`

> Post plans to Teams and thread PR updates as replies.

When Claude creates a plan, automatically posts it to a Teams channel with a unique plan ID. When PRs are subsequently created via Azure DevOps, posts them as threaded replies to the original plan message — keeping plan → PR → completion all in one thread.

**Usage:** Automatic — no slash command needed. Configure in `~/.claude/CLAUDE.md` to enable.

**Install:**
```
/plugin install teams-plan-tracker@yemsters-ai-goodies
```

Requires `TEAMS_PLAN_FLOW_URL` in `~/.claude/settings.json` and a Power Automate flow with SharePoint state management. See the [README](plugins/teams-plan-tracker/README.md) for setup.

---

## Summary

| Plugin | What it does | Trigger |
|--------|-------------|---------|
| `monitor-loop` | Background polling loop with configurable check/act/done logic | `/monitor-loop` |
| `teams-notifier` | Teams notification on task completion | `/teams-notifier` or automatic |
| `teams-plan-tracker` | Post plans + thread PR updates in Teams | Automatic (via CLAUDE.md) |
