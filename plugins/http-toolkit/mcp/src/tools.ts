import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProxyManager } from "./proxy.js";
import { TrafficStore } from "./store.js";

export function registerTools(server: McpServer, proxy: ProxyManager, store: TrafficStore): void {

  // start_proxy
  server.tool(
    "start_proxy",
    "Start the HTTP/HTTPS intercepting proxy. Returns the proxy URL and CA certificate path.",
    {
      port: z.number().int().min(1).max(65535).default(8080).describe("Port to listen on"),
      https: z.boolean().default(true).describe("Enable HTTPS interception"),
    },
    async ({ port, https: httpsEnabled }) => {
      try {
        const result = await proxy.start(port, httpsEnabled);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              status: "started",
              proxyUrl: result.proxyUrl,
              caCertPath: result.caCertPath,
              message: `Proxy started on ${result.proxyUrl}. ` +
                (result.caCertPath
                  ? `CA certificate at: ${result.caCertPath}. Install this cert on your device to intercept HTTPS.`
                  : "HTTPS interception disabled."),
            }, null, 2),
          }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // stop_proxy
  server.tool(
    "stop_proxy",
    "Stop the running proxy.",
    {},
    async () => {
      try {
        await proxy.stop();
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ status: "stopped" }) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // list_requests
  server.tool(
    "list_requests",
    "List captured HTTP requests with optional filtering by method, URL pattern, status code, or time range.",
    {
      method: z.string().optional().describe("Filter by HTTP method (e.g., GET, POST)"),
      urlPattern: z.string().optional().describe("Regex pattern to match against URLs"),
      statusCode: z.number().int().optional().describe("Filter by response status code"),
      since: z.string().optional().describe("ISO timestamp - only show requests after this time"),
      limit: z.number().int().min(1).max(500).default(50).describe("Maximum results to return"),
      offset: z.number().int().min(0).default(0).describe("Offset for pagination"),
    },
    async (params) => {
      try {
        const results = store.list(params);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ count: results.length, requests: results }, null, 2),
          }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // get_request_detail
  server.tool(
    "get_request_detail",
    "Get full details of a captured HTTP request including headers and body.",
    {
      id: z.string().describe("The request ID from list_requests"),
    },
    async ({ id }) => {
      const entry = store.get(id);
      if (!entry) {
        return {
          content: [{ type: "text" as const, text: `Error: Request ${id} not found` }],
          isError: true,
        };
      }

      const detail: Record<string, unknown> = {
        id: entry.id,
        method: entry.request.method,
        url: entry.request.url,
        headers: entry.request.headers,
        timestamp: entry.request.timestamp,
        contentType: entry.request.contentType,
        bodySize: entry.request.bodySize,
        isBinary: entry.request.isBinary,
      };

      if (entry.request.isBinary) {
        detail.body = `[Binary content: ${entry.request.contentType}, ${entry.request.bodySize} bytes]`;
      } else {
        detail.body = entry.request.body;
      }

      return {
        content: [{ type: "text" as const, text: JSON.stringify(detail, null, 2) }],
      };
    }
  );

  // get_response_detail
  server.tool(
    "get_response_detail",
    "Get full details of a captured HTTP response including headers and body.",
    {
      id: z.string().describe("The request ID from list_requests"),
    },
    async ({ id }) => {
      const entry = store.get(id);
      if (!entry) {
        return {
          content: [{ type: "text" as const, text: `Error: Request ${id} not found` }],
          isError: true,
        };
      }
      if (!entry.response) {
        return {
          content: [{ type: "text" as const, text: `Error: No response captured yet for ${id}` }],
          isError: true,
        };
      }

      const resp = entry.response;
      const detail: Record<string, unknown> = {
        id: entry.id,
        statusCode: resp.statusCode,
        statusMessage: resp.statusMessage,
        headers: resp.headers,
        timestamp: resp.timestamp,
        contentType: resp.contentType,
        bodySize: resp.bodySize,
        isBinary: resp.isBinary,
        duration: entry.duration,
      };

      if (resp.isBinary) {
        detail.body = `[Binary content: ${resp.contentType}, ${resp.bodySize} bytes]`;
      } else {
        detail.body = resp.body;
      }

      return {
        content: [{ type: "text" as const, text: JSON.stringify(detail, null, 2) }],
      };
    }
  );

  // search_traffic
  server.tool(
    "search_traffic",
    "Search across captured traffic using regex. Can search URLs, request/response bodies, and headers.",
    {
      pattern: z.string().describe("Regex pattern to search for"),
      searchIn: z.enum(["url", "request_body", "response_body", "request_headers", "response_headers", "all"])
        .default("all")
        .describe("Where to search"),
      limit: z.number().int().min(1).max(200).default(20).describe("Maximum results"),
    },
    async (params) => {
      try {
        const results = store.search(params);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ count: results.length, matches: results }, null, 2),
          }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // get_traffic_stats
  server.tool(
    "get_traffic_stats",
    "Get statistics about captured traffic: totals, method distribution, status codes, response times, top domains.",
    {},
    async () => {
      const stats = store.getStats();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(stats, null, 2) }],
      };
    }
  );

  // clear_traffic
  server.tool(
    "clear_traffic",
    "Clear all captured traffic from memory.",
    {},
    async () => {
      const count = store.clear();
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ status: "cleared", entriesRemoved: count }),
        }],
      };
    }
  );
}
