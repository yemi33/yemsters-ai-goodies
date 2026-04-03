# Response: Finding 401 Errors and Showing Failed Request Bodies

## What I Would Do and Say

---

### Step 1: List all 401 requests

I would start by calling `list_requests` filtered to status code 401 to get an overview of all the failed requests.

**MCP tool call:**
```
list_requests(
  statusCode: 401,
  limit: 50
)
```

**What I would tell the user:**

"Let me pull up all the 401 responses from your captured traffic."

**Example response from the tool (hypothetical):**
```json
[
  { "id": "req_101", "method": "POST", "url": "https://api.myapp.com/v1/users/me", "status": 401, "timestamp": "2026-03-17T10:03:12Z", "content-type": "application/json", "body_size": 312 },
  { "id": "req_108", "method": "GET",  "url": "https://api.myapp.com/v1/feed",    "status": 401, "timestamp": "2026-03-17T10:04:05Z", "content-type": "application/json", "body_size": 0 },
  { "id": "req_115", "method": "POST", "url": "https://api.myapp.com/v1/auth/refresh", "status": 401, "timestamp": "2026-03-17T10:05:31Z", "content-type": "application/json", "body_size": 128 },
  ...
]
```

---

### Step 2: Fetch the request body for each 401

For every request in the list that has a non-zero `body_size` (i.e., it actually sent a body), I would call `get_request_detail` to retrieve the full request including headers and body. Requests with `body_size: 0` (like plain GET requests) would be noted but skipped for body inspection since they have nothing to show.

**MCP tool calls (one per relevant request):**

```
get_request_detail("req_101")
get_request_detail("req_115")
```

**Example tool responses (hypothetical):**

`req_101`:
```json
{
  "method": "POST",
  "url": "https://api.myapp.com/v1/users/me",
  "headers": {
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "Content-Type": "application/json"
  },
  "body": "{\"displayName\": \"Jane Doe\", \"email\": \"jane@example.com\"}",
  "timing": { "start": "2026-03-17T10:03:12Z", "duration_ms": 87 }
}
```

`req_115`:
```json
{
  "method": "POST",
  "url": "https://api.myapp.com/v1/auth/refresh",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": "{\"refresh_token\": \"dGhpcyBpcyBhIHRlc3Q...\"}",
  "timing": { "start": "2026-03-17T10:05:31Z", "duration_ms": 43 }
}
```

---

### Step 3: Present findings to the user

After collecting all the data, I would summarize like this:

---

"I found **N** requests that came back with a 401 Unauthorized. Here's a breakdown of the failed request bodies:

**req_101 — POST https://api.myapp.com/v1/users/me**
- The request included a Bearer token in the `Authorization` header, but the server rejected it (likely expired or revoked).
- Request body:
  ```json
  { "displayName": "Jane Doe", "email": "jane@example.com" }
  ```

**req_108 — GET https://api.myapp.com/v1/feed**
- No request body (GET request). The 401 here is likely a missing or invalid token in the headers.

**req_115 — POST https://api.myapp.com/v1/auth/refresh**
- This one is notable: the app tried to refresh its token but got a 401 back, which means the refresh token itself is invalid or expired.
- Request body:
  ```json
  { "refresh_token": "dGhpcyBpcyBhIHRlc3Q..." }
  ```

**Pattern observed:** The 401s appear to be clustered around an expired or invalid token. The refresh attempt at `req_115` also failing suggests the session may be fully expired. You may want to check whether the token lifecycle or storage is working correctly in the app."

---

## Summary of Tool Call Order

| Step | Tool | Arguments | Purpose |
|------|------|-----------|---------|
| 1 | `list_requests` | `statusCode: 401, limit: 50` | Get all 401 responses |
| 2 | `get_request_detail` | `id` for each request with a body | Retrieve full request bodies |

No calls to `get_response_detail`, `search_traffic`, or `get_traffic_stats` are needed for this specific task — the user asked specifically about the **failed request bodies**, so fetching request details is sufficient.
