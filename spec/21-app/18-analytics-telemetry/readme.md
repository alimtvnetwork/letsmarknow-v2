# 18 — Analytics & Telemetry

How we learn what's working without violating user trust.

## Reading order

1. `01-opt-in-analytics.md` — product analytics events, opt-in model.
2. `02-error-reporting.md` — crash + exception capture.
3. `03-events.md` — **canonical event taxonomy** (single source of truth for every event name, props schema, owner).

## Files

| File | Purpose |
|---|---|
| `01-opt-in-analytics.md` | Product event telemetry |
| `02-error-reporting.md` | Crash + exception capture |
| `03-events.md` | Master event catalog — every event name, props, owner, sampling |

## Locked rules

- **Opt-in by default for EU/UK users**; opt-out elsewhere with prominent banner.
- **Never log PII** (no URLs, no titles, no notes, no search queries by default).
- **Aggregated only** for cross-Account analysis.
- **User can purge** all their telemetry from `/account/privacy` at any time.
- **Free-text inputs never sent**, only metadata (length, has_operators, etc.).
- **Self-hosted analytics** (PostHog / Plausible / OSS) — no third-party trackers.
- **Sampling**: high-volume events sampled to ≤ 5% of users at any time.
- **Retention**: raw events 90 d, aggregated metrics 2 y.
