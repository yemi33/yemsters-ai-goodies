# Teams Plan Tracker Plugin

Automatically posts Claude plans to Microsoft Teams and threads PR updates as replies, creating a unified conversation thread for tracking implementation progress.

## What It Does

This plugin creates a seamless workflow between Claude's planning mode and Microsoft Teams:

1. **Plan Creation** - When Claude creates a plan, it automatically posts to Teams with a unique plan ID
2. **PR Tracking** - When PRs are created via Azure DevOps, they're posted as threaded replies to the original plan
3. **Status Updates** - PR status changes (Active → Completed) are tracked and updated in the thread
4. **State Management** - Maintains plan ID locally to ensure PR updates thread correctly

## Why Use This?

- **Visibility**: Keep your team informed about what Claude is working on
- **Traceability**: See which PRs belong to which plan in a threaded conversation
- **Progress Tracking**: Monitor implementation progress from plan to completion
- **Automation**: Zero manual effort - everything posts automatically

## Installation

### 1. Install the Plugin

```bash
# Clone or add this plugin to your Claude plugins directory
cp -r plugins/teams-plan-tracker ~/.claude/skills/teams-plan-tracker
```

### 2. Configure Environment Variables

Add to your `~/.claude/settings.json`:

```json
{
  "env": {
    "TEAMS_PLAN_FLOW_URL": "your-power-automate-webhook-url"
  }
}
```

### 3. Set Up Power Automate Flow

The plugin requires a Power Automate flow with:

- **Trigger**: HTTP Request (When a HTTP request is received)
- **SharePoint List**: "Claude Plan Tracking" with columns:
  - PlanID (Single line of text)
  - MessageID (Single line of text)
  - ConversationID (Single line of text)
- **Logic**:
  - If `event_type` is "plan": Post to Teams and save message IDs to SharePoint
  - If `event_type` is "pr_update": Look up plan in SharePoint and reply to that message

### 4. Enable in CLAUDE.md (Optional)

To make this automatic, add to your `~/.claude/CLAUDE.md`:

```markdown
## Teams Plan Tracking
- When entering plan mode or creating a plan, automatically post it to Teams using the teams-plan-tracker skill
- Generate a unique plan ID and save it to `~/.claude/.current_plan_id`
- When creating PRs via Azure DevOps MCP server, automatically post PR updates to Teams as threaded replies
```

## How It Works

### Plan Creation Flow

```
User: "Make a plan to add authentication"
    ↓
Claude creates plan
    ↓
Plugin generates plan ID: "plan-1736967832"
    ↓
Saves to ~/.claude/.current_plan_id
    ↓
Posts to Teams via webhook
    ↓
Power Automate posts to Teams channel
    ↓
Saves message ID to SharePoint
```

### PR Update Flow

```
Claude creates PR via ADO MCP
    ↓
Plugin extracts PR URL from response
    ↓
Reads plan ID from ~/.claude/.current_plan_id
    ↓
Posts PR update via webhook
    ↓
Power Automate looks up plan in SharePoint
    ↓
Posts as reply to original plan message
```

## Usage

### Automatic Usage

Once configured, the plugin works automatically:

```
User: "Create a plan to refactor the auth module"
```

Claude will:
1. Create the plan
2. Automatically post it to Teams
3. Save the plan ID locally

```
User: "Implement the plan and create a PR"
```

Claude will:
1. Implement the changes
2. Create PR using Azure DevOps MCP
3. Automatically post the PR as a reply to the plan in Teams

### Manual Commands

#### Check Current Plan ID
```bash
cat ~/.claude/.current_plan_id
```

#### Start a New Plan Thread
```bash
rm ~/.claude/.current_plan_id
```

#### Test the Webhook
```bash
curl -X POST "$TEAMS_PLAN_FLOW_URL" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"plan","plan_id":"test-123","title":"Test Plan","content":"Testing the webhook","timestamp":"2025-01-15T00:00:00Z"}'
```

## Message Formats

### Plan Message
```
🎯 Claude Plan Created

Title: Add User Authentication

Tasks:
- Create auth service
- Add login endpoint
- Implement JWT tokens
- Add auth middleware

Created: 2025-01-15T10:30:00Z
```

### PR Update (Threaded Reply)
```
✅ PR Update

PR: feat: Add JWT authentication
Status: Active
Link: https://dev.azure.com/contoso/MyProject/_git/MyRepo/pullrequest/123

Updated: 2025-01-15T12:45:00Z
```

## PR Status Values

- **Active** - PR is open and awaiting review
- **Completed** - PR has been merged
- **Abandoned** - PR was closed without merging

## Requirements

- Claude Code CLI
- Microsoft Teams with webhook permissions
- Power Automate with premium connector (HTTP, Teams, SharePoint)
- Azure DevOps for PR creation
- SharePoint list for state management

## Troubleshooting

### PR Not Threading

**Problem**: PR updates post as new messages instead of replies

**Solutions**:
1. Check that plan ID exists in SharePoint: `cat ~/.claude/.current_plan_id`
2. Verify Power Automate flow is enabled
3. Check SharePoint list has the plan ID entry
4. Review Power Automate run history for errors

### Webhook Not Working

**Problem**: No messages appear in Teams

**Solutions**:
1. Verify environment variable: `echo $TEAMS_PLAN_FLOW_URL`
2. Test webhook manually (see Manual Commands)
3. Check Power Automate flow is turned "On"
4. Review flow run history for error details

### Plan ID Missing

**Problem**: `~/.claude/.current_plan_id` is empty

**Solutions**:
1. Claude will automatically generate a new plan ID on next plan creation
2. Or manually create one: `echo "plan-$(date +%s)" > ~/.claude/.current_plan_id`

### Wrong PR URLs

**Problem**: GitHub URLs instead of Azure DevOps URLs

**Solution**: Ensure you're creating PRs with `mcp__azure-ado__repo_create_pull_request`, not `gh pr create`

## Architecture

```
Claude Plan Mode
    ↓
Generate Plan ID
    ↓
~/.claude/.current_plan_id (local file)
    ↓
POST to $TEAMS_PLAN_FLOW_URL
    ↓
Power Automate Flow
    ↓
├─ Post to Teams → Get Message ID
└─ Save to SharePoint (PlanID → MessageID mapping)
    ↓
When PR Created
    ↓
POST pr_update with plan_id
    ↓
Power Automate looks up MessageID
    ↓
Post as reply to original message
```

## Integration with Other Plugins

This plugin works well alongside:

- **teams-notifier**: For task completion notifications (separate from plan tracking)
- **azure-ado MCP**: Required for PR creation and management
- **devbox-remote-control**: Can notify when dev boxes are ready

## Contributing

This plugin is part of the [yemsters-ai-goodies](https://github.com/yemishin/yemsters-ai-goodies) marketplace.

## License

MIT

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/yemishin/yemsters-ai-goodies).
