import * as mockttp from "mockttp";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { TrafficStore } from "./store.js";
import { TrafficEntry, TrafficRequest, TrafficResponse } from "./types.js";

const MAX_BODY_SIZE = 100 * 1024; // 100KB
const CA_DIR = path.join(os.homedir(), ".http-toolkit-mcp");
const CA_CERT_PATH = path.join(CA_DIR, "ca.pem");
const CA_KEY_PATH = path.join(CA_DIR, "ca.key");

const BINARY_CONTENT_TYPES = [
  "image/", "audio/", "video/", "application/octet-stream",
  "application/zip", "application/gzip", "application/pdf",
  "application/wasm", "font/",
];

function isBinaryContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return BINARY_CONTENT_TYPES.some((prefix) => contentType.startsWith(prefix));
}

function getHeaderValue(headers: Record<string, string | string[] | undefined>, name: string): string | null {
  const value = headers[name.toLowerCase()];
  if (value === undefined) return null;
  return Array.isArray(value) ? value[0] : value;
}

function headersToRecord(
  headers: Record<string, string | string[] | undefined>
): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export class ProxyManager {
  private server: mockttp.Mockttp | null = null;
  private store: TrafficStore;
  private _isRunning = false;
  private _port: number = 0;
  private _httpsEnabled = false;

  constructor(store: TrafficStore) {
    this.store = store;
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  get port(): number {
    return this._port;
  }

  get caCertPath(): string {
    return CA_CERT_PATH;
  }

  async start(port: number = 8080, httpsEnabled: boolean = true): Promise<{
    proxyUrl: string;
    caCertPath: string | null;
  }> {
    if (this._isRunning) {
      throw new Error("Proxy is already running");
    }

    let serverOptions: mockttp.MockttpOptions = {};

    if (httpsEnabled) {
      if (!fs.existsSync(CA_DIR)) {
        fs.mkdirSync(CA_DIR, { recursive: true });
      }

      if (fs.existsSync(CA_CERT_PATH) && fs.existsSync(CA_KEY_PATH)) {
        serverOptions = {
          https: {
            certPath: CA_CERT_PATH,
            keyPath: CA_KEY_PATH,
          },
        };
      } else {
        const ca = await mockttp.generateCACertificate();
        fs.writeFileSync(CA_CERT_PATH, ca.cert);
        fs.writeFileSync(CA_KEY_PATH, ca.key);
        serverOptions = {
          https: {
            cert: ca.cert,
            key: ca.key,
          },
        };
      }
    }

    this.server = mockttp.getLocal(serverOptions);

    await this.server.start(port);

    // Set up pass-through rule
    await this.server.forAnyRequest().thenPassThrough();

    // Subscribe to request/response events (mockttp async subscriptions)
    await this.server.on("request", (req) => {
      this.handleRequest(req);
    });

    await this.server.on("response", (resp) => {
      this.handleResponse(resp);
    });

    this._isRunning = true;
    this._port = port;
    this._httpsEnabled = httpsEnabled;

    return {
      proxyUrl: `http://127.0.0.1:${port}`,
      caCertPath: httpsEnabled ? CA_CERT_PATH : null,
    };
  }

  async stop(): Promise<void> {
    if (!this._isRunning || !this.server) {
      throw new Error("Proxy is not running");
    }

    await this.server.stop();
    this.server = null;
    this._isRunning = false;
    this._port = 0;
  }

  private handleRequest(req: mockttp.CompletedRequest): void {
    const contentType = getHeaderValue(req.headers, "content-type");
    const binary = isBinaryContentType(contentType);

    let bodyText: string | null = null;
    let bodySize = 0;

    try {
      const rawBody = req.body;
      if (rawBody) {
        // CompletedBody has .buffer (Buffer) and .text (string) properties
        const buf = (rawBody as any).buffer ?? rawBody;
        if (Buffer.isBuffer(buf)) {
          bodySize = buf.length;
        }
        if (!binary) {
          const text = typeof (rawBody as any).text === "string"
            ? (rawBody as any).text
            : (Buffer.isBuffer(buf) ? buf.toString("utf-8") : null);
          if (text) {
            bodyText = text.substring(0, MAX_BODY_SIZE);
          }
        }
      }
    } catch {
      // Body access can fail for some requests
    }

    const trafficReq: TrafficRequest = {
      method: req.method,
      url: req.url,
      headers: headersToRecord(req.headers),
      body: bodyText,
      bodySize,
      isBinary: binary,
      contentType,
      timestamp: new Date().toISOString(),
    };

    const entry: TrafficEntry = {
      id: req.id,
      request: trafficReq,
      response: null,
      duration: null,
    };

    this.store.add(entry);
  }

  private handleResponse(resp: mockttp.CompletedResponse): void {
    const entry = this.store.get(resp.id);
    if (!entry) return;

    const contentType = getHeaderValue(resp.headers, "content-type");
    const binary = isBinaryContentType(contentType);

    let bodyText: string | null = null;
    let bodySize = 0;

    try {
      const rawBody = resp.body;
      if (rawBody) {
        const buf = (rawBody as any).buffer ?? rawBody;
        if (Buffer.isBuffer(buf)) {
          bodySize = buf.length;
        }
        if (!binary) {
          const text = typeof (rawBody as any).text === "string"
            ? (rawBody as any).text
            : (Buffer.isBuffer(buf) ? buf.toString("utf-8") : null);
          if (text) {
            bodyText = text.substring(0, MAX_BODY_SIZE);
          }
        }
      }
    } catch {
      // Body access can fail
    }

    const trafficResp: TrafficResponse = {
      statusCode: resp.statusCode,
      statusMessage: (resp as any).statusMessage ?? "",
      headers: headersToRecord(resp.headers),
      body: bodyText,
      bodySize,
      isBinary: binary,
      contentType,
      timestamp: new Date().toISOString(),
    };

    entry.response = trafficResp;

    const reqTime = new Date(entry.request.timestamp).getTime();
    const respTime = new Date(trafficResp.timestamp).getTime();
    entry.duration = respTime - reqTime;
  }
}
