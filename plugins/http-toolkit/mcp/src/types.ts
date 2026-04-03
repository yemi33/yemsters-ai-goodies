export interface TrafficRequest {
  method: string;
  url: string;
  headers: Record<string, string | string[]>;
  body: string | null;
  bodySize: number;
  isBinary: boolean;
  contentType: string | null;
  timestamp: string; // ISO
}

export interface TrafficResponse {
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string | string[]>;
  body: string | null;
  bodySize: number;
  isBinary: boolean;
  contentType: string | null;
  timestamp: string; // ISO
}

export interface TrafficEntry {
  id: string;
  request: TrafficRequest;
  response: TrafficResponse | null;
  duration: number | null; // ms
}

export interface TrafficSummary {
  id: string;
  method: string;
  url: string;
  statusCode: number | null;
  timestamp: string;
  contentType: string | null;
  bodySize: number;
}

export interface TrafficStats {
  totalRequests: number;
  byMethod: Record<string, number>;
  byStatusCode: Record<string, number>;
  averageResponseTimeMs: number | null;
  topDomains: Array<{ domain: string; count: number }>;
}

export interface ListRequestsParams {
  method?: string;
  urlPattern?: string;
  statusCode?: number;
  since?: string;
  limit?: number;
  offset?: number;
}

export interface SearchParams {
  pattern: string;
  searchIn?: "url" | "request_body" | "response_body" | "request_headers" | "response_headers" | "all";
  limit?: number;
}
