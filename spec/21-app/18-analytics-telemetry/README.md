# 18 — Analytics & Telemetry

How we learn what's working without violating user trust.

## Reading order

1. `opt-in-analytics.md` — product analytics events, opt-in model.
2. `error-reporting.md` — crash + exception capture.

## Files

| File | Purpose |
|---|---|
| `opt-in-analytics.md` | Product event telemetry |
| `error-reporting.md` | Crash + exception capture |

## Locked rules

- **Opt-in by default for EU/UK users**; opt-out elsewhere with prominent banner.
- **Never log PII** (no URLs, no titles, no notes, no search queries by default).
- **Aggregated only** for cross-Account analysis.
- **User can purge** all their telemetry from `/account/privacy` at any time.
- **Free-text inputs never sent**, only metadata (length, has_operators, etc.).
- **Self-hosted analytics** (PostHog / Plausible / OSS) — no third-party trackers.
- **Sampling**: high-volume events sampled to ≤ 5% of users at any time.
- **Retention**: raw events 90 d, aggregated metrics 2 y.
