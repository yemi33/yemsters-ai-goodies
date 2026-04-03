# Android App Traffic Capture — Full Response

## What I Would Say and Do (Step by Step)

---

### Step 1: Start the proxy

The first thing I would do is call the `start_proxy` MCP tool to start the local intercepting proxy:

**MCP Tool Call:**
```
start_proxy()
```

Expected response:
```json
{
  "proxyUrl": "http://127.0.0.1:8080",
  "caCertPath": "/Users/yemishin/.http-toolkit-mcp/ca.pem"
}
```

---

### Step 2: Tell the user what was started and what to do next

> The proxy is running at **http://127.0.0.1:8080** and a CA certificate has been generated at:
> `/Users/yemishin/.http-toolkit-mcp/ca.pem`
>
> Since you're on Android with a debug build and have the source, here's what you need to do:
>
> **A. Configure your Android device to use the proxy**
>
> 1. Connect your Android device to the same Wi-Fi network as your machine.
> 2. Long-press your Wi-Fi network → Modify network → Advanced options.
> 3. Set **Proxy** to **Manual**.
> 4. Set **Proxy hostname** to your machine's local IP address (e.g., `192.168.1.10`).
> 5. Set **Proxy port** to `8080`.
> 6. Save.
>
> **B. Install the CA certificate on your device**
>
> Because your app targets API 24+ (which is almost certainly the case for a modern debug build), Android no longer trusts user-installed certificates by default for app traffic. You need to do **both** of the following:
>
> 1. **Install the cert on the device:**
>    - Transfer `ca.pem` to your device (ADB push, email, etc.).
>    - Go to **Settings → Security → Install certificate** (exact path varies by Android version; look for "Install from storage" or "Install a certificate").
>    - Install it as a **CA certificate** or **Wi-Fi certificate** — not VPN or apps.
>
> 2. **Add a Network Security Config to your app source** (required for API 24+):
>
>    Create or edit `res/xml/network_security_config.xml`:
>    ```xml
>    <?xml version="1.0" encoding="utf-8"?>
>    <network-security-config>
>        <debug-overrides>
>            <trust-anchors>
>                <certificates src="user" />
>            </trust-anchors>
>        </debug-overrides>
>    </network-security-config>
>    ```
>
>    Then reference it in your `AndroidManifest.xml`:
>    ```xml
>    <application
>        android:networkSecurityConfig="@xml/network_security_config"
>        ...>
>    ```
>
>    Because you're using `<debug-overrides>`, this only applies to debug builds — your release build won't be affected. Rebuild and reinstall the app after making this change.
>
> **Why both steps are needed:** The device cert install makes Android trust the CA at the OS level for browser traffic. The network security config is what tells your *app* (which enforces its own trust rules on API 24+) to also trust user-installed CAs when running as a debug build.

---

### Step 3: Prompt the user to trigger traffic

> Once you have:
> - The proxy set on your device
> - The cert installed
> - The app rebuilt with the network security config and reinstalled
>
> Go ahead and use your app — tap through the flows you want to inspect. Then let me know and I'll pull up what was captured.

---

### Step 4: After the user confirms they've triggered traffic — query the results

Once the user says they've used the app, I would call:

**MCP Tool Call:**
```
list_requests(limit: 50)
```

This returns the 50 most recent captured requests (newest first), with fields: `id`, `method`, `url`, `statusCode`, `timestamp`, `contentType`, `bodySize`.

I would present the results to the user and ask if they want to:
- Filter to a specific domain or endpoint using `urlPattern`
- Drill into the full details of a specific request or response using `get_request_detail(id)` / `get_response_detail(id)`
- Search for something specific (e.g., a token, parameter, or error string) using `search_traffic(pattern)`
- Get an overview of all traffic using `get_traffic_stats()`

---

### Step 5 (example drill-down): Get full request + response detail

If the user spots an interesting request (say, id `abc123`):

**MCP Tool Calls:**
```
get_request_detail("abc123")
get_response_detail("abc123")
```

This gives full headers, body, timing (`duration` in ms), and status for that specific exchange.

---

### Summary of MCP tools called, in order

| Order | Tool | Arguments | Purpose |
|-------|------|-----------|---------|
| 1 | `start_proxy` | _(none)_ | Start the intercepting proxy, get URL and CA cert path |
| 2 | `list_requests` | `limit: 50` | See all captured traffic after user triggers app flows |
| 3 | `get_request_detail` | `id: <id>` | Inspect full request headers and body for a specific call |
| 4 | `get_response_detail` | `id: <id>` | Inspect full response headers, body, and timing |

Optional tools depending on what the user wants to explore:
- `search_traffic(pattern, searchIn)` — hunt for a specific token, param, or string
- `get_traffic_stats()` — aggregate overview (top domains, avg response time, status code breakdown)
- `clear_traffic()` — wipe captured entries to start a clean session
- `stop_proxy()` — shut down the proxy when done
