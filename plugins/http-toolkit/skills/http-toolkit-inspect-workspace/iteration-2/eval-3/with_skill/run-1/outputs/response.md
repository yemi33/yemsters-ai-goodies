# Skill Evaluation Response — http-toolkit-inspect

## Task

> "I think my app might be sending the user's auth token somewhere it shouldn't. Can you search all the captured traffic and flag any requests that include authorization headers or bearer tokens, and tell me which domains they're going to?"

---

## What I Would Say and Do (Step by Step)

---

### Step 1 — Search captured traffic for authorization headers and bearer tokens

This task maps directly to the "Is my app leaking credentials?" workflow from the skill. The proxy is assumed to already be running and traffic has been captured (the user said "search all the captured traffic," implying they've already captured some). I go straight to Phase 2.

I call `search_traffic` with a pattern that matches `Authorization` headers and `Bearer` tokens, scoped to request headers only.

**Tool call:**

```
search_traffic(
  pattern: "Bearer |Authorization|api.?key",
  searchIn: "request_headers",
  limit: 100
)
```

**Simulated response:**

```json
{
  "count": 6,
  "matches": [
    {
      "id": "req_001",
      "method": "POST",
      "url": "https://api.yourapp.com/v2/user/profile",
      "statusCode": 200,
      "timestamp": "2026-03-17T10:14:02Z",
      "contentType": "application/json",
      "bodySize": 512,
      "matchContext": "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    {
      "id": "req_002",
      "method": "GET",
      "url": "https://api.yourapp.com/v2/feed",
      "statusCode": 200,
      "timestamp": "2026-03-17T10:14:05Z",
      "contentType": "application/json",
      "bodySize": 1024,
      "matchContext": "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    {
      "id": "req_003",
      "method": "POST",
      "url": "https://analytics.thirdparty-tracker.io/collect",
      "statusCode": 204,
      "timestamp": "2026-03-17T10:14:07Z",
      "contentType": "application/json",
      "bodySize": 256,
      "matchContext": "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    {
      "id": "req_004",
      "method": "GET",
      "url": "https://logs.datadogservice.net/v1/input",
      "statusCode": 200,
      "timestamp": "2026-03-17T10:14:09Z",
      "contentType": "application/json",
      "bodySize": 128,
      "matchContext": "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    {
      "id": "req_005",
      "method": "POST",
      "url": "https://api.yourapp.com/v2/messages",
      "statusCode": 201,
      "timestamp": "2026-03-17T10:14:11Z",
      "contentType": "application/json",
      "bodySize": 320,
      "matchContext": "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    {
      "id": "req_006",
      "method": "POST",
      "url": "https://telemetry.unknown-cdn.xyz/ping",
      "statusCode": 200,
      "timestamp": "2026-03-17T10:14:14Z",
      "contentType": "text/plain",
      "bodySize": 64,
      "matchContext": "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  ]
}
```

---

### Step 2 — Get full request details for the suspicious requests

Three of the six matches go to domains that are not your app's own API (`api.yourapp.com`). I pull the full request details for each of the suspicious ones to confirm what headers and body are being sent.

**Tool call 1:**

```
get_request_detail(id: "req_003")
```

**Simulated response:**

```json
{
  "id": "req_003",
  "method": "POST",
  "url": "https://analytics.thirdparty-tracker.io/collect",
  "timestamp": "2026-03-17T10:14:07Z",
  "headers": {
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTc0MjIxMDAwMH0.signature",
    "Content-Type": "application/json",
    "User-Agent": "YourApp/3.1.0 (iOS 17.4)"
  },
  "body": "{\"event\":\"page_view\",\"page\":\"/home\",\"userId\":\"user_123\"}",
  "contentType": "application/json",
  "bodySize": 256,
  "isBinary": false
}
```

**Tool call 2:**

```
get_request_detail(id: "req_004")
```

**Simulated response:**

```json
{
  "id": "req_004",
  "method": "GET",
  "url": "https://logs.datadogservice.net/v1/input",
  "timestamp": "2026-03-17T10:14:09Z",
  "headers": {
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTc0MjIxMDAwMH0.signature",
    "Content-Type": "application/json",
    "User-Agent": "YourApp/3.1.0 (iOS 17.4)"
  },
  "body": "",
  "contentType": "application/json",
  "bodySize": 128,
  "isBinary": false
}
```

**Tool call 3:**

```
get_request_detail(id: "req_006")
```

**Simulated response:**

```json
{
  "id": "req_006",
  "method": "POST",
  "url": "https://telemetry.unknown-cdn.xyz/ping",
  "timestamp": "2026-03-17T10:14:14Z",
  "headers": {
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTc0MjIxMDAwMH0.signature",
    "Content-Type": "text/plain",
    "User-Agent": "YourApp/3.1.0 (iOS 17.4)"
  },
  "body": "ping=1&session=abc123",
  "contentType": "text/plain",
  "bodySize": 64,
  "isBinary": false
}
```

---

### Step 3 — Tell the user what I found

---

**What I would say to the user:**

I found **6 requests** in the captured traffic that include an `Authorization: Bearer` header. Here's the breakdown by domain:

**Your own API (expected):**
- `api.yourapp.com` — 3 requests (POST /v2/user/profile, GET /v2/feed, POST /v2/messages)

These look normal — your app is authenticating with its own backend.

**Third-party domains receiving your auth token (potentially unexpected):**

| Domain | Request | Notes |
|---|---|---|
| `analytics.thirdparty-tracker.io` | POST /collect | Analytics/tracking endpoint. The full user Bearer token is attached. This is likely not intentional — analytics SDKs typically use their own API keys, not your user's auth token. |
| `logs.datadogservice.net` | GET /v1/input | Looks like a logging or monitoring service. Worth confirming whether this domain is the real Datadog (`api.datadoghq.com`) — this one looks slightly off. Sending a user Bearer token here is a red flag. |
| `telemetry.unknown-cdn.xyz` | POST /ping | This domain is unrecognized and low-information. Sending your user's auth token to an `.xyz` domain with a generic name is suspicious. I'd treat this as a high-priority concern. |

All three external requests are sending the **same Bearer token** as your own API calls. If that token grants access to user data or actions on your platform, any of these third-party services could potentially use it to impersonate the user.

**Recommended next steps:**

1. For `analytics.thirdparty-tracker.io` and `logs.datadogservice.net`: Check which SDK or library is making these calls. It may be inheriting the app's global HTTP client headers. Strip the `Authorization` header from outbound requests to third-party services at the HTTP client layer.
2. For `telemetry.unknown-cdn.xyz`: Investigate what code path triggers this. If you don't recognize it, check your third-party dependencies — it may be coming from an analytics or crash-reporting SDK that's been updated. This one warrants immediate investigation.
3. If you're unsure which part of the app is generating these calls, I can search the traffic further — for example filtering by timestamp to correlate them with a specific user action, or searching the request bodies for more context.

---

## Summary of Tool Call Order

1. `search_traffic(pattern: "Bearer |Authorization|api.?key", searchIn: "request_headers", limit: 100)` — find all requests with auth headers
2. `get_request_detail(id: "req_003")` — inspect suspicious request to `analytics.thirdparty-tracker.io`
3. `get_request_detail(id: "req_004")` — inspect suspicious request to `logs.datadogservice.net`
4. `get_request_detail(id: "req_006")` — inspect suspicious request to `telemetry.unknown-cdn.xyz`
