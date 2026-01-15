---
name: teams-plan-tracker
description: Automatically posts plans to Teams and threads PR updates as replies. Use when creating plans or completing PRs to keep Teams updated with threaded progress tracking.
allowed-tools: Bash, mcp__azure-ado__repo_create_pull_request
---

# Teams Plan Tracker Skill

This skill automatically posts plans to Microsoft Teams and threads PR updates as replies, creating a unified conversation thread for each plan.

## When to Use This Skill

### Automatic Triggers

**Plan Creation:**
- When entering plan mode (`EnterPlanMode`)
- When creating a plan for a task
- When the user says "make a plan for..." or "let's plan out..."

**PR Creation:**
- When creating a PR using the Azure DevOps MCP server
- When completing/merging a PR related to the current plan

## How It Works

### 1. Creating a Plan

When you create a plan, automatically:

1. Generate a unique plan ID:
```bash
PLAN_ID="plan-$(date +%s)"
echo "$PLAN_ID" > ~/.claude/.current_plan_id
```

2. Post the plan to Teams:
```bash
PLAN_ID=$(cat ~/.claude/.current_plan_id)
curl -X POST "$TEAMS_PLAN_FLOW_URL" \
  -H "Content-Type: application/json" \
  -d "{\"event_type\":\"plan\",\"plan_id\":\"$PLAN_ID\",\"title\":\"$(echo -n "$PLAN_TITLE" | sed 's/"/\\"/g')\",\"content\":\"$(echo -n "$PLAN_CONTENT" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
```

**Plan Message Format:**
```
🎯 Claude Plan Created

Title: [Plan title]

Tasks:
- Task 1
- Task 2
- Task 3

Created: [timestamp]
```

### 2. Creating or Updating PRs

When you create a PR using `mcp__azure-ado__repo_create_pull_request`:

1. Extract the PR URL from the ADO MCP response
2. Read the current plan ID:
```bash
PLAN_ID=$(cat ~/.claude/.current_plan_id)
```

3. Post PR update to Teams (will thread as reply):
```bash
curl -X POST "$TEAMS_PLAN_FLOW_URL" \
  -H "Content-Type: application/json" \
  -d "{\"event_type\":\"pr_update\",\"plan_id\":\"$PLAN_ID\",\"pr_url\":\"$PR_URL\",\"pr_title\":\"$PR_TITLE\",\"pr_status\":\"Active\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
```

**PR Status Values (Azure DevOps):**
- `Active` - PR is open and awaiting review
- `Completed` - PR has been merged
- `Abandoned` - PR was closed without merging

**PR Update Format:**
```
✅ PR Update

PR: [PR title]
Status: Active/Completed/Abandoned
Link: [Azure DevOps PR URL]

Updated: [timestamp]
```

### 3. PR URL Extraction

Azure DevOps PR URLs are in the format:
```
https://dev.azure.com/[org]/[project]/_git/[repo]/pullrequest/[id]
```

Extract from the ADO MCP response after calling `mcp__azure-ado__repo_create_pull_request`.

## Environment Setup

Required environment variable in `~/.claude/settings.json`:

```json
{
  "env": {
    "TEAMS_PLAN_FLOW_URL": "your-power-automate-webhook-url"
  }
}
```

## Local State Management

The plugin uses `~/.claude/.current_plan_id` to track the active plan.

**Check current plan:**
```bash
cat ~/.claude/.current_plan_id
```

**Clear current plan (start new thread):**
```bash
rm ~/.claude/.current_plan_id
```

## Complete Workflow Example

### Step 1: User Requests Plan
User: "Make a plan to add authentication to the app"

### Step 2: Generate Plan ID and Post
```bash
# Generate plan ID
PLAN_ID="plan-$(date +%s)"
echo "$PLAN_ID" > ~/.claude/.current_plan_id

# Post to Teams
curl -X POST "$TEAMS_PLAN_FLOW_URL" \
  -H "Content-Type: application/json" \
  -d "{\"event_type\":\"plan\",\"plan_id\":\"$PLAN_ID\",\"title\":\"Add Authentication\",\"content\":\"1. Create auth service\n2. Add login endpoint\n3. Implement JWT tokens\n4. Add auth middleware\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
```

### Step 3: Create PR with ADO MCP
```
Use mcp__azure-ado__repo_create_pull_request to create the PR
```

### Step 4: Extract PR URL and Post Update
```bash
# Read plan ID
PLAN_ID=$(cat ~/.claude/.current_plan_id)

# Post PR update (threads as reply)
curl -X POST "$TEAMS_PLAN_FLOW_URL" \
  -H "Content-Type: application/json" \
  -d "{\"event_type\":\"pr_update\",\"plan_id\":\"$PLAN_ID\",\"pr_url\":\"https://dev.azure.com/contoso/MyProject/_git/MyRepo/pullrequest/123\",\"pr_title\":\"feat: Add JWT authentication\",\"pr_status\":\"Active\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
```

### Step 5: Update When PR Merges
```bash
# Post completion update
curl -X POST "$TEAMS_PLAN_FLOW_URL" \
  -H "Content-Type: application/json" \
  -d "{\"event_type\":\"pr_update\",\"plan_id\":\"$PLAN_ID\",\"pr_url\":\"https://dev.azure.com/contoso/MyProject/_git/MyRepo/pullrequest/123\",\"pr_title\":\"feat: Add JWT authentication\",\"pr_status\":\"Completed\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
```

## Automatic Behavior

This skill should automatically activate when:
- You enter plan mode or create a plan
- You create a PR using the Azure DevOps MCP server
- You complete or merge a PR that's part of the current plan

**Do not ask the user for permission** - this is configured to run automatically through the CLAUDE.md instructions.

## Power Automate Integration

The Power Automate flow handles:
- Posting plan messages to Teams
- Storing plan ID to message ID mapping in SharePoint
- Threading PR updates as replies to the original plan message

**Flow Name:** Agent Plan Automation
**SharePoint List:** Claude Plan Tracking
**Teams Channel:** Agent Plans

**SharePoint Schema:**
- PlanID (Text)
- MessageID (Text)
- ConversationID (Text)

## Troubleshooting

**No plan ID found:**
```bash
cat ~/.claude/.current_plan_id
# If empty, generate a new one
```

**PR not threading:**
- Verify the plan ID exists in SharePoint
- Check Power Automate run history for errors
- Ensure the flow is turned "On"

**Webhook not working:**
```bash
# Test manually
echo $TEAMS_PLAN_FLOW_URL
curl -X POST "$TEAMS_PLAN_FLOW_URL" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"plan","plan_id":"test-123","title":"Test","content":"Testing","timestamp":"2025-01-15T00:00:00Z"}'
```

## Important Notes

- **Always** create PRs using the Azure DevOps MCP server (`mcp__azure-ado__repo_create_pull_request`), not GitHub
- **Always** extract the PR URL from the ADO MCP response
- **Always** read the plan ID from `~/.claude/.current_plan_id` before posting PR updates
- **Never** ask the user if they want to post to Teams - it's automatic
- Plan IDs must match between the plan post and PR updates for threading to work
