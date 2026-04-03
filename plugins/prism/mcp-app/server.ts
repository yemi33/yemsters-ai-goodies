console.log("Starting PRism MCP App server (HTTP)...");

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import express from "express";
import { createPrismServer } from "./prism-server.js";

const server = createPrismServer();

const expressApp = express();
expressApp.use(cors());
expressApp.use(express.json());

expressApp.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on("close", () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const PORT = parseInt(process.env.PORT || "3001", 10);

expressApp.listen(PORT, () => {
  console.log(`PRism MCP App server listening on http://localhost:${PORT}/mcp`);
});
