# Observability

Logs, metrics, traces, alerts, on-call. If you can't see it, you can't fix it.

---

## 1. Stack

| Signal | Tool | Notes |
|---|---|---|
| **Structured logs** | Cloud Function logs → forwarded to Better Stack (Logtail) | JSON only |
| **Metrics** | Prometheus-compatible (Lovable Cloud built-in) → Grafana | Dashboards-as-code |
| **Traces** | OpenTelemetry → Tempo (via Grafana Cloud free tier) | All API requests sampled at 10%, 100% for errors |
| **Error reporting** | Self-hosted GlitchTip (Sentry-compatible) | EU-residency, no third-party trackers |
| **Product analytics** | Self-hosted PostHog | Per `18-analytics-telemetry/01-opt-in-analytics.md` |
| **Uptime** | Cron `health-checks` + Better Stack synthetic monitors | 1 min cadence |
| **Status page** | Instatus | Auto-publishes incidents from PagerDuty |
| **On-call** | PagerDuty (or alternative free for small team) | Weekly rotation |

## 2. Log conventions

```json
{
  "level": "info|warn|error|debug",
  "ts": "ISO-8601",
  "msg": "human-readable",
  "trace_id": "uuidv7",
  "request_id": "uuidv7",
  "actor_account_id": "uuidv7|null",
  "org_id": "uuidv7|null",
  "event": "share.created|item.save_failed|...",
  "duration_ms": 42,
  "props": { "...": "structured event-specific" }
}
```

- Never log: passwords, tokens, share secrets, raw user content (URLs, titles, notes), email addresses (use hashed form for join queries).
- Always log: `trace_id`, `request_id`, `org_id`, outcome.
- PII redaction enforced by a logging middleware; bypassing it fails CI lint.

## 3. Metrics — golden signals

Per surface (web, API, marketing, extension SW):

- **Latency:** p50 / p95 / p99 per route.
- **Traffic:** RPS per route.
- **Errors:** rate per route, by status class.
- **Saturation:** CPU, memory, queue depth.

Plus business metrics:
- `signups_per_hour`, `saves_per_hour`, `shares_created_per_hour`, `mrr_estimated`, `active_orgs_24h`.

Dashboards live in `infra/grafana/` as JSON, deployed via CI.

## 4. Alerts

| Alert | Threshold | Severity | Action |
|---|---|---|---|
| API error rate | > 2% over 5 min | P1 | Page on-call |
| API p99 latency | > 1500 ms over 5 min | P2 | Slack #alerts |
| Web app JS errors | > 100 / 5 min | P2 | Slack |
| DB connection saturation | > 85% over 10 min | P1 | Page |
| Queue DLQ depth | > 50 any queue | P2 | Slack |
| Cron failure (3 consecutive) | — | P2 | Slack |
| Cert < 14d to expire | — | P3 | Email |
| Stripe webhook signature failure rate | > 1% | P1 | Page (security implication) |
| Failed login spike | > 10x baseline | P2 | Slack (possible attack) |
| Share-revoke purge SLA breach | > 5s p99 over 5 min | P2 | Slack |
| Backup verify failure | — | P1 | Page |
| Cost burn | > 110% of monthly budget projection | P3 | Email |

Each alert links to a runbook in `infra/runbooks/<alert-id>.md`.

## 5. On-call

- **Rotation:** weekly, primary + secondary.
- **Hours:** 24/7 for P1; business-hours-only for P3.
- **Acknowledge SLA:** P1 = 5 min, P2 = 30 min, P3 = next business day.
- **Resolve SLA:** P1 = 1 h MTTR target.
- **Postmortems:** mandatory for any P1 or any user-visible incident > 30 min. Blameless template in `infra/postmortems/`.

## 6. Tracing

- OpenTelemetry SDK in API and web app.
- Trace ID propagated via `traceparent` header.
- Sampling: 10% baseline, 100% for any request returning >= 500.
- Spans annotate: `org_id`, `route`, `db.statement` (sanitized), `queue.job_id`.

## 7. Privacy

- All telemetry residency = EU.
- User can purge own telemetry from `/account/privacy` (per `18-analytics-telemetry/`).
- No third-party SaaS tracker — every tool is self-hosted or has a signed DPA.

## 8. Cross-references

- Error reporting opt-in: `18-analytics-telemetry/02-error-reporting.md`
- Audit log (separate from observability): `17-admin-org/04-audit-log.md`
- Data handling: `19-security-privacy/02-data-handling.md`
