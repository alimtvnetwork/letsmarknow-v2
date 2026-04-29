# Billing Webhooks

Inbound webhook handling for Stripe + Paddle.

---

## 1. Endpoints

| Path | Processor |
|---|---|
| `POST /v1/webhooks/stripe` | Stripe |
| `POST /v1/webhooks/paddle` | Paddle |

Each endpoint:
1. Verifies signature.
2. Dedupes by `event.id`.
3. Routes to handler.
4. Returns 200 on success (even for unrecognized events; we log & ignore).
5. Returns 4xx for signature failure (do NOT retry).
6. Returns 5xx for transient handler failure (processor retries).

## 2. Signature verification

### Stripe
- Header: `Stripe-Signature`.
- Verify with `STRIPE_WEBHOOK_SECRET` (per environment).
- 5-min replay window (Stripe default).

### Paddle
- Header: `Paddle-Signature`.
- HMAC-SHA256 with `PADDLE_WEBHOOK_SECRET`.
- Compare in constant time.

## 3. Idempotency

`processed_webhook_events` table:
| Field | Type |
|---|---|
| `id` | text (event_id) |
| `processor` | enum |
| `event_type` | text |
| `payload_hash` | bytea |
| `processed_at` | timestamptz |
| `outcome` | enum (`ok \| ignored \| error_retried \| error_giving_up`) |

90-day retention.

On receipt:
1. INSERT with ON CONFLICT DO NOTHING by `(id, processor)`.
2. If conflict (already processed): return 200 immediately.
3. Else: route + execute; update `outcome`.

## 4. Event routing

Map event type → handler module:

| Stripe event | Handler |
|---|---|
| `checkout.session.completed` | `handlers/stripe/checkout_completed` |
| `customer.subscription.created` | `handlers/stripe/subscription_created` |
| `customer.subscription.updated` | `handlers/stripe/subscription_updated` |
| `customer.subscription.deleted` | `handlers/stripe/subscription_deleted` |
| `customer.subscription.trial_will_end` | `handlers/stripe/trial_will_end` |
| `invoice.created` | `handlers/stripe/invoice_created` |
| `invoice.finalized` | `handlers/stripe/invoice_finalized` |
| `invoice.paid` | `handlers/stripe/invoice_paid` |
| `invoice.payment_failed` | `handlers/stripe/invoice_failed` |
| `customer.updated` | `handlers/stripe/customer_updated` |
| `charge.refunded` | `handlers/stripe/charge_refunded` |
| `payment_method.attached` | `handlers/stripe/pm_attached` |
| `payment_method.detached` | `handlers/stripe/pm_detached` |

| Paddle event | Handler |
|---|---|
| `subscription.created` | `handlers/paddle/subscription_created` |
| `subscription.updated` | `handlers/paddle/subscription_updated` |
| `subscription.canceled` | `handlers/paddle/subscription_canceled` |
| `subscription.activated` | `handlers/paddle/subscription_activated` |
| `subscription.past_due` | `handlers/paddle/subscription_past_due` |
| `transaction.completed` | `handlers/paddle/transaction_completed` |
| `transaction.payment_failed` | `handlers/paddle/transaction_failed` |
| `customer.updated` | `handlers/paddle/customer_updated` |
| `adjustment.created` | `handlers/paddle/adjustment_created` |

Unknown events: logged, return 200, no-op.

## 5. Handler contract

Each handler:
- Pure function `(event, services) -> Result`.
- Side effects only via injected services (DB, email, telemetry).
- Idempotent within itself (handler may be called twice on same event due to upstream retries).
- Returns structured outcome; no exceptions thrown to dispatcher.

## 6. Out-of-order events

State machine on `org_subscription` tolerates out-of-order:
- Each event includes a timestamp.
- Compare against `last_synced_at` and ignore if older.
- For deletes, compare against `current_period_end` to detect stale "delete after recreate".

## 7. Failure handling

- Handler error → return 500 → processor retries with backoff.
- Persistent failure (10 retries) → mark event `error_giving_up` + page on-call.
- Side-channel: nightly reconciliation job pulls subscription state from processors and corrects drift.

## 8. Latency

- p95 webhook receipt → DB update < 500 ms.
- p99 < 2 s.
- Side-effects (emails, entitlement bust) fired async after DB commit.

## 9. Security

- Endpoints unauthenticated (relies on signature).
- Rate-limited per processor IP range (Cloudflare WAF).
- No CSRF (no cookies).
- All payloads logged at debug level only (PII redacted in production logs).

## 10. Logging

- Each event logged structured JSON: `{ event_id, type, processor, latency_ms, outcome }`.
- Errors include redacted payload + stack trace.
- Sampled 1% in production for noise control; 100% for failures.

## 11. Reconciliation job

Nightly:
1. List all active subscriptions per processor via API.
2. Compare with our `org_subscription` mirror.
3. For drift: fetch full subscription, simulate `subscription.updated` event through handler.
4. Report: count of corrections, total drift detected.

## 12. Telemetry

- `webhook.received` `{ processor, type }`
- `webhook.deduped` `{ processor, type }`
- `webhook.processed` `{ processor, type, latency_ms }`
- `webhook.failed` `{ processor, type, attempt, reason }`
- `webhook.signature_invalid` `{ processor }` (alert)
- `reconciliation.run` `{ corrections, drift_count }`

## 13. Edge cases

| Case | Behavior |
|---|---|
| Webhook before our DB row exists (race) | Buffer for 5 min; retry processing |
| Same event ID across processors | Different `(id, processor)` tuple — no conflict |
| Massive backlog after outage | Process in parallel with controlled concurrency (10 workers) |
| Handler throws unhandled exception | Caught by dispatcher; returns 500; processor retries |
| Processor adds new event type we don't handle | Logged as `unknown_event_type`; no-op; periodic review |

## 14. Tests

- Signature verification (positive + negative + tampering).
- Idempotency: same event 100x → same DB state.
- Out-of-order tolerance (`updated` before `created`).
- Reconciliation correctness on simulated drift.
- Per-handler unit tests with realistic fixtures.
