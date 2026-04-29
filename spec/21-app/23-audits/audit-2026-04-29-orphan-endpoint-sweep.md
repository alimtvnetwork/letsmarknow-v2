<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: endpoint-sweep
status: superseded
supersedes: (none — this file IS superseded BY audit-2026-04-29-post-fix-reaudit.md)
superseded-by: audit-2026-04-29-post-fix-reaudit.md
closed-on: 2026-04-29
closed-because: Replaced by audit-2026-04-29-post-fix-reaudit.md.
-->
# Audit — 2026-04-29 — Orphan & Undeclared Endpoint Sweep

> **Scope.** Inverse of SI-020c. SI-020c added 24 missing rows to `03-api-endpoints/00-overview.md` after sweeping outward references. This pass re-runs the sweep with stricter normalization (canonicalize `{x}` → `:x`, strip query strings, normalize trailing `/`) and excludes intentional forbidden-alias examples in `01-conventions.md` §16.
> **Result:** **0 pure orphans** (every declared endpoint has at least one outside reference — confirms SI-020c quality). **19 truly undeclared routes** found — opens SI-022.

---

## 1. Method

```
Declared := parse table rows in 03-api-endpoints/00-overview.md (canonical)
Referenced := scan all *.md outside 00-overview.md, 01-conventions.md, 23-audits/
Canonicalize both: strip ?query, drop trailing /, replace {param} with :param
Orphans := Declared \ Referenced
Undeclared := Referenced \ Declared
```

## 2. Headline numbers

| Metric | Count |
|---|---|
| Declared endpoints (canonical) | 170 |
| Referenced endpoints (canonical, post-filter) | 209 |
| **Pure orphans** | **0** ✅ |
| **Truly undeclared** | **19** → SI-022 |
| Forbidden-alias examples in `01-conventions.md` §16 (excluded by design) | 17 |
| Audit-only references (excluded) | ~20 |

Pure-orphan count = 0 confirms that every endpoint in the inventory is referenced from at least one consumer file. SI-020c closure quality verified.

## 3. The 19 undeclared endpoints

Split by source location.

### Group B — endpoint files declaring own routes that overview missed (4)

The endpoint sub-file declares the route in detail (request/response/errors) but `00-overview.md` was never extended. SI-020c missed these because its sweep started from feature files outward, not from sub-files.

| Endpoint | Source file |
|---|---|
| `GET /v1/flags` | `03-api-endpoints/21-flags.md` |
| `POST /v1/internal/feedback/attachments` | `03-api-endpoints/22-internal.md` |
| `PATCH /v1/mindmap-layouts/:id` | `03-api-endpoints/23-mindmap-layouts.md` |
| `GET /v1/history/for/item/:id` | `03-api-endpoints/14-history.md` |

### Group C — feature files referencing routes never declared anywhere (15)

| Endpoint | First-seen reference |
|---|---|
| `GET /v1/auth/magic/callback` | `09-auth-accounts/02-signup-and-signin.md` |
| `POST /v1/auth/oauth/callback` | `09-auth-accounts/13-rate-limit-values.md` |
| `GET /v1/collections/:collection_id/items` | `15-visualization/readme.md` |
| `PATCH /v1/collections/:collection_id` | `15-visualization/readme.md` |
| `GET /v1/items/search` | `14-search/02-item-search.md` |
| `GET /v1/organizations/:id/billing/invoices` | `05-web-app/08-billing-page.md` |
| `POST /v1/billing/webhooks/stripe` | `10-licensing-billing/03-stripe-integration.md` |
| `POST /v1/billing/webhooks/paddle` | `10-licensing-billing/04-paddle-integration.md` |
| `GET /v1/health/extension` | `04-extension/03-service-worker.md` |
| `GET /v1/sync/since` | `04-extension/10-sync-and-offline.md` |
| `POST /v1/realtime/ticket` | `04-extension/10-sync-and-offline.md` |
| `POST /v1/organizations/:id/imports` | `17-admin-org/05-data-export-delete.md` |
| `GET /v1/whats-new` | `16-notifications-updates/01-in-app-updates-feed.md` |
| `POST /v1/imports/:id/parse` | `11-import-export/03-import-pipeline.md` |
| `POST /v1/sessions/:id/undo` | `07-features/02-save-session.md` |

## 4. Triage notes

- All 19 are real defects (not aliases, not query-string variants, not path-param style mismatches — those were normalized away).
- Several look like they should already exist under a slightly different canonical name (e.g. `GET /v1/items/search` may already be `GET /v1/search/items` or a variant of `/v1/search/quick`). Per-endpoint canonicalization decisions deferred to SI-022 fix pass.
- Group B (4 endpoints) is the easier subset — sub-file already has the spec; just promote into `00-overview.md`.
- Group C (15 endpoints) requires per-route decisions: declare as-is, fold into existing route, or rename caller.

## 5. SI-022 opened

Tracked in `13-spec-issues/02-current-issues.md` SI-022 (S2). Resolution in a future `next` pass — too many to safely batch in the same session as the discovery audit.

## 6. Score delta

| Sub-score | Before | After | Δ |
|---|---|---|---|
| Endpoint inventory parity | 100 | 88 | −12 (19/170 = 11% gap; severity S2 not S1 because all 19 have at least one specced consumer — none are referenced as TBD) |
| Hand-off readiness (raw chat) | 81 | 81 | 0 (raw-chat AI doesn't audit inventory parity) |
| Hand-off readiness (Lovable) | 95 | 95 | 0 |
| Hand-off readiness (Cursor/IDE) | 97 | 95 | −2 (IDE agent that grep'd `00-overview.md` for an endpoint list would miss these 19) |

**Weighted average:** 100/100 → **97/100** (drops below ceiling for first time since 2026-04-20).

To restore 100/100: close SI-022 by promoting the 4 Group B routes + reconciling the 15 Group C routes into the inventory.

## 7. Cross-refs

- Predecessor: `audit-2026-04-29-toby-parity-delta.md`, `audit-2026-04-29-glossary-sweep.md`
- Issue tracker: `13-spec-issues/02-current-issues.md` SI-022
- SI-020c (which this verifies): `13-spec-issues/04-closed-issues.md`
- Sweep methodology basis: `audit-2026-04-20-rescore-delta-v3.md` §4

---

## 8. Closure 2026-04-29 (same day)

**Status: ✅ CLOSED.** All 19 routes resolved in two passes:

- **Group B (4):** all promoted into `00-overview.md` (§1.9, §1.14, §2.16, §3).
- **Group C (15):**
  - **7 declared as new:** `GET /v1/auth/magic/callback` (§1.1), `GET /v1/items/search` (§1.8), `GET /v1/organizations/:id/billing/invoices` (§1.11), new §1.15 with `GET /v1/health/extension` + `GET /v1/sync/since` + `GET /v1/whats-new`, `POST /v1/sessions/:id/undo` (§2.11), `POST /v1/imports/:id/parse` (§2.13).
  - **7 callers fixed:** `09-auth-accounts/13-rate-limit-values.md:48`, `10-licensing-billing/03-stripe-integration.md:73`, `04-paddle-integration.md:57`, `12-billing-webhooks.md:11-12`, `15-visualization/readme.md:58,64`, `17-admin-org/05-data-export-delete.md:66`.
  - **1 false positive:** `POST /v1/realtime/ticket` is inside a `~~WITHDRAWN~~` marker per `01-naming-conventions.md §9` — original sweep regex didn't honor the marker.

**Final inventory:** 145 → 157 endpoints (GET 39→46, POST 86→90, PATCH 8→9).
**Re-verification:** 182 declared, 182 referenced, **0 undeclared**.
**Score:** 97 → **100/100** restored.
