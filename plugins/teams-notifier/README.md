# Teams Notifier Skill

This skill enables automatic Teams notifications when Claude Code completes tasks.

## Installation

Install the plugin from the marketplace:

```
/plugin marketplace add yemi33/yemsters-ai-goodies
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

### Getting a Webhook URL via Power Automate

1. Go to [Power Automate](https://make.powerautomate.com)
2. Click **Create** → **Automated cloud flow**
3. Name your flow (e.g., "Claude Code Notifications")
4. Skip the trigger selection and click **Create**
5. Click **+ New step** → Search for "When an HTTP request is received"
6. In the HTTP trigger, click **Use sample payload to generate schema**
7. Paste this sample payload:
   ```json
   {
     "title": "Task Complete",
     "message": "Successfully completed the build process"
   }
   ```
8. Click **Done** - the schema will be automatically generated
9. Add another step → Search for "Post message in a chat or channel" (Teams)
10. Configure the Teams action:
    - **Post as:** Flow bot
    - **Post in:** Channel
    - **Team:** Select your team
    - **Channel:** Select your channel
    - **Message:** Use dynamic content to insert `title` and `message`:
      ```
      **@{triggerBody()?['title']}**
      
      @{triggerBody()?['message']}
      ```
11. **Save** the flow
12. Go back to the HTTP trigger step and copy the **HTTP URL**
13. Add this URL to your `~/.claude/settings.json` as shown above

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

2. **Check Power Automate flow:**
   - Verify the flow is turned on
   - Check the run history for errors
   - Ensure you have permissions to post in the Teams channel

3. **Update webhook URL:**
   If you need to update the webhook URL, edit `~/.claude/settings.json` and restart Claude Code

## Optional: Automatic Notifications with Stop Hook

You can configure Claude Code to automatically send a Teams notification when you stop a conversation. Add this hook to your `~/.claude/settings.json`:

```json
{
  "env": {
    "TEAMS_WEBHOOK_URL": "your-teams-webhook-url-here"
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
