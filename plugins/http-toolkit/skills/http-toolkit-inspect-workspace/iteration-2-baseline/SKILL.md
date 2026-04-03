---
name: http-toolkit-inspect
description: Use when working with the http-toolkit MCP to intercept, capture, or inspect HTTP/HTTPS network traffic. Invoke this skill whenever the user wants to set up a proxy to capture mobile app or browser traffic, search through captured requests or responses, debug API calls, analyze what an app is sending to a server, check for leaked tokens or credentials in network traffic, or investigate slow or failing requests. Use this even if the user just says "see what my app is sending", "capture traffic", or "check the network" — the setup workflow matters and this skill covers it end-to-end.
---

# HTTP Toolkit

The `http-toolkit` MCP runs a local HTTPS-intercepting proxy and exposes captured traffic for querying. Most workflows have two phases: **starting the proxy and directing traffic through it**, then **querying what was captured**.

## Phase 1: Start the proxy

If the proxy isn't already running, start it:

```
start_proxy(port?, https?)
→ { proxyUrl: "http://127.0.0.1:8080", caCertPath: "/Users/.../.http-toolkit-mcp/ca.pem" }
```

After starting, tell the user two things:

1. **Configure their device or browser** to use the proxy URL (`http://127.0.0.1:<port>`)
2. **Install the CA certificate** at `caCertPath` if they need HTTPS interception — without it, HTTPS traffic will be blocked rather than intercepted:
   - **macOS**: double-click the .pem → Keychain Access → mark as Always Trust
   - **iOS**: Settings → General → VPN & Device Management → trust the profile
   - **Android**: Settings → Security → Install certificate; for apps targeting API 24+, the app also needs `<certificates src="user" />` in its `network_security_config.xml`
   - **Browsers**: import the cert into the browser's certificate store (Chrome/Firefox each have their own)

Once the user has configured their device, ask them to trigger the traffic they want to capture, then move to Phase 2.

## Phase 2: Inspect captured traffic

### List and filter requests

```
list_requests(method?, urlPattern?, statusCode?, since?, limit?, offset?)
→ { count, requests: [{ id, method, url, statusCode, timestamp, contentType, bodySize }] }
```

`urlPattern` is a case-insensitive regex — use it to narrow to a specific domain or endpoint path. Results come back newest-first.

### Get full request or response details

```
get_request_detail(id)
→ { id, method, url, headers, body, timestamp, contentType, bodySize, isBinary }

get_response_detail(id)
→ { id, statusCode, statusMessage, headers, body, timestamp, contentType, bodySize, isBinary, duration }
```

Binary bodies (images, video, zips, PDFs) come back as `[Binary content: <type>, <N> bytes]` rather than raw bytes. The `duration` field on responses is milliseconds from request sent to response received.

### Search across all traffic

When you're hunting for something specific — a token, an error string, a parameter value — search is faster than paging through list results:

```
search_traffic(pattern, searchIn?, limit?)
→ { count, matches: [{ id, method, url, statusCode, timestamp, contentType, bodySize, matchContext }] }
```

`searchIn` options: `"url"`, `"request_body"`, `"response_body"`, `"request_headers"`, `"response_headers"`, `"all"` (default). `matchContext` is a snippet showing where in the field the match landed.

### Get aggregate stats

```
get_traffic_stats()
→ { totalRequests, byMethod, byStatusCode, averageResponseTimeMs, topDomains }
```

Good first call when the user wants an overview or doesn't know where to start.

### Housekeeping

```
stop_proxy()    // stop the proxy when done
clear_traffic() // wipe all captured entries to start a clean capture session
```

## Common workflow patterns

**"What is my app sending to the server?"**
Start proxy → user triggers app actions → `list_requests(urlPattern: "yourdomain\\.com")` → `get_request_detail` on anything interesting.

**"Why is this request returning an error?"**
`list_requests(statusCode: 401)` (or 500, etc.) → `get_response_detail` to read the error body and headers.

**"Is my app leaking credentials?"**
`search_traffic("Bearer |Authorization|api.?key", searchIn: "request_headers")` → inspect matching requests.

**"My app feels slow — what's taking long?"**
`get_traffic_stats()` for average response times and top domains → `list_requests` to drill into specific endpoints, check `duration` on individual responses.

**"I want to capture a fresh session cleanly"**
`clear_traffic()` → user relaunches app/flow → `list_requests()` to see only the new session's traffic.
