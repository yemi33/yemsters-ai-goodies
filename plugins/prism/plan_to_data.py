#!/usr/bin/env python3
"""Convert a markdown plan file into data.json for the PR Dependency Visualizer."""

import argparse
import json
import re
import sys
from pathlib import Path


PR_ID_RE = re.compile(r"(PR-[A-Za-z0-9_-]+)")
CHECKBOX_RE = re.compile(r"^\s*[-*+]\s*\[(?P<done>[ xX])\]\s*(?P<text>.+)$")
LIST_ITEM_RE = re.compile(r"^\s*(?:[-*+]|\\d+\\.)\s+(?P<text>.+)$")
HEADING_RE = re.compile(r"^#{2,6}\s+(?P<title>.+)$")
PR_HEADING_RE = re.compile(
    r"^#{3,6}\s*(?P<id>PR-[A-Za-z0-9_-]+)\s*(?:[:\-]\s*)?(?P<title>.*)$"
)

PR_SECTION_NAMES = {"prs", "pr", "pull requests", "pull request", "pr list"}
TODO_SECTION_NAMES = {"todos", "todo", "tasks", "task list"}
DEFAULT_REFRESH_SECONDS = 8


def slugify(text):
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "task"


def normalize_key(key):
    return re.sub(r"[^a-z0-9]", "", key.lower())


def parse_dependency_ids(value):
    if not value:
        return []
    ids = PR_ID_RE.findall(value)
    if ids:
        return ids
    parts = re.split(r"[;|/]+|\s+", value)
    return [part.strip() for part in parts if part.strip()]


def parse_metadata(text):
    match = re.search(r"\(([^)]*)\)\s*$", text) or re.search(r"\[([^]]*)\]\s*$", text)
    if not match:
        return {}, text.strip()

    meta_blob = match.group(1)
    cleaned = text[: match.start()].strip()
    meta = {}
    for part in meta_blob.split(","):
        if "=" in part:
            key, value = part.split("=", 1)
        elif ":" in part:
            key, value = part.split(":", 1)
        else:
            continue
        meta[normalize_key(key)] = value.strip()
    return meta, cleaned


def apply_metadata(pr, meta):
    for raw_key, value in meta.items():
        if raw_key in {"dependson", "depends", "deps"}:
            pr["dependsOn"] = parse_dependency_ids(value)
        elif raw_key == "reviewcommand":
            pr["reviewCommand"] = value
        elif raw_key == "status":
            pr["status"] = value
        elif raw_key == "owner":
            pr["owner"] = value
        elif raw_key == "url":
            pr["url"] = value
        elif raw_key == "description":
            pr["description"] = value
    return pr


def parse_pr_line(text, fallback_id):
    meta, cleaned = parse_metadata(text)
    id_match = PR_ID_RE.search(cleaned)
    if id_match:
        pr_id = id_match.group(1)
        title = cleaned.replace(pr_id, "", 1).strip(" :-")
    else:
        pr_id = fallback_id
        title = cleaned
    if not title:
        title = pr_id

    pr = {
        "id": pr_id,
        "title": title,
        "status": "todo",
        "dependsOn": [],
    }
    pr = apply_metadata(pr, meta)
    return pr


def parse_task_line(text, index):
    label = text.strip()
    pr_match = PR_ID_RE.search(label)
    pr_id = pr_match.group(1) if pr_match else ""
    task_id = f"task-{index}-{slugify(label)}"
    task = {"id": task_id, "label": label}
    if pr_id:
        task["prId"] = pr_id
    return task


def parse_markdown(lines):
    prs = []
    tasks = []
    todo_candidates = []
    current_section = ""
    pr_counter = 1

    for line in lines:
        heading_match = HEADING_RE.match(line)
        if heading_match:
            current_section = heading_match.group("title").strip().lower()
            continue

        pr_heading_match = PR_HEADING_RE.match(line)
        if pr_heading_match:
            pr_id = pr_heading_match.group("id")
            title = pr_heading_match.group("title").strip() or pr_id
            pr = {
                "id": pr_id,
                "title": title,
                "status": "todo",
                "dependsOn": [],
            }
            prs.append(pr)
            continue

        checkbox_match = CHECKBOX_RE.match(line)
        if checkbox_match:
            tasks.append(parse_task_line(checkbox_match.group("text"), len(tasks) + 1))
            continue

        list_match = LIST_ITEM_RE.match(line)
        if not list_match:
            continue

        text = list_match.group("text").strip()
        if not text:
            continue

        if current_section in PR_SECTION_NAMES:
            prs.append(parse_pr_line(text, f"PR-{pr_counter}"))
            pr_counter += 1
            continue

        if current_section in TODO_SECTION_NAMES:
            todo_candidates.append(text)
            continue

        if PR_ID_RE.search(text):
            prs.append(parse_pr_line(text, f"PR-{pr_counter}"))
            pr_counter += 1

    if not prs and todo_candidates:
        for text in todo_candidates:
            prs.append(parse_pr_line(text, f"PR-{pr_counter}"))
            pr_counter += 1

    return prs, tasks


def load_refresh_seconds(output_path, override):
    if override is not None:
        return override
    if output_path.exists():
        try:
            existing = json.loads(output_path.read_text(encoding="utf-8"))
            if isinstance(existing, dict) and "refreshSeconds" in existing:
                return existing["refreshSeconds"]
        except json.JSONDecodeError:
            pass
    return DEFAULT_REFRESH_SECONDS


def build_payload(prs, tasks, refresh_seconds):
    return {
        "refreshSeconds": refresh_seconds,
        "prs": prs,
        "tasks": tasks,
    }


def parse_args():
    parser = argparse.ArgumentParser(
        description="Convert a markdown plan file into pr-visualizer data.json"
    )
    parser.add_argument(
        "--plan",
        default="plan.md",
        help="Path to the markdown plan file.",
    )
    parser.add_argument(
        "--output",
        default=str(Path(__file__).parent / "data.json"),
        help="Path to write data.json.",
    )
    parser.add_argument(
        "--refresh",
        type=int,
        default=None,
        help="Override refreshSeconds in the output.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    plan_path = Path(args.plan)
    output_path = Path(args.output)
    if not plan_path.exists():
        raise SystemExit(f"Plan file not found: {plan_path}")

    lines = plan_path.read_text(encoding="utf-8").splitlines()
    prs, tasks = parse_markdown(lines)
    refresh_seconds = load_refresh_seconds(output_path, args.refresh)

    payload = build_payload(prs, tasks, refresh_seconds)
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
