# PRism

A lightweight, self-contained dashboard to track stacked PR dependencies with live progress updates. Available as both a static HTML dashboard and an MCP App for inline rendering in chat.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- For the MCP App: an MCP host that supports [MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview) (Claude Desktop, claude.ai, VS Code Copilot, Goose, etc.)

> **Note:** The MCP App requires a UX client that can render MCP App HTML (sandboxed iframes). In a pure CLI terminal, the MCP tools are callable but the interactive dashboard UI will not render — you'll only see raw tool responses. The `prism-summary` tool works well in CLI mode as it returns plain text.

## Installation

### Via the Agency Marketplace (recommended)

If you have the playground marketplace installed:

```bash
# In Claude Code or Copilot CLI
agency copilot   # or: agency claude

# Add the marketplace (if not already added)
/plugin marketplace add agency-microsoft/playground

# Install the plugin
/plugin install prism@agency-playground
```

### Manual setup (MCP App)

```bash
cd plugins/prism/mcp-app
npm install
npm run build   # if dist/mcp-app.html is missing
```

#### Add to Claude Code

Add to your `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "prism": {
      "command": "npx",
      "args": ["tsx", "/path/to/plugins/prism/mcp-app/server-stdio.ts"],
      "tools": ["*"]
    }
  }
}
```

#### Add to VS Code (Copilot)

Add to your `.vscode/mcp.json`:

```json
{
  "servers": {
    "prism": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "/path/to/plugins/prism/mcp-app/server-stdio.ts"]
    }
  }
}
```

#### Add to Claude Desktop or other web hosts

Start the server in HTTP mode:

```bash
cd plugins/prism/mcp-app
npx tsx server.ts
```

Then connect your host to `http://localhost:3001/mcp`. For Claude Desktop, use [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/) to tunnel:

```bash
npx cloudflared tunnel --url http://localhost:3001
```

Add the generated URL as a custom connector in Claude Desktop settings.

## MCP App Tools

| Tool | Description |
|------|-------------|
| `prism-dashboard` | Renders the PRism dashboard inline in chat. Pass PR data as a JSON string with a `prs` array. |
| `prism-update-pr` | Updates a PR's status or URL in PRism data. Returns the updated JSON. |
| `prism-summary` | Returns a plain-text progress summary — works well in CLI terminals without UI rendering. |

## Static Dashboard

The standalone HTML dashboard can be used without the MCP App:

```bash
cd plugins/prism
python -m http.server 8000
# Visit http://localhost:8000
```

> Opening `index.html` directly from the file system will block `data.json` from loading.

## Generate data.json from a plan

### Using the Python converter

```bash
python plan_to_data.py --plan path/to/plan.md --output data.json
```

The converter looks for PRs in a `## PRs` section, headings like `### PR-101: Title`, or any list item containing a `PR-xxx` identifier. It also converts markdown checklist items (`- [ ] Task (PR-101)`) into tasks.

### Using the Claude skill

When installed as a Claude Code plugin, invoke `/prism:plan-tracker` to generate `data.json` from any markdown plan — including phase/step-based plans without explicit PR definitions.

```bash
# Install the plugin
claude --plugin-dir /path/to/prism

# Invoke the skill
/prism:plan-tracker path/to/plan.md
```

## Auto-update on PR creation

Use `prism-update.js` to update `data.json` when PRs are created or tasks completed:

```bash
# Update by PR ID
node prism-update.js data.json update PR-3 --status done --url https://...

# Update by fuzzy title match
node prism-update.js data.json match --title "Apply Detekt plugin" --status done --url https://...

# Mark a task as done
node prism-update.js data.json task 0 --done

# Show progress summary
node prism-update.js data.json summary
```

Any skill or workflow that creates PRs can call the updater afterward. The dashboard auto-refreshes and reflects changes.

## Data format

```json
{
  "refreshSeconds": 8,
  "prs": [
    {
      "id": "PR-1",
      "title": "Auth flow",
      "status": "in-progress",
      "dependsOn": [],
      "wave": "Phase 1",
      "description": "Login/logout endpoints",
      "url": "https://dev.azure.com/org/project/_git/repo/pullrequest/123"
    }
  ],
  "tasks": [
    { "title": "Review PR-1", "done": false, "linkedPr": "PR-1" }
  ]
}
```

## Status values

`todo`, `in-progress`, `done`

## Live updates

`refreshSeconds` controls how often the dashboard polls `data.json`. Set it to `0` to pause auto-refresh.

## Development (MCP App)

```bash
cd mcp-app
npx tsx server-stdio.ts     # Start in stdio mode (for Claude Code)
npx tsx server.ts            # Start in HTTP mode (for web hosts, port 3001)
```

To test with the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npx @modelcontextprotocol/inspector npx tsx mcp-app/server-stdio.ts
```

To test rendering with the [basic-host](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-host):

```bash
cd mcp-app && npx tsx server.ts
# In another terminal:
git clone https://github.com/modelcontextprotocol/ext-apps.git
cd ext-apps/examples/basic-host
npm install
SERVERS='["http://localhost:3001/mcp"]' npm start
# Open http://localhost:8080
```
