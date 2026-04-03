---
name: http-toolkit-inspect
description: Use when working with the http-toolkit MCP to intercept, capture, or inspect HTTP/HTTPS network traffic. Invoke this skill whenever the user wants to set up a proxy to capture traffic, search through captured requests or responses, debug API calls, analyze what an app is sending to a server, check for leaked tokens or credentials in network traffic, or investigate slow or failing requests. Use this even if the user just says "see what my app is sending", "capture traffic", or "check the network" — the setup workflow matters and this skill covers it end-to-end.
---

# HTTP Toolkit

The `http-toolkit` MCP runs a local HTTPS-intercepting proxy and exposes captured traffic for querying. Most workflows have two phases: **starting the proxy**, then **querying what was captured**.

## Phase 1: Start the proxy

Call `start_proxy` to start the proxy. It returns a `proxyUrl` and a `caCertPath`.

```
start_proxy(port?, https?)
→ { proxyUrl: "http://127.0.0.1:8080", caCertPath: "~/.http-toolkit-mcp/ca.pem" }
```

Tell the user:
1. Configure their device or browser to route traffic through the returned `proxyUrl`
2. Install the CA certificate at `caCertPath` to intercept HTTPS — without it, HTTPS connections will fail rather than be intercepted

Once they've configured their client, ask them to trigger the traffic they want to capture, then move to Phase 2.

## Phase 2: Inspect captured traffic

### List and filter requests

Call `list_requests` to see what was captured. Results come back newest-first.

```
list_requests(method?, urlPattern?, statusCode?, since?, limit?, offset?)
→ { count, requests: [{ id, method, url, statusCode, timestamp, contentType, bodySize }] }
```

`urlPattern` is a case-insensitive regex — use it to narrow to a specific domain or endpoint path.

### Get full request or response details

```
get_request_detail(id)
→ { id, method, url, headers, body, timestamp, contentType, bodySize, isBinary }

get_response_detail(id)
→ { id, statusCode, statusMessage, headers, body, timestamp, contentType, bodySize, isBinary, duration }
```

Binary bodies (images, zips, etc.) come back as `[Binary content: <type>, <N> bytes]`. `duration` is milliseconds from request to response.

### Search across all traffic

When hunting for something specific — a token, an error string, a parameter — call `search_traffic`:

```
search_traffic(pattern, searchIn?, limit?)
→ { count, matches: [{ id, method, url, statusCode, timestamp, contentType, bodySize, matchContext }] }
```

`searchIn` options: `"url"`, `"request_body"`, `"response_body"`, `"request_headers"`, `"response_headers"`, `"all"` (default). `matchContext` shows a snippet of where the match landed.

### Get aggregate stats

Call `get_traffic_stats` when the user wants an overview or doesn't know where to start:

```
get_traffic_stats()
→ { totalRequests, byMethod, byStatusCode, averageResponseTimeMs, topDomains }
```

### Housekeeping

```
stop_proxy()    // stop the proxy when done
clear_traffic() // wipe captured entries to start a clean session
```

## Common workflow patterns

**"What is my app sending to the server?"**
Call `start_proxy` → user triggers app → call `list_requests(urlPattern: "yourdomain\\.com")` → call `get_request_detail` on anything interesting.

**"Why is this request returning an error?"**
Call `list_requests(statusCode: 401)` (or 500, etc.) → call `get_response_detail` to read the error body and headers.

**"Is my app leaking credentials?"**
Call `search_traffic("Bearer |Authorization|api.?key", searchIn: "request_headers")` → call `get_request_detail` on matches going to unexpected domains.

**"My app feels slow — what's taking long?"**
Call `get_traffic_stats()` for average response times and top domains → call `list_requests` to drill in, check `duration` on individual responses.

**"I want a clean capture"**
Call `clear_traffic()` → user relaunches their flow → call `list_requests()`.
