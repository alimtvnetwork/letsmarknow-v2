# Entitlements Engine

How capabilities are computed from plans + licenses + flags, then cached and served.

---

## 1. Concept

An **Entitlement** is a `(key, value)` pair stating what an Account-in-Org can do.

Inputs:
- Active subscription plan (per Org).
- Active lifetime licenses (per Account).
- Org overrides (Enterprise custom contracts).
- Feature flags (engineering controls; never grant paid features).
- Trial status.
- Member role (gates some entitlement keys).

Output: `Entitlements` map consumed by client + server.

## 2. Resolution algorithm

Per request context `(account_id, org_id)`:

```
1. Determine effective plan for the Org:
   plan = max_tier(
     org.subscription.plan if active,
     account.lifetime_license.plan if active,
     "free"
   )

2. Load plan_capability_matrix[plan] → base map

3. Apply overrides:
   - Org-level (Enterprise contracts)
   - Promo overrides (rare; coupon-attached upgrades)
   - Trial bumps (free → pro during trial)

4. Apply role gating:
   - Some keys (e.g. webhooks.write) require role >= admin
   - Filter from response if role insufficient

5. Compute hash:
   ent_h = sha256(canonical_json(map))

6. Return { values, hash, source_breakdown }
```

`max_tier` ranking: `free < pro < team < team_enterprise`. Lifetime plans rank with their tier (Lifetime Pro = pro).

## 3. Storage

- Plan capability matrix lives in `entitlements/plans.yaml` (versioned, code-reviewed).
- Org/Account state in DB:
  - `org_subscription` (Stripe/Paddle-backed)
  - `account_lifetime_licenses`
  - `org_entitlement_overrides` (rare; manually written by ops)
- No precomputed entitlements row; always derived on read.

## 4. Caching

- Result memoized in Redis keyed by `(account_id, org_id, plan_version)` for 5 min.
- Invalidation triggers:
  - Plan change (subscription updated).
  - License redeemed/revoked.
  - Override added/removed.
  - Plan matrix version bumped (rare; deploy-time).
  - Role change (per-key flag invalidation).
- Cache bust publishes Redis pub/sub `ent:bust:<account_id>:<org_id>`; clients with WebSocket receive `entitlement.changed` and refetch.

## 5. Distribution to client

- Embedded in JWT as `ent_h` (hash only; not full map).
- Full map fetched once on auth via `GET /v1/me/entitlements?org=<id>`.
- Client compares `ent_h` on each token refresh; mismatch → refetch full map.
- Cached client-side in TanStack Query for session.

## 6. Server enforcement

- Every protected route has a decorator:
  ```ts
  requireEntitlement("shares.public.cap.active", { mode: "below_cap" });
  ```
- The decorator pulls live entitlements (cache-aware) and rejects with `403 ENTITLEMENT_REQUIRED { key, current, required }` on fail.
- Cap-counting handled by separate counter store (Redis HyperLogLog for unique counts; precise counters for shares/members).

## 7. Client UX

- Disabled buttons show tooltip: "Available on Pro · Upgrade".
- Click → opens upgrade modal pre-selected to Pro/Team based on key's lowest plan.
- Hard caps display countdown ("3 of 3 public shares used").

## 8. Entitlement keys (canonical list)

Defined in `01-plans-matrix.md` § 8. Adding a new key requires:
1. Add to `plans.yaml` for every plan (default value).
2. Add server-side enforcement.
3. Add client UX gate.
4. Bump plan matrix version.
5. Migrate any cached values (cache TTL handles this naturally).

## 9. Trial handling

- During trial: Pro entitlements applied even though `org.subscription.plan = "free"`.
- `trial_active` flag in entitlements response (UI shows trial banner).
- On trial end: plan reverts; cache busted; banner updates to "Trial ended" CTA.

## 10. Lifetime + subscription stacking

- Lifetime grants its plan's entitlements permanently to the Account's Personal Org.
- Adding a Pro/Team subscription on top:
  - Stacking effect: max_tier wins.
  - Subscription is "pauseable" while lifetime covers; auto-pause on resolution if lifetime >= subscription.

## 11. Override mechanism

For Enterprise custom contracts:
- `org_entitlement_overrides`:
  - `key`, `value`, `reason`, `created_by`, `expires_at?`
- Override always wins over plan matrix for that key.
- All overrides audited.

## 12. Performance

- Resolution p99 < 5 ms (Redis hit).
- Resolution p99 cold < 30 ms (DB lookup + matrix eval).
- JWT `ent_h` adds < 64 bytes to token.

## 13. Telemetry

- `entitlement.resolved` `{ org_id, plan, source: "cache" | "db" }` (sampled 0.1%)
- `entitlement.denied` `{ key, current, required, role }`
- `entitlement.changed` `{ org_id, hash_old, hash_new }`
- `entitlement.upgrade_clicked` `{ key, from_plan, suggested_plan }`

## 14. Anti-abuse

- No client-supplied entitlements ever trusted.
- Tampered JWT (`ent_h` changed) → signature fails (JWT integrity).
- Race conditions on cap-counting handled atomically (Redis `INCR` with check).

## 15. Edge cases

| Case | Behavior |
|---|---|
| Plan downgrade reduces caps below current usage | Soft-block new creates; existing kept; banner explains |
| Override conflicts with plan downgrade | Override wins; flagged in admin UI |
| Cache miss + DB outage | Fail closed (return Free entitlements); telemetry alerted |
| Multiple Orgs per Account | Each Org has independent entitlements |
| API token requests | Inherit creator's role + Org plan; entitlements gated on token scopes too |

## 16. Tests

- Resolution algorithm unit tests across plan combos.
- Cache invalidation propagation < 5 s.
- Cap counter atomicity under concurrency.
- Override precedence tests.
- JWT hash matches map deterministically.
