# Eval-3 Response: Searching for Auth Token Leaks

## User Task
"I think my app might be sending the user's auth token somewhere it shouldn't. Can you search all the captured traffic and flag any requests that include authorization headers or bearer tokens, and tell me which domains they're going to?"

---

## Full Agent Response (what I would say and do, in order)

---

### Step 1: Search request headers for Authorization and Bearer tokens

The skill's "Is my app leaking credentials?" pattern maps directly to this request. I'll search across all captured request headers using a pattern that catches both `Authorization` headers and `Bearer` token values.

**Tool call:**

```
search_traffic(
  pattern: "Bearer |Authorization|api.?key",
  searchIn: "request_headers"
)
```

**Simulated response:**

```json
{
  "count": 5,
  "matches": [
    {
      "id": "req_001",
      "method": "POST",
      "url": "https://api.myapp.com/v1/user/profile",
      "statusCode": 200,
      "timestamp": "2026-03-17T10:14:02Z",
      "contentType": "application/json",
      "bodySize": 412,
      "matchContext": "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6..."
    },
    {
      "id": "req_002",
      "method": "GET",
      "url": "https://analytics.third-party-tracker.io/collect?uid=abc123",
      "statusCode": 204,
      "timestamp": "2026-03-17T10:14:05Z",
      "contentType": null,
      "bodySize": 0,
      "matchContext": "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6..."
    },
    {
      "id": "req_003",
      "method": "POST",
      "url": "https://logs.third-party-tracker.io/events",
      "statusCode": 200,
      "timestamp": "2026-03-17T10:14:08Z",
      "contentType": "application/json",
      "bodySize": 890,
      "matchContext": "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6..."
    },
    {
      "id": "req_004",
      "method": "GET",
      "url": "https://api.myapp.com/v1/settings",
      "statusCode": 200,
      "timestamp": "2026-03-17T10:14:10Z",
      "contentType": "application/json",
      "bodySize": 198,
      "matchContext": "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6..."
    },
    {
      "id": "req_005",
      "method": "POST",
      "url": "https://crash-reports.external-service.net/report",
      "statusCode": 201,
      "timestamp": "2026-03-17T10:14:15Z",
      "contentType": "application/json",
      "bodySize": 1240,
      "matchContext": "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6..."
    }
  ]
}
```

---

### Step 2: Inspect the suspicious requests in detail

Two of the five results go to your own domain (`api.myapp.com`), which is expected. The other three go to third-party domains. I'll pull the full request detail on those three to see exactly what headers are being sent.

**Tool call 1:**

```
get_request_detail(id: "req_002")
```

**Simulated response:**

```json
{
  "id": "req_002",
  "method": "GET",
  "url": "https://analytics.third-party-tracker.io/collect?uid=abc123",
  "headers": {
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzQ1NiIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTc0MjIxMDAwMCwiZXhwIjoxNzQyMjk2NDAwfQ.signature",
    "User-Agent": "MyApp/2.3.1 (iOS 17.4; iPhone)",
    "Accept": "*/*"
  },
  "body": null,
  "timestamp": "2026-03-17T10:14:05Z",
  "contentType": null,
  "bodySize": 0,
  "isBinary": false
}
```

**Tool call 2:**

```
get_request_detail(id: "req_003")
```

**Simulated response:**

```json
{
  "id": "req_003",
  "method": "POST",
  "url": "https://logs.third-party-tracker.io/events",
  "headers": {
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzQ1NiIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTc0MjIxMDAwMCwiZXhwIjoxNzQyMjk2NDAwfQ.signature",
    "Content-Type": "application/json",
    "User-Agent": "MyApp/2.3.1 (iOS 17.4; iPhone)"
  },
  "body": "{\"event\":\"screen_view\",\"screen\":\"ProfilePage\",\"userId\":\"user_456\"}",
  "timestamp": "2026-03-17T10:14:08Z",
  "contentType": "application/json",
  "bodySize": 890,
  "isBinary": false
}
```

**Tool call 3:**

```
get_request_detail(id: "req_005")
```

**Simulated response:**

```json
{
  "id": "req_005",
  "method": "POST",
  "url": "https://crash-reports.external-service.net/report",
  "headers": {
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzQ1NiIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTc0MjIxMDAwMCwiZXhwIjoxNzQyMjk2NDAwfQ.signature",
    "Content-Type": "application/json",
    "User-Agent": "MyApp/2.3.1 (iOS 17.4; iPhone)"
  },
  "body": "{\"crash_id\":\"cr_789\",\"stack_trace\":\"...\",\"user_id\":\"user_456\"}",
  "timestamp": "2026-03-17T10:14:15Z",
  "contentType": "application/json",
  "bodySize": 1240,
  "isBinary": false
}
```

---

### Step 3: Report findings to the user

Here is what I found and what I would tell the user:

---

**Found 5 requests carrying Authorization / Bearer token headers. Here's the breakdown by domain:**

| Domain | # Requests | Expected? | Notes |
|---|---|---|---|
| `api.myapp.com` | 2 | Yes | Your own backend — normal |
| `analytics.third-party-tracker.io` | 1 | **Suspicious** | Analytics/tracking domain |
| `logs.third-party-tracker.io` | 1 | **Suspicious** | Logging subdomain of same third-party |
| `crash-reports.external-service.net` | 1 | **Suspicious** | Crash reporting service |

**The three concerning requests:**

1. **`analytics.third-party-tracker.io`** (req_002) — A GET to a tracking/analytics endpoint is being sent with your full `Authorization: Bearer` JWT. The token decodes to include at minimum a user ID and email. An analytics ping has no legitimate reason to carry a user auth credential.

2. **`logs.third-party-tracker.io`** (req_003) — A POST sending event data (screen views, user ID) to the same third-party tracker, again with the full Bearer token attached. The body already contains a `userId` field, so the auth header is redundant and means the token is being leaked in addition to the user ID.

3. **`crash-reports.external-service.net`** (req_005) — A crash report POST is attaching the Bearer token. Crash reporters typically only need an API key specific to your developer account, not a per-user auth token. This is the least severe of the three, but still unintentional credential leakage.

**What the token contains (decoded from the JWT payload):**
- `sub`: `user_456`
- `email`: `user@example.com`
- `iat` / `exp`: issued and expires within a 24-hour window

**Recommendation:** Your app appears to be setting the `Authorization` header globally (e.g., as a default header on an HTTP client instance) and that same client is being reused for third-party SDK calls. You should either:
- Scope the `Authorization` header to requests going to your own domain only, or
- Use separate HTTP client instances (one authenticated, one unauthenticated) for first-party vs third-party calls.

Would you like me to dig deeper into any of these requests, or check the response bodies to see what the third-party services are sending back?

---

## Tool Call Order Summary

1. `search_traffic(pattern: "Bearer |Authorization|api.?key", searchIn: "request_headers")` — find all requests leaking auth headers
2. `get_request_detail(id: "req_002")` — inspect suspicious third-party analytics request
3. `get_request_detail(id: "req_003")` — inspect suspicious third-party logging request
4. `get_request_detail(id: "req_005")` — inspect suspicious crash reporting request
5. Report findings to user with domain table and recommendations
