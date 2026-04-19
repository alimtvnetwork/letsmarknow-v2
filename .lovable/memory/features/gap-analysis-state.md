---
name: Gap Analysis State
description: Tracks which gap-analysis items are closed, deferred, or still open. Updated 2026-04-19 (v4 — all majors closed except B4/B7 deferred).
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

### Round 2 (2026-04-19, v4)

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

## Intentionally Deferred

| ID | Item | Reason |
|---|---|---|
| B4 | Testing folder (Gherkin) | User requested defer; partially mitigated by M14 DoD checklist |
| B7 | Seed/fixture data | User requested defer |

## Still Open (High Priority)

None as of 2026-04-19 (v4). Both remaining items (B4, B7) are user-deferred.

## Gap Analysis Scorecard

| Target AI | v1 | v2 | v3 (2026-04-18) | **v4 (2026-04-19)** |
|---|---|---|---|---|
| Lovable | 62% | 72% | 78% | **90%** |
| Cursor/IDE | 74% | 80% | 86% | **94%** |
| Raw chat | 38% | 48% | 52% | **68%** |

**Lift remaining if B4 closes:** Lovable → ~94%, Cursor → ~97%, Raw chat → ~75%.
