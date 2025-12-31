---
name: teams-notifier
description: Sends completion notifications to Microsoft Teams when tasks are finished. Use this skill when you complete a task, finish implementing a feature, fix a bug, or want to notify the user that work is done. Automatically sends a formatted message to the configured Teams webhook.
allowed-tools: Bash
---

# Teams Notifier Skill (Portable)

This skill sends automatic notifications to Microsoft Teams when tasks are complete. It's configured to work across all your machines.

## Purpose

Use this skill to notify the user via Teams whenever you:
- Complete a task or series of tasks
- Finish implementing a feature
- Successfully fix a bug
- Complete a refactoring
- Finish running tests or builds
- Any other significant milestone

## How to Use

When you're done with a task, send a notification using curl:

```bash
curl -X POST "$TEAMS_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"title": "Task Complete", "message": "Brief description of what was accomplished"}'
```

## Environment Setup

The `TEAMS_WEBHOOK_URL` environment variable should be configured in your `~/.claude/settings.json`:

```json
{
  "env": {
    "TEAMS_WEBHOOK_URL": "your-webhook-url-here"
  }
}
```

## Cross-Machine Setup

This skill is stored in `~/.claude/skills/teams-notifier/` (personal skills directory).

**To use on multiple machines:**

1. **Option A: Cloud sync** (Recommended)
   - Use OneDrive, Dropbox, or iCloud to sync your `~/.claude/` directory
   - Or create a symlink: `ln -s ~/OneDrive/.claude ~/.claude`

2. **Option B: Manual copy**
   - Copy `~/.claude/skills/teams-notifier/` to each machine
   - Copy the `env` section from `~/.claude/settings.json` to each machine

3. **Option C: Use the setup script** (provided below)
   - Run the setup script on each new machine
   - It will configure everything automatically

## Examples

### Task completion
```bash
curl -X POST "$TEAMS_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"title": "Feature Complete", "message": "Successfully implemented user authentication with OAuth2"}'
```

### Bug fix
```bash
curl -X POST "$TEAMS_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"title": "Bug Fixed", "message": "Resolved memory leak in data processing pipeline"}'
```

### Refactoring
```bash
curl -X POST "$TEAMS_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"title": "Refactoring Complete", "message": "Simplified authentication module - reduced from 500 to 250 lines"}'
```

## Automatic Behavior

Claude will automatically use this skill when:
- You complete all tasks in your todo list
- You finish a significant piece of work
- The user has requested Teams notifications for task completion

The notification includes:
- A clear title indicating completion
- A summary of what was accomplished
- Timestamp of when the work finished

## Troubleshooting

**Webhook not working?**
- Verify `$TEAMS_WEBHOOK_URL` is set: `echo $TEAMS_WEBHOOK_URL`
- Check that the webhook URL is still active in Teams
- Test manually: `curl -X POST "$TEAMS_WEBHOOK_URL" -H "Content-Type: application/json" -d '{"title":"Test","message":"Testing"}'`

**Skill not loading?**
- Restart Claude Code after adding the skill
- Verify the skill file exists: `ls ~/.claude/skills/teams-notifier/SKILL.md`
