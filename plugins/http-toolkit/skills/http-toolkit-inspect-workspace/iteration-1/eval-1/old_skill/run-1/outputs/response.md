# Response: Android Proxy Setup and Traffic Capture

## What I Would Tell the User

---

Great question — setting up HTTP Toolkit to intercept traffic from an Android debug build involves a few steps on both your machine and your device. I can walk you through the full setup, but I want to be upfront about one thing first:

**The tools I have available are for inspecting traffic that has already been captured** — listing requests, searching by URL or body, and reading request/response details. I do not currently have MCP tools for configuring the proxy, setting up Android interception, or launching a capture session. Those steps need to be done manually in the HTTP Toolkit desktop app.

Here is exactly what you need to do:

---

## Step-by-Step Setup

### 1. Install HTTP Toolkit on Your Machine

Download and install HTTP Toolkit from https://httptoolkit.com. Launch the app.

### 2. Start an Android Interception Session

In the HTTP Toolkit UI:
- Click **"Android Device"** from the interception options on the home screen.
- HTTP Toolkit will display your machine's local IP address and the proxy port (typically `8000`).

### 3. Connect Your Android Device

- Enable **Developer Options** on your Android device (Settings > About Phone > tap "Build Number" 7 times).
- Connect the device via USB and ensure **USB debugging** is enabled.
- HTTP Toolkit can configure the device automatically via ADB. If your device is detected, click **"Connect via ADB"** and HTTP Toolkit will:
  - Push its CA certificate to the device.
  - Configure the Wi-Fi proxy automatically.

If automatic setup does not work, do it manually:
- On your Android device, go to **Settings > Wi-Fi**, long-press your network, select **Modify Network**, set **Proxy** to **Manual**, enter your machine's IP and port `8000`.
- Install the HTTP Toolkit CA certificate manually: visit `http://httptoolkit.tech/android` from the device browser while the proxy is active, download the cert, and install it under **Settings > Security > Install Certificate**.

### 4. Trust the Certificate for Debug Builds (Network Security Config)

Because you have the source and it is a debug build, you can make the app trust user-installed CA certificates. In your app's `res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <debug-overrides>
        <trust-anchors>
            <certificates src="user" />
            <certificates src="system" />
        </trust-anchors>
    </debug-overrides>
</network-security-config>
```

Reference it in your `AndroidManifest.xml`:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

Rebuild and install the debug APK. This allows your app to trust the HTTP Toolkit certificate without needing root.

### 5. Start Capturing

Run your app on the device. Traffic will start appearing in the HTTP Toolkit desktop UI in real time.

---

## Once Traffic Is Captured — What I Can Do

Once HTTP Toolkit is capturing traffic, I can help you analyze it using the available MCP tools. Here is what I would do and in what order:

### Get an Overview

I would call `get_traffic_stats()` to see a high-level summary:

```
get_traffic_stats()
```

This returns total request count, breakdown by HTTP method, status code distribution, average response time, and top domains — useful for a quick sanity check that traffic is flowing.

### List All Captured Requests

```
list_requests(limit: 50)
```

This gives you an array of `{ id, method, url, status, timestamp, content-type, body_size }` for the most recent 50 requests. I can filter by method or URL pattern, for example to see only POST requests:

```
list_requests(method: "POST", limit: 50)
```

Or to focus on a specific API host:

```
list_requests(urlPattern: "api\\.yourapp\\.com", limit: 50)
```

### Inspect a Specific Request

Once I have an `id` from the list (e.g., `"req_42"`), I would call both detail tools:

```
get_request_detail("req_42")
// Returns: method, URL, request headers, request body, timing

get_response_detail("req_42")
// Returns: status code, response headers, response body, timing
```

### Search Across All Traffic

If you want to find something specific — like an auth token, a particular field in a JSON body, or a specific endpoint — I would use:

```
search_traffic(pattern: "access_token", searchIn: "response_body")
```

or

```
search_traffic(pattern: "/auth/login", searchIn: "url")
```

---

## Summary of Tool Calls I Would Make (in Order)

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `get_traffic_stats()` | Confirm traffic is being captured; get totals and top domains |
| 2 | `list_requests(limit: 50)` | See all recent requests |
| 3 | `list_requests(urlPattern: "...", method: "POST")` | Narrow to relevant endpoints |
| 4 | `get_request_detail(id)` | Read full request headers and body |
| 5 | `get_response_detail(id)` | Read full response headers and body |
| 6 | `search_traffic(pattern: "...", searchIn: "all")` | Find specific tokens, fields, or patterns across all traffic |

---

## What I Cannot Do (Scope Limitation)

The HTTP Toolkit MCP tools I have access to are read-only inspection tools. I cannot:
- Start or stop a capture session via MCP.
- Configure the proxy settings programmatically.
- Push certificates to your device.
- Modify interception rules.

All of those actions must be performed in the HTTP Toolkit desktop app directly. Once the capture is running, I can take over and help you analyze everything.

---

Let me know when you have traffic flowing and I will start digging in.
