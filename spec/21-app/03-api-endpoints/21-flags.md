# Feature-Flag Endpoints

> **Scope.** Runtime flag-evaluation surface for the client (web app, extension, share viewer). The flag definitions, rollout percentages, and targeting rules are owned by `07-features/15-feature-flags-and-rollouts.md §19`. This file documents only the contract the client uses to ask the server "for this Account in this Org with this context, what variant of each flag should I render?"

All endpoints require bearer auth + `X-Organization-Id` unless noted.

---

### Evaluate flags for the current context
`POST /v1/flags/evaluate`

**Auth:** bearer + `X-Organization-Id` (Org optional; flags can be evaluated for the Account alone)
**Idempotent:** yes (server returns the same variant assignment for the same `(account, org, context)` tuple within the bucketing-stability window)
**Rate limit class:** `read` (300 / min per Account; clients should cache for at least 60 s)

> **Why POST not GET.** The `context` payload (URL, surface, user-agent fragments, locale, A/B cohort hint) can exceed practical query-string limits, and the evaluator needs a deterministic body for response caching keyed by content-hash. POST with `Idempotency-Key` is the cleanest fit.
>
> **Why a single endpoint rather than `GET /v1/flags`.** The evaluator returns ONLY the flags the calling client knows about, so each surface (web app, extension popup, share viewer) sends the flag-key list it cares about and gets a focused response. This avoids leaking flag names for unreleased features.

**Request body**
```json
{
  "flags": ["mindmap_v2", "ai_assist", "share_password_v2"],
  "context": {
    "surface": "web_app",
    "url_host": "app.letsmarknow.com",
    "locale": "en-US",
    "client_version": "1.4.2",
    "session_age_minutes": 12
  }
}
```
- `flags` — required, max 100 keys per request. Unknown keys are silently dropped from the response (NOT 404).
- `context` — optional; the evaluator uses `account_id`, `org_id`, and `context.*` to pick a variant. All `context` fields are optional; pass what you have.

**Response 200**
```json
{
  "data": {
    "evaluated_at": "2026-04-20T08:30:00Z",
    "ttl_seconds": 60,
    "flags": {
      "mindmap_v2": { "variant": "on", "reason": "rollout_50pct", "payload": null },
      "ai_assist": { "variant": "off", "reason": "not_in_targeting" },
      "share_password_v2": { "variant": "control", "reason": "ab_cohort_a", "payload": { "ui": "v1" } }
    },
    "exposure_logged": true
  }
}
```

**Field semantics**
- `variant` — flag-defined string. Boolean flags use `"on"`/`"off"`. Multi-variant flags use the names declared in the flag definition.
- `reason` enum: `default | rollout_pct | rollout_email_allowlist | rollout_org_allowlist | ab_cohort_a | ab_cohort_b | killswitch | not_in_targeting | flag_unknown`. Used by debug overlays; never gate UI on `reason`.
- `payload` — optional JSON config attached to the variant (e.g. UI copy, threshold values).
- `exposure_logged` — `true` when the server counted this evaluation as an A/B exposure for analytics. Clients SHOULD NOT log a duplicate exposure.

**Caching**
- Response is cacheable by the client for `ttl_seconds` (default 60).
- Cache key: hash of `(account_id, org_id, sorted(flags), context)`.
- On variant change mid-session, the server bumps `evaluated_at`; clients re-fetch when stale.

**Errors**
- `400 VALIDATION_FAILED` — `flags` array empty or > 100 keys.
- `429 RATE_LIMITED` — client exceeded per-minute budget (likely missing local cache).

See also `07-features/15-feature-flags-and-rollouts.md §19`.
