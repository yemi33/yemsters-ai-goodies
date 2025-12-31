# Teams Notifier Skill

This skill enables automatic Teams notifications when Claude Code completes tasks.

## Installation

Install the plugin from the marketplace:

```
/plugin marketplace add yemishin_microsoft/yemsters-ai-goodies
/plugin install teams-notifier@yemsters-ai-goodies
```

## Configuration

Add your Teams webhook URL to `~/.claude/settings.json`:

```json
{
  "env": {
    "TEAMS_WEBHOOK_URL": "your-teams-webhook-url-here"
  }
}
```

### Getting a Teams Webhook URL

1. Go to your Teams channel
2. Click the three dots (...) → Connectors → Incoming Webhook
3. Configure and copy the webhook URL
4. Add it to your settings as shown above

Restart Claude Code after configuration.

## How to Use

Once installed and configured, the skill works automatically. Claude will send Teams notifications when:
- Tasks are complete
- Features are implemented
- Bugs are fixed
- You explicitly ask for a notification

### Manual Test

To test the notification manually:
```bash
curl -X POST "$TEAMS_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "message": "Testing Teams notification"}'
```

Or simply ask Claude: "Send me a test Teams notification"

## Troubleshooting

### Skill not working?

1. **Verify installation:**
   ```bash
   ls ~/.claude/skills/teams-notifier/SKILL.md
   ```

2. **Check environment variable:**
   ```bash
   echo $TEAMS_WEBHOOK_URL
   ```

3. **Restart Claude Code:**
   Exit and restart to load the skill

### Notification not sending?

1. **Test webhook manually:**
   ```bash
   curl -X POST "$TEAMS_WEBHOOK_URL" -H "Content-Type: application/json" -d '{"title":"Test","message":"Hello"}'
   ```

2. **Check Teams channel:**
   - Verify the webhook is still active
   - Check if the channel still exists

3. **Update webhook URL:**
   If you need to update the webhook URL, edit `~/.claude/settings.json` and restart Claude Code
