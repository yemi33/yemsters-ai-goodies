---
name: plan-to-pr-visualizer
description: Converts a markdown plan file into data.json for the PR Dependency Visualizer dashboard. Use when the user wants to generate or update the PR visualizer from a plan file.
---

# Plan to PR Visualizer Skill

Convert a markdown plan file into `data.json` for the PR Dependency Visualizer dashboard.

## Prerequisites

- Python is available in the environment.
- The converter script exists at `C:\Users\yemishin\yemsters-ai-goodies\plugins\pr-visualizer\plan_to_data.py`.
- The dashboard files are in `C:\Users\yemishin\yemsters-ai-goodies\plugins\pr-visualizer\`.

## Inputs

Ask the user for these if not provided:

- **plan_path** (required): Path to the markdown plan file.
- **output_path** (optional): Path for the generated JSON. Default: `C:\Users\yemishin\pr-visualizer\data.json`.
- **refresh_seconds** (optional): Override the dashboard refresh interval.

## Supported Markdown Patterns

The converter recognizes these patterns in the plan file:

### PR definitions

- A `## PRs` section with list items:
  ```
  - PR-101: Auth flow (status=in-progress, dependsOn=PR-100, owner=alice, url=https://..., reviewCommand=copilot agent review --pr 101)
  ```
- Headings like `### PR-101: Auth flow`
- Any list item containing a `PR-xxx` identifier

### Metadata fields (in parentheses or brackets)

- `status` — e.g. `todo`, `in-progress`, `done`
- `dependsOn` — comma-separated PR IDs
- `owner` — assignee name
- `url` — link to the PR
- `description` — short description
- `reviewCommand` — command to review the PR

### Task checklists

- `- [ ] Review PR-101 (PR-101)` — creates a task linked to a PR
- `- [x] Completed task` — marks task as done

### Fallback

If no `## PRs` section is found, list items under `## Todos` or `## Tasks` headings are converted into PRs with auto-generated IDs.

## Steps

1. **Confirm inputs** — Verify `plan_path` exists. Ask if a custom `output_path` or `refresh_seconds` is needed.

2. **Read the plan file** — Use the Read tool to show the user a summary of what will be converted.

3. **Run the converter** — Execute:
   ```
   python C:\Users\yemishin\yemsters-ai-goodies\plugins\pr-visualizer\plan_to_data.py --plan <plan_path> --output <output_path>
   ```
   Add `--refresh <seconds>` if the user specified a refresh interval.

4. **Verify the output** — Read the generated `data.json` and summarize the results:
   - Number of PRs found
   - Number of tasks found
   - Any dependency chains detected

5. **Optionally start the dashboard** — If the user wants to view the visualization, start a local server:
   ```
   python -m http.server 8000 --directory C:\Users\yemishin\pr-visualizer
   ```
   Then tell the user to open `http://localhost:8000` in their browser.

## Output

The generated `data.json` contains:
- `prs` — array of PR objects with id, title, status, dependsOn, and optional metadata
- `tasks` — array of task objects linked to PRs
- `refreshSeconds` — dashboard auto-refresh interval
