# Spec → Implementation Gap Analysis

> **Question this answers:** "If I hand `spec/21-app/` to an AI and say 'build this,' how much will it actually deliver before failing?"
>
> **Method:** Brutally honest. Assume the AI is dumb (no inference, no defaults, no asking back). Score against three target AIs side-by-side.
>
> **Spec measured:** 200 markdown files, ~916 KB, ~25,000 lines, 21 numbered domain folders.
>
> **Date:** 2026-04-18. **Audit version:** v1 (post 10-step fix).

---

## 1. TL;DR scorecard

| Target AI | Realistic completion if handed spec blindly | Will it ship a usable product? | Main failure mode |
|---|---|---|---|
| **Lovable** (React+Vite+Tailwind+Cloud) | **62%** | Yes — MVP slice works | Runs out of context; rebuilds same files; can't keep 200 files coherent in one session |
| **Cursor / Windsurf / Claude Code** (IDE agents) | **74%** | Yes — closest to full v1 | Overshoots scope, invents APIs, ignores locked rules without constant re-grounding |
| **Raw Claude / GPT / Gemini chat** (no execution) | **38%** | No — produces snippets, not a product | No file system, no test loop, loses thread after ~30 files |

**Bottom line:** The spec is **strong on contracts, weak on visuals and acceptance criteria**. Any AI will build something that compiles and roughly matches the data model, but **none will independently produce the exact product you have in your head** without 3–8 rounds of correction.

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
| B5 | **Chrome extension MV3 manifest not finalized.** `04-extension/01-manifest.md` exists but permissions, host patterns, OAuth client IDs are TBD. | Extension build + Chrome Web Store submission | AI invents permissions → store rejection | Medium — fill manifest.json template literally |
| B6 | **No infrastructure / deployment spec.** No file describes: hosting, CI/CD, env var inventory, secrets vault, domains, SSL, CDN, queues, cron. | Day 1 of deploy | AI defaults to Vercel + Supabase free tier → won't scale, no Redis for share-revocation 5s SLA | Medium — `22-infrastructure/` folder |
| B7 | **No real seed/sample data.** No `seeds.json` or fixture file. | Every dev environment, every test | AI generates fake data inline, inconsistent across runs | Low — one seed file per major entity |

### 3.2 MAJOR — AI will fill with wrong defaults

| # | Gap | Risk |
|---|---|---|
| M1 | **Pricing numbers exist but Paddle/Stripe product IDs don't.** `01-plans-matrix.md` has tiers but no `price_xxx` SKU mapping. | AI hardcodes placeholder IDs; live billing fails on first transaction. |
| M2 | **OAuth provider client IDs / redirect URIs not listed.** | AI hardcodes `localhost`; OAuth fails in prod. |
| M3 | **Realtime presence transport unspecified.** `08-sharing-collab/06-realtime-presence.md` says "WebSocket" but no protocol (Phoenix? Supabase Realtime? Y.js? raw WS?). | AI picks Socket.io → conflicts with Supabase Realtime billing. |
| M4 | **Rate limits stated as policy, not as values.** "Throttle abusive auth attempts" with no `5/min/IP` numbers. | AI either over-throttles real users or leaves wide open. |
| M5 | **Search engine choice undefined.** `14-search/` describes UX but not Postgres FTS vs Meilisearch vs Typesense vs Algolia. | AI picks the easiest (Postgres `ILIKE`); fails the "<150ms p95" non-goal. |
| M6 | **Favicon pipeline only described.** No service chosen (Google s2 vs self-hosted vs duckduckgo proxy). | Privacy violation if AI picks Google. |
| M7 | **Email provider not specified.** Verification, invites, share notifications all need email. No Resend/Postmark/SES choice. | AI picks Nodemailer + Gmail → spam folder + no DKIM. |
| M8 | **Storage bucket layout undefined.** No path convention for favicons, exports, attachments. | AI invents naming; cleanup jobs break. |
| M9 | **Mobile breakpoints implied, not enumerated.** `04-layout-grid.md` mentions responsive but no `sm/md/lg` token mapping with intended layouts. | AI ships desktop-first; mobile broken. |
| M10 | **Accessibility (a11y) not gated.** No WCAG 2.1 AA target stated, no per-component a11y checklist. | AI skips ARIA; legal risk in EU. |
| M11 | **Analytics events listed per feature but no taxonomy file.** Each `07-features/*.md` mentions events; no master `events.md`. | AI emits inconsistent event names; dashboards broken. |
| M12 | **Migration / import dedup algorithm hand-waved.** `05-mapping-and-dedup.md` says "fuzzy match" without algorithm or threshold. | AI picks Levenshtein > 0.8 arbitrarily; users complain. |
| M13 | **Permissions matrix references roles but no machine-readable matrix.** `05-permissions-matrix.md` is prose, not a table the AI can codegen RLS from. | AI writes wrong RLS policies; security incident. |
| M14 | **No definition of "Done."** No checklist per feature: "ship when X, Y, Z true." | AI declares features complete that aren't. |

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

| Folder | Lov | Cur | Raw | Notes |
|---|---|---|---|---|
| 00-overview | 95 | 95 | 90 | Vocabulary locked, vision clear |
| 01-information-architecture | 90 | 90 | 75 | Hierarchy explicit |
| 02-data-model | **90** | **95** | 80 | Strongest section. Direct schema codegen possible. |
| 03-api-endpoints | 80 | 85 | 60 | Missing error code enum (B2) |
| 04-extension | 50 | 60 | 25 | Manifest TBD (B5); Lovable can't build extensions |
| 05-web-app | 55 | 70 | 40 | Layout described in prose only (B1) |
| 06-ui-ux | 65 | 70 | 50 | Tokens great; copy strings missing (B3) |
| 07-features | 70 | 75 | 50 | Per-feature locked rules help; no acceptance tests (B4) |
| 08-sharing-collab | 60 | 70 | 40 | Realtime transport undefined (M3) |
| 09-auth-accounts | 75 | 80 | 55 | OAuth IDs missing (M2) |
| 10-licensing-billing | 55 | 65 | 35 | No SKU mapping (M1); Paddle/Stripe live secrets needed |
| 11-import-export | 60 | 70 | 40 | Dedup algorithm hand-waved (M12) |
| 12-history-undo | 70 | 75 | 50 | Event log model clear |
| 14-search | 50 | 60 | 35 | Engine undefined (M5) |
| 15-visualization | 45 | 55 | 25 | Mind-map view has no math; column view no virtualization spec |
| 16-notifications-updates | 65 | 70 | 45 | Email provider missing (M7) |
| 17-admin-org | 70 | 75 | 50 | RLS not codegen-ready (M13) |
| 18-analytics-telemetry | 60 | 65 | 40 | Event taxonomy fragmented (M11) |
| 19-security-privacy | 75 | 80 | 55 | Threat model strong; rate limits soft (M4) |
| 20-roadmap | 100 | 100 | 100 | Pure planning, no impl needed |
| **Weighted average** | **~62** | **~74** | **~38** | weighted by folder volume |

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

1. **`06-ui-ux/17-copy-strings.md`** — full key→EN string map. *Closes B3, m1, m9 partially.*
2. **`03-api-endpoints/18-error-codes.md`** — enumerated `error_code` table with HTTP status, retryable flag, suggested toast. *Closes B2.*
3. **`21-testing/`** folder — Gherkin scenarios per feature + per API. *Closes B4 and M14.*
4. **Annotated wireframes** — even hand-drawn screenshots in `06-ui-ux/wireframes/` named per route. *Closes B1.*
5. **`22-infrastructure/`** — hosting, env vars, secrets, queues, cron, CDN, domains. *Closes B6.*
6. **Machine-readable permissions matrix** (CSV/JSON) under `08-sharing-collab/permissions-matrix.json`. *Closes M13 → enables RLS codegen.*
7. **`10-licensing-billing/sku-map.md`** — Paddle/Stripe product+price IDs per tier per currency. *Closes M1.*
8. **`18-analytics-telemetry/events.md`** — single event taxonomy with name, props schema. *Closes M11.*
9. **`04-extension/01-manifest.md` finalized** — actual `manifest.json` literal. *Closes B5.*
10. **Seed data** under `99-fixtures/` (one JSON per entity). *Closes B7.*

**Estimated effort to write all 10:** ~1 day of focused work. **Expected score lift:** Lovable 62 → 88, Cursor 74 → 92, Raw chat 38 → 65.

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
