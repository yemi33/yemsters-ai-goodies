#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ProxyManager } from "./proxy.js";
import { TrafficStore } from "./store.js";
import { registerTools } from "./tools.js";

async function main(): Promise<void> {
  const store = new TrafficStore();
  const proxy = new ProxyManager(store);

  const server = new McpServer({
    name: "http-toolkit-mcp",
    version: "1.0.0",
  });

  registerTools(server, proxy, store);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Graceful shutdown
  process.on("SIGINT", async () => {
    if (proxy.isRunning) {
      await proxy.stop();
    }
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    if (proxy.isRunning) {
      await proxy.stop();
    }
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
