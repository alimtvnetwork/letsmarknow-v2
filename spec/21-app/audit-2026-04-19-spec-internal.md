# Spec-Internal Audit (No-Implementation Mode)

> **Date:** 2026-04-19 (UTC+8)
> **Scope:** Audit of `spec/21-app/` itself — internal consistency, coverage, ambiguity, and hand-off readiness.
> **Why this and not impl audit:** Implementation is intentionally on hold (`mem://constraints/no-implementation-mode`). The previous spec→impl audit (`audit-2026-04-18.md`) is still valid; re-running would change nothing. This audit instead targets what *can* still improve in this phase: the spec itself.
> **Companion docs:** `gap-analysis.md` (AI build-readiness, v3), `audit.md` (older spec reconciliation), `audit-2026-04-18.md` (spec→impl).

---

## 1. Executive verdict

| Metric | Score | Verdict |
|---|---|---|
| **Spec compliance (internal consistency)** | **84 / 100** | High. Naming, hierarchy, locked rules mostly enforced. |
| **Spec completeness (coverage of declared scope)** | **76 / 100** | 6 of 10 top gaps closed; 12 majors still open per gap-analysis v3. |
| **Clarity & testability** | **72 / 100** | Strong contracts; weak on acceptance criteria (B4 deferred), ambiguous on M3/M4/M5/M7. |
| **Hand-off readiness for another AI** | **78 / 100 (Lovable) · 86 / 100 (Cursor)** | Per gap-analysis v3. |
| **Reliability risk if AI builds from spec today** | **45 / 100** (lower = better) | M1, M2, M3, M5, M7 will block features mid-build. |

**Repository facts (measured 2026-04-19):**
- 223 markdown files in `spec/21-app/` (was 200 last audit; +23 from B5/B6/M11/M13/audit closures).
- 1 JSON file (`08-sharing-collab/permissions-matrix.json`).
- 21 numbered domain folders. **Missing numbers: `13/`, `21/`** (intentional gaps; flag below).
- All folders have `readme.md`.
- Locked-rules block present in **18/21** folder readmes; **3 missing**: `00-overview`, `01-information-architecture`, `02-data-model`.
- All files in numbered folders follow `NN-name.md` convention. **Naming compliance: 100%.**
- 3 files reference `TBD/TODO/FIXME` (low; all intentional placeholders).
- 11 data-model entities · 18 API endpoint files (1:1.6 ratio — healthy).
- `05-web-app/01-routes.md`: 64 table rows (rich routing surface).

---

## 2. Findings — spec-internal, ranked by risk

> 🔴 BLOCKING (will mislead any AI implementer) · 🟠 PARTIAL · 🟢 OK
> Severity / Confidence / Risk per finding.

### S1 🔴 Folder number `13/` is unused — sequence gap
- **Spec:** Numbered-folder convention (locked Core rule).
- **Gap:** Folders skip from `12-history-undo/` to `14-search/`. No `13-*/` exists. An AI scanning the tree will assume something was deleted.
- **Severity:** 4/10 · **Confidence:** 10/10 · **Risk:** medium
- **Why fails:** Hand-off AI may invent a domain to fill `13/` or flag it as an error.
- **Fix:** Either (a) renumber `14..22` down by one, or (b) add a 1-line note in `readme.md` that "13 is reserved (or skipped intentionally)".
- **Remaining after fix:** Same decision needed for `21/` (see S2).
- **Blocks compliance:** No, but lowers hand-off score.

### S2 🔴 Folder number `21/` is unused — second sequence gap
- **Spec:** Same as S1.
- **Gap:** `20-roadmap/` jumps to `22-infrastructure/`.
- **Severity:** 4/10 · **Confidence:** 10/10 · **Risk:** medium
- **Fix:** Document the reservation in `readme.md` (e.g. "21 reserved for `21-testing/` once B4 is closed"). This actually maps to a known plan (B4), so document it as such.
- **Blocks compliance:** No.

### S3 🔴 Locked-rules block missing in 3 foundational readmes
- **Spec:** Convention — every folder readme ends with `## Locked rules`.
- **Gap:** `00-overview/readme.md`, `01-information-architecture/readme.md`, `02-data-model/readme.md` have no Locked-rules section.
- **Severity:** 7/10 · **Confidence:** 10/10 · **Risk:** high
- **Why fails:** These are the *most-read* folders by any AI. Without explicit locked rules, AI will mutate vocabulary, hierarchy, or entity invariants.
- **Fix:** Append a `## Locked rules` block to each:
  - `00-overview`: vocabulary frozen, browser scope = Chrome v1, identifiers = UUIDv7, role enum locked.
  - `01-information-architecture`: max 1 level of Group, Org→Space→Collection→Group?→Item.
  - `02-data-model`: UUIDv7 PKs, soft-delete = 30d, FKs `on delete cascade` per file, every entity has RLS.
- **Blocks compliance:** YES (these are the "constitutional" docs).

### S4 🔴 Open spec gaps will block any implementer (carry-over from gap-analysis v3)
- **Spec:** `gap-analysis.md` §3.2
- **Gap:** Still open — M1 SKU map, M2 OAuth client IDs, M3 realtime transport, M4 rate limit values, M5 search engine, M6 favicon pipeline, M7 email provider, M8 storage layout, M9 breakpoints, M10 a11y target, M12 dedup algorithm, M14 definition of done.
- **Severity:** 9/10 · **Confidence:** 10/10 · **Risk:** critical
- **Why fails:** Any AI that starts building will stall the moment it hits one of these.
- **Fix:** Close in priority order: M14 → M3 → M5 → M7 → M1 → M4 → M9 → M10 → M2 → M6 → M8 → M12. (M14 first because Definition of Done gates everything else.)
- **Remaining after fix:** B4 (tests) and B7 (fixtures) still deferred per user.
- **Blocks compliance:** YES.

### S5 🔴 Definition of Done (M14) is missing — no shippable acceptance bar
- **Spec:** Gap M14 in `gap-analysis.md`.
- **Gap:** No checklist anywhere defining "this feature is done when X, Y, Z true."
- **Severity:** 9/10 · **Confidence:** 10/10 · **Risk:** critical
- **Why fails:** AI (and humans) declare features complete that aren't. Sharing v1 could "ship" with no audit log; billing could "ship" with no webhook signing.
- **Fix:** Create `spec/21-app/00-overview/06-definition-of-done.md` with a per-feature checklist template (DB migration + RLS, API contract + Zod + tests, UI matches wireframe, telemetry fires, undo verified, locked rules confirmed, copy from `17-copy-strings.md` used).
- **Blocks compliance:** YES.

### S6 🔴 Realtime transport (M3) undefined — affects 4 folders
- **Spec:** `08-sharing-collab/06-realtime-presence.md`, `12-history-undo/03-conflict-resolution.md`, `15-visualization/06-resizable-sections.md`, `04-extension/10-sync-and-offline.md`.
- **Gap:** Spec says "WebSocket" without choosing Supabase Realtime vs Y.js vs raw WS vs Phoenix.
- **Severity:** 8/10 · **Confidence:** 10/10 · **Risk:** high
- **Why fails:** Choice cascades into RLS strategy, pricing, conflict-resolution algo, offline queue.
- **Fix:** Pick **Supabase Realtime** (consistent with Lovable Cloud) or **Y.js over Realtime channels** (if CRDT needed for mind-map). Document in `06-realtime-presence.md` with rationale.
- **Blocks compliance:** YES.

### S7 🔴 Search engine (M5) undefined — performance SLA at risk
- **Spec:** `14-search/*` (5 files describe UX; engine choice absent).
- **Gap:** No decision between Postgres FTS · Meilisearch · Typesense · Algolia.
- **Severity:** 7/10 · **Confidence:** 10/10 · **Risk:** high
- **Why fails:** UX promises "<150ms p95" globally; Postgres `ILIKE` won't hit it past 100k rows.
- **Fix:** Choose **Postgres FTS for MVP** (zero ops), document upgrade path to Meilisearch at 500k items.
- **Blocks compliance:** YES.

### S8 🔴 Email provider (M7) undefined — verification + invites + share notifications all blocked
- **Spec:** `09-auth-accounts/09-email-verification.md`, `08-sharing-collab/08-notifications.md`, `03-api-endpoints/11-members-invites.md`.
- **Gap:** No Resend / Postmark / SES choice; no DKIM/SPF/DMARC requirements.
- **Severity:** 7/10 · **Confidence:** 10/10 · **Risk:** high
- **Fix:** Pick **Resend** (Lovable-friendly), add DKIM/SPF/DMARC checklist to `22-infrastructure/05-domains-ssl.md`.
- **Blocks compliance:** YES.

### S9 🔴 SKU map (M1) missing — billing spec is a contract without IDs
- **Spec:** `10-licensing-billing/01-plans-matrix.md` (tiers + prices) but no Stripe/Paddle product/price IDs.
- **Gap:** No `15-sku-map.md` mapping tier × currency × provider → price ID.
- **Severity:** 8/10 · **Confidence:** 10/10 · **Risk:** critical
- **Why fails:** Live billing fails on first transaction; promo codes can't be validated.
- **Fix:** Create `spec/21-app/10-licensing-billing/15-sku-map.md` with TBD-marked placeholders per (USD/EUR/MYR) × (monthly/yearly/lifetime) × provider.
- **Blocks compliance:** YES.

### S10 🔴 Rate-limit values (M4) hand-waved
- **Spec:** `09-auth-accounts/11-rate-limits-and-abuse.md`, `19-security-privacy/*`.
- **Gap:** "Throttle abusive auth attempts" with no `5/min/IP` numbers.
- **Severity:** 7/10 · **Confidence:** 10/10 · **Risk:** high
- **Fix:** Add a numeric table in `11-rate-limits-and-abuse.md`: per-endpoint limits (auth, share-viewer, save-tab burst, search), with separate dev/prod values.
- **Blocks compliance:** YES.

### S11 🟠 Mobile breakpoints (M9) implied not enumerated
- **Spec:** `06-ui-ux/04-layout-grid.md`.
- **Gap:** Mentions responsive but no `sm/md/lg/xl` token mapping with intended layouts.
- **Severity:** 6/10 · **Confidence:** 10/10 · **Risk:** high
- **Fix:** Append a breakpoint table mapping each breakpoint to a wireframe in `06-ui-ux/wireframes/`.
- **Blocks compliance:** YES.

### S12 🟠 Accessibility target (M10) absent
- **Spec:** UX folder — none state WCAG 2.1 AA.
- **Severity:** 7/10 · **Confidence:** 9/10 · **Risk:** high (legal in EU)
- **Fix:** Add `spec/21-app/06-ui-ux/18-accessibility.md` declaring WCAG 2.1 AA + per-component checklist.
- **Blocks compliance:** YES.

### S13 🟠 Dedup algorithm (M12) hand-waved
- **Spec:** `11-import-export/05-mapping-and-dedup.md` says "fuzzy match".
- **Severity:** 6/10 · **Confidence:** 10/10 · **Risk:** high
- **Fix:** Specify URL canonicalization rules + Levenshtein threshold (`>0.85` on title, exact on canonical URL).
- **Blocks compliance:** YES.

### S14 🟠 OAuth client IDs (M2) absent
- **Spec:** `09-auth-accounts/04-oauth-providers.md`.
- **Severity:** 6/10 · **Confidence:** 10/10 · **Risk:** high
- **Fix:** Document the redirect URI pattern + which client IDs live where (Lovable Cloud secrets); leave the IDs themselves as TBD with clear placeholder names.
- **Blocks compliance:** YES.

### S15 🟠 Storage bucket layout (M8) undefined
- **Spec:** `22-infrastructure/06-cdn-storage.md` exists but no path conventions.
- **Severity:** 5/10 · **Confidence:** 10/10 · **Risk:** medium
- **Fix:** Append path table: `favicons/{hash}.png`, `exports/{org_id}/{export_id}.zip`, `attachments/{org_id}/{item_id}/{file_id}`.
- **Blocks compliance:** YES.

### S16 🟠 Favicon pipeline (M6) undefined — privacy implication
- **Spec:** Implied by Item entity; no provider chosen.
- **Severity:** 6/10 · **Confidence:** 9/10 · **Risk:** high (privacy)
- **Fix:** Choose **self-hosted favicon fetcher** (edge function) over Google s2 / DuckDuckGo proxy. Document in `07-features/12-embeds-and-previews.md`.
- **Blocks compliance:** YES.

### S17 🟠 Tests (B4) and fixtures (B7) intentionally deferred
- **Spec:** Per `mem://features/gap-analysis-state`.
- **Severity:** 7/10 · **Confidence:** 10/10 · **Risk:** high (compounds)
- **Note:** Documented decision. Re-flag at next milestone.
- **Blocks compliance:** YES (eventually).

### S18 🟠 `audit.md` and `gap-analysis.md` and `audit-2026-04-18.md` are unindexed
- **Spec:** `spec/21-app/readme.md`.
- **Gap:** Top-level audit/gap files exist but the root readme doesn't list them as the entry-point trio for any AI hand-off.
- **Severity:** 4/10 · **Confidence:** 10/10 · **Risk:** medium
- **Fix:** Add a "Read these first" section to `spec/21-app/readme.md` listing audit / gap-analysis / audit-2026-04-18 / definition-of-done (once S5 closes).
- **Blocks compliance:** No.

### S19 🟠 Permissions matrix JSON not referenced from data-model files
- **Spec:** `08-sharing-collab/permissions-matrix.json` (M13).
- **Gap:** Each entity file in `02-data-model/*.md` should link to its row in the matrix.
- **Severity:** 5/10 · **Confidence:** 9/10 · **Risk:** medium
- **Fix:** Append a `## Permissions` line to each entity file pointing at the JSON.
- **Blocks compliance:** No.

### S20 🟠 Conversation log file referenced in Core memory but doesn't exist
- **Spec:** Core memory says "append every user instruction verbatim to `spec/21-app/00-conversation-log.md`".
- **Gap:** No `00-conversation-log.md` found in repo (also not under `00-overview/`).
- **Severity:** 5/10 · **Confidence:** 10/10 · **Risk:** medium
- **Fix:** Either (a) create the file and start logging, or (b) drop the rule from Core memory if abandoned. **Decide explicitly.**
- **Blocks compliance:** No, but is a violated locked rule.

### S21 🟢 Naming convention compliance — 100%
- **Evidence:** 0 unnumbered files in numbered folders.
- **Note:** Strong asset. Maintain.

### S22 🟢 Locked vocabulary holding
- **Evidence:** `00-overview/02-glossary.md` plus role enum lock referenced consistently.
- **Note:** Strong asset.

### S23 🟢 Browser scope discipline
- **Evidence:** v1 = Chrome only; multi-browser deferred to Phase 4. No spec file violates.

---

## 3. Rubric scoring (0–100)

| Dimension | Score | Notes |
|---|---|---|
| **Requirement coverage (declared scope)** | 76 | 6 of 10 top gaps closed; 12 majors open |
| **Logic correctness (entity invariants, role enum)** | 90 | UUIDv7, role enum, share v1, browser scope all locked & consistent |
| **Edge case handling** | 55 | Good in data-model; weak in import dedup (M12), rate limits (M4), conflict resolution (M3) |
| **Error handling** | 88 | `18-error-codes.md` is comprehensive (60+ codes) |
| **Consistency with own conventions** | 92 | Naming 100%, locked-rules 18/21, vocabulary stable |
| **Missing/ambiguous requirements** | 60 | M3, M5, M7, M14 are showstoppers; everything else is a known-known |
| **Maintainability of spec itself** | 78 | Good folder structure; root readme should index audit trio (S18) |
| **Testability (acceptance criteria)** | 35 | B4 deferred; no Gherkin; M14 (DoD) missing |
| **Security & safety considerations** | 80 | Permissions matrix JSON shipped; threat model present; rate limits soft (M4) |
| **Scalability / performance** | 70 | Infra spec ✅; search engine choice (M5) and storage layout (M8) still gaps |
| **Hand-off readiness (AI builds from this)** | 78 / 86 | Lovable / Cursor per gap-analysis v3 |

---

## 4. Top 5 risks (spec-only)

| Rank | Risk | Why it matters |
|---|---|---|
| 1 | **No Definition of Done (S5/M14)** | Every other gap-closure is unverifiable without it. |
| 2 | **3 foundational readmes lack Locked-rules block (S3)** | The most-read docs let AI improvise the constitutional layer. |
| 3 | **M3 / M5 / M7 cluster (S6/S7/S8)** | Realtime, search, email — all infra-defining choices that cascade into 4+ folders each. |
| 4 | **M1 / M14 cluster (S5/S9)** | Billing has prices but no IDs; features have specs but no done-bar. |
| 5 | **Conversation-log rule unfulfilled (S20)** | Violates a locked Core rule; either honor or delete it. |

---

## 5. Highest-priority spec fixes (in order)

1. **S5 → create `00-overview/06-definition-of-done.md`** (M14).
2. **S3 → append Locked-rules to 3 foundational readmes**.
3. **S6 → pick realtime transport** (M3) and document.
4. **S5/S20 → resolve conversation-log rule**: create file or remove rule.
5. **S7 → pick search engine** (M5).
6. **S8 → pick email provider** (M7).
7. **S9 → create SKU map** (M1).
8. **S10 → numeric rate-limit table** (M4).
9. **S11 → breakpoint table** (M9).
10. **S12 → a11y target file** (M10).
11. **S1/S2 → document folder gaps `13/` and `21/`**.
12. **S18 → index audit trio in root readme**.
13. **S13/S14/S15/S16 → close M12/M2/M8/M6**.

After these 13 closures, spec hand-off readiness should reach **~92 (Lovable) / ~96 (Cursor)** — beyond which only B4 (tests) and B7 (fixtures) remain, both deferred by user choice.

---

## 6. What changed since `audit-2026-04-18.md`

- Implementation: **unchanged** (no-impl mode locked).
- Spec: **+23 files** since last impl audit (B5/B6/M11/M13 closed; this audit + previous audit added).
- Gap-analysis scores: **unchanged** (Lovable 78 · Cursor 86 · Raw 52).
- New constraint in memory: `mem://constraints/no-implementation-mode`.

---

## 7. Assumptions

1. User remains in spec-only mode until they explicitly lift the constraint.
2. B4 (tests) and B7 (fixtures) remain deferred indefinitely; not counted against compliance until lifted.
3. Phase 0 MVP is the v1 target. Phase 4 (cross-browser) is out of scope.
4. Lovable Cloud is the assumed runtime when M3/M5/M7 are decided (favors Supabase Realtime + Postgres FTS + Resend).
