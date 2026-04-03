#!/usr/bin/env node

/**
 * PRism Dashboard Updater
 *
 * Auto-detects PR creation or task completion and updates data.json.
 *
 * Usage:
 *   node prism-update.js <data.json> update <pr-id> --status <status> [--url <url>]
 *   node prism-update.js <data.json> match --title "PR title" --status <status> [--url <url>]
 *   node prism-update.js <data.json> task <task-index> --done
 *   node prism-update.js <data.json> summary
 *
 * Examples:
 *   node prism-update.js ./data.json update PR-3 --status done --url https://dev.azure.com/...
 *   node prism-update.js ./data.json match --title "Apply Detekt plugin" --status done --url https://...
 *   node prism-update.js ./data.json task 0 --done
 *   node prism-update.js ./data.json summary
 */

const fs = require('fs');
const path = require('path');

function loadData(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function saveData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function fuzzyMatch(needle, haystack) {
  const a = needle.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const b = haystack.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return 0.8;
  const aWords = a.split(/\s+/);
  const bWords = b.split(/\s+/);
  const matched = aWords.filter(w => bWords.some(bw => bw.includes(w) || w.includes(bw)));
  return matched.length / Math.max(aWords.length, 1);
}

function findPrById(data, id) {
  return data.prs.find(pr => pr.id.toLowerCase() === id.toLowerCase());
}

function findPrByTitle(data, title) {
  let best = null;
  let bestScore = 0;
  for (const pr of data.prs) {
    const score = fuzzyMatch(title, pr.title);
    if (score > bestScore) {
      bestScore = score;
      best = pr;
    }
  }
  if (bestScore < 0.4) return null;
  return best;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length < 2) return printUsage();

  const dataFile = args[0];
  const command = args[1];
  const rest = args.slice(2);

  const flags = {};
  let positional = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith('--') && i + 1 < rest.length) {
      flags[rest[i].slice(2)] = rest[i + 1];
      i++;
    } else {
      positional.push(rest[i]);
    }
  }

  return { dataFile, command, positional, flags };
}

function printUsage() {
  console.log(`PRism Dashboard Updater

Usage:
  node prism-update.js <data.json> update <pr-id> --status <status> [--url <url>]
  node prism-update.js <data.json> match --title "PR title" --status <status> [--url <url>]
  node prism-update.js <data.json> task <index> --done
  node prism-update.js <data.json> summary

Statuses: todo, in-progress, done`);
  process.exit(1);
}

function cmdUpdate(dataFile, prId, flags) {
  const data = loadData(dataFile);
  const pr = findPrById(data, prId);
  if (!pr) {
    console.error(`PR "${prId}" not found in ${dataFile}`);
    process.exit(1);
  }
  if (flags.status) pr.status = flags.status;
  if (flags.url) pr.url = flags.url;
  saveData(dataFile, data);
  console.log(`Updated ${pr.id}: status=${pr.status}${pr.url ? ` url=${pr.url}` : ''}`);
}

function cmdMatch(dataFile, flags) {
  if (!flags.title) {
    console.error('--title is required for match command');
    process.exit(1);
  }
  const data = loadData(dataFile);
  const pr = findPrByTitle(data, flags.title);
  if (!pr) {
    console.error(`No PR matching "${flags.title}" found in ${dataFile}`);
    process.exit(1);
  }
  if (flags.status) pr.status = flags.status;
  if (flags.url) pr.url = flags.url;
  saveData(dataFile, data);
  console.log(`Matched "${flags.title}" -> ${pr.id} ("${pr.title}")`);
  console.log(`Updated ${pr.id}: status=${pr.status}${pr.url ? ` url=${pr.url}` : ''}`);
}

function cmdTask(dataFile, indexStr, flags) {
  const data = loadData(dataFile);
  const index = parseInt(indexStr, 10);
  if (!data.tasks || index < 0 || index >= data.tasks.length) {
    console.error(`Task index ${index} out of range (${data.tasks ? data.tasks.length : 0} tasks)`);
    process.exit(1);
  }
  if ('done' in flags) {
    data.tasks[index].done = flags.done !== 'false';
  }
  saveData(dataFile, data);
  const t = data.tasks[index];
  console.log(`Task ${index}: "${t.title}" done=${t.done}`);
}

function cmdSummary(dataFile) {
  const data = loadData(dataFile);
  const total = data.prs.length;
  const done = data.prs.filter(p => p.status === 'done').length;
  const inProgress = data.prs.filter(p => p.status === 'in-progress').length;
  const todo = total - done - inProgress;
  const pct = total ? Math.round((done / total) * 100) : 0;

  console.log(`PRism Summary: ${done}/${total} done (${pct}%)`);
  console.log(`  Done: ${done} | In Progress: ${inProgress} | Todo: ${todo}`);

  if (data.tasks && data.tasks.length) {
    const tasksDone = data.tasks.filter(t => t.done).length;
    console.log(`  Tasks: ${tasksDone}/${data.tasks.length} completed`);
  }

  // Show next actionable PRs (todo PRs whose dependencies are all done)
  const doneIds = new Set(data.prs.filter(p => p.status === 'done').map(p => p.id));
  const ready = data.prs.filter(p =>
    p.status === 'todo' && p.dependsOn.every(dep => doneIds.has(dep))
  );
  if (ready.length) {
    console.log(`\n  Ready to start:`);
    for (const pr of ready) {
      console.log(`    ${pr.id}: ${pr.title}`);
    }
  }
}

const parsed = parseArgs(process.argv);
if (!parsed) process.exit(1);

const { dataFile, command, positional, flags } = parsed;

if (!fs.existsSync(dataFile)) {
  console.error(`File not found: ${dataFile}`);
  process.exit(1);
}

switch (command) {
  case 'update':
    if (!positional[0]) { console.error('PR ID required'); process.exit(1); }
    cmdUpdate(dataFile, positional[0], flags);
    break;
  case 'match':
    cmdMatch(dataFile, flags);
    break;
  case 'task':
    if (!positional[0]) { console.error('Task index required'); process.exit(1); }
    cmdTask(dataFile, positional[0], flags);
    break;
  case 'summary':
    cmdSummary(dataFile);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    printUsage();
}
