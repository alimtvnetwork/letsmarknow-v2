# Feature Flags & Rollouts

How we ship features incrementally without redeploys, with safe defaults and consistent gating.

---

## 1. Two distinct systems

| System | Use | Drives |
|---|---|---|
| **Entitlements** | Plan / role gating (Pro / Team / Owner) | Feature availability |
| **Feature flags** | Gradual rollout, A/B tests, kill switches | Code branches |

Never conflate. Entitlements are *purchased*; flags are *engineering controls*.

## 2. Feature flag service

- Server: tiny in-house service `flagd` storing flags in Postgres + Redis cache.
- Decision API: `POST /v1/flags/evaluate` `{ account_id, org_id, context }` → `{ flag_id: variant }`.
- Decisions cached in client (TanStack Query, 5 min) and embedded in JWT for hot flags.
- Anonymous flags also supported (marketing site uses `client_id` from `localStorage`).

## 3. Flag types

- **Boolean**: on/off.
- **Multivariate**: A / B / C strings.
- **Percentage rollout**: 0–100% of bucket; sticky per `account_id` (or `client_id` anon).
- **Kill switch**: top-priority instant disable (flips Redis; clients pick up within 30 s).

## 4. Targeting rules

- By Account ID (allowlist).
- By Org ID (per-org rollout).
- By Plan (Pro+ only).
- By Country / locale.
- By Browser / extension version.
- By Account age (tenured users first).

Rules combined with explicit AND/OR; UI in admin panel; audit log on every change.

## 5. Naming convention

`area.subarea.behavior`:
- `dashboard.column_view.enabled`
- `extension.save.dedupe_prompt_v2`
- `billing.lifetime.appsumo_2026q2`
- `safety.share_revoke.kill_switch`

Always include the version when iterating: `..._v2`, `..._v3`. Old versions deprecated then removed after 30 days of 100% rollout on the new one.

## 6. Default values

- New flags MUST ship with a safe default that's identical to current behavior.
- Removing a flag requires the default to be the new behavior (no behavior change at removal time).
- Code paths assume default if `flagd` unreachable.

## 7. Rollout playbook

1. Implement behind flag at 0%.
2. Enable for internal Org (LMN team) at 100%.
3. Enable for opt-in beta cohort (Account flag).
4. 1% → 5% → 25% → 50% → 100% over days, watching error rates and key metrics.
5. After 14 days at 100%: remove flag and dead code in next release.

Rollbacks: kill switch flips to default in < 30 s.

## 8. A/B tests

- Multivariate flag with random assignment per `account_id` hash.
- Telemetry: `experiment.exposed` `{ flag, variant }` once per Account per experiment.
- Analysis dashboard reads from the warehouse; success metric pre-registered.
- Min sample size and duration set before launch; cannot peek-and-stop.

## 9. UI for flags

- Admin panel `/admin/flags` (Lovable Cloud-only; not in product nav) for ops.
- Each flag shows: id, description, owner, type, rollout %, targeting rules, last changed.
- Audit log per flag.
- "What's enabled for me?" inspector for Owners (read-only) shows non-secret flags relevant to their Org.

## 10. Anti-abuse

- No flag can grant entitlements.
- No flag can bypass billing.
- No flag can disable security telemetry or audit logging.
- All flag toggles audited with actor + reason.

## 11. Telemetry

- `flag.evaluated` (sampled 1%; useful for verification).
- `flag.toggled` `{ flag, from, to, actor, reason }` (server-side audit).
- `experiment.exposed` `{ flag, variant }`.
- `flag.kill_switch_engaged` `{ flag, reason }` (always alerted).

## 12. Local development

- `flagd` runs in dev with seed file `flags.dev.yaml` checked into repo.
- Override via env var `LMN_FLAG_<NAME>=true`.
- E2E tests pin flag values via test fixture before running.

## 13. Forbidden

- Flag-by-environment-variable in production code.
- Reading flags inside hot loops (cache once per render tree).
- Flags whose names imply marketing campaigns visible in client (use opaque IDs).
- Mixing entitlement checks and flag checks in one expression — wrap separately for clarity.

## 14. Tests

- Decision API unit tests for every targeting rule type.
- Determinism test: same `account_id` → same bucket across calls.
- Kill-switch integration: assert all clients pick up < 30 s.
- Cleanup test: build fails if flag removed without removing code paths (lint rule).
