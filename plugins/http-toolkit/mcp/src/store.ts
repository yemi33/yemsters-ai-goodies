import {
  TrafficEntry,
  TrafficSummary,
  TrafficStats,
  ListRequestsParams,
  SearchParams,
} from "./types.js";

const DEFAULT_MAX_ENTRIES = 10000;

export class TrafficStore {
  private entries: Map<string, TrafficEntry> = new Map();
  private insertionOrder: string[] = [];
  private maxEntries: number;

  constructor(maxEntries: number = DEFAULT_MAX_ENTRIES) {
    this.maxEntries = maxEntries;
  }

  add(entry: TrafficEntry): void {
    if (this.entries.size >= this.maxEntries) {
      const oldest = this.insertionOrder.shift();
      if (oldest) {
        this.entries.delete(oldest);
      }
    }
    this.entries.set(entry.id, entry);
    this.insertionOrder.push(entry.id);
  }

  get(id: string): TrafficEntry | undefined {
    return this.entries.get(id);
  }

  clear(): number {
    const count = this.entries.size;
    this.entries.clear();
    this.insertionOrder = [];
    return count;
  }

  list(params: ListRequestsParams): TrafficSummary[] {
    const {
      method,
      urlPattern,
      statusCode,
      since,
      limit = 50,
      offset = 0,
    } = params;

    let urlRegex: RegExp | null = null;
    if (urlPattern) {
      try {
        urlRegex = new RegExp(urlPattern, "i");
      } catch {
        throw new Error(`Invalid regex pattern: ${urlPattern}`);
      }
    }

    const sinceDate = since ? new Date(since).getTime() : null;

    const results: TrafficSummary[] = [];

    // Iterate in reverse insertion order (newest first)
    for (let i = this.insertionOrder.length - 1; i >= 0; i--) {
      const id = this.insertionOrder[i];
      const entry = this.entries.get(id);
      if (!entry) continue;

      if (method && entry.request.method.toUpperCase() !== method.toUpperCase()) continue;
      if (urlRegex && !urlRegex.test(entry.request.url)) continue;
      if (statusCode != null && entry.response?.statusCode !== statusCode) continue;
      if (sinceDate && new Date(entry.request.timestamp).getTime() < sinceDate) continue;

      results.push(this.toSummary(entry));
    }

    return results.slice(offset, offset + limit);
  }

  search(params: SearchParams): Array<TrafficSummary & { matchContext: string }> {
    const { pattern, searchIn = "all", limit = 20 } = params;

    let regex: RegExp;
    try {
      regex = new RegExp(pattern, "i");
    } catch {
      throw new Error(`Invalid regex pattern: ${pattern}`);
    }

    const results: Array<TrafficSummary & { matchContext: string }> = [];

    for (let i = this.insertionOrder.length - 1; i >= 0; i--) {
      if (results.length >= limit) break;

      const id = this.insertionOrder[i];
      const entry = this.entries.get(id);
      if (!entry) continue;

      const matchContext = this.findMatch(entry, regex, searchIn);
      if (matchContext) {
        results.push({ ...this.toSummary(entry), matchContext });
      }
    }

    return results;
  }

  getStats(): TrafficStats {
    const byMethod: Record<string, number> = {};
    const byStatusCode: Record<string, number> = {};
    const domainCounts: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;

    for (const entry of this.entries.values()) {
      // Method
      const m = entry.request.method;
      byMethod[m] = (byMethod[m] || 0) + 1;

      // Status code
      if (entry.response) {
        const sc = String(entry.response.statusCode);
        byStatusCode[sc] = (byStatusCode[sc] || 0) + 1;
      }

      // Domain
      try {
        const domain = new URL(entry.request.url).hostname;
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      } catch {
        // ignore invalid URLs
      }

      // Duration
      if (entry.duration != null) {
        totalDuration += entry.duration;
        durationCount++;
      }
    }

    const topDomains = Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));

    return {
      totalRequests: this.entries.size,
      byMethod,
      byStatusCode,
      averageResponseTimeMs: durationCount > 0 ? Math.round(totalDuration / durationCount) : null,
      topDomains,
    };
  }

  private toSummary(entry: TrafficEntry): TrafficSummary {
    return {
      id: entry.id,
      method: entry.request.method,
      url: entry.request.url,
      statusCode: entry.response?.statusCode ?? null,
      timestamp: entry.request.timestamp,
      contentType: entry.response?.contentType ?? entry.request.contentType,
      bodySize: entry.response?.bodySize ?? entry.request.bodySize,
    };
  }

  private findMatch(
    entry: TrafficEntry,
    regex: RegExp,
    searchIn: string
  ): string | null {
    const checks: Array<{ label: string; value: string | null }> = [];

    if (searchIn === "all" || searchIn === "url") {
      checks.push({ label: "url", value: entry.request.url });
    }
    if (searchIn === "all" || searchIn === "request_body") {
      checks.push({ label: "request_body", value: entry.request.body });
    }
    if (searchIn === "all" || searchIn === "response_body") {
      checks.push({ label: "response_body", value: entry.response?.body ?? null });
    }
    if (searchIn === "all" || searchIn === "request_headers") {
      checks.push({ label: "request_headers", value: JSON.stringify(entry.request.headers) });
    }
    if (searchIn === "all" || searchIn === "response_headers") {
      checks.push({
        label: "response_headers",
        value: entry.response ? JSON.stringify(entry.response.headers) : null,
      });
    }

    for (const { label, value } of checks) {
      if (!value) continue;
      const match = regex.exec(value);
      if (match) {
        const start = Math.max(0, match.index - 40);
        const end = Math.min(value.length, match.index + match[0].length + 40);
        const snippet = value.substring(start, end);
        return `[${label}] ...${snippet}...`;
      }
    }

    return null;
  }
}
