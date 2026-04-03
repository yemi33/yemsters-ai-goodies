---
name: http-toolkit-inspect
description: Use when inspecting captured HTTP/HTTPS network traffic — listing requests, searching by URL or body content, reading request/response details, or getting traffic stats.
---

# HTTP Toolkit Inspect

Reference for the `http-toolkit` MCP tools that expose captured network traffic.

## Tools

### list_requests

List captured requests, with optional filters.

```
list_requests(
  urlPattern?: string,   // regex filter on URL
  method?: string,       // GET, POST, etc.
  statusCode?: number,
  since?: string,        // ISO 8601 timestamp
  limit?: number,        // default 50
  offset?: number
)
```

Returns: array of `{ id, method, url, status, timestamp, content-type, body_size }`.

### get_request_detail

Get the full request for a captured traffic entry.

```
get_request_detail(id: string)
```

Returns: `{ method, url, headers, body, timing }`.

### get_response_detail

Get the full response for a captured traffic entry.

```
get_response_detail(id: string)
```

Returns: `{ status, headers, body, timing }`.

### search_traffic

Search across captured traffic using a regex pattern.

```
search_traffic(
  pattern: string,
  searchIn?: "url"
           | "request_body"
           | "response_body"
           | "request_headers"
           | "response_headers"
           | "all"            // default
  limit?: number              // default 20
)
```

Returns: matching request summaries with match highlights.

### get_traffic_stats

Get aggregate statistics for all captured traffic.

```
get_traffic_stats()
```

Returns: `{ total_requests, by_method, status_distribution, avg_response_time_ms, top_domains }`.

## Example

Find all POST requests to an auth endpoint and inspect the first one:

```
list_requests(urlPattern: "/auth/token", method: "POST")
// → [{ id: "req_42", url: "https://api.example.com/auth/token", status: 200, ... }]

get_request_detail("req_42")
// → { method: "POST", url: "...", headers: {...}, body: "grant_type=client_credentials&..." }

get_response_detail("req_42")
// → { status: 200, headers: {...}, body: '{"access_token":"eyJ..."}' }
```
