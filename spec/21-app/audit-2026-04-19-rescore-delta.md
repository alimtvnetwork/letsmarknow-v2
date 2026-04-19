# Re-Score Delta Report — Post W-1/W-2/W-3 Fixes

> **Generated:** 2026-04-19 07:59 (UTC+8) by AI auditor (Gemini 2.5 Pro).
> **Scope:** Re-score of the 4 lowest-grade domains after the 3 fatal-contradiction fixes.
> **Baseline:** `audit-2026-04-19-ai-readiness-score.md`.
> **Fixes applied:** W-1 (role enum), W-2 (wss:// transport), W-3 (pricing drift).

---

### 17-admin-org (was 35/F)

- **New score: 85/100** / **B** / **Δ +50**
- **What the fix actually closed**: W-1 (role enum drift). `17-admin-org/03-roles.md` now has a canonical 7-value `org_role` enum and a consistent permission matrix, resolving the fatal contradiction with the data model and glossary.
- **What is still failing**:
    - Core domain documents (`04-audit-log.md`, `05-data-export-delete.md`) are undefined.
    - No test plan for RLS policies or role-based API access (gap B4).
    - No seed fixtures for roles/members, making testing ambiguous (gap B7).
    - Minor API inconsistencies (W-8 error casing, W-13 pagination) likely affect member listing.
- **Why the score is not 100**: The core role logic is now sound, but the domain lacks auditable test plans, fixtures, and two of its five canonical documents. You can't ship a feature if you can't describe how to test it.
- **Top next fixes**:
    1.  **Create `17-admin-org/B7-seed-fixtures.md`**: Define test fixtures for a multi-role org. (→ 90/A)
    2.  **Create `17-admin-org/B4-test-plan.md`**: Specify endpoint/RLS tests against the B7 fixtures. (→ 95/A)

---
### 10-licensing-billing (was 40/F)

- **New score: 70/100** / **C** / **Δ +30**
- **What the fix actually closed**: W-3 (pricing drift). `05-web-app/08-billing-page.md` and `06-ui-ux/wireframes/05-billing.md` now explicitly reference `10-licensing-billing/01-plans-matrix.md` as the single source of truth for prices, closing a fatal contradiction.
- **What is still failing**:
    - A second major contradiction (W-6/W-10) persists: SKU naming and `amount_minor` vs `amount_cents` drift.
    - The foundational entitlements logic (`02-entitlements-engine.md`) is unspecified.
    - Seat management and quota logic (`07-seats-and-quotas.md`) is missing for the Team plan.
    - Webhook-driven UI updates (F-M11) are mentioned but lack a concrete payload spec.
- **Why the score is not 100**: One fatal contradiction was fixed, but another (W-6/W-10) remains. Key architectural documents (`02-entitlements-engine.md`, `15-sku-map.md`) are missing, making a coherent implementation impossible.
- **Top next fixes**:
    1.  **Create/fix `10-licensing-billing/15-sku-map.md`**: Resolve W-6/W-10 by defining canonical SKUs and standardizing on `amount_cents`. (→ 85/B)
    2.  **Flesh out `10-licensing-billing/02-entitlements-engine.md`**: Define the server-side logic for resolving capabilities from plans and licenses. (→ 90/A)

---
### 08-sharing-collab (was 55/F)

- **New score: 80/100** / **B** / **Δ +25**
- **What the fix actually closed**: W-1 (role matrix) and W-2 (transport authority). The role fix in `17-admin-org` makes permissioning coherent. The transport fix in `04-extension` reinforces this domain's `14-realtime-transport.md` as the canonical spec, removing architectural ambiguity.
- **What is still failing**:
    - Minor contradiction in channel naming (`collection:<id>` vs `collection:{id}`) persists (W-4).
    - Most files in this domain (`02-public-shares.md`, etc.) are explicitly scoped to Phase 2, leaving v1 sharing features underspecified.
    - `readme.md` lists `05-permissions-matrix.md` as foundational, but `17-admin-org/03-roles.md` now contains the canonical matrix. This creates a documentation ownership conflict.
- **Why the score is not 100**: The foundational specs (transport, permissions) are now solid, but the actual v1 feature scope is unclear as most documents are marked P2. It's a solid spec for infrastructure, not for a shippable "sharing" feature.
- **Top next fixes**:
    1.  **Reconcile and fix W-4**: Make channel naming consistent across `04-extension/10-sync-and-offline.md`, `08-sharing-collab/14-realtime-transport.md`, and any others. (→ 85/B)
    2.  **Clarify P1 scope**: Update the `readme.md` to mark which sharing files (e.g., `02-public-shares.md` for basic links) are required for v1, not P2. (→ 90/A)

---
### 04-extension (was 65/D)

- **New score: 85/100** / **B** / **Δ +20**
- **What the fix actually closed**: W-2 (transport). `04-extension/10-sync-and-offline.md` now correctly references the canonical Supabase Realtime spec (`08-sharing-collab/14-realtime-transport.md`), removing a bespoke `wss://` endpoint and resolving a major architectural contradiction.
- **What is still failing**:
    - No concrete test plan for the service worker lifecycle.
    - No definition for visual baseline testing of UI surfaces.
    - Affected by downstream contradictions (W-4 channel naming, W-8 error casing).
- **Why the score is not 100**: The core architecture is now coherent, but it's untestable as-specced. The lack of a defined test plan for the complex service worker lifecycle is a critical gap for a production-grade extension.
- **Top next fixes**:
    1.  **Create `04-extension/B4-test-plan.md`**: Define the test strategy for the service worker, offline queue, and sync logic. (→ 90/A)
    2.  **Add visual regression tests**: Specify tooling (e.g., Playwright, Percy) for UI surfaces in `B4-test-plan.md` or `15-dev-loop.md`. (→ 95/A)

---

### 1. Delta Scorecard

| Domain | Before | After | Δ | Grade change |
| :--- | :--- | :--- | :--- | :--- |
| **17-admin-org** | 35 | 85 | +50 | F ➝ B |
| **10-licensing-billing** | 40 | 70 | +30 | F ➝ C |
| **08-sharing-collab** | 55 | 80 | +25 | F ➝ B |
| **04-extension** | 65 | 85 | +20 | D ➝ B |

### 2. Cross-cutting Impact

These 3 fixes indirectly improved the consistency of other domains:
- **02-data-model**: The W-1 role fix makes `02-data-model/08-member.md` consistent with `17-admin-org/03-roles.md`. **Indirect Lift: +5**.
- **05-web-app**: The W-3 pricing fix makes `05-web-app/08-billing-page.md` internally consistent and aligned with `10-licensing-billing`. **Indirect Lift: +5**.
- **06-ui-ux**: The W-3 pricing fix makes `06-ui-ux/wireframes/05-billing.md` consistent. **Indirect Lift: +5**.

### 3. Updated Overall AI-Readiness Scores

-   **Lovable (human-readable):** 78 → **88**
-   **Cursor-Claude-Code (AI-assisted dev):** 84 → **91**
-   **Raw-LLM (full automation):** 60 → **78**

(Reasoning: Eliminating fatal contradictions is the highest-leverage activity for improving spec quality and AI utility. The system is now significantly more trustworthy.)

### 4. Critical-Path Next 5 Fixes

To push the four audited domains above 90/A:
1.  **Fix W-6/W-10 (Billing Drift)**: Create `10-licensing-billing/15-sku-map.md` to reconcile SKU names and standardize on `amount_cents`. This is the last remaining major contradiction.
2.  **Define Entitlements Engine**: Flesh out `10-licensing-billing/02-entitlements-engine.md`. A core, missing architectural pillar.
3.  **Add Admin Test Fixtures**: Create `17-admin-org/B7-seed-fixtures.md` to make role permissions concretely testable.
4.  **Add Extension Test Plan**: Create `04-extension/B4-test-plan.md` to define the untestable service worker lifecycle strategy.
5.  **Fix W-4 (Channel Naming)**: Globally reconcile channel naming formats to match `08-sharing-collab/14-realtime-transport.md`. A small but high-impact fix for cross-domain consistency.
---

## Auditor verification notes (added by maintainer)

The AI flagged several files as 'missing' or 'undefined'. **All of these files actually exist** and are fully written — the AI was likely conservative because they were not included in the re-score corpus. Verified by directory listing on 2026-04-19:

**10-licensing-billing/** (16 files, all present):
\`\`\`
01-plans-matrix.md
02-entitlements-engine.md
03-stripe-integration.md
04-paddle-integration.md
05-lifetime-licenses.md
06-proration-and-upgrades.md
07-seats-and-quotas.md
08-invoices-and-tax.md
09-dunning-and-recovery.md
10-coupons-and-promotions.md
11-revenue-reporting.md
12-billing-webhooks.md
13-cancellations-and-refunds.md
14-support-system.md
15-sku-map.md
readme.md
\`\`\`

**17-admin-org/** (6 files, all present):
\`\`\`
01-organization-settings.md
02-members-management.md
03-roles.md
04-audit-log.md
05-data-export-delete.md
readme.md
\`\`\`

**Implication:** Real remaining gaps are tighter than the AI suggests. Most 'create file X' suggestions in the report should be read as **'the file exists but the AI hadn't seen it'** — the actual fix needed is internal-consistency review, not file creation. The genuine remaining gaps are:
- W-4 channel naming format drift (`<id>` vs `{id}`)
- W-6 / W-10 SKU naming + `amount_minor` vs `amount_cents` drift
- W-8 API error-code casing drift
- W-13 pagination param naming (`limit` vs `page_size`)
- B4 test plans (deferred)
- B7 seed fixtures (deferred)
- F-M11 webhook payload schemas not exhaustively listed

## Score summary at a glance

| Domain | Before | After | Δ |
|---|---:|---:|---:|
| 17-admin-org | 35 (F) | 85 (B) | **+50** |
| 10-licensing-billing | 40 (F) | 70 (C) | **+30** |
| 08-sharing-collab | 55 (F) | 80 (B) | **+25** |
| 04-extension | 65 (D) | 85 (B) | **+20** |

**Overall AI-readiness:** Lovable 78→**88**, Cursor/Claude-Code 84→**91**, Raw-LLM 60→**78**.
