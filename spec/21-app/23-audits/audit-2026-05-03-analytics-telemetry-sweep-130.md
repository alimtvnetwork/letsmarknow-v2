# Audit 130 — `18-analytics-telemetry/` Sweep

**Date:** 2026-05-03 MYT
**Session:** 130
**Scope:** First broad sweep of all 4 spec files in `spec/21-app/18-analytics-telemetry/`.

---

## 1. Findings

| Check | Result |
|-------|--------|
| ULID references | 0 ✅ |
| Bare "Workspace" | 0 ✅ |
| Hard-coded hex | 0 ✅ |
| Non-`/v1/` paths | 0 ✅ |
| Endpoint inventory | `/v1/ingest` lives on **separate telemetry subdomain** `t.letsmarknow.com` — out of scope for `03-api-endpoints/00-overview.md` (which scopes only `api.letsmarknow.com`). |

## 2. Patches Applied

**F1 — `01-opt-in-analytics.md §8`:** Annotated the `/v1/ingest` line to make the host-scope boundary explicit, so a future reviewer doesn't open it as an undeclared-endpoint SI (cf. SI-022).

## 3. Outcome

`18-analytics-telemetry/` clean. Score impact: 0.
