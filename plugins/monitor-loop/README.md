# Monitor Loop Skill

A generic background polling skill that runs a coordinator agent to repeatedly check a set of items, act on anything that needs attention, and stop when a done condition is met. Bring your own check/act/done logic.

## Installation

```
/plugin marketplace add yemi33/yemsters-ai-goodies
/plugin install monitor-loop@yemsters-ai-goodies
```

## Usage

```
/monitor-loop <description> [--interval <minutes>]
```

- `<description>`: Natural language description of what to monitor, what to do each round, and what "done" looks like
- `--interval <minutes>`: How often to poll (default: 30)

## Examples

```
/monitor-loop "Watch these 5 PRs until all builds are green. Each round: check build status, fix any failures, push fixes." --interval 30

/monitor-loop "Poll this API endpoint every 10 minutes until it returns status=ready, then notify me." --interval 10

/monitor-loop "Monitor these background jobs until all complete. Each round: check job status, restart any that have failed." --interval 15
```

## How It Works

1. Parses your description to extract items, check logic, act logic, done condition, and interval
2. Spawns a background coordinator agent (via `TeamCreate` + `Task`) so the loop runs independently
3. The coordinator checks all items each round, acts on anything that needs attention, logs progress, and sleeps until the next round
4. When the done condition is met, the coordinator sends a summary back and cleans up

## Building Wrappers

`/monitor-loop` is designed to be composed. You can build thin skill wrappers that pre-fill the description with domain-specific check/act/done logic and delegate orchestration here. See `android-monitor-fix-prs` as an example.
