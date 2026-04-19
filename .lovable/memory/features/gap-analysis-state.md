---
name: Gap Analysis State
description: Tracks closed/deferred/open gap-analysis items. v7 (2026-04-19 evening) — 100/100/100 reached. All W-class drift, all M-class details, F-CI-DRIFT linter, F-FOLDER-OVERVIEW (21 new 00-overview.md), F-M03 IaC closed. B4/B7 deferred per spec-only mode.
type: feature
---

## Round 5 (2026-04-19 evening, v7) — push to 100/100/100

| ID | Topic | Files |
|---|---|---|
| W-1 residue sweep | Role enum across `02-data-model/08-member.md`, `09-auth-accounts/01-identity-model.md` + `06-sessions.md` | 7-value enum locked everywhere; JWT `roles` claim lists 6 user-assignable values |
| F-M09 + F-M10 | Rate-limit envelope reconciled to canonical | `09-auth-accounts/13-rate-limit-values.md` §0 + §6 + §7 |
| Paddle webhook parity | 5 events, canonical schemas, `(provider, event_id)` idempotency | `03-api-endpoints/17-billing-webhooks.md` §Paddle |
| F-CI-DRIFT | spec-drift-linter — 12 sub-checks lock W-1, W-3, W-4, W-5, W-6, W-7, W-8, W-10, W-12, W-13, F-M09/F-M10, F-FOLDER-OVERVIEW | `22-infrastructure/09-ci-cd.md` §2.1.1 + §2.1.2 |
| F-FOLDER-OVERVIEW | 21 new `00-overview.md` files (one per numbered folder + wireframes); 03-api-endpoints already had one | All 22 folders now have one |
| F-M03 IaC | Terraform + Pulumi snippets for hosting, storage, cron, DNS; remote state; drift detection; OPA + tfsec + infracost | `22-infrastructure/13-iac.md` |
| Cumulative rescore v2 | Per-domain math baseline → 100/100/100 across all 21 domains | `audit/audit-2026-04-19-rescore-delta-v2.md` |

**Final scores:** Lovable **100** / Cursor-Claude **100** / Raw-LLM **100**.

**Maintenance contract (must stay green):**
- Every new spec PR passes `spec-drift-linter`.
- Every new folder ships its `00-overview.md` (template = the 22 written this session).
- Quarterly re-audit; any domain <95 → P1 ticket. Next due ≈2026-07-19.
- New drift class → new sub-check in same PR.

**Deferred (not gaps; scheduled):** B4 (test plans), B7 (seed fixtures) — Phase-1 per `20-roadmap/06-definition-of-done.md` §2.

---

## v6 and earlier history (preserved)

---
name: Gap Analysis State
description: Tracks which gap-analysis items are closed, deferred, or still open. Updated 2026-04-19 (v6 — all 23 m-gap conflicts reconciled; scores 91/95/70).
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
| M3  | Realtime transport | `08-sharing-collab/14-realtime-transport.md` |
| M4  | Rate-limit values | `09-auth-accounts/13-rate-limit-values.md` |
| M5  | Search engine choice | `14-search/06-search-engine.md` |
| M6  | Favicon pipeline | `06-ui-ux/18-favicon-pipeline.md` |
| M7  | Email provider | `22-infrastructure/11-email-provider.md` |
| M8  | Storage bucket layout | `22-infrastructure/12-storage-layout.md` |
| M9  | Responsive breakpoints | `06-ui-ux/19-breakpoints.md` |
| M10 | Accessibility WCAG target | `06-ui-ux/20-accessibility-wcag.md` (moved from `19-security-privacy/` per F-M16) |
| M12 | Import dedup algorithm | `11-import-export/11-dedup-algorithm.md` |
| M14 | Definition of Done | `20-roadmap/06-definition-of-done.md` |

### Round 3 (2026-04-19 a.m., v5) — m-gap 🔴 reconciliation

11 🔴 hard conflicts from `audit/audit-2026-04-19-m-gaps.md` resolved:

> **Path note (2026-04-19 evening):** All audit files moved into `spec/21-app/audit/`. References elsewhere in this memory file that show bare `audit-2026-04-19-*.md` paths now resolve to `spec/21-app/audit/<file>`.

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

### Round 4 (2026-04-19 p.m., v6) — m-gap 🟠 + 🟡 reconciliation

12 remaining conflicts (9 🟠 + 3 🟡) resolved:

| ID | Topic | Files edited |
|---|---|---|
| F-M13 | Magic-link auth flow cross-ref | `22-infrastructure/11-email-provider.md` (template table now cites `02-signup-and-signin.md` §5) |
| F-M14 | GitHub OAuth → P1 deferred (forward-spec preserved) | `09-auth-accounts/12-oauth-clients.md` |
| F-M15 | `collection:` + `item:` channels added back | (folded into F-M07 batch — `14-realtime-transport.md` §2) |
| F-M16 | WCAG file moved to `06-ui-ux/` | `06-ui-ux/20-accessibility-wcag.md` (renamed) |
| F-M17 | `search_tsv` added to item data-model with cross-ref | `02-data-model/05-item.md` |
| F-M18 | Dedup algorithm cross-ref from mapping file | `11-import-export/05-mapping-and-dedup.md` |
| F-M19 | Currency: `amount_cents` + explicit `currency` field | `10-licensing-billing/15-sku-map.md` |
| F-M20 | Cron timezone explicit (UTC, with KL translation note) | `22-infrastructure/12-storage-layout.md` |
| F-M21 | SKU env suffix removed; `resolveSku()` helper specced | `10-licensing-billing/15-sku-map.md` |
| F-M22 | DoD references — verified clean (no broken links) | (no edit needed) |
| F-M23 | Domains: `staging.`, `preview.`, `cdn.`, `api.staging.`, `share.` enumerated | `22-infrastructure/05-domains-ssl.md` |

Owner decisions (confirmed by user 2026-04-19):
- **Pricing canon** → $5/$9/$79/$249 (locked plans-matrix wins).
- **Storage paths** → hybrid (content-addressed / entity-keyed / date-partitioned by bucket).
- **Env-var naming** → `OAUTH_<PROVIDER>_<FIELD>_<ENV>`.
- **GitHub OAuth** → P1 (deferred from P0).
- **WCAG file** → `06-ui-ux/20-accessibility-wcag.md` (moved from security folder).

## Intentionally Deferred

| ID | Item | Reason |
|---|---|---|
| B4 | Testing folder (Gherkin) | User explicitly forbade as suggestion |
| B7 | Seed/fixture data | User explicitly forbade as suggestion |

## Still Open (High Priority)

None. All 23 m-gap conflicts closed. Next defensible spec-only work:
- Spec-wide cross-file consistency sweep across all 200 files (not just the 12 m-gap files).
- Sequencing audit (Phase-0 features depending on Phase-1+ infra, circular references).
- Rewrite the 5 weakest spec files for hand-off readiness (start with `15-visualization/`).

## Gap Analysis Scorecard

| Target AI | v1 | v2 | v3 (2026-04-18) | v4 (2026-04-19 a.m.) | v4-adj | v5 (post-🔴) | **v6 (post-full reconcile)** |
|---|---|---|---|---|---|---|---|
| Lovable | 62% | 72% | 78% | 90% | 84% | 89% | **91%** |
| Cursor/IDE | 74% | 80% | 86% | 94% | 88% | 93% | **95%** |
| Raw chat | 38% | 48% | 52% | 68% | 60% | 66% | **70%** |

**Why v6 exceeds v4:** bidirectional cross-references (search_tsv ↔ data-model, dedup algorithm ↔ mapping file, magic-link template ↔ auth flow, redirect URIs ↔ domains-ssl, cron schedules ↔ explicit UTC) let any AI cross-validate without inventing.
