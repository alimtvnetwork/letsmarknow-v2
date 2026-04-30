# Opt-in Analytics

Product event telemetry — strictly opt-in, strictly PII-free.

---

## 1. Consent model

| Region | Default | Banner |
|---|---|---|
| EU / UK / Switzerland | Opt-OUT (no events until consent) | GDPR-compliant banner with "Accept" / "Reject" / "Customize" |
| California | Opt-IN with prominent "Do Not Sell" link | CCPA notice |
| Rest of world | Opt-IN with one-line notice | Dismissible toast |

Region detected from IP at first load. Stored as `account.privacy.analytics_consent: granted | denied | pending`.

## 2. Granularity of consent

User can independently toggle:
- **Essential** (always on; for billing, security, fraud detection).
- **Product analytics** (feature usage, performance).
- **Crash reports** (per `02-error-reporting.md`).
- **Beta program telemetry** (only relevant if on beta channel).

Default for opt-in regions: all on.
Default for opt-out regions: all off.

## 3. Settings surface

- `/account/privacy` page.
- Each toggle has plain-English description + link to data list.
- "Download my telemetry" button → CSV of last 90 d events tied to Account.
- "Delete all my telemetry" button → instant purge from event store + aggregated buckets re-counted within 24 h.

## 4. Event taxonomy

All events follow `<surface>.<object>.<verb>` naming:
- `extension.popup.opened`
- `web.collection.created`
- `mindmap.node.clicked`

Event payload schema:
```json
{
  "event": "string",
  "ts": "ISO 8601",
  "anon_id": "uuid (rotated yearly per device)",
  "session_id": "uuid (rotated per app session)",
  "account_id": "uuidv7 (only if consent granted)",
  "org_id": "uuidv7 (current org context)",
  "surface": "web|extension|api",
  "channel": "stable|beta",
  "platform": "macos|windows|linux|ios|android",
  "client_version": "semver",
  "properties": { ... event-specific ... }
}
```

## 5. PII rules

NEVER include in `properties`:
- URLs, titles, descriptions, notes (full or partial).
- Search queries (only `query_length`, `has_operators`, `operator_count`).
- Tag names (only `tag_count`).
- Member emails or names.
- IP (server logs only; not in event payload).
- File names (use `file_size`, `mime_type` instead).

ALLOWED:
- Counts, durations, enum values, boolean flags.
- Hashed identifiers when join needed.

Static linter on event definitions enforces this.

## 6. Event registry

- Single file `analytics/events.yaml` defines every allowed event + schema.
- CI fails build if code emits an event not in registry.
- Each event documented: purpose, owner team, retention, sampling rate.
- New events require code review + privacy review.

Excerpt:
```yaml
- name: extension.popup.save_clicked
  owner: extension-team
  sampling: 1.0
  retention: 90d
  properties:
    save_target_kind: { type: enum, values: [collection, group, inbox] }
    has_session_capture: { type: bool }
```

## 7. Sampling

| Volume | Sampling rate |
|---|---|
| < 1 event/min/user (avg) | 100% |
| 1-10/min | 10% |
| > 10/min | 1% |
| Ultra-high (scroll, mouse-move) | Aggregate client-side; emit summary every 60 s |

Sampling deterministic per-Account so cohorts remain consistent.

## 8. Transport

- Batched: events buffered client-side, flushed every 30 s or 50 events.
- HTTPS POST to `https://t.letsmarknow.com/v1/ingest`.
- gzip-compressed NDJSON.
- Failure: queued in IndexedDB; retried with exponential backoff up to 24 h.
- Beacon API used on `pagehide` to flush remaining.

## 9. Backend

- Self-hosted PostHog (or equivalent OSS).
- No third-party SDKs (no GA, no Mixpanel, no Segment).
- Data stays in our infrastructure (EU + US regions; user's residency respected).
- 90-day raw event retention; aggregated cohort metrics 2 y.

## 10. Dashboards

Internal-only:
- Daily/weekly active users.
- Feature adoption per surface.
- Funnels: signup → first save → 7-day retained.
- Performance: p95 latencies for search, save, sync.
- Plan distribution + conversion rates.

Public transparency report (annual):
- Aggregated counts only.
- Event categories + retention published.
- Linked from privacy policy.

## 11. Identity rotation

- `anon_id` rotates every 365 days OR when user clears local data.
- `account_id` only attached if user is signed in AND consented.
- Cross-device join uses signed-in `account_id`; never device fingerprinting.
- IP truncated server-side (`/24` v4, `/48` v6) before storage.

## 12. Telemetry of telemetry

- `analytics.consent_granted` / `analytics.consent_revoked`.
- `analytics.purge_requested`.
- `analytics.queue_overflow` (server health signal).

## 13. Edge cases

| Case | Behavior |
|---|---|
| Consent toggled mid-session | Future events follow new state; in-memory buffer flushed or discarded |
| User signs out | Stop attaching `account_id`; `anon_id` continues |
| User in EU but VPN to US | IP-based; user can override in settings |
| Event registry missing definition | Event dropped client-side + warning logged in dev mode |
| PostHog ingestion down | Queue persists; alert ops; no user-visible impact |
| Schema drift between client + registry | Strict validation; rejected events logged |

## 14. Tests

- Consent state controls event emission (every region default).
- PII linter catches forbidden properties.
- Sampling rate determinism per-Account.
- Purge endpoint removes all rows + recomputes aggregates.
- Beacon flush on `pagehide`.
- Queue retry with backoff under network failure.
