# send-to-codex

Delegate the current plan and conversation context to GitHub Copilot CLI (`agency copilot`) in headless mode for autonomous execution. This enables a Claude-to-Copilot handoff where Claude packages up its understanding of the task and lets Copilot execute it independently.

## Prerequisites

- **agency CLI** installed and on your PATH (`agency` command available)
- **GitHub Copilot CLI** installed and authenticated (`copilot` command available via `agency copilot`)

## How It Works

1. **Gathers context** from the current conversation: the active plan, working directory, relevant files, and any constraints.
2. **Writes a structured prompt file** to `/tmp/codex-prompt-XXXXXX.md` containing the task summary, plan steps, context, and execution instructions.
3. **Invokes `agency copilot -p`** in headless mode with `--allow-all` permissions and `--share` to capture a session transcript.
4. **Reports back** with a summary of what Copilot did, including files modified and any errors encountered.

## Trigger Phrases

- "send to codex"
- "run in copilot"
- "hand off to copilot"

## Optional Flags

You can ask Claude to pass additional flags through to `agency copilot`:

- `--mcp ado` - Give Copilot access to Azure DevOps
- `--mcp kusto` - Give Copilot access to Kusto
- `--agent <name>` - Use a custom agent definition
- `--output-format json` - Get structured JSONL output
