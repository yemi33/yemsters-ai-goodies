#!/usr/bin/env python3
"""Convert a markdown plan file into data.json for the PR Dependency Visualizer."""

import argparse
import json
import re
import sys
from pathlib import Path


def parse_plan(plan_text: str) -> dict:
    prs = []
    tasks = []

    # Try to find PR Breakdown section
    pr_section = re.search(
        r"## PR Breakdown(.*?)(?=\n## |\Z)", plan_text, re.DOTALL
    )

    if pr_section:
        content = pr_section.group(1)
        # Parse wave headers and PR table rows
        current_wave = ""
        current_deps = []
        wave_prs = {}  # wave_name -> list of PR ids

        for line in content.split("\n"):
            # Wave headers
            wave_match = re.match(
                r"###\s+(Wave\s+\S+.*?)(?:\s*\(.*?\))?\s*$", line, re.IGNORECASE
            )
            if wave_match:
                current_wave = wave_match.group(1).strip()
                # Parse dependency info from wave header
                dep_match = re.search(
                    r"\b(?:after|Sequential after|depends on)\s+(.*?)(?:\)|$)",
                    line,
                    re.IGNORECASE,
                )
                if dep_match:
                    dep_text = dep_match.group(1)
                    # Extract PR numbers from dependency text
                    current_deps = re.findall(r"PR\s*(\d+)", dep_text)
                else:
                    current_deps = []
                continue

            # Table rows with PR info
            pr_match = re.match(
                r"\|\s*\*\*PR\s*(\d+)\*\*\s*\|.*?\|\s*(.*?)\s*\|", line
            )
            if pr_match:
                pr_id = f"PR-{pr_match.group(1)}"
                desc = pr_match.group(2).strip()
                # Remove markdown formatting
                desc = re.sub(r"\*\*|`", "", desc)

                # Extract risk from the row
                risk_match = re.search(r"\|\s*(LOW|MEDIUM|HIGH)\s*\|", line, re.IGNORECASE)
                risk = risk_match.group(1).upper() if risk_match else ""

                # Extract step info
                step_match = re.search(r"\|\s*Step\s*([\d\s+]+)\s*\|", line)
                steps = step_match.group(1).strip() if step_match else ""

                # Build depends_on from wave dependencies and inline deps
                depends_on = [f"PR-{d}" for d in current_deps]

                # Check for inline dependency markers
                inline_dep = re.search(r"dependsOn[=:]\s*(PR-[\d,\s]+)", line)
                if inline_dep:
                    depends_on.extend(
                        d.strip()
                        for d in inline_dep.group(1).split(",")
                    )

                pr_obj = {
                    "id": pr_id,
                    "title": desc,
                    "status": "todo",
                    "dependsOn": depends_on,
                    "wave": current_wave,
                }
                if risk:
                    pr_obj["risk"] = risk
                if steps:
                    pr_obj["description"] = f"Step {steps}"

                prs.append(pr_obj)
                wave_prs.setdefault(current_wave, []).append(pr_id)
                continue

        # If table parsing found nothing, try list-based format
        if not prs:
            for line in content.split("\n"):
                list_match = re.match(
                    r"\s*[-*]\s*\*?\*?PR[- ]?(\d+)\*?\*?[:\s]+(.*)", line
                )
                if list_match:
                    pr_id = f"PR-{list_match.group(1)}"
                    rest = list_match.group(2)
                    # Parse metadata in parentheses
                    meta = {}
                    meta_match = re.search(r"\((.*?)\)", rest)
                    if meta_match:
                        for pair in meta_match.group(1).split(","):
                            if "=" in pair:
                                k, v = pair.split("=", 1)
                                meta[k.strip()] = v.strip()
                        rest = rest[: meta_match.start()].strip()

                    depends_on = []
                    if "dependsOn" in meta:
                        depends_on = [
                            d.strip() for d in meta["dependsOn"].split(",")
                        ]

                    prs.append(
                        {
                            "id": pr_id,
                            "title": rest.strip().rstrip(")").strip(),
                            "status": meta.get("status", "todo"),
                            "dependsOn": depends_on + [f"PR-{d}" for d in current_deps],
                            "owner": meta.get("owner", ""),
                            "url": meta.get("url", ""),
                        }
                    )

    # If still no PRs found, look for dependency chain text
    if not prs:
        chain_match = re.search(r"Dependency chain[:\s]*(.*)", plan_text)
        if chain_match:
            print(f"Warning: No PR table found but dependency chain detected: {chain_match.group(1)}", file=sys.stderr)

    # Parse task checklists
    for m in re.finditer(r"- \[([ x])\]\s+(.*?)(?:\(PR-(\d+)\))?$", plan_text, re.MULTILINE):
        done = m.group(1) == "x"
        title = m.group(2).strip()
        linked_pr = f"PR-{m.group(3)}" if m.group(3) else ""
        tasks.append(
            {
                "title": title,
                "done": done,
                "linkedPr": linked_pr,
            }
        )

    return {"prs": prs, "tasks": tasks}


def main():
    parser = argparse.ArgumentParser(description="Convert plan markdown to data.json")
    parser.add_argument("--plan", required=True, help="Path to the markdown plan file")
    parser.add_argument(
        "--output",
        default=str(Path(__file__).parent / "data.json"),
        help="Output path for data.json",
    )
    parser.add_argument(
        "--refresh", type=int, default=30, help="Dashboard refresh interval in seconds"
    )
    args = parser.parse_args()

    plan_path = Path(args.plan)
    if not plan_path.exists():
        print(f"Error: Plan file not found: {plan_path}", file=sys.stderr)
        sys.exit(1)

    plan_text = plan_path.read_text(encoding="utf-8")
    data = parse_plan(plan_text)
    data["refreshSeconds"] = args.refresh

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    print(f"Generated {output_path}")
    print(f"  PRs: {len(data['prs'])}")
    print(f"  Tasks: {len(data['tasks'])}")
    for pr in data["prs"]:
        deps = ", ".join(pr["dependsOn"]) if pr["dependsOn"] else "none"
        print(f"    {pr['id']}: {pr['title']} (deps: {deps})")


if __name__ == "__main__":
    main()
