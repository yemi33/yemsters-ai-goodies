---
name: teams-notifier
description: Sends completion notifications to Microsoft Teams when tasks are finished. Use this skill when you complete a task, finish implementing a feature, fix a bug, or want to notify the user that work is done. Automatically sends a formatted message to the configured Teams webhook.
allowed-tools: Bash
---

# Teams Notifier Skill

This skill sends automatic notifications to Microsoft Teams when tasks are complete.

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

### Getting a Webhook URL via Power Automate

1. Go to [Power Automate](https://make.powerautomate.com)
2. Click **Create** → **Automated cloud flow**
3. Name your flow (e.g., "Claude Code Notifications")
4. Skip the trigger selection and click **Create**
5. Click **+ New step** → Search for "When an HTTP request is received"
6. Add another step → Search for "Post message in a chat or channel" (Teams)
7. Configure the Teams action:
   - **Post as:** Flow bot
   - **Post in:** Channel
   - **Team:** Select your team
   - **Channel:** Select your channel
   - **Message:** Use dynamic content to insert `title` and `message`:
     ```
     **@{triggerBody()?['title']}**
     
     @{triggerBody()?['message']}
     ```
8. **Save** the flow
9. Go back to the HTTP trigger and copy the **HTTP URL**
10. Add this URL to your `~/.claude/settings.json`

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

## Optional: Automatic Notifications on Exit

Would you like to automatically get notified when conversations end? You can set up a Stop hook that sends Teams notifications whenever you exit Claude Code.

To enable this, add the following hook configuration to your `~/.claude/settings.json`:

```json
{
  "env": {
    "TEAMS_WEBHOOK_URL": "your-webhook-url-here"
  },
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Analyze what task was just completed in this conversation. Generate a concise title (3-8 words) and a brief message (1-2 sentences) summarizing what was accomplished. Then send a Teams notification using this bash command:\n\ncurl -X POST \"$TEAMS_WEBHOOK_URL\" -H \"Content-Type: application/json\" -d '{\"title\": \"YOUR_TITLE\", \"message\": \"YOUR_MESSAGE\"}'\n\nReplace YOUR_TITLE and YOUR_MESSAGE with your generated content. Be specific about what was done (e.g., file names, features added, bugs fixed).",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

With this hook enabled, Claude will automatically:
- Analyze what was accomplished in the conversation
- Generate a summary
- Send a Teams notification when you exit

This is completely optional and can be added/removed at any time.

## Troubleshooting

**Webhook not working?**
- Verify `$TEAMS_WEBHOOK_URL` is set: `echo $TEAMS_WEBHOOK_URL`
- Check that the Power Automate flow is turned on
- Check the flow run history for errors
- Test manually: `curl -X POST "$TEAMS_WEBHOOK_URL" -H "Content-Type: application/json" -d '{"title":"Test","message":"Testing"}'`

**Skill not loading?**
- Restart Claude Code after adding the skill
- Verify the skill file exists: `ls ~/.claude/skills/teams-notifier/SKILL.md`
