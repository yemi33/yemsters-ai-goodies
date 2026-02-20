# Skill: monitor-loop

Runs a background polling loop that repeatedly checks a set of items, acts on them, and stops when a completion condition is met. Generic orchestration — bring your own check/act logic.

## Usage

```
/monitor-loop <description> [--interval <minutes>]
```

- `<description>`: Natural language description of what to monitor, what to do each round, and what "done" looks like
- `--interval <minutes>`: How often to poll (default: 30)

**Examples:**
```
/monitor-loop "Watch these 5 PRs until all builds are green. Each round: check build status, fix any failures, push fixes." --interval 30

/monitor-loop "Poll this API endpoint every 10 minutes until it returns status=ready, then notify me." --interval 10

/monitor-loop "Monitor these background jobs until all complete. Each round: check job status, restart any that have failed." --interval 15
```

## Instructions

### Step 1: Parse arguments

Extract from the user's input:
- **Items**: the things being monitored (list them explicitly)
- **Check logic**: what to do each round to assess status
- **Act logic**: what to do when something needs attention
- **Done condition**: what state means the loop can stop
- **Interval**: from `--interval` flag, default 30 minutes

Confirm your understanding with the user before spawning.

### Step 2: Create the team

```
TeamCreate: team_name = "monitor-<short-descriptor>"
```

Use a short slug derived from what's being monitored (e.g. `monitor-pr-builds`, `monitor-jobs`).

### Step 3: Create a task

```
TaskCreate: "Monitor loop: <one-line description>"
```

### Step 4: Spawn the background coordinator

Use the Task tool with:
- `subagent_type`: "general-purpose"
- `run_in_background`: true
- `team_name`: the team you just created
- `name`: "monitor-coordinator"

Use the coordinator prompt template below, filled in with the parsed details.

---

## Coordinator Prompt Template

```
You are a background monitor coordinator. Your job is to repeatedly check a set of items,
act on anything that needs attention, and stop when the done condition is met.

## What you're monitoring
{ITEMS}

## Each round, you should
{CHECK_AND_ACT_LOGIC}

## You are done when
{DONE_CONDITION}

## Polling interval
{INTERVAL} minutes between rounds.

## Progress log
Append all activity to a log file. Choose a sensible path based on the working context
(e.g. a `.monitor-loop.log` file in the relevant working directory, or `~/.claude/monitor-loop.log`
if there's no obvious project directory). Use this format:
```
[TIMESTAMP] ROUND N starting
[TIMESTAMP] <item>: <status>
[TIMESTAMP] <item>: <action taken>
[TIMESTAMP] ROUND N complete — X/{TOTAL} done. Sleeping {INTERVAL} min...
[TIMESTAMP] DONE — all items complete.
```

## Workflow

Repeat until the done condition is met:

### 1. Check all items
Assess the current status of every item using the check logic above.
Items that are already done: skip.
Items that need attention: proceed to step 2.
Items that are in-progress (waiting on something external): note it, skip this round.

### 2. Act on items that need attention
Apply the act logic above for each item that needs it.
Log what you did.

### 3. Check if done
If the done condition is met for all items, go to "When done" below.

### 4. Wait
Use sequential Bash calls (each with timeout=600000) to wait {INTERVAL} minutes.
Each call can sleep at most 540 seconds (9 min). Chain as many as needed:
- 15 min: sleep 540 + sleep 360
- 30 min: sleep 540 × 4
- 60 min: sleep 540 × 7

```bash
sleep 540
```

### 5. Repeat from step 1

## When done

1. Write a summary to the log file.
2. Send a message to the team lead with:
   - What was monitored
   - How many rounds it took
   - What actions were taken
   - Anything still pending human action

## Rules
- Only act on what you're asked to monitor — don't touch unrelated things
- If an item is blocked on human action, note it and move on — don't spin on it
- If an action fails, log it, try once more next round, then escalate to the team lead
- Never force push or take destructive actions without explicit instruction
```

---

## After the Coordinator Finishes

When the coordinator sends back its summary:
1. Display the summary to the user
2. Send shutdown request: `SendMessage type=shutdown_request` to `monitor-coordinator`
3. Clean up: `TeamDelete`
