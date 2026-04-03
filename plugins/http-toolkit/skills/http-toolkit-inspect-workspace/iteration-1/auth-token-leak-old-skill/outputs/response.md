# Response: Auth Token Leak Investigation

## What I Would Tell the User

Great question — this is an important security concern. I'll search through all captured traffic to find any requests that include authorization headers or bearer tokens, then report which domains they're going to.

---

## Step 1: Search for Authorization Headers

First, I would call `search_traffic` targeting request headers for any `Authorization` header:

**Tool call:**
```
search_traffic(
  pattern: "(?i)authorization",
  searchIn: "request_headers",
  limit: 50
)
```

**Why:** This catches all requests that include an `Authorization` header, regardless of casing or value type (Bearer, Basic, Digest, etc.).

---

## Step 2: Search for Bearer Tokens in Headers and Body

Next, I would run a second search specifically for bearer token patterns, also scanning the request body in case tokens are being passed as form fields or JSON payloads:

**Tool call:**
```
search_traffic(
  pattern: "(?i)bearer\\s+[a-zA-Z0-9\\-._~+/]+=*",
  searchIn: "request_headers",
  limit: 50
)
```

**Tool call:**
```
search_traffic(
  pattern: "(?i)bearer\\s+[a-zA-Z0-9\\-._~+/]+=*",
  searchIn: "request_body",
  limit: 50
)
```

**Why:** Bearer tokens are the most common auth mechanism in modern apps. Checking both headers and the request body ensures we don't miss tokens sent in non-standard ways (e.g., as a `token` field in a JSON POST body).

---

## Step 3: Inspect Details for Each Match

For every request ID returned by the searches above, I would call `get_request_detail` to retrieve the full headers and body:

**Tool call (repeated for each matched request ID, e.g., req_01, req_02, ...):**
```
get_request_detail("req_01")
get_request_detail("req_02")
// ... and so on for each match
```

**Why:** The search results give summaries with match highlights, but the full detail call lets me see the exact header values (so I can determine whether it's a real token or a placeholder) and the destination URL (to classify the domain).

---

## Step 4: Compile Domain List

After collecting the full details, I would extract the domain from each matched request's URL and group them. I would present a summary like:

**What I would tell the user:**

> Here are all the domains that received requests containing authorization headers or bearer tokens:
>
> | Domain | Request Count | Auth Type |
> |--------|---------------|-----------|
> | api.yourapp.com | 12 | Bearer (expected) |
> | auth.microsoft.com | 3 | Bearer (expected — login flow) |
> | analytics.thirdparty.io | 2 | Bearer (UNEXPECTED — investigate) |
> | cdn.somecdn.net | 1 | Basic (UNEXPECTED — investigate) |
>
> **Flagged for review:** `analytics.thirdparty.io` and `cdn.somecdn.net` are receiving auth credentials but are not typical auth endpoints. This could indicate a token leak — you should verify whether your app is intentionally sending credentials to these domains.

---

## Step 5: Optional — Get Traffic Stats for Full Context

If the user wants broader context (e.g., what percentage of all traffic includes auth headers), I would also call:

**Tool call:**
```
get_traffic_stats()
```

This returns top domains and total request volume, which helps contextualize how widespread the issue might be.

---

## Summary of Tool Calls (in order)

1. `search_traffic(pattern: "(?i)authorization", searchIn: "request_headers", limit: 50)`
2. `search_traffic(pattern: "(?i)bearer\\s+[a-zA-Z0-9\\-._~+/]+=*", searchIn: "request_headers", limit: 50)`
3. `search_traffic(pattern: "(?i)bearer\\s+[a-zA-Z0-9\\-._~+/]+=*", searchIn: "request_body", limit: 50)`
4. `get_request_detail("<id>")` — for each matched request ID from steps 1–3
5. `get_traffic_stats()` — optional, for broader context

The final output to the user would be a table of domains receiving auth credentials, with clear flags on any that appear unexpected or suspicious.
