# Response: Searching Captured Traffic for Auth Token Leaks

## What I Would Say and Do

This task maps directly to the "Is my app leaking credentials?" workflow in the http-toolkit-inspect skill. The MCP is not running, so the steps below describe exactly what I would do if it were.

---

## Step 1: Check proxy status / captured traffic overview

Before searching, I would call `get_traffic_stats()` to confirm there is captured traffic to search and get a quick overview of what domains have been seen:

**MCP tool call:**
```
get_traffic_stats()
```

**What I would tell the user:**

> Let me first check what traffic has already been captured so I know what we're working with.

**Expected response shape:**
```json
{
  "totalRequests": 142,
  "byMethod": { "GET": 89, "POST": 41, "OPTIONS": 12 },
  "byStatusCode": { "200": 110, "401": 3, "204": 14, "500": 2, "404": 13 },
  "averageResponseTimeMs": 312,
  "topDomains": [
    "api.myapp.com",
    "auth.myapp.com",
    "analytics.thirdparty.io",
    "cdn.fonts.net",
    "logs.datadog.com"
  ]
}
```

> There are 142 captured requests going to 5 distinct domains. Now I'll search for any requests that include authorization headers or bearer tokens.

---

## Step 2: Search request headers for Authorization / Bearer tokens

The skill's "Is my app leaking credentials?" pattern calls for:

```
search_traffic("Bearer |Authorization|api.?key", searchIn: "request_headers")
```

**MCP tool call:**
```
search_traffic(
  pattern: "Bearer |Authorization|api.?key",
  searchIn: "request_headers",
  limit: 100
)
```

**What I would tell the user:**

> I'm searching all captured request headers for `Authorization` headers, `Bearer` tokens, and API keys now.

**Example response shape:**
```json
{
  "count": 7,
  "matches": [
    {
      "id": "req_001",
      "method": "GET",
      "url": "https://api.myapp.com/v2/user/profile",
      "statusCode": 200,
      "timestamp": "2026-03-17T10:14:02Z",
      "contentType": "application/json",
      "bodySize": 512,
      "matchContext": "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."
    },
    {
      "id": "req_019",
      "method": "POST",
      "url": "https://analytics.thirdparty.io/events",
      "statusCode": 200,
      "timestamp": "2026-03-17T10:14:09Z",
      "contentType": "application/json",
      "bodySize": 220,
      "matchContext": "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."
    },
    {
      "id": "req_034",
      "method": "POST",
      "url": "https://logs.datadog.com/api/v2/logs",
      "statusCode": 202,
      "timestamp": "2026-03-17T10:15:01Z",
      "contentType": "application/json",
      "bodySize": 890,
      "matchContext": "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."
    }
    // ... more matches
  ]
}
```

---

## Step 3: Get full request details on any suspicious matches

For any request going to a domain that isn't the app's own backend (i.e., third-party domains), I would call `get_request_detail` to see the full headers and confirm the exact token value:

**MCP tool calls (one per suspicious request):**
```
get_request_detail(id: "req_019")
get_request_detail(id: "req_034")
```

**What I would tell the user:**

> I found matches on third-party domains. Let me pull the full request details to see exactly what is being sent.

**Example response for req_019:**
```json
{
  "id": "req_019",
  "method": "POST",
  "url": "https://analytics.thirdparty.io/events",
  "headers": {
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImV4cCI6MTc0MjI1MDAwMH0.sig",
    "Content-Type": "application/json",
    "User-Agent": "MyApp/3.2.1 (iOS 17.4)"
  },
  "body": "{\"event\": \"screen_view\", \"screen\": \"HomeScreen\"}",
  "timestamp": "2026-03-17T10:14:09Z"
}
```

---

## Step 4: Summarize findings for the user

After collecting all results, I would present a clear summary:

---

**What I would say to the user:**

> Here is what I found after searching all captured traffic for authorization headers and bearer tokens:
>
> **Requests with auth tokens, by domain:**
>
> | Domain | # Requests | Expected? |
> |---|---|---|
> | api.myapp.com | 4 | Yes — your own backend |
> | auth.myapp.com | 1 | Yes — authentication endpoint |
> | analytics.thirdparty.io | 1 | **Suspicious** |
> | logs.datadog.com | 1 | **Suspicious** |
>
> **The problem:** Your app is sending the same `Authorization: Bearer` token to `analytics.thirdparty.io` and `logs.datadog.com`. These appear to be third-party analytics and logging services — they should not be receiving your user's auth token.
>
> The token found in those requests is:
> ```
> eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImV4cCI6MTc0MjI1MDAwMH0.sig
> ```
> This looks like a JWT. If this is your backend authentication token, sending it to third-party services is a security risk — those services would be able to impersonate the user or access your API on their behalf.
>
> **Recommended next steps:**
> 1. Check where in your code the HTTP client is configured — look for any global interceptors or headers that attach `Authorization` to all outgoing requests regardless of domain.
> 2. Scope the `Authorization` header only to requests targeting your own domains (e.g., `*.myapp.com`).
> 3. If the third-party SDKs (analytics, logging) require authentication, use their own separate API keys — never your user's auth token.
>
> Would you like me to dig deeper into any of these specific requests, or check the response bodies to see what data those third-party services are sending back?

---

## Summary of MCP Tool Call Order

| Order | Tool | Purpose |
|---|---|---|
| 1 | `get_traffic_stats()` | Confirm traffic exists, see top domains |
| 2 | `search_traffic(pattern: "Bearer \|Authorization\|api.?key", searchIn: "request_headers")` | Find all requests with auth headers |
| 3 | `get_request_detail(id)` | Inspect full headers of suspicious third-party matches |

No proxy setup was needed because the user indicated traffic is already captured ("search all the captured traffic").
