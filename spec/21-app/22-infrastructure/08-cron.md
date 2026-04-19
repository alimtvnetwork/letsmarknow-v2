# Cron

Scheduled jobs. All times UTC. All jobs idempotent (safe to run twice).

---

## 1. Schedule

> **F-M20 closure (2026-04-19):** Every job below carries an explicit `timezone` field. The global default is `UTC`; any future job that needs business-local scheduling must override this column rather than relying on implicit conversion. Job runners MUST read this column when registering crons (do not parse the cadence string for tz hints).

| Job | Cadence | Cron expr | Timezone | Purpose |
|---|---|---|---|---|
| `purge-trash` | hourly | `0 * * * *` | `UTC` | Hard-delete entities past 30d soft-delete grace |
| `purge-expired-shares` | every 5 min | `*/5 * * * *` | `UTC` | Set `expires_at < now` shares to `revoked` |
| `rotate-share-cache` | every 5 min | `*/5 * * * *` | `UTC` | Edge cache invalidation sweep |
| `dunning-charge-retry` | daily 10:00 | `0 10 * * *` | `UTC` | Retry failed Stripe/Paddle charges per dunning ladder |
| `dunning-email` | daily 10:30 | `30 10 * * *` | `UTC` | Send dunning emails (T+1, T+3, T+7, T+14) |
| `analytics-rollup-hourly` | hourly | `5 * * * *` | `UTC` | Roll raw events → hourly aggregates |
| `analytics-rollup-daily` | daily 01:00 | `0 1 * * *` | `UTC` | Roll hourly → daily |
| `analytics-purge-raw` | daily 02:00 | `0 2 * * *` | `UTC` | Drop raw events older than 90d |
| `audit-log-archive` | daily 03:00 | `0 3 * * *` | `UTC` | Move >90d audit entries to cold storage |
| `import-cleanup` | daily 04:00 | `0 4 * * *` | `UTC` | Delete `imports/` bucket files older than 24h (per `12-storage-layout.md` §5) |
| `export-cleanup` | daily 04:30 | `30 4 * * *` | `UTC` | Delete `exports/` bucket files older than 7d (per `12-storage-layout.md` §5) |
| `favicon-refresh` | weekly Sun 05:00 | `0 5 * * 0` | `UTC` | Refresh stale favicons (90d TTL) |
| `seat-quota-recompute` | daily 06:00 | `0 6 * * *` | `UTC` | Recompute Org seat counts; mark over-quota |
| `notifications-digest-email` | daily 16:00 | `0 16 * * *` | `UTC` | Daily digest email per user prefs |
| `tag-usage-recount` | weekly Mon 07:00 | `0 7 * * 1` | `UTC` | Rebuild `Tag.usage_count_cache` |
| `mfa-recovery-prune` | monthly 1st 02:00 | `0 2 1 * *` | `UTC` | Drop unused MFA recovery codes >1y old |
| `session-expiry-sweep` | hourly | `15 * * * *` | `UTC` | Hard-delete expired session rows |
| `webhook-dlq-alert` | every 15 min | `*/15 * * * *` | `UTC` | Alert if any DLQ depth > 50 |
| `backup-verify` | daily 23:00 | `0 23 * * *` | `UTC` | Restore latest backup to staging; assert row counts |
| `cert-expiry-check` | daily 08:00 | `0 8 * * *` | `UTC` | Alert if any cert < 14d to expire |
| `health-checks` | every 1 min | `* * * * *` | `UTC` | Hit `/health` per surface; record uptime |

## 2. Invocation

- Lovable Cloud scheduled functions (or `pg_cron` on the DB for pure SQL jobs).
- Each cron call hits an Edge Function with header `Authorization: Bearer ${CRON_SECRET}`.
- Cron Edge Function enqueues a job to the relevant queue (see `07-queues.md`) and returns immediately. **Cron does no work itself**; it only schedules.

## 3. Failure handling

- Cron runs are logged with start/end + outcome.
- If a cron run fails 3 consecutive times → page on-call.
- Backfill: any missed run within 4h is auto-rerun on the next successful invocation; older misses require manual replay.

## 4. Owner-facing time

All jobs default to `timezone: UTC` per §1. Owner-facing dates render in Asia/Kuala_Lumpur (UTC+8) per project memory. Backend never converts; UI does. Any future job needing local-business scheduling MUST set its own `timezone` value (e.g., `Asia/Kuala_Lumpur`) and not rely on offsetting the cron expression.

## 5. Cross-references

- Queues: `07-queues.md`
- Dunning policy: `10-licensing-billing/09-dunning-and-recovery.md`
- Backups: `02-environments.md` §3
- Audit retention: `12-history-undo/01-event-log.md`
