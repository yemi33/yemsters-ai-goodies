# HTTP Toolkit MCP Server

A standalone MCP server that runs a transparent HTTPS proxy and exposes tools to inspect captured traffic. Powered by [mockttp](https://github.com/httptoolkit/mockttp).

## Installation

```bash
npm install
npm run build
```

## Claude Code Configuration

Add to your `.mcp.json` or `.claude/settings.json`:

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

## Usage

1. `start_proxy` — starts the proxy (default port 8080, HTTPS enabled)
2. Configure your device/browser to use `<your-ip>:8080` as proxy
3. Generate traffic
4. `list_requests`, `get_request_detail`, `get_response_detail`, `search_traffic`
5. `clear_traffic` / `stop_proxy` when done

## CA Certificate (HTTPS)

Auto-generated on first run at `~/.http-toolkit-mcp/ca.pem`. Install on clients to trust HTTPS interception.

**Android:** `adb push ~/.http-toolkit-mcp/ca.pem /data/local/tmp/ca.pem` then install via Settings > Security > CA certificate.

**Windows:** Double-click `ca.pem` → Install → Trusted Root Certification Authorities.

**macOS:** Double-click `ca.pem` → Keychain Access → Always Trust.

For Android apps targeting API 24+, the app must opt in via `network_security_config.xml`:
```xml
<debug-overrides>
  <trust-anchors><certificates src="user" /></trust-anchors>
</debug-overrides>
```

## Tools

| Tool | Description |
|------|-------------|
| `start_proxy` | Start the intercepting proxy |
| `stop_proxy` | Stop the proxy |
| `list_requests` | List/filter captured requests |
| `get_request_detail` | Full request details |
| `get_response_detail` | Full response details |
| `search_traffic` | Regex search across traffic |
| `get_traffic_stats` | Traffic statistics |
| `clear_traffic` | Clear captured traffic |

## Limits

- Max 10,000 entries (oldest evicted when full)
- Bodies truncated at 100KB
- Binary content shows type and size only
