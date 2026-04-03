---
name: plan-tracker
description: "Parses a markdown plan file and generates a data.json that powers the PRism visual dashboard — showing PR status, dependencies, wave groupings, and completion progress. Also provides the prism-update.js integration for auto-updating PR status when PRs are created or merged. ALWAYS use this skill when the user wants to: convert a plan to a PR tracker or visualization, generate or update data.json for PRism, view the prism dashboard, mark PRs as done in the tracker, track plan progress visually, or whenever 'prism', 'PR dashboard', 'plan visualization', 'track my PRs', or 'show progress' is mentioned. This skill contains the exact JSON schema, markdown parsing patterns, and updater CLI commands needed — without it you will not produce the correct data.json format."
---

# PRism — Plan to PR Visualizer

Convert a markdown plan file into `data.json` for the PRism dashboard. Automatically track PR creation and task completion.

## Dashboard Location

The PRism dashboard and updater script are at:
- **Dashboard:** `prism/index.html`
- **Update script:** `prism/prism-update.js`
- **Data file:** Generated `data.json` should be placed alongside `index.html`

## Part 1: Generating data.json from a plan

### Inputs

Ask the user for these if not provided:

- **plan_path** (required): Path to the markdown plan file.
- **output_dir** (optional): Directory for the generated JSON. Default: `prism/`

### Supported Markdown Patterns

The converter recognizes these patterns in the plan file:

#### PR definitions

- A `## PRs` section with list items:
  ```
  - PR-101: Auth flow (status=in-progress, dependsOn=PR-100, owner=alice, url=https://...)
  ```
- Headings like `### PR-101: Auth flow`
- Any list item containing a `PR-xxx` identifier

#### Metadata fields (in parentheses or brackets)

- `status` — e.g. `todo`, `in-progress`, `done`
- `dependsOn` — comma-separated PR IDs
- `owner` — assignee name
- `url` — link to the PR
- `description` — short description

#### Task checklists

- `- [ ] Review PR-101 (PR-101)` — creates a task linked to a PR
- `- [x] Completed task` — marks task as done

#### Fallback — Phase/Step-based plans

If no `## PRs` section is found, extract PRs from the plan structure:
- Each implementation step or phase becomes a PR entry
- Group by phase as waves
- Auto-generate PR IDs (PR-1, PR-2, ...)
- Extract dependencies from step ordering

### Steps

1. **Confirm inputs** — Verify `plan_path` exists.

2. **Read the plan file** — Summarize what will be converted.

3. **Generate data.json** — Parse the plan and create the JSON structure:
   ```json
   {
     "refreshSeconds": 8,
     "prs": [
       {
         "id": "PR-1",
         "title": "Step title",
         "description": "What this PR does",
         "status": "todo",
         "dependsOn": [],
         "wave": "Phase 1: Name"
       }
     ],
     "tasks": []
   }
   ```

4. **Write data.json** to the output directory.

5. **Show summary** — Run the updater to show status:
   ```
   node prism/prism-update.js <data.json> summary
   ```

6. **Optionally start the dashboard:**
   ```
   python -m http.server 8000 --directory prism
   ```
   Tell the user to open `http://localhost:8000`.

## Part 2: Auto-updating on PR creation

**IMPORTANT:** After ANY workflow creates a PR that might match an entry in `data.json`, update the dashboard automatically.

### When to update

Call the updater whenever:
- A PR is created (via any skill, MCP tool, or CLI)
- A task is completed
- A PR status changes (merged, closed, etc.)

### How to update

Use the standalone updater script — works with Node.js or Bun:

```bash
# Update by PR ID (when you know which planned PR this maps to)
node prism/prism-update.js <data.json> update PR-3 --status done --url <pr-url>

# Update by fuzzy title match (when the PR title matches a planned PR)
node prism/prism-update.js <data.json> match --title "PR title text" --status done --url <pr-url>

# Mark a task as done (by index)
node prism/prism-update.js <data.json> task 0 --done

# Show current progress
node prism/prism-update.js <data.json> summary
```

### Integration pattern

After creating a PR in any skill or workflow:

1. Check if a `data.json` exists in the prism directory
2. If yes, call `prism-update.js match` with the PR title and URL
3. The fuzzy matcher will find the closest planned PR and update it
4. The dashboard auto-refreshes and reflects the change

### Statuses

- `todo` — Not started (default)
- `in-progress` — Currently being worked on
- `done` — PR created and pushed

## Output

The `data.json` powers the PRism dashboard which shows:
- **Progress bar** — Overall PR completion percentage
- **Wave columns** — PRs grouped by phase/wave
- **Status badges** — Color-coded todo/in-progress/done
- **View PR buttons** — Clickable links to PRs (appear when `url` is set)
- **Auto-refresh** — Dashboard polls `data.json` every N seconds
