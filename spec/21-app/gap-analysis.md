# Spec → Implementation Gap Analysis

> **Question this answers:** "If I hand `spec/21-app/` to an AI and say 'build this,' how much will it actually deliver before failing?"
>
> **Method:** Brutally honest. Assume the AI is dumb (no inference, no defaults, no asking back). Score against three target AIs side-by-side.
>
> **Spec measured:** 200 markdown files, ~916 KB, ~25,000 lines, 21 numbered domain folders.
>
> **Date:** 2026-04-19 (v5). **Audit version:** v5 — closed W-1, W-2, W-3 (three fatal contradictions surfaced by the AI-readiness re-audit).

---

## 1. TL;DR scorecard

> **Updated 2026-04-19 (v5):** Closed W-1 (role enum), W-2 (wss:// transport), W-3 (pricing drift). See `audit-2026-04-19-rescore-delta.md` for per-domain delta scores after the fixes. Remaining open: B4 (test plan, deferred), B7 (seed data, deferred), plus W-4 / W-6 / W-8 / W-10 / W-13 / F-M11 (consistency drift, lower severity).
>
> **Prior v4 (2026-04-19):** Closed M1, M2, M3, M4, M5, M6, M7, M8, M9, M10, M12, M14 (12 majors).

| Target AI | v1 | v2 | v3 | v4 | **v5 (now)** | Will it ship a usable product? | Main remaining failure mode |
|---|---|---|---|---|---|---|---|
| **Lovable** (React+Vite+Tailwind+Cloud) | 62% | 72% | 78% | 90% | **88%** † | Yes — full MVP web slice ships cleanly | Cannot build the Chrome extension itself; tests still deferred (B4) |
| **Cursor / Windsurf / Claude Code** (IDE agents) | 74% | 80% | 86% | 94% | **91%** † | Yes — near-complete v1 in one sprint | Tests still missing (B4); seed fixtures absent (B7) |
| **Raw Claude / GPT / Gemini chat** (no execution) | 38% | 48% | 52% | 68% | **78%** | Yes — can produce full v1 modules with the spec; needs a developer to wire infra | No file system, no test loop, context window |

> † v5 numbers come from a stricter, contradictory-fact-aware rescoring rubric (Gemini 2.5 Pro audit on 2026-04-19). The drop in Lovable / Cursor scores vs v4 reflects the new rubric, not regression — Raw-LLM rose because eliminating fatal contradictions disproportionately helps no-execution agents. See `audit-2026-04-19-rescore-delta.md` for the rubric and per-domain math.

**v5 score lift drivers (this round, 2026-04-19):**
- **W-1 closed** → `17-admin-org/03-roles.md` — `org_role` enum expanded to canonical 7 values (`owner, admin, editor, viewer, billing, guest, system`); permission matrix re-tabulated with Billing column; system-role guard CHECK constraint added. Indirect lift on `02-data-model/08-member.md` (+5).
- **W-2 closed** → `04-extension/10-sync-and-offline.md` — bespoke `wss://api.letsmarknow.com/v1/realtime` endpoint and `POST /v1/realtime/ticket` ticket-exchange flow withdrawn; replaced with Supabase Realtime reference + channel naming pointer to `08-sharing-collab/14-realtime-transport.md`. `grep -r 'wss://' spec/` returns zero bespoke references.
- **W-3 closed** → `05-web-app/08-billing-page.md` + `06-ui-ux/wireframes/05-billing.md` — prices reconciled to canonical `10-licensing-billing/01-plans-matrix.md` (Free $0 / Pro $5 mo / $48 yr / Team $9 seat-mo / $84 seat-yr); both files now declare the matrix as source of truth. Indirect lift on `05-web-app` and `06-ui-ux` (+5 each).

**Per-domain lift after v5 fixes** (from `audit-2026-04-19-rescore-delta.md`):

| Domain | v4 score | v5 score | Δ | Grade change |
|---|---:|---:|---:|---|
| 17-admin-org | 35 | **85** | +50 | F → B |
| 10-licensing-billing | 40 | **70** | +30 | F → C |
| 08-sharing-collab | 55 | **80** | +25 | F → B |
| 04-extension | 65 | **85** | +20 | D → B |

**Prior v4 lift drivers (2026-04-19):**
- **M1 closed** → `10-licensing-billing/15-sku-map.md` — Stripe + Paddle SKU registry (+4 pts on billing).
- **M2 closed** → `09-auth-accounts/12-oauth-clients.md` — OAuth client/redirect matrix (+3 pts on auth).
- **M3 closed** → `08-sharing-collab/14-realtime-transport.md` — Supabase Realtime locked (+3 pts on collab).
- **M4 closed** → `09-auth-accounts/13-rate-limit-values.md` — concrete numeric rate limits (+2 pts on security).
- **M5 closed** → `14-search/06-search-engine.md` — Postgres FTS v1, Meilisearch Phase-2 (+4 pts on search).
- **M6 closed** → `06-ui-ux/18-favicon-pipeline.md` — self-hosted + DDG fallback, Google s2 forbidden (+1 pt).
- **M7 closed** → `22-infrastructure/11-email-provider.md` — Resend primary, Postmark failover (+2 pts).
- **M8 closed** → `22-infrastructure/12-storage-layout.md` — bucket layout + retention (+2 pts).
- **M9 closed** → `06-ui-ux/19-breakpoints.md` — 6-token responsive grid (+2 pts on UI).
- **M10 closed** → `19-security-privacy/06-accessibility-wcag.md` — WCAG 2.1 AA + CI gating (+3 pts).
- **M12 closed** → `11-import-export/11-dedup-algorithm.md` — 4-stage pipeline w/ Jaro-Winkler 0.92 (+2 pts).
- **M14 closed** → `20-roadmap/06-definition-of-done.md` — universal DoD + per-domain overlays (+3 pts).

**Prior v3 lift drivers (2026-04-18):** B1, B2, B3, B5, B6, M11, M13 closed.

**Bottom line:** The spec is now **A-grade for contracts, craft, and operational definition, with all known fatal contradictions resolved**. Only verification (B4 tests), seed data (B7), and ~6 minor consistency drifts (W-4/6/8/10/13, F-M11) remain. An AI handed `spec/21-app/` + the AI hand-off prompt in §7 will produce a near-complete v1 without needing to invent any contract, enum, threshold, or vendor.

---

## 2. What the spec does well (the 60–75% the AI *can* deliver)

| Strength | Evidence | Why it lands |
|---|---|---|
| **Locked vocabulary** | `00-overview/02-glossary.md` with forbidden synonyms | AI uses correct entity names everywhere |
| **Full data-model contracts** | 11 entities × ~70 lines each, every field typed | AI generates DB schema + TypeScript types directly |
| **REST contracts with bodies** | `03-api-endpoints/` — 17 files, ~3,200 lines, real JSON examples | AI generates routes + Zod schemas |
| **Design tokens fully resolved** | `06-ui-ux/01-design-tokens.md` — 270 lines of HSL triplets | AI wires Tailwind config without guessing |
| **Locked rules per section** | Each `README.md` ends with `## Locked rules` | AI has hard constraints to refuse bad changes |
| **Phased roadmap** | `20-roadmap/01-phase-0-mvp.md` → `phase-4` | AI can scope a single phase instead of biting all |
| **Audit + reconciliation done** | `audit.md` + 10-step fix | No more ULID/UUIDv7 drift, role enum locked, share v1 vs v2 separated |

→ **An AI given just `00-overview/` + `02-data-model/` + `03-api-endpoints/` + `01-phase-0-mvp.md` will produce a working backend skeleton in one shot.** That's the 38–74% baseline.

---

## 3. Where every AI will fail (the 25–60% gap)

Ranked by **severity × frequency**.

### 3.1 BLOCKERS — AI cannot proceed without inventing

| # | Gap | Where it hurts | What AI will do instead | Fix effort |
|---|---|---|---|---|
| ~~B1~~ | ~~No wireframes / Figma / pixel mockups.~~ **CLOSED** — see `06-ui-ux/wireframes/` (dashboard, popup, share-viewer, onboarding, billing) | — | — | Done |
| ~~B2~~ | ~~No enumerated error code catalog.~~ **CLOSED** — see `03-api-endpoints/18-error-codes.md` (60+ codes across 10 domains) | — | — | Done |
| ~~B3~~ | ~~No copy strings catalog.~~ **CLOSED** — see `06-ui-ux/17-copy-strings.md` (full key→EN map across 17 sections) | — | — | Done |
| B4 | **No test plan / acceptance criteria.** Zero files matching `test|qa|acceptance`. | Every feature | AI ships untested code → you find bugs in week 2 | High — `21-testing/` folder with Gherkin-style scenarios per feature |
| ~~B5~~ | ~~Chrome extension MV3 manifest not finalized.~~ **CLOSED** — `04-extension/01-manifest.md` now contains a literal `manifest.json` (MV3, 9 required + 3 optional permissions, host patterns scoped to `*.letsmarknow.com`, full `commands`/`omnibox`/`side_panel`/`chrome_url_overrides`/CSP/`externally_connectable` blocks, plus per-permission rationale table for store-listing review). | — | — | Done |
| ~~B6~~ | ~~No infrastructure / deployment spec.~~ **CLOSED** — see `22-infrastructure/` (10 files: hosting, environments, env-vars, secrets, domains-ssl, cdn-storage, queues, cron, ci-cd, observability) | — | — | Done |
| B7 | **No real seed/sample data.** No `seeds.json` or fixture file. | Every dev environment, every test | AI generates fake data inline, inconsistent across runs | Low — one seed file per major entity |

### 3.2 MAJOR — all closed as of 2026-04-19

| # | Gap | Closed by |
|---|---|---|
| ~~M1~~ | ~~Pricing numbers exist but Paddle/Stripe product IDs don't.~~ **CLOSED** | `10-licensing-billing/15-sku-map.md` — full Stripe + Paddle SKU registry, live + test IDs, coupons, tax behavior. |
| ~~M2~~ | ~~OAuth provider client IDs / redirect URIs not listed.~~ **CLOSED** | `09-auth-accounts/12-oauth-clients.md` — Google + Apple + GitHub clients per env; PKCE/state/nonce locked. |
| ~~M3~~ | ~~Realtime presence transport unspecified.~~ **CLOSED** | `08-sharing-collab/14-realtime-transport.md` — Supabase Realtime chosen v1; Y.js Phase-3. |
| ~~M4~~ | ~~Rate limits stated as policy, not as values.~~ **CLOSED** | `09-auth-accounts/13-rate-limit-values.md` — concrete `req/min` limits per route, 429 envelope, Org-wide quotas. |
| ~~M5~~ | ~~Search engine choice undefined.~~ **CLOSED** | `14-search/06-search-engine.md` — Postgres FTS v1, Meilisearch Phase-2 trigger conditions. |
| ~~M6~~ | ~~Favicon pipeline only described.~~ **CLOSED** | `06-ui-ux/18-favicon-pipeline.md` — self-hosted + DDG fallback; Google s2 forbidden. |
| ~~M7~~ | ~~Email provider not specified.~~ **CLOSED** | `22-infrastructure/11-email-provider.md` — Resend primary, Postmark failover; Gmail forbidden. |
| ~~M8~~ | ~~Storage bucket layout undefined.~~ **CLOSED** | `22-infrastructure/12-storage-layout.md` — 8 buckets, sharded paths, retention, quotas. |
| ~~M9~~ | ~~Mobile breakpoints implied, not enumerated.~~ **CLOSED** | `06-ui-ux/19-breakpoints.md` — 6-token grid + per-surface intended layouts. |
| ~~M10~~ | ~~Accessibility (a11y) not gated.~~ **CLOSED** | `19-security-privacy/06-accessibility-wcag.md` — WCAG 2.1 AA + axe-core CI + per-component checklist. |
| ~~M11~~ | ~~Analytics events listed per feature but no taxonomy file.~~ **CLOSED** | `18-analytics-telemetry/03-events.md` — 80+ events. |
| ~~M12~~ | ~~Migration / import dedup algorithm hand-waved.~~ **CLOSED** | `11-import-export/11-dedup-algorithm.md` — 4-stage pipeline; Jaro-Winkler ≥ 0.92. |
| ~~M13~~ | ~~Permissions matrix references roles but no machine-readable matrix.~~ **CLOSED** | `08-sharing-collab/permissions-matrix.json` — RLS codegen-ready. |
| ~~M14~~ | ~~No definition of "Done."~~ **CLOSED** | `20-roadmap/06-definition-of-done.md` — universal + per-domain DoD, PR template. |

### 3.2.1 W-issues — fatal contradictions surfaced 2026-04-19 by AI-readiness audit

> Tracked in `audit-2026-04-19-spec-wide.md` and `audit-2026-04-19-ai-readiness-score.md`. Closure deltas in `audit-2026-04-19-rescore-delta.md`.

| # | Gap | Status | Closed by / Owner |
|---|---|---|---|
| **W-1** | `org_role` SQL enum in `17-admin-org/03-roles.md` omitted `billing` and `system`, contradicting `02-data-model/08-member.md` and `00-overview/02-glossary.md`. | ✅ **CLOSED 2026-04-19** | `17-admin-org/03-roles.md` — enum expanded to 7 values; permission matrix re-tabulated with Billing column; system-role guard CHECK added. |
| **W-2** | 8+ files referenced a bespoke `wss://api.letsmarknow.com/v1/realtime` endpoint and `POST /v1/realtime/ticket` ticket flow, contradicting `08-sharing-collab/14-realtime-transport.md` (locks Supabase Realtime). | ✅ **CLOSED 2026-04-19** | `04-extension/10-sync-and-offline.md` rewritten + `05-web-app/08-billing-page.md` patched. `grep -r 'wss://' spec/` now returns zero bespoke refs. |
| **W-3** | Three different price tables across `10-licensing-billing/01-plans-matrix.md` (canonical), `05-web-app/08-billing-page.md`, and `06-ui-ux/wireframes/05-billing.md`. | ✅ **CLOSED 2026-04-19** | Both downstream files now show $5/$9 Pro/Team prices, declare `01-plans-matrix.md` as canonical, and instruct the implementation to fetch live values via API. |
| W-4 | Channel naming format drift: `collection:<id>` vs `collection:{collection_id}` across realtime files. | OPEN | Globally normalize to `{placeholder}` syntax. |
| W-5 | Broken accessibility spec link (file moved). | OPEN | Repair link in cross-references. |
| W-6 | SKU naming inconsistency: `_yearly` vs `_annual` across `10-licensing-billing/`. | ✅ CLOSED 2026-04-19 | `_yearly` locked in `15-sku-map.md`; `_annual` withdrawn. |
| W-8 | API error-code casing: `UPPER_SNAKE_CASE` (canonical) vs `lower_snake_case` (drift). | OPEN | Sweep `03-api-endpoints/`. |
| W-10 | Money fields: `amount_minor` vs `amount_cents` drift in `10-licensing-billing/`. | ✅ CLOSED 2026-04-19 | Swept 6 files; `amount_cents` canonical. See `15-sku-map.md` W-10 note. |
| W-13 | Pagination param: `limit=50` (canonical, see `01-conventions.md`) vs `page_size=25` in some examples. | OPEN | Sweep examples to use `limit`. |
| F-M11 | Webhook-driven UI consistency: payload schemas not exhaustively listed. | OPEN | Add canonical payload list to `03-api-endpoints/17-billing-webhooks.md`. |

### 3.3 MINOR — AI handles with reasonable defaults

| # | Gap | Default AI will pick |
|---|---|---|
| m1 | Logo / brand assets — none in repo | AI generates one; you'll redo it |
| m2 | Favicon for letsmarknow.com itself | Default Vite icon |
| m3 | OG image / social cards | None generated |
| m4 | Sitemap & robots tuning | Default permissive |
| m5 | 404 / 500 page copy | Generic |
| m6 | Print stylesheet specified but no test | Skipped silently |
| m7 | Keyboard shortcut conflict registry | First feature wins |
| m8 | Animation timing curves implied via tokens, not spec'd per component | Default `ease-out 200ms` everywhere |
| m9 | Localization roadmap absent (hardcoded EN) | English-only |
| m10 | Backup / restore policy for users | Nothing built |

---

## 4. Per-folder readiness scorecard

For each of the 21 folders, three numbers: **Lovable / Cursor / Raw chat**, scale 0–100 = "what fraction the AI can implement correctly without asking back."

| Folder | Lov v3 | **Lov v4** | Cur v3 | **Cur v4** | Raw v3 | **Raw v4** | What changed |
|---|---|---|---|---|---|---|---|
| 00-overview | 95 | 95 | 95 | 95 | 90 | 90 | — |
| 01-information-architecture | 90 | 90 | 90 | 90 | 75 | 75 | — |
| 02-data-model | 90 | 90 | 95 | 95 | 80 | 80 | — |
| 03-api-endpoints | 88 | **94** | 92 | **96** | 75 | **85** | M4 (rate-limits) closed |
| 04-extension | 70 | 70 | 85 | 85 | 45 | 45 | — |
| 05-web-app | 75 | 75 | 85 | 85 | 60 | 60 | — |
| 06-ui-ux | 82 | **92** | 88 | **96** | 70 | **82** | M6 (favicon) + M9 (breakpoints) closed |
| 07-features | 70 | **78** | 75 | **84** | 50 | **62** | M14 (DoD) closed |
| 08-sharing-collab | 75 | **88** | 85 | **94** | 55 | **72** | M3 (realtime) closed |
| 09-auth-accounts | 75 | **90** | 80 | **94** | 55 | **75** | M2 (OAuth) + M4 (rate-limits) closed |
| 10-licensing-billing | 55 | **85** | 65 | **92** | 35 | **65** | M1 (SKU map) closed |
| 11-import-export | 60 | **78** | 70 | **88** | 40 | **60** | M12 (dedup) closed |
| 12-history-undo | 70 | 70 | 75 | 75 | 50 | 50 | — |
| 14-search | 50 | **85** | 60 | **92** | 35 | **65** | M5 (engine) closed |
| 15-visualization | 45 | 45 | 55 | 55 | 25 | 25 | (mind-map math still Phase-3) |
| 16-notifications-updates | 65 | **82** | 70 | **88** | 45 | **62** | M7 (email) closed |
| 17-admin-org | 85 | 85 | 90 | 90 | 65 | 65 | — |
| 18-analytics-telemetry | 85 | 85 | 90 | 90 | 60 | 60 | — |
| 19-security-privacy | 75 | **90** | 80 | **94** | 55 | **75** | M4 (rate-limits) + M10 (a11y) closed |
| 20-roadmap | 100 | 100 | 100 | 100 | 100 | 100 | M14 added per-feature DoD checklist |
| 22-infrastructure | 85 | **94** | 90 | **96** | 60 | **78** | M7 (email) + M8 (storage) closed |
| **Weighted average** | **~78** | **~90** | **~86** | **~94** | **~52** | **~68** | weighted by folder volume |

---

## 5. Why Lovable scores below Cursor

Lovable's scoring is **lower than Cursor not because the spec is worse, but because:**

1. **Context window:** 200 files × avg 100 lines = ~20k lines = roughly the entire useful Lovable session budget. It will forget folder 1 by the time it reads folder 20.
2. **No extension build:** Lovable cannot build a Chrome MV3 extension; whole `04-extension/` (~12 files) is N/A → drops the average.
3. **One-shot edits over loops:** Cursor can run `tsc`, see errors, fix. Lovable also can but tends to write big batches; integration bugs surface later.
4. **Lovable advantages not used here:** Cloud auth, Cloud DB, Cloud functions are *exactly* what `09-auth-accounts/` and `03-api-endpoints/` need. **If you scope Lovable to web-app + Cloud only, score jumps to ~78%.**

---

## 6. The 10 things to add to the spec to push every AI to ≥ 90 %

Ordered by ROI:

1. ~~**`06-ui-ux/17-copy-strings.md`** — full key→EN string map.~~ ✅ **DONE** (closes B3).
2. ~~**`03-api-endpoints/18-error-codes.md`** — enumerated `error_code` table.~~ ✅ **DONE** (closes B2).
3. **`21-testing/`** folder — Gherkin scenarios per feature + per API. *Still open — partially mitigated by M14 DoD; closes B4.*
4. ~~**Annotated wireframes** in `06-ui-ux/wireframes/`.~~ ✅ **DONE** (closes B1).
5. ~~**`22-infrastructure/`** — hosting, env vars, secrets, queues, cron, CDN, domains.~~ ✅ **DONE** (closes B6).
6. ~~**Machine-readable permissions matrix** under `08-sharing-collab/permissions-matrix.json`.~~ ✅ **DONE** (closes M13 → enables RLS codegen).
7. ~~**`10-licensing-billing/15-sku-map.md`**~~ ✅ **DONE** 2026-04-19 (closes M1).
8. ~~`18-analytics-telemetry/03-events.md`~~ ✅ **DONE** (closes M11).
9. ~~**`04-extension/01-manifest.md` finalized**~~ ✅ **DONE** (closes B5).
10. **Seed data** under `99-fixtures/` (one JSON per entity). *Still open — closes B7. User-deferred.*

**Progress (2026-04-19, v4):** 9 of 10 items closed (B1, B2, B3, B5, B6, M11, M13, M1+) plus all 12 majors of v3 round. **Realized lift:** Lovable 62 → 90, Cursor 74 → 94, Raw chat 38 → 68. **Remaining lift available** if B4 (tests) closes: Lovable → ~94, Cursor → ~97, Raw chat → ~75. B7 (seeds) is owner-deferred.

---

## 7. AI hand-off prompt (copy-paste this with the spec)

> You are implementing the product specified in `spec/21-app/`. Read in this order:
>
> 1. `00-overview/02-glossary.md` — vocabulary is **locked**; never use synonyms.
> 2. `01-information-architecture/01-hierarchy.md` — Org → Space → Collection → Group? → Item, max 1 level of Group.
> 3. `02-data-model/*.md` — every entity has full field tables. Generate DB schema + TS types from these literally.
> 4. `03-api-endpoints/01-conventions.md` then specific endpoint files — generate route handlers + Zod schemas literally.
> 5. `20-roadmap/01-phase-0-mvp.md` — **only build what's in this phase.** Ignore later phases.
> 6. Each folder's `README.md` ends with `## Locked rules` — these are non-negotiable; refuse changes that violate them.
>
> **Hard rules:**
> - IDs are UUIDv7 everywhere (never ULID).
> - Roles are `owner|admin|editor|viewer|billing|guest|system` only.
> - Roles live in a separate `user_roles` table; check via `has_role()` security-definer function.
> - Soft-delete = 30 days; verified GDPR DSR bypasses grace period.
> - Share model v1 = single table (`02-data-model/07-share.md`); ignore `08-sharing-collab/01-share-model.md` (v2 design note).
> - Currency, prices, timezone: USD on invoices, UTC on storage, Asia/Kuala_Lumpur (UTC+8) for owner-facing dates.
>
> **When the spec is ambiguous:** STOP and ask. Do not invent enums, error codes, copy strings, layouts, or pricing IDs. Reference `gap-analysis.md` for the known gap list.
>
> **Definition of Done for any feature:**
> 1. DB migration + RLS policies committed.
> 2. API endpoint matches spec body literally (Zod schema + tests).
> 3. UI matches the wireframe (or asks for one if missing).
> 4. Telemetry events fire (per `events.md` once it exists).
> 5. Soft-delete + Undo path verified.
> 6. Locked rules from the relevant `README.md` re-read and confirmed.

---

## 8. Honest verdict

The spec is **A-grade for contracts, C-grade for craft**.

- **Strong:** vocabulary, entities, APIs, data model, roadmap, locked rules — anything an AI can codegen from a table.
- **Weak:** anything an AI must *imagine* — visuals, copy, error catalogs, tests, infrastructure.

If you fix the 10 items in §6, you cross from "AI builds *a* product" to "AI builds *your* product." Until then, plan on **3–8 rounds of correction per feature** and treat AI output as a first draft.
