/**
 * Bug-session persistence for the LetsMarkNow bug recorder.
 *
 * Talks to the LetsMarkNow backend (`{base}/bug-reports`), NOT the old
 * cat-my-v12 SQLite `task.db` endpoints. A sibling worker is building the
 * backend against this exact contract:
 *
 * - POST {base}/bug-reports
 *     { sessionId?, title, category, description?, expectedBehavior?,
 *       actualBehavior?, initialRoute, finalRoute?, durationMs?,
 *       events[], screenshots[{ title, dataUrl, source }], errors[] }
 *   → { sessionId }
 * - GET {base}/bug-reports/sessions?limit&offset&category
 *   → [ { sessionId, title, category, description, expectedBehavior,
 *         actualBehavior, initialRoute, finalRoute, durationMs, eventCount,
 *         screenshotCount, errorCount, createdAt, persistedAt } ]
 * - GET {base}/bug-reports/sessions/{sessionId}
 *   → summary fields above + events[] + screenshots[{ id, title, dataUrl,
 *     source, seqNumber }]
 *
 * Follows src/lib/apiClient.ts auth conventions (JSON content type,
 * cookies included). Falls back to a same-origin relative path when the
 * configured base URL fails.
 */
import { getBackendBaseUrl } from "./backend-url";

export interface BugReportScreenshotInput {
  title: string;
  dataUrl: string;
  source: string;
}

export interface SaveBugSessionInput {
  sessionId?: string;
  title: string;
  category: string;
  description?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  initialRoute: string;
  finalRoute?: string;
  durationMs?: number;
  events: unknown[];
  screenshots: BugReportScreenshotInput[];
  errors: unknown[];
}

export interface BugSessionSummary {
  sessionId: string;
  title: string;
  category: string;
  description: string | null;
  expectedBehavior: string | null;
  actualBehavior: string | null;
  initialRoute: string;
  finalRoute: string | null;
  durationMs: number;
  eventCount: number;
  screenshotCount: number;
  errorCount: number;
  /** ISO timestamps from the backend (tolerate epoch seconds/ms at read time). */
  createdAt: string;
  persistedAt: string;
}

export interface BugSessionScreenshot {
  id: string;
  title: string;
  dataUrl: string;
  source: string;
  seqNumber: number;
}

export interface BugSessionDetail extends BugSessionSummary {
  events: unknown[];
  screenshots: BugSessionScreenshot[];
}

export interface ListBugSessionsParams {
  limit?: number;
  offset?: number;
  category?: string;
}

function effectiveBaseUrl(): string {
  return getBackendBaseUrl() ?? "http://localhost:3000/v1";
}

function jsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}

/** Unwrap `{ sessionId }` tolerating common envelope shapes. */
function unwrapSessionId(json: unknown): string | null {
  if (!json || typeof json !== "object") {
    return null;
  }

  const payload = json as Record<string, unknown>;
  const data = payload.data ?? payload.Results ?? payload.results;

  const candidates: unknown[] = [payload.sessionId, payload.session_id];

  if (data && typeof data === "object") {
    const inner = data as Record<string, unknown>;
    candidates.push(inner.sessionId, inner.session_id);

    if (Array.isArray(data) && data.length > 0) {
      const first = data[0] as Record<string, unknown>;
      candidates.push(first?.sessionId, first?.session_id);
    }
  }

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return null;
}

function unwrapList(json: unknown): unknown[] {
  if (Array.isArray(json)) {
    return json;
  }

  if (json && typeof json === "object") {
    const payload = json as Record<string, unknown>;
    const data = payload.data ?? payload.Results ?? payload.results;

    if (Array.isArray(data)) {
      return data;
    }
  }

  return [];
}

function hasSessionId(value: unknown): value is Record<string, unknown> {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>).sessionId === "string"
  );
}

async function fetchJson(input: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(input, { ...init, credentials: "include" });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Saves a stopped recording session to the LetsMarkNow backend.
 * Returns the backend-assigned `sessionId` (falls back to the client id).
 */
export async function saveBugSession(input: SaveBugSessionInput): Promise<string> {
  const baseUrl = effectiveBaseUrl();
  const paths = [`${baseUrl}/bug-reports`, "/bug-reports"];

  let lastError: unknown = null;

  for (const url of paths) {
    try {
      const json = await fetchJson(url, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(input),
      });
      const sessionId = unwrapSessionId(json);

      if (sessionId) {
        return sessionId;
      }

      // Saved but backend returned an unexpected envelope — keep client id.
      return input.sessionId ?? "";
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to save bug session");
}

export async function fetchBugSessions(
  params: ListBugSessionsParams = {},
): Promise<BugSessionSummary[]> {
  const baseUrl = effectiveBaseUrl();
  const queryParts: string[] = [];

  if (typeof params.limit === "number") {
    queryParts.push(`limit=${params.limit}`);
  }

  if (typeof params.offset === "number") {
    queryParts.push(`offset=${params.offset}`);
  }

  if (params.category) {
    queryParts.push(`category=${encodeURIComponent(params.category)}`);
  }

  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const paths = [
    `${baseUrl}/bug-reports/sessions${queryString}`,
    `/bug-reports/sessions${queryString}`,
  ];

  for (const url of paths) {
    try {
      const json = await fetchJson(url);

      return unwrapList(json) as BugSessionSummary[];
    } catch (err) {
      console.warn("[BugSessionRepo] Failed to fetch bug sessions:", err);
    }
  }

  return [];
}

export async function fetchBugSessionDetail(
  sessionId: string,
): Promise<BugSessionDetail | null> {
  const baseUrl = effectiveBaseUrl();
  const encoded = encodeURIComponent(sessionId);
  const paths = [
    `${baseUrl}/bug-reports/sessions/${encoded}`,
    `/bug-reports/sessions/${encoded}`,
  ];

  for (const url of paths) {
    try {
      const json = await fetchJson(url);
      const data = json as Record<string, unknown>;
      const inner = (data.data ?? data.Results?.[0] ?? data.results?.[0] ?? data) as unknown;

      if (hasSessionId(inner)) {
        return inner as unknown as BugSessionDetail;
      }
    } catch (err) {
      console.warn(`[BugSessionRepo] Failed to fetch session ${sessionId}:`, err);
    }
  }

  return null;
}
