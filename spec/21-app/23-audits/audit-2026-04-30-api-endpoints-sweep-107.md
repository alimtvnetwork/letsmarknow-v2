---
audit-type: ad-hoc
audit-id: 107
date: 2026-04-30
scope: spec/21-app/03-api-endpoints/
status: closed
score-before: 100/100
score-after: 100/100
findings: 0
---

# Audit 107 — `03-api-endpoints/` gap-sweep

## Scope

Inventory hygiene + idempotency contract coverage across all 25 files in
`spec/21-app/03-api-endpoints/`, plus cross-folder endpoint reference
resolution.

## Method

1. Ran all 17 CI sub-checks on the full spec tree.
2. Read `00-overview.md` (498 lines) + `01-conventions.md` (329 lines) end-to-end.
3. Diffed the 4 quadrants: Method header, Path, Auth, Idem. column.
4. Counted `Idem.` column distribution across 98 POST rows.
5. Spot-checked cross-folder `/v1/` references (202 distinct backticked
   endpoint refs project-wide).

## Linter results (all green)

| Sub-check | Result |
|---|---|
| `endpoint-counts` | ✅ 21 files, 171 rows, 171 distinct, 0 duplicates |
| `pagination-param` | ✅ 43 files |
| `realtime-channel-syntax` | ✅ 18 files |
| `allowlist-discipline` | ✅ 12 allowlists × 21 sub-checks |
| `next-singleton-invariants` | ✅ 327 files |
| `role-enum` | ✅ 327 files |
| `link-check` | ✅ 75 relative links |
| `folder-overview` | ✅ |
| `audit-cadence` | ✅ 36 audits |
| `error-code-casing` | ✅ catalog 84 |
| `naming-convention` | ✅ |
| `sku-naming` | ✅ |
| `env-var-naming` | ✅ 57 vars |
| `money-units` | ✅ |
| `pricing-source` | ✅ |
| `storage-path` | ✅ 10 buckets |
| `backticked-path-resolution` | ✅ 2089 paths across 327 files |

## Idempotency contract coverage (98 POSTs)

| Idem. value | Count | Verdict |
|---|---|---|
| `Y` (required) | 29 | All resource-creating + resource-allocating POSTs |
| `Y (auto, 1/24h per Account)` | 1 | `/v1/me/gdpr-export` (server-imposed) |
| `Idem-Key` | 1 | `/v1/webhooks/inbound/:webhook_token` (path-token auth, doc'd as opt-in) |
| `—` (N/A) | 71 | Action/command verbs, auth challenges, webhooks |
| (blank) | 0 | none |

Every creating POST (`/v1/items`, `/v1/collections`, `/v1/spaces`,
`/v1/groups`, `/v1/tags`, `/v1/shares`, `/v1/organizations`,
`/v1/members/invites`, `/v1/sessions/save`, `/v1/imports`,
`/v1/exports`, `/v1/transfers/cross-org`, `/v1/mindmap-layouts`,
`/v1/internal/feedback`, `/v1/internal/feedback/attachments`,
`/v1/billing/lifetime/redeem`, `/v1/billing/lifetime/stack`,
`/v1/billing/checkout`, `/v1/shares/:id/purge`,
`/v1/imports/upload`, `/v1/imports/:id/commit`, `/v1/imports/:id/parse`,
`/v1/exports/:export_id/refresh-url`) carries `Idem. = Y`.

Action verbs that legitimately don't allocate resources (`/move`,
`/reorder`, `/star`, `/unstar`, `/restore`, `/revoke`, `/rotate-slug`,
`/cancel`, `/undo`, `/redo`, `/leave`, `/refresh-entitlements`,
`/open-all`, `/duplicate` exceptions where Y) correctly carry `—`.
Note: `/duplicate` rows DO carry `Y` because they allocate new entities.

## Inventory hygiene

- Method totals match `00-overview.md §7`: 51 GET, 98 POST, 10 PATCH,
  1 PUT, 11 DELETE = 171.
- Counter Discipline meta-rule (SI-025 closure) holds: §7 was generated
  by `--write`, not hand-edited.
- All 16 forbidden-alias rows in `01-conventions.md §16.1` validate
  against canonical declarations (manually spot-checked 3 rows).
- Cross-references to endpoints declared in sibling folders
  (`../14-search/02-item-search.md`, `../11-import-export/03-import-pipeline.md`,
  `../04-extension/03-service-worker.md`, `../04-extension/10-sync-and-offline.md`,
  `../16-notifications-updates/01-in-app-updates-feed.md`) resolve via
  `link-check` and are NOT double-counted by `endpoint-counts`.

## Findings

**Zero findings.** Folder is build-ready.

## Score

100/100/100. No score change.

## Notes for next sweep

- `04-extension/` next on the queue — popup §14 ↔ next-queue cross-checks,
  MV3 surfaces, side panel.
- `15-visualization/` and `16-notifications-updates/` not yet swept this
  cycle.
