/**
 * Backend base URL resolution for the LetsMarkNow bug reporter.
 *
 * Priority:
 *   1. `import.meta.env.VITE_API_URL`
 *   2. `localStorage` key `bugReportApiUrl` (lets users point at a custom backend)
 *   3. Default: `http://localhost:3000/v1` (this repo's API base, see src/lib/apiClient.ts)
 *
 * Returns `null` when no backend is reachable configuration is available,
 * mirroring the old cat-my-v12 `resolveBackendBaseUrl` semantics so callers
 * can fall back to `mailto:` or other offline paths.
 */
const DEFAULT_BACKEND_BASE_URL = "http://localhost:3000/v1";
const STORAGE_KEY = "bugReportApiUrl";

export function getBackendBaseUrl(): string | null {
  if (typeof import.meta !== "undefined") {
    const envUrl = (import.meta.env?.VITE_API_URL as string | undefined)?.trim();

    if (envUrl) {
      return envUrl.replace(/\/+$/, "");
    }
  }

  try {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY)?.trim();

      if (stored) {
        return stored.replace(/\/+$/, "");
      }
    }
  } catch {
    // localStorage unavailable (private mode, SSR, etc.) — fall through to default.
  }

  return DEFAULT_BACKEND_BASE_URL;
}

/** Legacy alias kept for drop-in compatibility with the ported cat-my-v12 code. */
export const resolveBackendBaseUrl = getBackendBaseUrl;
