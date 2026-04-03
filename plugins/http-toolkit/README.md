# HTTP Toolkit Plugin

HTTPS-intercepting proxy MCP server for inspecting network traffic from mobile apps, browsers, and other HTTP clients.

## What it does

- Runs a local HTTPS proxy (powered by [mockttp](https://github.com/httptoolkit/mockttp))
- Captures all HTTP/HTTPS traffic passing through the proxy
- Exposes tools to list, search, inspect, and analyze intercepted requests/responses
- Auto-generates CA certificates for HTTPS interception

## Tools

| Tool | Description |
|------|-------------|
| `start_proxy` | Start the intercepting proxy on a given port |
| `stop_proxy` | Stop the proxy |
| `list_requests` | List captured requests with filters (method, URL, status, time) |
| `get_request_detail` | Get full request headers and body |
| `get_response_detail` | Get full response headers and body |
| `search_traffic` | Regex search across URLs, headers, and bodies |
| `get_traffic_stats` | Aggregate stats: counts, status codes, latency, top domains |
| `clear_traffic` | Clear all captured traffic |

## Skills

### `http-toolkit-inspect`
Guides network inspection workflows — verifying Sydney request payloads, diagnosing missing option sets, checking page context decoration, and filtering traffic for Canmore commands.

## Setup

### 1. Build the MCP

```bash
cd mcp
npm install
npm run build
```

### 2. Configure Claude Code

Add to your `.claude/settings.json` or `.mcp.json`:

```json
{
  "mcpServers": {
    "http-toolkit": {
      "command": "node",
      "args": ["<path-to-plugin>/mcp/dist/index.js"]
    }
  }
}
```

### 3. Configure your device/browser

Point your device's WiFi proxy to `<your-machine-ip>:8080`.

For Android apps (API 24+), add `<debug-overrides>` with `<certificates src="user" />` to the app's `network_security_config.xml`, then install the CA from `~/.http-toolkit-mcp/ca.pem`.
