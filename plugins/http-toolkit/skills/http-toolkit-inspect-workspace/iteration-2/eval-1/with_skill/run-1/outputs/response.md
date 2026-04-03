# Full Agent Response — HTTP Toolkit Proxy Setup for Android

---

## Step 1: Start the proxy

I'll start the HTTP Toolkit proxy now so we have the details you need to configure your device.

**Tool call:**

```
start_proxy()
```

**Simulated response:**

```json
{
  "proxyUrl": "http://127.0.0.1:8080",
  "caCertPath": "~/.http-toolkit-mcp/ca.pem"
}
```

---

## What I tell the user after Step 1:

The proxy is running. Here's what you need to do to route your Android app's traffic through it:

---

### 1. Connect your Android device to the same network as your machine

Your computer's proxy is at `http://127.0.0.1:8080`. Since your Android device needs to reach it over the network, use your machine's **local IP address** instead of `127.0.0.1` — for example, `192.168.1.42`. You can find this with `ipconfig` (Windows) or `ifconfig` (Mac/Linux).

So the proxy address your device will use is something like: `http://192.168.1.42:8080`

---

### 2. Set the proxy on your Android device

1. Go to **Settings → Wi-Fi**
2. Long-press your current Wi-Fi network and choose **Modify network** (or tap the gear icon)
3. Expand **Advanced options**
4. Set **Proxy** to **Manual**
5. Enter your machine's local IP as the **Proxy hostname** and `8080` as the **Proxy port**
6. Save

---

### 3. Install the CA certificate on your Android device (required for HTTPS)

Without this step, HTTPS connections will fail instead of being intercepted.

The CA certificate is at: `~/.http-toolkit-mcp/ca.pem`

To install it on Android:

1. Copy `ca.pem` to your Android device (via USB, adb push, or a shared drive)
2. Go to **Settings → Security → Install from storage** (exact path varies by Android version — search for "Install certificate" if needed)
3. Select `ca.pem` and install it as a **CA certificate** (you may need to set a PIN/password if you haven't already)
4. Give it any name, e.g., "HTTP Toolkit CA"

> **Note for Android 7+ (API 24+):** By default, user-installed CA certificates are NOT trusted by apps for HTTPS connections. Because you have a **debug build and the source**, you can fix this one of two ways:
>
> **Option A — Add a network security config (recommended):**
> Add the following to your app's `res/xml/network_security_config.xml`:
> ```xml
> <?xml version="1.0" encoding="utf-8"?>
> <network-security-config>
>     <debug-overrides>
>         <trust-anchors>
>             <certificates src="user"/>
>         </trust-anchors>
>     </debug-overrides>
> </network-security-config>
> ```
> Then reference it in `AndroidManifest.xml`:
> ```xml
> <application
>     android:networkSecurityConfig="@xml/network_security_config"
>     ...>
> ```
> Rebuild and reinstall the debug APK.
>
> **Option B — Use adb to push the cert as a system cert** (requires root or an emulator with a writable system partition).

---

### 4. Trigger the traffic you want to capture

Once the proxy is configured and the certificate is installed (and your debug build trusts it), open your app and perform whatever actions make the API calls you want to inspect.

---

### 5. Ready to inspect

When you've triggered the traffic, let me know and I'll query what was captured. I can:

- **List all requests** your app made
- **Filter by domain or endpoint** (e.g., only calls to `api.yourbackend.com`)
- **Show full request headers and body** for any call
- **Show the full response** including status code, headers, and body
- **Search across all traffic** for specific strings (tokens, error messages, parameter names)

Just say "show me what was captured" or tell me what you're looking for and I'll dig in.

---

## Step 2 (after user triggers traffic) — example of what I would do next:

Once the user says they've triggered their app, I would call:

**Tool call:**

```
list_requests(limit: 50)
```

**Simulated response:**

```json
{
  "count": 12,
  "requests": [
    {
      "id": "req_001",
      "method": "POST",
      "url": "https://api.example.com/v2/auth/token",
      "statusCode": 200,
      "timestamp": "2026-03-17T10:42:01.123Z",
      "contentType": "application/json",
      "bodySize": 312
    },
    {
      "id": "req_002",
      "method": "GET",
      "url": "https://api.example.com/v2/user/profile",
      "statusCode": 200,
      "timestamp": "2026-03-17T10:42:02.456Z",
      "contentType": "application/json",
      "bodySize": 874
    },
    {
      "id": "req_003",
      "method": "GET",
      "url": "https://api.example.com/v2/feed?page=1&limit=20",
      "statusCode": 200,
      "timestamp": "2026-03-17T10:42:03.789Z",
      "contentType": "application/json",
      "bodySize": 4210
    },
    {
      "id": "req_004",
      "method": "POST",
      "url": "https://analytics.thirdparty.io/collect",
      "statusCode": 204,
      "timestamp": "2026-03-17T10:42:04.001Z",
      "contentType": "application/json",
      "bodySize": 156
    }
  ]
}
```

**What I would tell the user at this point:**

Here's what your app sent during that session — 12 requests total. A few things stand out:

- `POST /v2/auth/token` — looks like a token exchange or login call
- `GET /v2/user/profile` and `GET /v2/feed` — standard API reads
- `POST https://analytics.thirdparty.io/collect` — a third-party analytics ping

Which of these do you want to drill into? I can show you the full request body and headers (including any auth tokens being sent) or the full response for any of them. Or if you're looking for something specific, tell me and I'll search across all the traffic for it.
