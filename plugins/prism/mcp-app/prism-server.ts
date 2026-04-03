import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const dashboardResourceUri = "ui://prism/dashboard.html";

export function createPrismServer(): McpServer {
  const server = new McpServer({
    name: "PRism",
    version: "1.0.0",
  });

  // --- Tool: prism-dashboard ---
  registerAppTool(
    server,
    "prism-dashboard",
    {
      title: "PRism Dashboard",
      description:
        "Display the PRism PR dependency tracker dashboard inline. Pass PR data as JSON to visualize stacked PR dependencies, completion status, and progress. The data should follow the PRism format with a prs array (id, title, status, dependsOn, wave) and optional tasks array.",
      inputSchema: {
        data: z
          .string()
          .describe(
            'PRism data as a JSON string. Must contain "prs" array with objects having id, title, status (todo|in-progress|done), dependsOn (array of PR IDs), and optionally wave, description, url, risk. Can also include "tasks" array and "refreshSeconds" number.',
          ),
      },
      _meta: { ui: { resourceUri: dashboardResourceUri } },
    },
    async ({ data }) => {
      try {
        const parsed = JSON.parse(data);
        if (!parsed.prs || !Array.isArray(parsed.prs)) {
          return {
            content: [
              { type: "text" as const, text: 'Invalid data: missing "prs" array' },
            ],
            isError: true,
          };
        }
        return {
          content: [{ type: "text" as const, text: JSON.stringify(parsed) }],
        };
      } catch {
        return {
          content: [
            { type: "text" as const, text: "Invalid JSON" },
          ],
          isError: true,
        };
      }
    },
  );

  // --- Tool: prism-update-pr (app-only, called by the dashboard UI) ---
  registerAppTool(
    server,
    "prism-update-pr",
    {
      title: "Update PR Status",
      description:
        "Update a PR's status or URL in PRism data. Returns the updated data JSON.",
      inputSchema: {
        data: z.string().describe("Current PRism data as JSON string"),
        prId: z.string().describe("PR ID to update (e.g. PR-1)"),
        status: z.enum(["todo", "in-progress", "done"]).optional().describe("New status"),
        url: z.string().optional().describe("PR URL to set"),
      },
      _meta: {
        ui: {
          resourceUri: dashboardResourceUri,
          visibility: ["app"],
        },
      },
    },
    async ({ data, prId, status, url }) => {
      try {
        const parsed = JSON.parse(data);
        const pr = parsed.prs?.find(
          (p: { id: string }) => p.id.toLowerCase() === prId.toLowerCase(),
        );
        if (!pr) {
          return { content: [{ type: "text" as const, text: `PR "${prId}" not found in data` }] };
        }
        if (status) pr.status = status;
        if (url) pr.url = url;
        return { content: [{ type: "text" as const, text: JSON.stringify(parsed, null, 2) }] };
      } catch {
        return { content: [{ type: "text" as const, text: "Invalid JSON data" }] };
      }
    },
  );

  // --- Tool: prism-summary (no UI, text-only for CLI) ---
  server.tool(
    "prism-summary",
    "Get a text summary of PRism progress — how many PRs are done, in progress, and which are ready to start.",
    {
      data: z.string().describe("PRism data as JSON string"),
    },
    async ({ data }) => {
      try {
        const parsed = JSON.parse(data);
        const prs = parsed.prs || [];
        const total = prs.length;
        const done = prs.filter((p: { status: string }) => p.status === "done").length;
        const inProgress = prs.filter((p: { status: string }) => p.status === "in-progress").length;
        const todo = total - done - inProgress;
        const pct = total ? Math.round((done / total) * 100) : 0;

        const doneIds = new Set(
          prs.filter((p: { status: string }) => p.status === "done").map((p: { id: string }) => p.id),
        );
        const ready = prs.filter(
          (p: { status: string; dependsOn: string[] }) =>
            p.status === "todo" && p.dependsOn.every((dep: string) => doneIds.has(dep)),
        );

        let summary = `PRism: ${done}/${total} done (${pct}%)\n`;
        summary += `  Done: ${done} | In Progress: ${inProgress} | Todo: ${todo}\n`;

        if (parsed.tasks?.length) {
          const tasksDone = parsed.tasks.filter((t: { done: boolean }) => t.done).length;
          summary += `  Tasks: ${tasksDone}/${parsed.tasks.length} completed\n`;
        }

        if (ready.length) {
          summary += `\nReady to start:\n`;
          for (const pr of ready) {
            summary += `  ${pr.id}: ${pr.title}\n`;
          }
        }

        return { content: [{ type: "text" as const, text: summary }] };
      } catch {
        return { content: [{ type: "text" as const, text: "Invalid JSON data" }] };
      }
    },
  );

  // --- Resource: dashboard HTML (ui:// scheme) ---
  registerAppResource(
    server,
    "PRism Dashboard",
    dashboardResourceUri,
    {
      description: "Interactive inline dashboard for tracking stacked PR dependencies",
    },
    async () => {
      const html = await fs.readFile(path.join(__dirname, "dist", "mcp-app.html"), "utf-8");
      return {
        contents: [{ uri: dashboardResourceUri, mimeType: RESOURCE_MIME_TYPE, text: html }],
      };
    },
  );

  return server;
}
