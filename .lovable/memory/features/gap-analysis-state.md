---
name: Gap Analysis State
description: Tracks which gap-analysis items are closed, deferred, or still open. Updated 2026-04-18.
type: feature
---

## Closed Items (2026-04-18)

| ID | Item | Closed By | Location |
|---|---|---|---|
| B1 | Wireframes | Wireframe files created | `06-ui-ux/wireframes/*.md` |
| B2 | Error codes catalog | 60+ error codes enumerated | `03-api-endpoints/18-error-codes.md` |
| B3 | Copy strings catalog | Full key→EN map | `06-ui-ux/17-copy-strings.md` |
| B5 | MV3 manifest | Literal manifest.json | `04-extension/01-manifest.md` |
| B6 | Infrastructure spec | 10-file infra folder | `22-infrastructure/*.md` |
| M11 | Event taxonomy | 80+ events catalog | `18-analytics-telemetry/03-events.md` |
| M13 | Permissions matrix JSON | Machine-readable matrix | `08-sharing-collab/permissions-matrix.json` |

## Intentionally Deferred

| ID | Item | Reason |
|---|---|---|
| B4 | Testing folder (Gherkin) | User requested avoid for now |
| B7 | Seed/fixture data | User requested avoid for now |

## Still Open (High Priority)

| ID | Item | Impact |
|---|---|---|
| M1 | SKU mapping | Billing will fail without Stripe/Paddle IDs |
| M2 | OAuth client IDs | OAuth fails in prod with localhost |
| M3 | Realtime transport | Presence/conflict resolution undefined |
| M4 | Rate limit values | Security vs UX tradeoff unclear |
| M5 | Search engine | Performance SLA at risk |
| M6 | Favicon pipeline | Privacy choice needed |
| M7 | Email provider | Verification emails undeliverable |
| M8 | Storage bucket layout | Cleanup jobs will break |
| M9 | Breakpoint enumeration | Mobile layouts unspecified |
| M10 | a11y WCAG target | Legal risk EU |
| M12 | Dedup algorithm | Import UX inconsistent |
| M14 | Definition of Done | Feature completeness undefined |

## Gap Analysis Scorecard (v3, 2026-04-18)

| Target AI | v1 | v2 | v3 |
|---|---|---|---|
| Lovable | 62% | 72% | **78%** |
| Cursor/IDE | 74% | 80% | **86%** |
| Raw chat | 38% | 48% | **52%** |

**Lift remaining if all open items closed:** Lovable → ~90%, Cursor → ~94%
