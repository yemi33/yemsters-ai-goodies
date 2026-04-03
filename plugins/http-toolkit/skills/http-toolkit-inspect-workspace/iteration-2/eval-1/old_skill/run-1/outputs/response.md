# Full Agent Response — Android App Traffic Capture

---

## What the user said

> "I want to see what API calls my Android app is making. It's a debug build and I have the source. How do I set up the proxy and start capturing traffic?"

---

## Step 1 — Start the proxy (MCP tool call)

The first thing I do is start the proxy so I have a URL and CA cert path to give the user.

**Tool call:**

```
start_proxy()
```

**Simulated response:**

```json
{
  "proxyUrl": "http://127.0.0.1:8080",
  "caCertPath": "/Users/yemishin/.http-toolkit-mcp/ca.pem"
}
```

---

## Step 2 — Tell the user what to do

**Message to user:**

The proxy is running at `http://127.0.0.1:8080`. To capture your Android app's traffic you need to do two things: point the device at the proxy, and trust the CA certificate so HTTPS isn't blocked.

### 2a — Configure the Android device's Wi-Fi proxy

1. On your Android device, go to **Settings → Wi-Fi**.
2. Long-press the network your device is connected to and choose **Modify network**.
3. Expand **Advanced options**, set **Proxy** to **Manual**.
4. Set **Proxy hostname** to your machine's local IP address (e.g. `192.168.1.42` — run `ipconfig` on Windows or `ifconfig` on Mac/Linux to find it).
5. Set **Proxy port** to `8080`.
6. Save.

Your machine and the Android device must be on the same Wi-Fi network.

### 2b — Install and trust the CA certificate

Because your app targets Android API 24+, you need to do **both** of the following:

**On the device:**

1. Transfer the CA cert to your device. The cert file is at:
   `/Users/yemishin/.http-toolkit-mcp/ca.pem`
   The easiest way is to host it briefly:
   ```
   python3 -m http.server 8000
   ```
   Then open `http://<your-machine-ip>:8000/ca.pem` in Chrome on the device and download it.
2. Go to **Settings → Security → Install a certificate → CA certificate** (exact path varies by Android version; on some devices it's under **Encryption & credentials**).
3. Select the downloaded `.pem` file and confirm installation.

**In your app source (required for API 24+ apps):**

User-installed CA certs are not trusted by default for apps targeting API 24+. Since you have the source, add a Network Security Config:

1. Create or edit `res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <debug-overrides>
        <trust-anchors>
            <certificates src="user" />
        </trust-anchors>
    </debug-overrides>
</network-security-config>
```

   Using `<debug-overrides>` means this only applies to debug builds — it won't affect your release build.

2. Reference it in `AndroidManifest.xml` inside the `<application>` tag:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

3. Rebuild and reinstall the debug APK on the device.

---

## Step 3 — Ask the user to trigger traffic

**Message to user:**

Once the device is configured and the updated app is installed, open the app and go through whatever flow you want to capture (log in, load a feed, make a purchase, etc.). Then let me know and I'll pull the captured requests.

---

## Step 4 — After user confirms traffic was triggered (Phase 2)

**Tool call:**

```
list_requests()
```

**Simulated response:**

```json
{
  "count": 14,
  "requests": [
    {
      "id": "req_001",
      "method": "POST",
      "url": "https://api.myapp.com/v2/auth/token",
      "statusCode": 200,
      "timestamp": "2026-03-17T10:02:11Z",
      "contentType": "application/json",
      "bodySize": 312
    },
    {
      "id": "req_002",
      "method": "GET",
      "url": "https://api.myapp.com/v2/user/profile",
      "statusCode": 200,
      "timestamp": "2026-03-17T10:02:13Z",
      "contentType": "application/json",
      "bodySize": 874
    },
    {
      "id": "req_003",
      "method": "GET",
      "url": "https://api.myapp.com/v2/feed?page=1&limit=20",
      "statusCode": 200,
      "timestamp": "2026-03-17T10:02:14Z",
      "contentType": "application/json",
      "bodySize": 4201
    },
    {
      "id": "req_004",
      "method": "POST",
      "url": "https://analytics.third-party.io/events",
      "statusCode": 204,
      "timestamp": "2026-03-17T10:02:15Z",
      "contentType": "application/json",
      "bodySize": 589
    }
  ]
}
```

**Message to user:**

I can see 14 requests captured so far. Here's a summary of what your app is calling:

| # | Method | URL | Status |
|---|--------|-----|--------|
| 1 | POST | `https://api.myapp.com/v2/auth/token` | 200 |
| 2 | GET | `https://api.myapp.com/v2/user/profile` | 200 |
| 3 | GET | `https://api.myapp.com/v2/feed?page=1&limit=20` | 200 |
| 4 | POST | `https://analytics.third-party.io/events` | 204 |
| … | … | … | … |

A few things stand out:
- Your app is posting to a **third-party analytics endpoint** (`analytics.third-party.io`) — I can drill into that if you want to see what data it's sending.
- The auth token request (req_001) succeeded — I can inspect the request body and response if you want to see what credentials are being exchanged.

Would you like me to dig into any of these? I can also run a search across all traffic if you're looking for something specific — for example, to check whether any sensitive tokens or keys are being sent in headers.

---

## Notes on the workflow

- All four MCP tools used: `start_proxy`, `list_requests`, `get_request_detail` (available on demand), `get_response_detail` (available on demand).
- The `<debug-overrides>` approach in the Network Security Config is the correct, non-destructive way to handle API 24+ certificate pinning in debug builds — it does not touch the release build's trust configuration.
- If the user wants a clean capture after setup, the right call is `clear_traffic()` before they trigger the app flow.
