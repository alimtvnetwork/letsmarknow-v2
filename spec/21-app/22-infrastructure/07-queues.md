# Queues

Background-job system. Anything async + retryable goes here.

---

## 1. Engine

- **Primary:** Lovable Cloud queue primitives (Postgres `pgmq` or equivalent), invoked from Edge Functions.
- **Why not external (SQS/Rabbit/etc.):** keeps trust boundary inside Cloud, no extra secrets, transactional with the DB.
- **Phase 4 escape hatch:** if throughput crosses 100 req/s sustained, migrate to a dedicated queue (Upstash QStash or Redis Streams) without changing producers (queue interface stays the same).

## 2. Queue catalog

| Queue | Producer | Consumer (Edge Function) | Purpose | Max attempts | Backoff | DLQ |
|---|---|---|---|---|---|---|
| `imports` | API on file upload | `process-import` | Parse + commit imports | 5 | exp 30s→30m | `imports-dlq` |
| `exports` | API on export request | `process-export` | Generate ZIP/JSON, upload, email link | 3 | exp 30s→10m | `exports-dlq` |
| `email-out` | API + cron | `send-email` | Transactional emails via Resend | 5 | exp 30s→1h | `email-out-dlq` |
| `webhooks-out` | API on event | `deliver-webhook` | Org outbound webhooks | 8 | exp 60s→24h | `webhooks-out-dlq` |
| `webhooks-in` | API webhook endpoint | `process-webhook-in` | Stripe / Paddle event processing | 5 | exp 30s→1h | `webhooks-in-dlq` |
| `favicon-fetch` | API on item save | `fetch-favicon` | Resolve + cache favicon | 3 | exp 30s→10m | `favicon-fetch-dlq` |
| `og-render` | API on share create/update | `render-og` | Generate OG card | 3 | exp 30s→10m | `og-render-dlq` |
| `share-revoke` | API on revoke | `purge-share-cache` | Edge cache purge + analytics flush | 3 | exp 5s→1m | `share-revoke-dlq` |
| `analytics-rollup` | cron (hourly) | `rollup-analytics` | Aggregate raw events → metrics | 3 | exp 60s→30m | `analytics-rollup-dlq` |
| `notifications` | API on event | `send-notification` | In-app + push + email per user prefs | 5 | exp 30s→1h | `notifications-dlq` |

## 3. Job envelope

```json
{
  "job_id": "uuidv7",
  "queue": "imports",
  "payload": { "...": "queue-specific" },
  "enqueued_at": "ISO-8601",
  "attempt": 1,
  "max_attempts": 5,
  "trace_id": "uuidv7",
  "actor_account_id": "uuidv7|null",
  "org_id": "uuidv7|null"
}
```

## 4. Idempotency

- Every job carries `job_id` (UUIDv7) — consumers MUST upsert by `job_id` before doing side-effects.
- External calls (Stripe, Resend) use `Idempotency-Key: <job_id>`.

## 5. Retry & DLQ semantics

- Transient failures (network, 5xx) → retry per backoff schedule.
- Permanent failures (4xx other than 429, validation) → straight to DLQ.
- DLQ inspected weekly by on-call; replay button per item in admin panel.
- Alert fires if DLQ depth > 50 for any queue.

## 6. Concurrency limits

| Queue | Max concurrent workers |
|---|---|
| `imports` | 4 (CPU-bound parsing) |
| `exports` | 4 |
| `email-out` | 8 |
| `webhooks-out` | 16 |
| `webhooks-in` | 8 |
| `favicon-fetch` | 16 (mostly I/O) |
| `og-render` | 4 (CPU + memory) |
| `share-revoke` | 8 |
| `analytics-rollup` | 1 (serialized) |
| `notifications` | 8 |

## 7. SLA

- Enqueue latency < 50ms p95.
- Job pickup latency < 2s p95 for hot queues, < 30s for cold queues.
- Share revoke end-to-end purge: **5s p99** (per `08-sharing-collab/12-revocation-and-expiry.md`).

## 8. Cross-references

- Cron jobs: `08-cron.md`
- Observability: `10-observability.md`
- Webhook reliability: `03-api-endpoints/17-billing-webhooks.md`
