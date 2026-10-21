export interface ApiErrorPayload {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
  request_id?: string;
  doc_url?: string;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly field?: string;
  public readonly details?: Record<string, unknown>;
  public readonly requestId?: string;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message || `Request failed with status ${status}`);
    this.name = "ApiError";
    this.statusCode = status;
    this.code = payload.code || "UNKNOWN_ERROR";
    this.field = payload.field;
    this.details = payload.details;
    this.requestId = payload.request_id;
  }
}

export interface BackendHealthResponse {
  status: "ok" | string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  services: {
    database: string;
    cache: string;
  };
}

class ApiClient {
  private baseUrl: string;
  private activeOrgId?: string;
  private accessToken?: string;

  constructor() {
    this.baseUrl =
      import.meta.env.VITE_API_URL || "http://localhost:3000/v1";
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  public setActiveOrgId(orgId: string | undefined): void {
    this.activeOrgId = orgId;
  }

  public setAccessToken(token: string | undefined): void {
    this.accessToken = token;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit & { idempotencyKey?: string } = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");
    headers.set("X-Client", "web/0.2.11");

    if (this.accessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }

    if (this.activeOrgId && !headers.has("X-Organization-Id")) {
      headers.set("X-Organization-Id", this.activeOrgId);
    }

    if (options.idempotencyKey) {
      headers.set("Idempotency-Key", options.idempotencyKey);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Send and receive HTTP-only cookies
    });

    if (response.status === 401 && !endpoint.includes("/auth/")) {
      // Attempt token refresh via HTTP-only cookie
      try {
        const refreshRes = await fetch(`${this.baseUrl}/auth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({}),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData?.data?.access_token;
          if (newToken) {
            this.setAccessToken(newToken);
            headers.set("Authorization", `Bearer ${newToken}`);
            const retryRes = await fetch(url, { ...options, headers, credentials: "include" });
            if (retryRes.ok) {
              if (retryRes.status === 204) return {} as T;
              return retryRes.json() as Promise<T>;
            }
          }
        }
      } catch {
        // Refresh failed, fall through to throw ApiError
      }
    }

    if (!response.ok) {
      let errorData: { error?: ApiErrorPayload } = {};
      try {
        errorData = await response.json();
      } catch {
        // Fallback for non-JSON error
      }
      throw new ApiError(response.status, errorData.error || {
        code: `HTTP_${response.status}`,
        message: response.statusText || "Request failed",
      });
    }

    // For 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  public get<T>(endpoint: string, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  public post<T>(
    endpoint: string,
    body?: unknown,
    options?: { idempotencyKey?: string; headers?: HeadersInit }
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      headers: options?.headers,
      idempotencyKey: options?.idempotencyKey,
    });
  }

  public patch<T>(
    endpoint: string,
    body?: unknown,
    headers?: HeadersInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public delete<T>(endpoint: string, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE", headers });
  }

  public async checkHealth(): Promise<BackendHealthResponse> {
    // Health is under /health or /v1/health
    const healthUrl = this.baseUrl.replace(/\/v1$/, "") + "/v1/health";
    return this.get<BackendHealthResponse>(healthUrl);
  }
}

export const api = new ApiClient();
