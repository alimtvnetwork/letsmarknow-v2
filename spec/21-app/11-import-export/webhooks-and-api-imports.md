# Webhooks & API Imports

Programmatic item ingestion. Team-tier feature.

---

## 1. Two modes

1. **API push** — caller POSTs items to our API.
2. **Webhook receive** — we accept inbound webhooks from third-parties (Zapier, Make, n8n, IFTTT, custom).

Both share the same backend ingestion pipeline.

## 2. API push

### Endpoint
`POST /v1/items` (single) or `POST /v1/items:batch` (up to 100 per call).

### Auth
Bearer API token (issued in `/settings/api`). Token scopes:
- `items:write` — required for item create.
- `items:read` — required for item fetch.
- `collections:write` — required to create Collections from API.
- `tags:write` — required to create Tags from API.

### Request
```http
POST /v1/items HTTP/1.1
Authorization: Bearer lmn_pat_...
Idempotency-Key: <uuid>
Content-Type: application/json

{
  "url": "https://example.com",
  "title": "Example",
  "description": "Optional",
  "tags": ["read-later"],
  "collection_id": "01J...",
  "group_id": null,
  "note": "Markdown note",
  "starred": false,
  "imported_from": "zapier"
}
```

### Response 201
```json
{ "data": { "id": "01J...", "url": "...", ... } }
```

### Errors
- `400` validation
- `401` auth
- `402` quota / entitlement
- `409` `Idempotency-Key` conflict (returns prior result)
- `429` rate limit

## 3. Webhook receive

For platforms that need a URL to POST to (Zapier "Webhooks by Zapier", IFTTT, etc.).

### Endpoint
`POST /v1/webhooks/inbound/:webhook_token`

`webhook_token` issued in `/settings/api/webhooks`; opaque 32-char string. Token is the auth (per-Org).

### Webhook config
Per token:
- Target Collection ID.
- Default tags (applied to every received item).
- Field mapping (JSON path → LMN field) — stored as JMESPath expressions.
- Duplicate handling (merge / keep_both / skip).
- Active: bool.

### Field mapping example
```json
{
  "url_path": "$.link",
  "title_path": "$.title",
  "tags_path": "$.categories",
  "tags_split": ","
}
```

Configurable in UI with live preview against last received payload.

### Verification (optional)
- Some sources sign payloads (e.g., Stripe-style HMAC).
- Per-webhook setting: HMAC secret + header name.
- If configured, signature verified before processing.

## 4. Rate limits

| Tier | API requests/min | Webhook events/min |
|---|---|---|
| Pro | 60 (read), n/a (write) | n/a |
| Team | 600 (read), 60 (write) | 60 |
| Enterprise | custom | custom |

429 with `Retry-After` header. Buckets per token.

## 5. Idempotency

- `Idempotency-Key` header required on all writes.
- Stored 24h; replay returns prior response.
- Webhook receive uses `event.id` from payload OR `body_hash` if no ID present.

## 6. Webhook outbound (alternative direction)

Separate concern: notify external systems on LMN events.

- `/settings/api/outbound-webhooks`.
- Subscribe to events: `item.created`, `item.updated`, `item.deleted`, `share.created`, `share.viewed`.
- POST JSON to user URL on each event.
- Retries: 5 attempts over 24h with exponential backoff.
- Signing: HMAC-SHA256 with shared secret in header `X-LMN-Signature`.
- Health: badge in UI shows last delivery status; auto-disable after 100 consecutive failures.

## 7. Token management

- Personal access tokens (PATs) issued in `/settings/api`.
- Format: `lmn_pat_<env>_<random>` (env = `live` or `test`).
- Display once at creation; hash-stored thereafter.
- Per-token: name, scopes, last_used_at, IP allowlist (optional).
- Rotation reminder at 90 days (banner).
- Revocable instantly.

## 8. OAuth (Pro+ for native integrations)

- Standard OAuth 2.0 Authorization Code + PKCE.
- For first-party apps (extension uses session token instead) and select partners.
- Scopes mirror PAT scopes.
- Refresh tokens with rotation.

## 9. Audit & telemetry

Every API write logged:
- Token ID
- Account ID (token owner)
- IP
- Endpoint
- Result code
- Idempotency outcome

Telemetry:
- `api.request` `{ endpoint, status, latency_ms, token_id }` (sampled)
- `api.rate_limited` `{ endpoint, token_id }`
- `webhook.inbound_received` `{ token_id, source_ip }`
- `webhook.inbound_failed` `{ token_id, reason }`
- `webhook.outbound_delivered` `{ event, attempt }`
- `webhook.outbound_failed` `{ event, attempt, reason }`
- `webhook.outbound_disabled_auto` `{ token_id }`

## 10. Security

- All endpoints HTTPS-only.
- TLS 1.2+ required.
- Tokens never logged.
- Webhook payloads logged with PII redaction.
- IP allowlist optional per token.
- CORS: API allows `*` for read; writes require token (no cookie auth).

## 11. Edge cases

| Case | Behavior |
|---|---|
| Duplicate idempotency key with different body | Reject with 409 + `previous_response_hash` |
| Webhook token leaks publicly | Owner alerted on usage anomaly; quick-revoke from UI |
| Outbound webhook URL becomes invalid (DNS, 404) | Auto-disable after 100 failures; email Owner |
| Webhook payload exceeds size limit (1 MB) | Reject 413; Owner notified |
| Concurrent webhook deliveries for same event | At-least-once; consumer must dedupe by event ID |

## 12. Tests

- API auth + scope enforcement.
- Idempotency replay correctness.
- Webhook signature verification.
- Outbound retry + backoff schedule.
- Rate-limit bucket accuracy under burst.
- Field mapping JMESPath correctness.
