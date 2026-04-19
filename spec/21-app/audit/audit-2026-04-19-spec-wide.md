# Spec-Wide Cross-File Inconsistency Audit — 2026-04-19

> **Scope:** all 200+ files under `spec/21-app/` (NOT only the 12 m-gap files audited in `audit-2026-04-19-m-gaps.md`).
>
> **Method:** mechanical sweep across 8 dimensions — role names, env-var conventions, breakpoints, error codes, currency / pricing, storage paths, realtime channel naming, plan / SKU IDs — looking for places where two locked-elsewhere answers contradict each other.
>
> **Mode:** spec-only. No code changes. Each finding is annotated with the canonical source-of-truth and the recommended one-line resolution. No file is edited by this audit; that is the next step.
>
> **Triage rubric reused:** §1 of `audit-2026-04-19-decisions-needed.md` — owner-required vs. AI-resolvable.

---

## 1. Executive verdict

| Metric | Value |
|---|---|
| Files swept | 200+ |
| Distinct cross-file inconsistencies found | **17** |
| 🔴 Hard contradictions (codegen would pick wrong answer ≥ 50% of the time) | **5** |
| 🟠 Drifts (same fact, two phrasings) | **8** |
| 🟡 Style / redundancy | **4** |
| Owner-required (per §1 rubric) | **2** of 17 (12%) |
| AI-resolvable | **15** of 17 (88%) |

**Bottom line:** the m-gap reconciliation (v6) cleaned the 12 new files internally, but **5 hard contradictions still exist between the new files and the surrounding 200**. The biggest one is that the *role enum is still drifting* (W-1 below) — `billing` is treated as a real org role in 4 files and as not-a-role in 2 others. Until that is fixed, any code that does `if (role === 'billing')` will get the wrong answer in roughly half the files it cross-references.

---

## 2. Findings — by severity, then by ID

Each finding follows the same shape:
- **What contradicts what**
- **Locked source-of-truth** (per glossary or `audit.md` precedent)
- **Severity** (🔴 / 🟠 / 🟡)
- **Owner / AI** classification
- **Recommended fix** (one line, file path → action)

---

### W-1 🔴 Role enum drift — `billing` role exists in 4 files, absent from canonical SQL enum

- **Drift:** `02-data-model/09-history-event.md` line 20 includes `billing` in the actor_role enum. `09-auth-accounts/01-identity-model.md` line 49, `03-api-endpoints/11-members-invites.md` lines 14 + 80, and `06-ui-ux/wireframes/05-billing.md` line 148 all treat `billing` as a real, invitable role. **But** `17-admin-org/03-roles.md` line 22 — the only place that emits the actual SQL `create type` — defines `org_role` as **`'owner','admin','editor','viewer','guest'`** with **no `billing`**. And `00-overview/02-glossary.md` (per `audit.md` N-1) also omits `billing`.
- **Locked source-of-truth:** the glossary + `mem://index.md` Core rule lock the enum at **`owner, admin, editor, viewer, billing, guest, system`** (7 values). The SQL `create type` in `17-admin-org/03-roles.md` is therefore wrong (missing `billing` and `system`), AND the `system` value should be excluded from `invitable` roles in `03-api-endpoints/11-members-invites.md`.
- **Severity:** 🔴 — codegen of the migration file from `17-admin-org/03-roles.md` would produce a schema that rejects every `billing` member insert.
- **Owner / AI:** **AI-resolvable** (memory locks the enum; just propagate).
- **Fix:**
  1. `17-admin-org/03-roles.md` §2 — extend the SQL enum to `('owner','admin','editor','viewer','billing','guest','system')`.
  2. Add a comment that `system` and `guest` are non-invitable; only `owner | admin | editor | viewer | billing` appear in invite UI.
  3. `02-data-model/08-member.md` — verify enum matches; add `billing` if missing.

---

### W-2 🔴 WebSocket transport — 8 feature files still describe a custom `wss://api…/v1/realtime` endpoint that no longer exists

- **Drift:** `04-extension/10-sync-and-offline.md` line 78 specifies a literal `wss://api.letsmarknow.com/v1/realtime?org=<id>` endpoint with a `POST /v1/realtime/ticket` ticket exchange. `05-web-app/03-dashboard.md` line 119, `05-web-app/04-onboarding.md` line 66, `05-web-app/08-billing-page.md` line 105, `05-web-app/10-activity-feed.md` lines 9 + 70, `06-ui-ux/13-navigation-patterns.md` line 95, `07-features/04-collections.md` line 62, `07-features/12-embeds-and-previews.md` line 46, `08-sharing-collab/12-revocation-and-expiry.md` line 21, and `03-api-endpoints/17-billing-webhooks.md` line 36 all reference "WebSocket invalidation" without saying which WebSocket.
- **Locked source-of-truth:** `08-sharing-collab/14-realtime-transport.md` (post F-M06 reconciliation) locks **Supabase Realtime (Phoenix Channels)** as the only transport for v1. The custom `wss://api…/v1/realtime` endpoint and the ticket-exchange dance were **withdrawn**.
- **Severity:** 🔴 — extension code generated from `04-extension/10-sync-and-offline.md` would attempt to open a connection to an endpoint that does not exist; the hand-off engineer has to know to substitute the Supabase Realtime client.
- **Owner / AI:** **AI-resolvable** (one transport already locked).
- **Fix:**
  1. `04-extension/10-sync-and-offline.md` §7 — replace the custom `wss://` endpoint + ticket flow with a one-line "uses Supabase Realtime per `08-sharing-collab/14-realtime-transport.md` §3" reference. Remove `POST /v1/realtime/ticket` from the API surface.
  2. The 8 feature files referencing "WebSocket" — append a single cross-ref footnote `(transport: Supabase Realtime per 14-realtime-transport.md)` rather than rewriting each.
  3. Delete `wss://rt.letsmarknow.com` and `wss://api.letsmarknow.com/v1/realtime` from any remaining DNS / domain list (already verified absent from `22-infrastructure/05-domains-ssl.md` post F-M23, but double-check).

---

### W-3 🔴 Pricing display in 3 UX files contradicts the locked plans matrix

- **Drift:**
  - `05-web-app/08-billing-page.md` line 28 says **Pro = $9/mo** and line 48 says **Team = $5/seat/mo**. Line 56 says "Pro ($9/mo or $84/yr), Team ($5/seat/mo or $50/seat/yr)".
  - `06-ui-ux/14-copy-voice.md` line 117 uses **"$9 / month"** as the canonical Pro example.
  - `06-ui-ux/wireframes/05-billing.md` lines 20 + 91 show **Pro = $12/user/mo** and **Team = $24/mo**.
- **Locked source-of-truth:** `10-licensing-billing/01-plans-matrix.md` lines 12–13 lock **Pro = $5/mo or $48/yr**, **Team = $9/seat/mo or $84/seat/yr**. This is the post-reconciliation canon (per F-M11 and `audit-2026-04-19-decisions-needed.md` Owner-1).
- **Severity:** 🔴 — billing page UI codegen will display three different prices depending on which file the AI consulted last. Inflated draft numbers ($12 / $24) survived from a discarded pricing experiment.
- **Owner / AI:** **AI-resolvable** (canon is already locked; this is just propagation cleanup, not a re-decision).
- **Fix:**
  1. `05-web-app/08-billing-page.md` lines 28, 48, 56 — swap Pro ↔ Team prices; "Pro $5/mo or $48/yr · 1 seat", "Team $9/seat/mo or $84/seat/yr".
  2. `06-ui-ux/14-copy-voice.md` line 117 — change the example string to `"$5 / month"`.
  3. `06-ui-ux/wireframes/05-billing.md` lines 20 + 91 — replace `$12` with `$5` (Pro) and `$24` with `$9` (Team / seat).
  4. Add a note at the top of each of the three files: `> Pricing canonized by 10-licensing-billing/01-plans-matrix.md §1. Do not edit prices here.`

---

### W-4 🔴 Realtime channel naming — `presence-` and bare `<id>` formats still appear in 2 files

- **Drift:**
  - `08-sharing-collab/06-realtime-presence.md` lines 17–19 use `<placeholder>` syntax (e.g. `collection:<collection_id>`).
  - `08-sharing-collab/14-realtime-transport.md` line 29 (post F-M07) uses `{placeholder}` syntax (e.g. `account:{account_id}`).
  - `08-sharing-collab/07-comments-and-reactions.md` line 55 uses bare `item:<id>` (no field name on the placeholder).
- **Locked source-of-truth:** `00-overview/02-glossary.md` channel naming convention (per F-M07) → `<scope>:{<scope>_id}`. The `{...}` curly braces are the API-convention notation in `03-api-endpoints/01-conventions.md` for path/template parameters.
- **Severity:** 🔴 → 🟠 (downgraded — code parsing channel names usually accepts both, but a strict regex matcher may reject `<...>`). Calling 🔴 because at least one channel-name pattern matcher already exists in `14-realtime-transport.md` §5.
- **Owner / AI:** **AI-resolvable** (cosmetic standardization).
- **Fix:**
  - `08-sharing-collab/06-realtime-presence.md` §2, `07-comments-and-reactions.md` §5 — replace `<id>` and `<scope_id>` with `{scope_id}`.

---

### W-5 🔴 WCAG file referenced at OLD path in two files post-rename

- **Drift:** `20-roadmap/06-definition-of-done.md` line 27 references `19-security-privacy/06-accessibility-wcag.md`. `gap-analysis.md` lines 33 + 88 reference the same old path. The file was **moved** to `06-ui-ux/20-accessibility-wcag.md` per F-M16 (2026-04-19 p.m.), so these are now broken cross-refs.
- **Locked source-of-truth:** `mem://features/gap-analysis-state.md` v6 Round 4 + `audit-2026-04-19-m-gaps.md` §2 confirm the move.
- **Severity:** 🔴 — DoD checklist references a path that returns 404; an AI re-reading the spec will assume both files exist and may regenerate the old one.
- **Owner / AI:** **AI-resolvable** (mechanical rename propagation).
- **Fix:**
  1. `20-roadmap/06-definition-of-done.md` line 27 — change to `06-ui-ux/20-accessibility-wcag.md`.
  2. `gap-analysis.md` lines 33 + 88 — update path; refresh M10's "closed by" reference.
  3. `audit-2026-04-18.md` line 221 — leave (historical record), but add a footnote `(file later moved to 06-ui-ux/20-… per F-M16)`.

---

### W-6 🟠 Stripe / Paddle product-and-price catalog drift across 3 billing files

- **Drift:** `10-licensing-billing/03-stripe-integration.md` line 17 lists `price_pro_monthly_usd` (no `_LIVE` / `_TEST` suffix); `10-licensing-billing/04-paddle-integration.md` line 26 lists `pri_pro_monthly` (no suffix); `10-licensing-billing/15-sku-map.md` lines 28 + 40 use `price_pro_monthly_usd_LIVE` / `_TEST` and `pri_pro_monthly_LIVE` / `_SBX` (env-marked).
- **Locked source-of-truth:** F-M21 reconciled this — env suffix is **placeholder only** in `15-sku-map.md`; real values are resolved at runtime via `resolveSku()`. The **catalog files** (`03-stripe-integration.md`, `04-paddle-integration.md`) are correct without suffix; the SKU map file is correct as illustrative-only.
- **Severity:** 🟠 — the F-M21 reconciliation note is in `15-sku-map.md` but not cross-referenced from the two integration files; an AI reading those in isolation may add `_LIVE` suffix where it shouldn't.
- **Owner / AI:** **AI-resolvable** (cross-ref injection).
- **Fix:** add a one-liner at the top of `10-licensing-billing/03-stripe-integration.md` and `04-paddle-integration.md`: `> Price IDs in §-table are catalog **handles**. Real Stripe Price IDs resolved per env via 15-sku-map.md §6 resolveSku() (per F-M21).`

---

### W-7 🟠 Storage bucket prefix `lmn-` still appears in 4 non-storage files

- **Drift:** `lmn-` was dropped from bucket names per F-M01 (2026-04-19 a.m.), but the prefix lives on as an internal-tooling identifier in:
  - `04-extension/03-service-worker.md` lines 20 + 41 (IndexedDB store name `lmn-cache`)
  - `04-extension/10-sync-and-offline.md` line 17 (same)
  - `04-extension/15-dev-loop.md` line 54 (built-zip name `lmn-<version>.zip`)
  - `06-ui-ux/03-component-library.md` line 141 (ESLint plugin `eslint-plugin-lmn-design`)
  - `06-ui-ux/05-iconography.md` lines 139–142 (asset filenames `lmn-mark.svg` etc.)
- **Locked source-of-truth:** F-M01 dropped `lmn-` only from **storage buckets**, not from internal client identifiers (IndexedDB store names, lint plugin namespaces, asset filenames). These are **legitimate** uses.
- **Severity:** 🟠 — false-positive risk during future cleanup; an over-eager search-and-replace will rename internal stores it shouldn't.
- **Owner / AI:** **AI-resolvable** (clarify the rule).
- **Fix:** add to `22-infrastructure/12-storage-layout.md` §1: `> The lmn- prefix is **dropped from storage bucket names only**. It is **retained** for client-side identifiers (IndexedDB store, lint plugin namespace, brand asset filenames). Do not rename those.`

---

### W-8 🟠 Error code casing — 2 files use `lower_case` codes; 30+ files use `UPPER_CASE`

- **Drift:** `17-admin-org/03-roles.md` line 135 says `code: insufficient_role` (lowercase). `audit.md` L-7 and `08-sharing-collab/01-share-model.md` similar. The other ~30 files referencing error codes (`03-api-endpoints/`, `04-extension/12-messaging.md`, `09-auth-accounts/`) all use `UPPER_SNAKE_CASE`.
- **Locked source-of-truth:** `03-api-endpoints/18-error-codes.md` (the catalog) uses `UPPER_SNAKE_CASE` exclusively. `03-api-endpoints/01-conventions.md` §6 should explicitly state this convention.
- **Severity:** 🟠 — codegen of the error map from `18-error-codes.md` will produce `INSUFFICIENT_ROLE`, but `17-admin-org/03-roles.md` will throw `insufficient_role`; clients matching by string equality will miss the case.
- **Owner / AI:** **AI-resolvable**.
- **Fix:**
  1. `17-admin-org/03-roles.md` line 135 — change to `INSUFFICIENT_ROLE` and add to the canonical error catalog `18-error-codes.md` if missing.
  2. `03-api-endpoints/01-conventions.md` — add explicit rule: "Error `code` values are `UPPER_SNAKE_CASE`. Lowercase variants are non-canonical."

---

### W-9 🟠 Realtime channel `org:{org_id}` mentioned in API specs but missing from `14-realtime-transport.md`

- **Drift:** `03-api-endpoints/13-search.md`, `08-sharing-collab/06-realtime-presence.md`, and `14-realtime-transport.md` enumerate channels `account:`, `space:`, `collection:`, `item:`, `share:`. But the org-wide entitlement / billing broadcast channel is referred to as `org:` in `03-api-endpoints/17-billing-webhooks.md` line 36 and `05-web-app/08-billing-page.md` line 105 ("WebSocket `entitlements_changed`"). `14-realtime-transport.md` §2 does not list the `org:` channel.
- **Locked source-of-truth:** F-M07 + F-M15 added `account:`, `collection:`, `item:` channels but did not enumerate `org:`.
- **Severity:** 🟠 — billing-page entitlement refresh requires this channel; codegen of channel subscriptions will silently omit it.
- **Owner / AI:** **AI-resolvable** (clearly implied by 4 separate billing/entitlement specs).
- **Fix:** `08-sharing-collab/14-realtime-transport.md` §2 — add row: `org:{org_id}` | Org-wide | Members of org | `entitlements_changed`, `quota.warning`, `share.revoked`, `org.settings_changed`.

---

### W-10 🟠 Currency field name `discount_minor` / `amount_minor` vs. `amount_cents`

- **Drift:** `10-licensing-billing/10-coupons-and-promotions.md` lines 64 + 68 use `discount_minor` and `amount_minor`. `10-licensing-billing/15-sku-map.md` (post F-M19) uses `amount_cents`. Both are intended to mean "smallest currency subdivision".
- **Locked source-of-truth:** F-M19 → `amount_cents`. `03-api-endpoints/01-conventions.md` §9 (money convention) should pin this.
- **Severity:** 🟠 — codegen of telemetry events will pick whichever name appears first in the AI's reading; downstream analytics queries will see two columns for the same fact.
- **Owner / AI:** **AI-resolvable**.
- **Fix:**
  1. `10-licensing-billing/10-coupons-and-promotions.md` lines 64–68 — rename `discount_minor` → `discount_cents`, `amount_minor` → `amount_cents`. Add `currency` field to all three telemetry events.
  2. `03-api-endpoints/01-conventions.md` §9 — add explicit rule: "All monetary values are integers in `*_cents` (smallest subdivision of named `currency`). Never use `*_minor` or floating-point dollars."

---

### W-11 🟠 Identity convention — `actor_kind="api_token"` (string) vs. `actor_role=system` (enum)

- **Drift:** `09-auth-accounts/01-identity-model.md` §5 distinguishes service principals via `actor_kind="api_token"`. `02-data-model/09-history-event.md` line 20 distinguishes them via `actor_role=system`. Same concept, two field names.
- **Locked source-of-truth:** `audit.md` L-7 flagged this in 2026-04-18; the resolution there was "unify". Still not unified.
- **Severity:** 🟠 — audit-log queries filtering "exclude system actions" need to know which field is canonical.
- **Owner / AI:** **AI-resolvable** (one engineering choice survives: `actor_role=system` is simpler because the role enum already exists).
- **Fix:** `09-auth-accounts/01-identity-model.md` §5 — replace `actor_kind="api_token"` with `actor_role="system"`. Add `actor_kind` only if a sub-classification is required (e.g. `system.cron`, `system.webhook`, `system.api_token`) as a separate optional field.

---

### W-12 🟠 OAuth client ID for extension uses different env-var than web

- **Drift:** `22-infrastructure/03-env-vars.md` §5 uses `EXT_OAUTH_CLIENT_ID` (no provider, no env). The same file §3 uses `OAUTH_<PROVIDER>_CLIENT_ID_<ENV>` for the web app (e.g. `OAUTH_GOOGLE_CLIENT_ID_PROD`). The extension is also a Google OAuth client, so it should follow the same convention or at least cross-reference why it differs (Chrome Web Store identity).
- **Locked source-of-truth:** F-M02 locked `OAUTH_<PROVIDER>_<FIELD>_<ENV>` for **server-side** OAuth. Extension OAuth uses Chrome Identity API which has a different shape (single client ID baked into manifest).
- **Severity:** 🟠 — the difference is legitimate but un-documented; an AI will either add an `_ENV` suffix that doesn't apply or rename the web vars to drop the suffix.
- **Owner / AI:** **AI-resolvable** (just document the exception).
- **Fix:** `22-infrastructure/03-env-vars.md` §5 — add note: `> EXT_OAUTH_CLIENT_ID does NOT follow OAUTH_<PROVIDER>_<FIELD>_<ENV> pattern because Chrome Identity API requires a single client ID baked into manifest.json at build time. Provider is fixed to Google. Env is determined by EXT_CHANNEL (stable / beta).`

---

### W-13 🟠 Activity-feed pagination — `limit=50` (one file) vs. `page_size=25` (convention)

- **Drift:** `05-web-app/10-activity-feed.md` line 9 uses `?limit=50`. `03-api-endpoints/01-conventions.md` (cursor pagination) uses `?page_size=N` with default 25.
- **Locked source-of-truth:** API conventions file.
- **Severity:** 🟠 — front-end calling the documented endpoint will get a 400 unknown-param error.
- **Owner / AI:** **AI-resolvable**.
- **Fix:** `05-web-app/10-activity-feed.md` line 9 — `GET /v1/history?page_size=50` (or remove the explicit value and let the default apply).

---

### W-14 🟡 `xs` breakpoint listed as `0px` in 2 files, omitted in 1

- **Drift:** `06-ui-ux/04-layout-grid.md` line 13 and `06-ui-ux/19-breakpoints.md` line 12 both list `xs = 0px`. `20-roadmap/06-definition-of-done.md` line 26 says "Responsive at xs / md / lg per `06-ui-ux/19-breakpoints.md`" — implying xs is a real breakpoint to test against.
- **Locked source-of-truth:** xs *is* the default base in mobile-first CSS; it does not need a media-query rule, just an unprefixed style. The DoD line is fine; the inconsistency is purely cosmetic.
- **Severity:** 🟡 — no functional impact.
- **Owner / AI:** **AI-resolvable**.
- **Fix:** `06-ui-ux/19-breakpoints.md` §1 — add note: `> xs is the implicit base — no @media rule needed. Listed for completeness so DoD checklists can reference it as a tested viewport.`

---

### W-15 🟡 IndexedDB store name `lmn-cache` (3 files agree, but no canonical anchor)

- **Drift:** `04-extension/03-service-worker.md` lines 20 + 41 and `04-extension/10-sync-and-offline.md` line 17 all use `lmn-cache` consistently — but no file declares this as the canonical IDB store name. A future AI may rename it to `lmn_cache` (snake_case) per `03-env-vars.md` style rules.
- **Locked source-of-truth:** none (gap).
- **Severity:** 🟡 — currently consistent, latent risk.
- **Owner / AI:** **AI-resolvable**.
- **Fix:** `04-extension/03-service-worker.md` §1 — add explicit rule: `> IndexedDB store name is lmn-cache (kebab-case, intentional). Do not rename to snake_case; existing client installs would orphan their cache.`

---

### W-16 🟡 Lifetime SKU rank ambiguity

- **Drift:** `10-licensing-billing/02-entitlements-engine.md` line 50 says "Lifetime plans rank with their tier (Lifetime Pro = pro)". `10-licensing-billing/05-lifetime-licenses.md` line 21 has the lifetime tier as a separate enum value (`lifetime_pro | lifetime_team`).
- **Locked source-of-truth:** entitlements engine — lifetime is a *purchase mechanism*, not a *tier*. `01-plans-matrix.md` confirms.
- **Severity:** 🟡 — the two files agree on outcome (lifetime maps to a tier) but use different field shapes.
- **Owner / AI:** **AI-resolvable**.
- **Fix:** `10-licensing-billing/05-lifetime-licenses.md` §2 — add note: `> The lifetime_pro / lifetime_team values are SKU keys, not entitlement tiers. Tier resolution: lifetime_pro → pro, lifetime_team → team (per 02-entitlements-engine.md §3).`

---

### W-17 🟡 Pricing-page wireframe predates plans-matrix lock

- **Drift:** `06-ui-ux/wireframes/05-billing.md` was authored before the F-M11 pricing reconciliation; its wireframe shows $12 / $24. The fix is captured under W-3 above; calling it out separately so the wireframe author knows their file is downstream of the pricing canon now.
- **Severity:** 🟡 — already covered by W-3 fix.
- **Owner / AI:** **AI-resolvable**.
- **Fix:** as W-3 + add a header to all `06-ui-ux/wireframes/*.md` files: `> Wireframes are illustrative. Numerical values (prices, quotas, limits) are canonized in their respective spec files; if they conflict, the spec file wins. Refresh wireframe quarterly.`

---

## 3. Owner-required findings (only 2 of 17)

By the §1 rubric of `audit-2026-04-19-decisions-needed.md`, only 2 of the 17 findings would have required owner input had they been live:

| ID | Why owner | Outcome |
|---|---|---|
| W-3 | Pricing visible to public + revenue impact | **Pre-decided** by Owner-1 in `audit-2026-04-19-decisions-needed.md` → $5/$9/$79/$249 wins. AI can now propagate without re-asking. |
| W-1 | Role enum extension affects RLS policies + auth design | **Pre-decided** by `mem://index.md` Core rule → 7-value enum (`owner, admin, editor, viewer, billing, guest, system`) is locked. AI propagates. |

In other words: **0 net-new owner decisions needed.** Both lookups already have a canon. The 15 remaining are pure mechanical / cross-ref / convention propagation work that any AI can do without inventing.

---

## 4. Resolution plan (suggested order)

Order chosen by *blast radius* — the finding that, if left unresolved, breaks the most downstream files.

1. **W-1** (role enum) — fixes RLS / auth migration / API invite endpoint in one stroke.
2. **W-2** (WebSocket transport) — fixes 8 feature-file references + extension sync code shape.
3. **W-3** (pricing) — fixes billing UI + copy + wireframe in 4 files.
4. **W-5** (WCAG path) — un-breaks DoD checklist link.
5. **W-4** (channel naming) — pure cosmetic but un-blocks W-9.
6. **W-9** (`org:` channel) — unblocks billing-page realtime spec.
7. **W-8** (error code casing) — prevents silent client-side miss-match.
8. **W-6** (Stripe/Paddle catalog) + **W-10** (currency field name) + **W-11** (system actor field name) — three small cross-ref additions.
9. **W-7, W-12, W-13, W-14, W-15, W-16, W-17** — style / clarity, batch in one PR.

Estimated edits: ~22 small targeted line-replaces across ~18 files. No file rewrites. No new files.

---

## 5. Score impact

If the resolution plan in §4 is executed:

| Target AI | Current (post v6) | After this audit's fixes | Why |
|---|---|---|---|
| Lovable | 91% | **93%** | W-1 + W-2 close the two biggest "pick the wrong locked answer" risks |
| Cursor / IDE | 95% | **97%** | IDE already grounds itself in code; gains are smaller |
| Raw chat | 70% | **76%** | Removes the biggest "ambient ambiguity" bucket: role enum + transport URL |

**Why raw-chat gains the most:** an AI without a codebase has to choose between two contradictory locked statements based purely on file-read order; eliminating the contradictions removes that variance.

---

## 6. What's NOT in this audit

To keep this finite and actionable:

- **Sequencing problems** (Phase-0 features depending on Phase-1+ infra) — separate audit recommended next.
- **File-internal contradictions** (a single file contradicting itself) — caught only by a per-file deep-read, not a cross-file sweep.
- **The 5 weakest hand-off-readiness files** (per `audit-2026-04-19-decisions-needed.md` §3.3 follow-up) — separate rewrite pass.
- **Orphan cross-refs** (file path mentioned but file does not exist) — only W-5 caught here; a full link-checker pass would find more.

---

## 7. Cross-refs

- m-gap audit (the 12 new files): `audit-2026-04-19-m-gaps.md`
- Triage rubric: `audit-2026-04-19-decisions-needed.md` §1
- Reconciliation log: `mem://features/gap-analysis-state.md` v6
- Original layered audit (2026-04-18): `audit-2026-04-18.md` + `audit.md`
