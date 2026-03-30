---
name: send-to-codex
description: This skill should be used when the user says "send to codex", "run in copilot", "hand off to copilot", or wants to delegate the current plan/task to GitHub Copilot CLI via agency copilot in headless mode.
allowed-tools: Bash
---

# Send to Codex

Delegate the current plan and conversation context to GitHub Copilot CLI (`agency copilot`) running in headless mode. This packages up what Claude knows about the task and hands it off to Copilot to execute autonomously.

## Workflow

### 1. Gather Context

Collect the following pieces of context to build the prompt:

- **Current plan**: Read the active plan from the conversation (task list, steps, goals). If no formal plan exists, summarize the user's request and any agreed-upon approach.
- **Working directory**: Capture `pwd` to tell Copilot where to work.
- **Relevant files**: List key files discussed or modified in the conversation.
- **Constraints**: Any user-specified constraints, preferences, or "do/don't" guidance from the conversation.

### 2. Build the Prompt File

Write a structured prompt to a temp file that Copilot can consume:

```bash
PROMPT_FILE=$(mktemp /tmp/codex-prompt-XXXXXX.md)
cat > "$PROMPT_FILE" << 'PROMPT_EOF'
# Task

[One-line summary of what needs to be done]

## Plan

[Full plan with numbered steps - copy from the active plan]

## Context

- Working directory: [path]
- Key files: [list of relevant files]

## Constraints

[Any constraints, preferences, or guidance from the conversation]

## Instructions

Execute the plan above. Work through each step sequentially. Commit your changes when done.
PROMPT_EOF
```

### 3. Invoke Agency Copilot

Run `agency copilot` in headless mode with the prompt:

```bash
PROMPT=$(cat "$PROMPT_FILE")
agency copilot -p "$PROMPT" --allow-all --share="/tmp/codex-session-$(date +%s).md"
```

**Flag reference:**
- `-p <text>` - Non-interactive mode, exits after completion
- `--allow-all` - Grant all permissions (tools, paths, URLs)
- `--share[=path]` - Save session transcript to markdown file
- `--mcp <servers>` - Add MCP servers (e.g., `ado`, `kusto`)
- `-s` / `--silent` - Output only agent response (no stats)
- `--agent <name>` - Load a custom agent from `~/.copilot/agents/`
- `--output-format json` - JSONL output for structured parsing

### 4. Report Back

After `agency copilot` finishes:

1. Read the session transcript from the `--share` path if available
2. Summarize what Copilot did - files created/modified, commits made
3. Flag any errors or incomplete steps for the user

## Important Notes

- Always use `agency copilot`, not bare `copilot`, to get MCP server support
- The prompt should be self-contained - Copilot has no access to this conversation's context
- If the plan references ADO work items or repos, add `--mcp ado` to give Copilot access
- For long prompts, always write to a file first and read it back to avoid shell escaping issues
- Use `--share` to capture the session transcript for review
- If the user specifies additional MCP servers or flags, pass them through

## Prompt Quality Checklist

Before sending, verify the prompt includes:
- Clear objective (what "done" looks like)
- Ordered steps (not just a vague description)
- File paths and repo context (Copilot starts fresh)
- Any branch/commit conventions to follow
