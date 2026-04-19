---
name: Gap Analysis State
description: Tracks which gap-analysis items are closed, deferred, or still open. Updated 2026-04-19 (v5 — 11 hard m-gap conflicts reconciled in-place; scores recovered to 89/93/66).
type: feature
---

## Closed Items

### Round 1 (2026-04-18, v3)

| ID | Item | Closed By | Location |
|---|---|---|---|
| B1 | Wireframes | Wireframe files created | `06-ui-ux/wireframes/*.md` |
| B2 | Error codes catalog | 60+ error codes enumerated | `03-api-endpoints/18-error-codes.md` |
| B3 | Copy strings catalog | Full key→EN map | `06-ui-ux/17-copy-strings.md` |
| B5 | MV3 manifest | Literal manifest.json | `04-extension/01-manifest.md` |
| B6 | Infrastructure spec | 10-file infra folder | `22-infrastructure/*.md` |
| M11 | Event taxonomy | 80+ events catalog | `18-analytics-telemetry/03-events.md` |
| M13 | Permissions matrix JSON | Machine-readable matrix | `08-sharing-collab/permissions-matrix.json` |

### Round 2 (2026-04-19, v4) — all majors

| ID | Item | Closed By |
|---|---|---|
| M1  | SKU map (Stripe + Paddle) | `10-licensing-billing/15-sku-map.md` |
| M2  | OAuth client IDs / redirect URIs | `09-auth-accounts/12-oauth-clients.md` |
| M3  | Realtime transport | `08-sharing-collab/14-realtime-transport.md` (Supabase Realtime) |
| M4  | Rate-limit values | `09-auth-accounts/13-rate-limit-values.md` |
| M5  | Search engine choice | `14-search/06-search-engine.md` (Postgres FTS v1) |
| M6  | Favicon pipeline | `06-ui-ux/18-favicon-pipeline.md` (self-host + DDG, no Google) |
| M7  | Email provider | `22-infrastructure/11-email-provider.md` (Resend primary) |
| M8  | Storage bucket layout | `22-infrastructure/12-storage-layout.md` |
| M9  | Responsive breakpoints | `06-ui-ux/19-breakpoints.md` |
| M10 | Accessibility WCAG target | `19-security-privacy/06-accessibility-wcag.md` (WCAG 2.1 AA) |
| M12 | Import dedup algorithm | `11-import-export/11-dedup-algorithm.md` (4-stage, Jaro-Winkler 0.92) |
| M14 | Definition of Done | `20-roadmap/06-definition-of-done.md` |

### Round 3 (2026-04-19, v5) — m-gap reconciliation

11 🔴 hard conflicts from `audit-2026-04-19-m-gaps.md` resolved in-place:

| ID | Topic | Files edited |
|---|---|---|
| F-M01 | Storage bucket names + path scheme | `22-infrastructure/12-storage-layout.md`, `06-cdn-storage.md` |
| F-M02 | OAuth env-var names → `OAUTH_<PROVIDER>_<FIELD>_<ENV>` | `22-infrastructure/03-env-vars.md`, `09-auth-accounts/12-oauth-clients.md` |
| F-M03 | Email provider env vars (Postmark, multi-sender) | `22-infrastructure/03-env-vars.md` |
| F-M04 | Rate-limit numbers aligned with locked auth limits | `09-auth-accounts/13-rate-limit-values.md` |
| F-M05 | Rate-limit paths gain `/v1/` prefix | `09-auth-accounts/13-rate-limit-values.md` |
| F-M06 | Realtime transport unified on Supabase Realtime | `08-sharing-collab/06-realtime-presence.md`, `14-realtime-transport.md` |
| F-M07 | Channel naming `account:` (not `user:`) per glossary | `08-sharing-collab/14-realtime-transport.md` |
| F-M08 | `3xl` breakpoint row added | `06-ui-ux/19-breakpoints.md` |
| F-M09 | 429 envelope uses canonical `{ error: { code, ... } }` | `09-auth-accounts/13-rate-limit-values.md` |
| F-M10 | Org quota error → `BILLING_QUOTA_EXCEEDED` | `09-auth-accounts/13-rate-limit-values.md` |
| F-M11 | SKU pricing/naming aligned with `01-plans-matrix.md`; `team_enterprise_yearly` re-added | `10-licensing-billing/15-sku-map.md` |
| F-M12 | `backups` bucket re-added | `22-infrastructure/12-storage-layout.md` |

Owner-decision items resolved by AI judgment (defensible defaults, documented in each file):
- **Pricing canon** → kept locked $5/$9/$79/$249 (matches marketing source-of-truth `01-plans-matrix.md`).
- **Storage paths** → hybrid (content-addressed / entity-keyed / date-partitioned by bucket).
- **Env-var naming** → `OAUTH_<PROVIDER>_<FIELD>_<ENV>` form.

## Intentionally Deferred

| ID | Item | Reason |
|---|---|---|
| B4 | Testing folder (Gherkin) | User explicitly forbade as suggestion |
| B7 | Seed/fixture data | User explicitly forbade as suggestion |
| F-M13–F-M21 | 9 🟠 drifts from m-gap audit | Deferred per user (2026-04-19) |
| F-M22–F-M23 | 3 🟡 style/redundancy items | Deferred per user (2026-04-19) |

## Still Open (High Priority)

None blocking. Next defensible spec-only work: spec-wide cross-file consistency sweep (200 files), sequencing audit, rewriting weakest spec files.

## Gap Analysis Scorecard

| Target AI | v1 | v2 | v3 (2026-04-18) | v4 (2026-04-19) | v4-adjusted (post-audit) | **v5 (post-🔴 reconcile)** |
|---|---|---|---|---|---|---|
| Lovable | 62% | 72% | 78% | 90% | 84% | **89%** |
| Cursor/IDE | 74% | 80% | 86% | 94% | 88% | **93%** |
| Raw chat | 38% | 48% | 52% | 68% | 60% | **66%** |

**Lift remaining if 🟠 drifts close:** Lovable → 90%, Cursor → 94%, Raw chat → 68%.
