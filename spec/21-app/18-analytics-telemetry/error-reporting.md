# Error Reporting

Crash + uncaught-exception capture across web app, extension, and service worker.

---

## 1. Capture surfaces

| Surface | Mechanism |
|---|---|
| Web app SPA | `window.onerror`, `unhandledrejection`, React error boundary |
| Extension popup / new tab | Same as web |
| Service worker (extension background) | `self.addEventListener('error')` + `unhandledrejection` |
| API server | Process-level handler + per-request middleware |
| Edge functions | Per-invocation try/catch + structured log |

## 2. Stack & context

Each report includes:
- Error message + name + stack (sourcemap-resolved).
- User action breadcrumbs (last 50): clicks, navigations, network calls, console logs (sampled).
- App state snapshot: `route`, `org_id`, `view_mode`, sanitized.
- Client: version, channel, platform, viewport.
- Server (if API): request id, endpoint, method, status, duration.
- NO request bodies, NO query parameters with PII, NO localStorage contents.

Breadcrumb redaction:
- URL paths kept; query strings stripped.
- Form inputs replaced with `<redacted len=N>`.
- Auth tokens replaced with `<token>`.

## 3. Consent

- Crash reporting consent independent from analytics consent.
- Default: ON for opt-in regions, OFF for EU/UK until explicit consent.
- Toggle in `/account/privacy`.
- "Send detailed reports including breadcrumbs" sub-toggle (on by default when crash reporting on).

When OFF: only error counts logged (server-side, no client report sent).

## 4. Backend

- Self-hosted Sentry (or GlitchTip OSS).
- Same data residency as analytics.
- 30-day retention of full reports; 1-year retention of aggregated counts.
- Source maps uploaded at build time, never served publicly.

## 5. Grouping & deduplication

- Sentry default fingerprinting (stack frames + message).
- Custom rules: group by error class for known noisy patterns.
- One report per unique fingerprint per user per hour (rate-limited).

## 6. Severity

| Level | Examples | Notification |
|---|---|---|
| `fatal` | App crashed, white screen | Page on-call within 5 min |
| `error` | Save failed, sync deadlock | Slack alert hourly digest |
| `warning` | Recoverable retry, 4xx response | Aggregated daily |
| `info` | Notable but expected | Stored, not alerted |

Severity assigned at emit site or via grouping rules.

## 7. User feedback prompt

When a fatal crash occurs:
- Friendly modal: "Sorry, something broke. Optionally tell us what you were doing."
- Free-text field (explicitly user-typed; included in report).
- Submit / Skip.
- Crash report sent regardless; feedback attached if provided.

## 8. Source maps

- Uploaded to Sentry on every release via CI.
- Versioned per `client_version`.
- Never deployed to production CDN.
- Resolution at view-time only (no public exposure).

## 9. Server-side errors

- All API errors logged with request id (correlatable with client report).
- Stack + sanitized request context.
- 5xx auto-paged; 4xx aggregated.
- DB errors: query NOT logged (privacy + length); only error code + table.

## 10. Extension service worker specifics

- SW restarts frequently; in-memory breadcrumbs lost.
- Persist last 20 breadcrumbs to `chrome.storage.session` for crash continuity.
- On SW startup, check for pending error reports → send.

## 11. Health metrics (separate from errors)

- `health.api.success_rate` per endpoint per minute.
- `health.client.uncaught_rate` per surface per release.
- `health.sync.lag_p95` end-to-end.

Not personal; aggregated at server.

## 12. Telemetry

- `error.captured` `{ severity, fingerprint, surface }`
- `error.report_sent` `{ has_user_feedback }`
- `error.consent_changed` `{ enabled, breadcrumbs_enabled }`
- `error.rate_alert_fired` `{ release, fingerprint }`

## 13. User access

- `/account/privacy` shows count of error reports sent in last 30 d.
- "Download my error reports" → JSON export.
- "Delete my error reports" → purge from Sentry within 24 h.

## 14. Edge cases

| Case | Behavior |
|---|---|
| Error in error handler | Caught + sent via minimal fallback path |
| Network down during fatal crash | Queued in IndexedDB; sent on next online |
| Source map missing for release | Stack reported with raw frames; CI alert |
| Same crash from 1000 users in 5 min | Sentry rate-limit + ops auto-page |
| Third-party extension causes errors in our context | Filter by stack origin; drop reports |
| User has consent OFF + crash occurs | Server-side count incremented; no payload sent |

## 15. Tests

- Fingerprint stability across releases (with/without sourcemap).
- Breadcrumb redaction correctness (PII linter).
- Consent gates report transmission.
- SW restart preserves last breadcrumbs.
- Rate-limit prevents storm.
- Source map resolution for current + last 3 releases.
