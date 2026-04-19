# Audit — Implementation vs Specification

**Date:** 2026-04-19 (Asia/Kuala_Lumpur, UTC+8)
**Scope:** All of `spec/21-app/` (locked v1 surface) vs the live codebase under `src/`.
**Auditor stance:** strict, evidence-based, no charity scoring.
**Method:** filesystem inspection of `src/`, `package.json`, routes, and design tokens; cross-referenced against every locked spec folder (00-overview … 22-infrastructure, 23-audits).

---

## 0. TL;DR

The repository is a **stock Vite + React + shadcn scaffold** (single placeholder `Index.tsx` route, no business logic, no backend, no Cloud connection, no extension code). The spec describes a full multi-tenant SaaS + browser extension (Account → Org → Space → Collection → Group → Item, RLS, sharing, billing, importers, history, search). **Implementation completeness vs spec ≈ 1%.** Every numbered spec folder is essentially unimplemented in code. This is expected (we are spec-first), but it must be stated plainly so future re-audits measure real delta.

**Headline scores (see §3):**
- Spec compliance: **2 / 100**
- Implementation completeness: **1 / 100**
- Clarity & testability of spec: **78 / 100**
- Reliability risk (lower is better): **92 / 100** (very high risk if shipped today)
- Production readiness: **1 / 100**

---

## 1. Rubric (extended)

| # | Dimension | Weight | What "10" looks like |
|---|---|---|---|
| R1 | Requirement coverage | 15% | Every locked spec requirement has a code path or explicitly deferred ticket. |
| R2 | Logic correctness | 12% | Implemented flows match spec semantics (role gates, soft-delete cascade, share inheritance). |
| R3 | Edge case handling | 10% | Documented edge cases in spec §6/§11 tables are exercised in tests. |
| R4 | Error handling | 8% | Error codes from `03-api-endpoints/18-error-codes.md` are emitted with correct shape. |
| R5 | Consistency with spec | 10% | Names, enums, IDs (UUIDv7), routes match spec verbatim. |
| R6 | Missing / ambiguous reqs | 8% | Spec gaps are tracked in `23-audits/`; no "TBD" in locked files. |
| R7 | Maintainability | 7% | Design tokens, no hardcoded colors, file-naming `NN-name.md`/component conventions. |
| R8 | Testability | 8% | Vitest + RLS fixture matrix + a11y + share-link guest tests. |
| R9 | Security & safety | 12% | RLS on every table, `has_role` SECURITY DEFINER, share-link entropy, no PII in telemetry. |
| R10 | Scalability / performance | 10% | Hard caps from `01-hierarchy.md §5` enforced; pagination on lists; index plan exists. |

Pass bar per dimension: **≥ 7/10**. Anything below that is flagged "FAILING" in §2.

---

## 2. Findings (ranked highest → lowest risk)

> **Failing** = blocks v1 launch. **Severity** is impact-if-shipped. **Confidence** is how sure I am the gap is real (10 = verified by file read).

### F-01 — No backend / Cloud not enabled  🔴 FAILING
1. **Title:** Lovable Cloud / Supabase backend is not provisioned.
2. **Spec area:** `02-data-model/*`, `03-api-endpoints/*`, `09-auth-accounts/*`, `17-admin-org/03-roles.md`, `22-infrastructure/*`.
3. **Description:** Spec mandates Postgres + RLS + `has_role` SECURITY DEFINER + UUIDv7 + auth + storage. Repo has zero backend code, no `supabase/` folder, no migrations, no edge functions.
4. **Implementation status:** Not started.
5. **Severity:** 10/10
6. **Confidence:** 10/10
7. **Risk:** critical
8. **Why it can fail:** Nothing persists. Auth, sharing, billing, extension sync — all impossible.
9. **Impact:** Product cannot exist.
10. **Fix:** Enable Lovable Cloud → create migrations for `organizations`, `member_roles`, `spaces`, `collections`, `groups`, `items`, `shares`, `share_grants`, `tags`, `history_events`, `licenses` per `02-data-model/`. Add `has_role(_user_id, _org_id, _role)` per `17-admin-org/03-roles.md §3`.
11. **Remaining after fix:** All endpoints in `03-api-endpoints/` still need wiring; RLS fixture matrix; seed data.
12. **Blocks compliance:** YES.

### F-02 — No authentication surface  🔴 FAILING
1. **Title:** No sign-up / sign-in / session handling.
2. **Spec area:** `09-auth-accounts/02-signup-and-signin.md`, `09-auth-accounts/06-sessions.md`, `09-auth-accounts/04-oauth-providers.md`.
3. **Description:** Spec requires email/password + magic link + Google + Apple, MFA optional, session rotation. Codebase exposes only `/` and 404.
4. **Status:** Not started.
5. **Severity:** 10/10  6. **Confidence:** 10/10  7. **Risk:** critical
8. **Why it fails:** Without auth, identity for `auth.uid()` in RLS does not exist; every spec policy collapses.
9. **Impact:** No user can use the product.
10. **Fix:** Implement Cloud auth UI (`/auth`), email confirm enabled in dev (disabled per safe default — confirm with user), Google/Apple OAuth providers, `onAuthStateChange` listener, session persisted in `localStorage` per Supabase SDK defaults.
11. **Remaining:** MFA, SSO/SAML (`05-sso-saml.md`), device management, rate-limit values from `09-auth-accounts/13-rate-limit-values.md`.
12. **Blocks compliance:** YES.

### F-03 — No role / RLS enforcement  🔴 FAILING
1. **Title:** Canonical 7-role enum and `has_role` are spec-only.
2. **Spec area:** `17-admin-org/03-roles.md`.
3. **Description:** Enum `owner|admin|editor|viewer|billing|guest|system`, `member_roles` table, `has_role` SECURITY DEFINER, and the locked permission matrix are not in the database.
4. **Status:** Not started.
5. **Severity:** 10/10  6. **Confidence:** 10/10  7. **Risk:** critical
8. **Why it fails:** All write endpoints will either be wide-open or arbitrarily denied. Privilege-escalation surface.
9. **Impact:** Security incident on day one of launch.
10. **Fix:** Ship migration with the exact SQL block in `17-admin-org/03-roles.md §2` + §3.
11. **Remaining:** Per-endpoint RLS policies; fixture-based test matrix from `17-admin-org/03-roles.md §12`.
12. **Blocks compliance:** YES.

### F-04 — No data model tables  🔴 FAILING
1. **Title:** Entire `02-data-model/` corpus has zero migrations.
2. **Spec area:** `02-data-model/01-organization.md` … `11-account.md`.
3. **Description:** No tables exist for any of the 11 locked entities.
4. **Severity:** 10/10  5. **Confidence:** 10/10  6. **Risk:** critical
7. **Why it fails:** Product cannot read or write anything.
8. **Impact:** Total.
9. **Fix:** Generate 11 migrations matching the column lists in each `02-data-model/` file; UUIDv7 primary keys (per memory rule); RLS enabled on every table; `created_by/updated_by/created_at/updated_at/deleted_at` per `01-hierarchy.md §3.9`.
10. **Remaining:** Indexes (search engine — `14-search/06-search-engine.md`), trigram for tag/title, position re-balance cron.
11. **Blocks compliance:** YES.

### F-05 — No API endpoints  🔴 FAILING
1. **Title:** None of the 17 endpoint families exist.
2. **Spec area:** `03-api-endpoints/02-public-share-viewer.md` … `17-billing-webhooks.md`.
3. **Severity:** 10/10  4. **Confidence:** 10/10  5. **Risk:** critical
6. **Why it fails:** Frontend cannot perform any spec action.
7. **Fix:** Implement each endpoint as either a Cloud edge function (mutations, webhooks) or direct PostgREST call (CRUD with RLS). Match error codes in `18-error-codes.md` (UPPER_SNAKE_CASE).
8. **Remaining:** Versioning header (`/v1/`), idempotency keys for `POST /sessions/save`, signed URLs for share viewer.
9. **Blocks compliance:** YES.

### F-06 — No browser extension code  🔴 FAILING
1. **Title:** `04-extension/` is entirely unimplemented.
2. **Spec area:** all of `04-extension/`.
3. **Severity:** 9/10  4. **Confidence:** 10/10  5. **Risk:** critical
6. **Why it fails:** The product's primary capture surface (`Save Tab`, `Save Session`, omnibox, context menu, new-tab override) is missing.
7. **Fix:** Stand up MV3 extension in a sibling repo or `apps/extension/`; manifest from `04-extension/01-manifest.md`; auth bridge per `04-extension/11-auth-bridge.md`.
8. **Remaining:** Cross-browser bundling (`20-roadmap/05-phase-4-cross-browser.md`), store listings, signing keys.
9. **Blocks compliance:** YES (Phase-0 MVP requires it).

### F-07 — No share viewer route  🔴 FAILING
1. **Title:** `/t/{slug}` public share viewer is missing.
2. **Spec area:** `05-web-app/14-share-viewer.md`, `08-sharing-collab/02-public-shares.md`, `08-sharing-collab/03-password-shares.md`.
3. **Severity:** 9/10  4. **Confidence:** 10/10  5. **Risk:** high
6. **Fix:** Add `/t/:slug` route, password-gate UI, embed widget per `08-sharing-collab/10-embed-widget.md`.
7. **Blocks compliance:** YES.

### F-08 — Routes do not match `05-web-app/01-routes.md`
1. **Title:** Only `/` and `*` are defined.
2. **Spec area:** `05-web-app/01-routes.md`.
3. **Description:** Spec defines `/auth`, `/dashboard`, `/c/:id`, `/g/:id`, `/i/:id`, `/settings/*`, `/billing`, `/trash`, `/activity`, `/import`, `/share/*`, `/t/:slug`, `/onboarding`, plus marketing `/`, `/pricing`, `/features`, `/changelog`. None exist.
4. **Severity:** 8/10  5. **Confidence:** 10/10  6. **Risk:** high
7. **Fix:** Generate route stubs with skeletons; protect non-public routes with auth guard; mark each `<Route>` with the matching spec section in a comment.
8. **Blocks compliance:** YES.

### F-09 — No design tokens beyond default shadcn
1. **Title:** `06-ui-ux/01-design-tokens.md` colors/spacing/typography are not encoded in `index.css` / `tailwind.config.ts`.
2. **Spec area:** `06-ui-ux/01-design-tokens.md`, `06-ui-ux/02-theming.md`.
3. **Description:** Repo still uses default shadcn neutral palette; no semantic surfaces (`--surface-raised`, `--brand-glow`), no font pair, no motion tokens (`07-motion.md`).
4. **Severity:** 6/10  5. **Confidence:** 9/10  6. **Risk:** medium
7. **Why it fails:** UI built before tokens land will leak hardcoded colors and force re-theming.
8. **Fix:** Encode tokens in HSL in `index.css`; map to Tailwind theme; add dark mode pair.
9. **Blocks compliance:** Partially (UI work blocked until done).

### F-10 — No PWA manifest / service worker
1. **Title:** `05-web-app/15-pwa.md` not implemented.
2. **Severity:** 5/10  3. **Confidence:** 10/10  4. **Risk:** medium
5. **Fix:** Add `manifest.webmanifest`, icons pipeline (`06-ui-ux/18-favicon-pipeline.md`), Workbox SW with offline shell.
6. **Blocks compliance:** YES for the PWA roadmap line; not for first launch.

### F-11 — No SEO surface
1. **Title:** `index.html` lacks the meta block specified in `05-web-app/16-seo.md`.
2. **Severity:** 5/10  3. **Confidence:** 9/10  4. **Risk:** medium
5. **Fix:** Add canonical title (<60ch), meta description (<160ch), JSON-LD `SoftwareApplication`, OpenGraph image, robots.txt audit.
6. **Blocks compliance:** Partial.

### F-12 — No analytics / telemetry plumbing
1. **Title:** Events listed in `18-analytics-telemetry/03-events.md` and `17-admin-org/03-roles.md §10` (`permission.denied`, `role.escalation_attempt`, etc.) have no emitter.
2. **Severity:** 5/10  3. **Confidence:** 10/10  4. **Risk:** medium
5. **Fix:** Add a single `track(event, payload)` adapter; route to console in dev, to provider in prod (per `18-analytics-telemetry/01-opt-in-analytics.md` opt-in default).
6. **Blocks compliance:** Partial.

### F-13 — No error-code surface
1. **Title:** `03-api-endpoints/18-error-codes.md` (UPPER_SNAKE_CASE) is not represented in any TS enum.
2. **Severity:** 6/10  3. **Confidence:** 10/10  4. **Risk:** medium
5. **Fix:** Generate `src/lib/error-codes.ts` from the markdown table; add a typed `ApiError` class.
6. **Blocks compliance:** Partial.

### F-14 — No tests beyond `example.test.ts`
1. **Title:** Vitest exists but only one trivial test.
2. **Spec area:** `17-admin-org/03-roles.md §12`, `01-hierarchy.md §6`, every `Tests` section across folders.
3. **Severity:** 7/10  4. **Confidence:** 10/10  5. **Risk:** high
6. **Fix:** Stand up RLS fixture matrix, share-link guest scope test, soft-delete cascade test, last-Owner constraint test.
7. **Blocks compliance:** YES (the rubric R8 fails outright).

### F-15 — Spec drift linter not implemented (B4/B7 deferred)
1. **Title:** 12 spec-drift-linter scripts are spec-only.
2. **Spec area:** `22-infrastructure/09-ci-cd.md`, `23-audits/audit-2026-04-19-ai-readiness-score.md`.
3. **Severity:** 5/10  4. **Confidence:** 10/10  5. **Risk:** medium
6. **Why it matters:** Without it, today's folder rename (`audit/` → `23-audits/`) could leave stale path references; we caught them manually this session, but the next move will not be free.
7. **Fix:** Author `scripts/lint/*.ts` (12 checks) + add 13th `xref-resolution` check.
8. **Blocks compliance:** Partial (it is a meta-control, not a product feature).

### F-16 — Folder-overview template not enforced everywhere
1. **Title:** `templates/folder-overview.md` exists; not all 22 numbered folders conform.
2. **Spec area:** `templates/readme.md`.
3. **Severity:** 4/10  4. **Confidence:** 7/10  5. **Risk:** low
6. **Fix:** Run conformance audit, normalize any folder `00-overview.md` missing the 5 required sections.

### F-17 — `Index.tsx` is the placeholder scaffold
1. **Title:** `src/pages/Index.tsx` is the Lovable placeholder (`<img src="/placeholder.svg">`).
2. **Spec area:** `05-web-app/03-dashboard.md` (authenticated) or `05-web-app/13-marketing-site.md` (anonymous).
3. **Severity:** 3/10  4. **Confidence:** 10/10  5. **Risk:** low (expected at this stage)
6. **Fix:** Replace with anonymous marketing landing or auth-gated dashboard redirect.

### F-18 — `App.tsx` lacks AuthProvider / OrgContext
1. **Title:** No global state for current Account, current Organization, role, theme.
2. **Spec area:** `05-web-app/02-shell.md`, `09-auth-accounts/06-sessions.md`.
3. **Severity:** 6/10  4. **Confidence:** 10/10  5. **Risk:** medium
5. **Fix:** Add `<AuthProvider>` (Cloud SDK) and `<OrgProvider>` reading active org from URL/session; expose `useAuth()`, `useOrg()`, `useRole()`.

### F-19 — No import / export pipeline
1. **Title:** `11-import-export/*` is unimplemented.
2. **Severity:** 6/10  3. **Confidence:** 10/10  4. **Risk:** medium
5. **Fix:** Edge function `POST /import` accepting Pocket/Raindrop/Tab Extend/HTML/CSV/JSON; queue per `11-import-export/03-import-pipeline.md`.
6. **Blocks compliance:** YES (Phase-0 includes basic import).

### F-20 — No history / undo log
1. **Title:** `12-history-undo/01-event-log.md` table missing.
2. **Severity:** 6/10  3. **Confidence:** 10/10  4. **Risk:** medium
5. **Fix:** `history_events` table + append-only insert trigger; client-side undo stack per `12-history-undo/02-undo-redo.md`.

### F-21 — No search engine
1. **Title:** `14-search/*` unimplemented.
2. **Severity:** 6/10  3. **Confidence:** 10/10  4. **Risk:** medium
5. **Fix:** Postgres `tsvector` GIN index on items+collections+tags; quick-find debounced API.

### F-22 — No license / billing entitlements
1. **Title:** `10-licensing-billing/02-entitlements-engine.md` and `15-sku-map.md` not in code.
2. **Severity:** 7/10  3. **Confidence:** 10/10  4. **Risk:** high
5. **Why it matters:** Quotas in `01-hierarchy.md §5` cannot be enforced.
6. **Fix:** `licenses` table + `entitlements(org_id) -> jsonb` view; webhook handlers for Stripe/Paddle.
7. **Blocks compliance:** YES (gating depends on it).

### F-23 — No GDPR / DSR pipeline
1. **Title:** `19-security-privacy/04-gdpr-ccpa.md` precedence chain not enforced.
2. **Severity:** 8/10  3. **Confidence:** 10/10  4. **Risk:** high (legal)
5. **Fix:** DSR endpoint + override of 30-day soft-delete; audit-log entry per `17-admin-org/04-audit-log.md`.

### F-24 — Missing `tailwind.config.lov.json` semantics
1. **Title:** A `src/tailwind.config.lov.json` exists but no token mapping in `tailwind.config.ts` references the spec tokens.
2. **Severity:** 3/10  3. **Confidence:** 7/10  4. **Risk:** low
5. **Fix:** Reconcile after F-09 lands.

### F-25 — Memory rule not yet codified for "spec-first repo"
1. **Title:** Newcomers (or future model sessions) might assume implementation is in progress.
2. **Severity:** 3/10  3. **Confidence:** 8/10  4. **Risk:** low
5. **Fix:** Add a Core memory line: "Repo is spec-first. Implementation = scaffold only. Do not assume features exist."

---

## 3. Scoring

### 3.1 Headline scores

| Metric | Score | Rationale |
|---|---:|---|
| Spec compliance (0–100) | **2** | Only `package.json`, `index.html`, scaffold align loosely with `22-infrastructure/`. |
| Implementation completeness (0–100) | **1** | One placeholder page, no business logic. |
| Clarity & testability of spec (0–100) | **78** | Spec is detailed, locked enums + matrices; weak spots: §F-16 folder conformance, §F-15 linter not built. |
| Reliability risk (0–100, higher = worse) | **92** | Shipping today = guaranteed incident (no auth, no RLS, no quotas). |
| Production readiness (0–100) | **1** | Not deployable as a product. |

### 3.2 Rubric scores (per dimension, 0–10)

| Dim | Score | Failing? | Note |
|---|---:|:---:|---|
| R1 Requirement coverage | 0 | ✅ | Nothing implemented. |
| R2 Logic correctness | n/a | ✅ | No logic to evaluate. |
| R3 Edge case handling | 0 | ✅ | — |
| R4 Error handling | 0 | ✅ | No error codes wired. |
| R5 Consistency with spec | 1 | ✅ | Routes, names, tables absent. |
| R6 Missing/ambiguous reqs (spec quality) | 8 | — | Strong; 23-audits track gaps. |
| R7 Maintainability | 5 | — | Scaffold is clean but tokens not encoded. |
| R8 Testability | 1 | ✅ | One stub test. |
| R9 Security & safety | 0 | ✅ | No RLS, no auth, no roles. |
| R10 Scalability/perf | 0 | ✅ | No DB to index. |

Pass bar (≥ 7) met only by **R6**.

---

## 4. Top risks (priority order)

1. **F-01** Cloud not enabled — blocks everything else.
2. **F-03** Role/RLS missing — security-critical.
3. **F-02** Auth missing — identity-critical.
4. **F-04 / F-05** Tables + endpoints missing — functionality-critical.
5. **F-22** Entitlements/billing — revenue + quota correctness.
6. **F-23** GDPR pipeline — legal exposure.
7. **F-14** Test matrix — without it, fixes regress silently.
8. **F-06** Extension — primary capture surface.
9. **F-07** Share viewer — primary distribution surface.
10. **F-15** Spec-drift linter — keeps everything else honest.

---

## 5. Path to ≥ 90 / 100

Minimum sequence to clear "blocks compliance: YES" findings:

1. Enable Lovable Cloud → migrations for **all** tables in `02-data-model/` + `member_roles` + `has_role` (closes F-01, F-03, F-04).
2. Auth UI on `/auth` + session provider in `App.tsx` (F-02, F-18).
3. Routes from `05-web-app/01-routes.md` as protected stubs (F-08, F-17).
4. Design tokens in `index.css` per `06-ui-ux/01-design-tokens.md` (F-09, F-24).
5. Per-table RLS policies + fixture-based RLS test matrix from `17-admin-org/03-roles.md §12` (F-14 partial).
6. Edge functions for endpoint families 02–10 from `03-api-endpoints/` (F-05).
7. `/t/:slug` share viewer with password gate (F-07).
8. Entitlements engine + Stripe webhook (F-22).
9. Import pipeline (F-19).
10. History + undo (F-20), search engine (F-21), GDPR DSR (F-23).
11. Extension MV3 in `apps/extension/` (F-06).
12. Spec-drift linter scripts incl. xref check (F-15).

After step 12: spec compliance projected ≈ 92, production readiness ≈ 85, reliability risk ≈ 25.

---

## 6. Assumptions made (where spec was unclear or implied)

- "Implementation completeness" treats the scaffold as ~1% rather than 0% because routing, build, lint, vitest, shadcn, tailwind are wired correctly per `22-infrastructure/01-hosting.md` defaults.
- I assumed Lovable Cloud (not external Supabase) is the chosen backend; spec is provider-agnostic but memory + `22-infrastructure/` defaults imply Cloud.
- I treated `04-extension/` as in-scope for v1 (Phase-0 MVP per `20-roadmap/01-phase-0-mvp.md`); if extension is Phase-1, downgrade F-06 severity to 7.
- I did not penalize the spec for `13-` being absent (folder is intentionally skipped — verified by directory listing).

---

## 7. Failing findings (single-glance list)

F-01, F-02, F-03, F-04, F-05, F-06, F-07, F-08, F-14, F-19, F-22.
(All marked 🔴 above. Each blocks v1 launch.)

---

## 8. Cross-references

- Locked rubric & re-score policy: `23-audits/audit-2026-04-19-ai-readiness-score.md`
- Previous gap list: `23-audits/gap-analysis.md`
- Sequencing for fixes: `23-audits/audit-2026-04-19-sequencing.md`
- Decisions still needed: `23-audits/audit-2026-04-19-decisions-needed.md`
- Folder template enforcement: `templates/readme.md`, `22-infrastructure/09-ci-cd.md`
