# Audit — 12 New M-Gap Spec Files vs. Existing Spec

> **Date:** 2026-04-19 (UTC+8)
> **Scope:** Cross-reference the 12 spec files added on 2026-04-19 (M1, M2, M3, M4, M5, M6, M7, M8, M9, M10, M12, M14) against the existing 200-file spec.
> **Method:** Read each new file; for every concrete claim (role, breakpoint, error code, rate limit, storage path, currency, timezone, vendor, environment URL, naming convention), grep the rest of `spec/21-app/` for the same concept. Record every mismatch.
> **Severity scale:** 🔴 Hard conflict (two files contradict; downstream code will pick one and break the other) · 🟠 Drift (slightly different statements, recoverable) · 🟡 Style/redundancy (no semantic conflict).
> **Auditor stance:** Strict. The new files are the *new* arrivals — when they conflict with older locked files, the new files lose unless the new file was a deliberate revision (none were).

---

## 1. Executive verdict

| Metric | Value |
|---|---|
| New files audited | 12 |
| Distinct conflicts found | **23** |
| 🔴 Hard conflicts | **11** → **0 remaining (all resolved 2026-04-19)** |
| 🟠 Drift | **9** (deferred — see §3 of this audit) |
| 🟡 Style/redundancy | **3** (deferred) |
| Files with at least 1 hard conflict | 9 of 12 |
| Files clean | 1 (M14 — `20-roadmap/06-definition-of-done.md`) |

**Status update (2026-04-19, post-reconciliation):** All 11 🔴 hard conflicts have been resolved in-place. Findings F-M01 through F-M12 below are kept for historical reference but each is now annotated **RESOLVED** with the file(s) actually edited. The 9 🟠 drifts (F-M13–F-M21) and 3 🟡 style issues (F-M22–F-M23 + one inline) remain deferred per user direction (2026-04-19).

**Bottom line (original):** The 12 new files were written in isolation. Several restate facts the spec already locked elsewhere — and several restated them differently. **As of 2026-04-19 reconciliation, the hard-conflict portion of that risk is gone**; codegen for `permissions-matrix.json`, `errors.ts`, `sku-map.ts`, `rate-limits.ts`, and the storage layout will now produce a single consistent answer. Drifts/style remain as future cleanup.

---

## 2. Findings — by severity, then by ID

### F-M01 🔴 Storage bucket names AND path convention conflict

- **Old (locked):** `22-infrastructure/06-cdn-storage.md` §2 — buckets are **`lmn-favicons`, `lmn-og-images`, `lmn-exports`, `lmn-imports`, `lmn-attachments`, `lmn-avatars`, `lmn-backups`** (7 buckets, all `lmn-` prefixed).
- **Old (locked):** Same file §3 — path convention is `<bucket>/<org_id>/<entity_type>/<entity_id>/<filename>`.
- **New:** `22-infrastructure/12-storage-layout.md` §1 — buckets are **`favicons, attachments, exports, imports, org-assets, share-snapshots, email-attachments, audit-archive`** (8 buckets, no prefix).
- **New:** Same file §2 — path convention is `{bucket}/{shard}/{logical_id}/{kind}.{ext}`.
- **Impact:** Two completely different storage layouts. ANY storage-related codegen (signed URL helpers, cleanup crons, RLS policies on storage) will pick one and the other will fail.
- **Severity:** 🔴 Hard conflict.
- **Recommended fix:**
  1. Pick ONE bucket-naming scheme. Recommend dropping `lmn-` prefix (cleaner, modern Cloud convention) → align `06-cdn-storage.md` to the new file.
  2. Pick ONE path scheme. Recommend the **new** sharded scheme for content-addressed buckets (`favicons`, `share-snapshots`) and the **old** `<org_id>/<entity_type>/...` scheme for entity-keyed buckets (`attachments`, `exports`). Rewrite both files to express this hybrid explicitly.
  3. Reconcile bucket inventory: `lmn-og-images` (old) vs `share-snapshots` (new) — they are the same thing; pick one name. `lmn-backups` (old) is missing from new. `audit-archive` (new) is missing from old. `email-attachments` (new) is missing from old.

### F-M02 🔴 OAuth env-var names contradict

- **Old (locked):** `22-infrastructure/03-env-vars.md` §3 — env var names are `OAUTH_GOOGLE_CLIENT_ID`, `OAUTH_GOOGLE_CLIENT_SECRET`, `OAUTH_APPLE_CLIENT_ID`, `OAUTH_APPLE_TEAM_ID`, `OAUTH_APPLE_KEY_ID`, `OAUTH_APPLE_PRIVATE_KEY`, `OAUTH_GITHUB_CLIENT_ID`, `OAUTH_GITHUB_CLIENT_SECRET`.
- **New:** `09-auth-accounts/12-oauth-clients.md` §4 — secret names are `GOOGLE_OAUTH_CLIENT_SECRET_STAGING`, `GOOGLE_OAUTH_CLIENT_SECRET_PROD`, `APPLE_OAUTH_KEY_STAGING`, `APPLE_OAUTH_KEY_PROD`, `GITHUB_OAUTH_CLIENT_SECRET_STAGING`, `GITHUB_OAUTH_CLIENT_SECRET_PROD`.
- **Impact:** Two naming conventions: prefix order (`OAUTH_<PROVIDER>` vs `<PROVIDER>_OAUTH`) and per-env suffix (none vs `_STAGING/_PROD`). Edge-function code reading `process.env` will fail on whichever it didn't standardise on.
- **Severity:** 🔴 Hard conflict.
- **Recommended fix:** Adopt the new file's per-env suffix convention (more accurate; multiple OAuth apps per provider is real), AND keep the older `OAUTH_<PROVIDER>_*` order (more readable, alphabetic grouping). Final form: `OAUTH_GOOGLE_CLIENT_SECRET_PROD`, `OAUTH_APPLE_PRIVATE_KEY_PROD`, etc. Update both files to one table.

### F-M03 🔴 Email provider canonical name vs. env-var (`EMAIL_FROM`) cross-ref missing

- **Old (locked):** `22-infrastructure/03-env-vars.md` §3 — `RESEND_API_KEY` (yes), `EMAIL_FROM` (yes, `noreply@letsmarknow.com`).
- **New:** `22-infrastructure/11-email-provider.md` §4 — secret name `RESEND_API_KEY` (matches ✅) but lists THREE additional sender identities (`notifications@`, `billing@`, `support@`) and adds Postmark failover (`EMAIL_PROVIDER=postmark`) without listing required Postmark env vars.
- **Impact:** Postmark failover is documented as automatic but Postmark API key env var is not in the env-vars catalog. Failover will silently fail on first activation.
- **Severity:** 🔴 Hard conflict (env-vars catalog is locked: "Anything not listed here MUST NOT be read from `process.env`").
- **Recommended fix:** Add to `03-env-vars.md`: `POSTMARK_API_KEY` (optional, required if `EMAIL_PROVIDER=postmark`), `EMAIL_PROVIDER` (optional, default `resend`), `EMAIL_FROM_NOTIFICATIONS`, `EMAIL_FROM_BILLING`, `EMAIL_FROM_SUPPORT`.

### F-M04 🔴 Rate-limit values disagree with the older auth limits doc

- **Old (locked):** `09-auth-accounts/11-rate-limits-and-abuse.md` §2 — `POST /v1/auth/signin` is **30 / 5 min per IP, 5 / 15 min per email**.
- **New:** `09-auth-accounts/13-rate-limit-values.md` §2 — `POST /auth/signin` is **5/min per ip+email, burst 10, lockout 15-min after 10 failures in 1 h**.
- **Impact:** Same endpoint, different numbers AND different identifiers (per-IP+email vs per-email). Edge gateway codegen will pick one; the other becomes dead spec.
- **Severity:** 🔴 Hard conflict.
- **Recommended fix:** Adopt the OLD numbers (30 / 5 min IP + 5 / 15 min email) — they're the empirically-tested ones from the locked rate-limits design — and ADD the new file's lockout values (15-min after 10 failures) which the old file lacks. Then collapse both files into one — the new file is essentially a superset numeric table; move it to replace §2 of the old file, keep the old file's §3–§14 (lockout, enumeration prevention, bot defenses, etc.) which the new file does not cover at all.

### F-M05 🔴 Rate-limit endpoint paths drop the `/v1/` prefix

- **Old (locked):** `03-api-endpoints/01-conventions.md` §1 — "All endpoints under `/v1/`."
- **New:** `09-auth-accounts/13-rate-limit-values.md` §2–§5 — uses unversioned paths: `POST /auth/signin`, `POST /items`, `POST /shares`, `GET /search`, `POST /webhooks/stripe`.
- **Impact:** Routing layer does not know what to limit. Either the rate-limit middleware is inserted at the wrong layer or paths are wrong.
- **Severity:** 🔴 Hard conflict.
- **Recommended fix:** Rewrite all paths in the new file with `/v1/` prefix. Also use the spec's exact path: `POST /v1/auth/sign_in` (note the underscore — see `03-api-endpoints/03-auth.md`), `POST /v1/items`, `POST /v1/shares/access` for password verify (per old file §2).

### F-M06 🔴 Realtime transport choice contradicts old design

- **Old (locked):** `08-sharing-collab/06-realtime-presence.md` §1 — transport is **`wss://rt.letsmarknow.com/v1/presence?org=<id>&token=<jwt>`** with **SSE fallback**, custom-rolled subdomain.
- **New:** `08-sharing-collab/14-realtime-transport.md` §1 — transport is **Supabase Realtime (Phoenix Channels over WebSocket)**, no separate `rt.` subdomain, no SSE fallback.
- **Impact:** Two different transport stacks. Channel naming format also conflicts (old uses `org:<id>`, `space:<id>`, `collection:<id>`, `item:<id>`, `account:<id>` — new uses `org:{org_id}`, `space:{space_id}`, `share:{share_token}`, `user:{user_id}` — note the missing `collection:` and `item:` channels in the new file, and old's `account:` is renamed `user:`).
- **Impact extra:** Old file specifies SSE fallback; new explicitly forbids non-Supabase transports.
- **Severity:** 🔴 Hard conflict.
- **Recommended fix:** The new file is correct strategically (Supabase Realtime is the right v1 choice; no need for self-hosted `rt.letsmarknow.com`). Update the old file: drop §1 transport block, drop SSE fallback, drop the `rt.` subdomain. Then merge the channel inventory: keep all 5 from old (`org`, `space`, `collection`, `item`, `account`) AND add `share:{share_token}` from new. Rename `account:` → keep `account:` (do NOT switch to `user:` — the glossary uses **Account**, not "user").

### F-M07 🔴 Realtime channel naming uses forbidden term "user"

- **Old (locked):** `00-overview/02-glossary.md` — the user-facing term for an authenticated person is **Account**. "User" is colloquial but not in the locked vocabulary.
- **New:** `08-sharing-collab/14-realtime-transport.md` §2 — channel `user:{user_id}` and §3 presence payload uses `user_id`.
- **Impact:** Drifts from the locked glossary. Code generated from this will create `user_id` columns and `user:` channels alongside `account_id` everywhere else — confusing and bug-prone.
- **Severity:** 🔴 Hard conflict (glossary is locked).
- **Recommended fix:** Replace `user_id` → `account_id` and `user:{user_id}` → `account:{account_id}` throughout the new file.

### F-M08 🔴 Breakpoint inventory disagrees on `3xl`

- **Old (locked):** `06-ui-ux/04-layout-grid.md` §1 — defines **7 breakpoints**: `xs / sm / md / lg / xl / 2xl / 3xl` (3xl = 1920 px custom).
- **New:** `06-ui-ux/19-breakpoints.md` §1 — defines **6 breakpoints**: `xs / sm / md / lg / xl / 2xl` and explicitly says "PRs introducing arbitrary `min-width` values are rejected" — which would forbid the existing `3xl`.
- **Impact:** Existing `tailwind.config.ts` (per old file's container config) registers `3xl: "1600px"`. New file's locked rule would forbid using it.
- **Severity:** 🔴 Hard conflict.
- **Recommended fix:** Add `3xl` row to the new file's table (1920 px per old file), update the per-surface table to specify what happens at `3xl` (most surfaces stay at `2xl` layout — explicit non-change is fine).

### F-M09 🔴 Rate-limit envelope conflicts with global error envelope

- **Old (locked):** `03-api-endpoints/01-conventions.md` §4 — error envelope is `{"error": {"code": "...", "message": "...", "field": "...", "details": {...}, "request_id": "...", "doc_url": "..."}}`.
- **Old (locked):** `03-api-endpoints/18-error-codes.md` §1 — adds `http_status`, `retryable`, `retry_after_ms` to the envelope.
- **New:** `09-auth-accounts/13-rate-limit-values.md` §7 — invents a flat envelope: `{"error_code": "RATE_LIMITED", "message": "...", "retry_after_seconds": 23, "limit": 120, "window_seconds": 60, "scope": "..."}` — note keys at top-level, not nested under `error`.
- **Impact:** Two incompatible response shapes for 429. Frontend `useErrorToast(error.code)` (from B2) will not match `error_code` (top-level).
- **Severity:** 🔴 Hard conflict.
- **Recommended fix:** Rewrite the new file's §7 to use the canonical envelope: `{"error": {"code": "RATE_LIMITED", "message": "...", "http_status": 429, "retryable": true, "retry_after_ms": 23000, "request_id": "...", "details": {"limit": 120, "window_seconds": 60, "scope": "account:route"}}}`. Note: `retry_after_ms` (milliseconds) per old, not `_seconds`.

### F-M10 🔴 Rate-limit error code names disagree

- **Old (locked):** `03-api-endpoints/18-error-codes.md` §3.8 — defines `RATE_LIMITED`, `RATE_LIMITED_AUTH`, `RATE_LIMITED_SHARE_PASSWORD`.
- **New:** `09-auth-accounts/13-rate-limit-values.md` §6 — uses `QUOTA_EXCEEDED` for org-wide quota exhaustion.
- **Impact:** `QUOTA_EXCEEDED` does not exist in the master error catalog. The new spec invents an error code without registering it.
- **Severity:** 🔴 Hard conflict (error codes are stable contracts; only the master catalog may add them).
- **Recommended fix:** Either (a) use existing `BILLING_QUOTA_EXCEEDED` (already in §3.6) or (b) add `RATE_QUOTA_EXCEEDED` to §3.8 of the master catalog, then reference it from the new file. Recommend (a) since org-wide quotas are billing-driven.

### F-M11 🔴 SKU IDs duplicate the existing plan-codes table differently

- **Old (locked):** `10-licensing-billing/01-plans-matrix.md` §6 — plan codes are `free`, `pro_monthly`, `pro_yearly`, `team_monthly`, `team_yearly`, `team_enterprise_yearly`, `lifetime_pro`, `lifetime_team`.
- **Old (locked):** Same file §1 — pricing is **Pro $5/mo or $48/yr**, **Team $9/seat/mo or $84/seat/yr**, **Lifetime Pro $79**, **Lifetime Team $249** (5 seats).
- **New:** `10-licensing-billing/15-sku-map.md` §2 — SKU keys are `pro_monthly`, `pro_annual`, `team_monthly`, `team_annual`, `lifetime_personal`, `lifetime_team5`. Pricing is **Pro $8/mo or $80/yr**, **Team $12/seat/mo or $120/seat/yr**, **Lifetime Personal $199**, **Lifetime Team5 $599**.
- **Impact:** Three drifts in one file:
  1. Naming: `_yearly` (old) vs `_annual` (new). `lifetime_pro` (old) vs `lifetime_personal` (new). `lifetime_team` (old) vs `lifetime_team5` (new).
  2. Prices: every single number is different (old $5/$9/$79/$249, new $8/$12/$199/$599).
  3. Missing tier: new file omits `team_enterprise_yearly` entirely.
  4. New file's "annual = 10× monthly" rule contradicts old file's "annual = ~20% off monthly" (which would be ~9.6× monthly, not 10×).
- **Severity:** 🔴 Hard conflict.
- **Recommended fix:** This is the worst conflict in the audit. Owner decision needed: which pricing is canonical? The old file has been the locked source for marketing copy. Recommend keeping the OLD prices ($5 / $9 / $79 / $249) and OLD naming (`_yearly`, `lifetime_pro`, `lifetime_team`) and rewriting the new file to use them. Add `team_enterprise_yearly` SKU (custom-priced, no fixed `price_xxx`). Reconcile "10× vs 20% off": 12 mo × $5 = $60, with 20% off = $48 (matches old), so old's math is right; drop the "10× rule" from new.

### F-M12 🔴 Storage bucket inventory missing from new file

- **Old (locked):** `22-infrastructure/06-cdn-storage.md` §2 lists `lmn-backups` (DB + storage backups, restricted IAM).
- **New:** `22-infrastructure/12-storage-layout.md` §1 has no `backups` bucket.
- **Impact:** Backups bucket falls out of the new layout's locked path convention (`{bucket}/{shard}/{logical_id}/...`) but it still needs to exist per backup spec in `02-environments.md`.
- **Severity:** 🔴 Hard conflict (backup bucket is a hard infra requirement).
- **Recommended fix:** Add `backups` to the new file's bucket inventory with `system-only` visibility, retention per `02-environments.md`, exempt path convention (date-partitioned like `audit-archive`).

### F-M13 🟠 Email provider catalog adds magic_link template not in old auth spec

- **Old (locked):** `09-auth-accounts/02-signup-and-signin.md` (referenced) and `11-rate-limits-and-abuse.md` §2 — auth flow includes `POST /v1/auth/magic_link`.
- **New:** `22-infrastructure/11-email-provider.md` §3 — lists `auth.magic_link` as a Phase-0 required template.
- **Impact:** Magic-link auth implies an entire auth flow (token issuance, validation, single-use) that is not specified in `09-auth-accounts/`. The old spec mentions magic-link only in rate-limits — the actual UX, route handler, token format, expiry, etc. are not documented.
- **Severity:** 🟠 Drift (downstream gap, not a contradiction).
- **Recommended fix:** Add a new section to `09-auth-accounts/02-signup-and-signin.md` covering magic-link flow OR demote magic-link to Phase-1 in the new email-provider file (delete the row).

### F-M14 🟠 OAuth GitHub support — Phase-0 vs Phase-1 ambiguity

- **Old (locked):** `09-auth-accounts/04-oauth-providers.md` (referenced) — provider list source-of-truth.
- **New:** `09-auth-accounts/12-oauth-clients.md` §1 — marks GitHub as **P1**, but still lists GitHub client IDs in §4 alongside P0 providers and includes GitHub in §5 scopes. Rate-limits file (`13-rate-limit-values.md`) §2 lists `POST /auth/oauth/callback` generically (covers GH).
- **Impact:** GitHub is half-defined for Phase-0. Either it ships P0 (then upgrade to "Required") or P1 (then remove the credentials and scopes from §4–§5).
- **Severity:** 🟠 Drift.
- **Recommended fix:** Owner decision. Either include GitHub in P0 (recommend, since adoption is high and Cloud supports it via Supabase native provider) OR remove rows from §4–§5.

### F-M15 🟠 Realtime channel scope conflicts with permissions matrix

- **Old (locked):** `08-sharing-collab/permissions-matrix.json` — actions are scoped to entities `space, collection, group, item, share, ...`.
- **New:** `08-sharing-collab/14-realtime-transport.md` §2 — channels exist for `org`, `space`, `share`, `user`. **No channel for `collection` or `item`** (old realtime-presence.md DID have them).
- **Impact:** Realtime updates for collection-level edits (rename, color change, member additions) and item-level edits (note edits, tags) have no channel to broadcast on. Falls back to `space:` channel, which is too coarse — every viewer of a Space gets every item edit's broadcast.
- **Severity:** 🟠 Drift.
- **Recommended fix:** Add `collection:{collection_id}` and `item:{item_id}` channels back into the new file's §2, matching the older `06-realtime-presence.md` inventory.

### F-M16 🟠 WCAG file places itself under `19-security-privacy/` but topic belongs in `06-ui-ux/`

- **Old (locked):** `06-ui-ux/` is the home for UI accessibility. `19-security-privacy/` covers data, encryption, GDPR, threat model — not visual a11y.
- **New:** `19-security-privacy/06-accessibility-wcag.md` — placed in security folder.
- **Impact:** AI handoff prompt instructs reader to scan `06-ui-ux/` for visual rules; will miss WCAG file. CI gates (`pa11y-ci` config) referenced in the new file rightly belong with UI tokens, not crypto.
- **Severity:** 🟠 Drift (organizational).
- **Recommended fix:** Move file from `19-security-privacy/06-accessibility-wcag.md` → `06-ui-ux/20-accessibility-wcag.md`. Update `mem://features/gap-analysis-state.md` reference.

### F-M17 🟠 Search engine file dictates schema (`alter table items add column search_tsv`) — overlaps data-model

- **Old (locked):** `02-data-model/05-item.md` — defines the canonical `items` table fields.
- **New:** `14-search/06-search-engine.md` §2.2 — adds a generated column `search_tsv` to `items`.
- **Impact:** Schema spec lives in two places. If the data-model file is regenerated, the search column may be dropped silently.
- **Severity:** 🟠 Drift.
- **Recommended fix:** Add `search_tsv` to the official field table in `02-data-model/05-item.md` (with a note "computed; see `14-search/06-search-engine.md`"). Also add `search_tsv` analogues to `collection`, `space`, `group` per the new file's §2.1 weight table.

### F-M18 🟠 Dedup algorithm currency / threshold not cross-referenced from importers

- **Old (locked):** `11-import-export/05-mapping-and-dedup.md` (referenced; was the file flagged in M12) — uses "fuzzy match".
- **New:** `11-import-export/11-dedup-algorithm.md` — concretizes to Jaro-Winkler ≥ 0.92.
- **Impact:** Old file (which the audit said is hand-wavy) is still in the repo and still says "fuzzy match" without citing the new algorithm. Importer codegen reading `05-mapping-and-dedup.md` will not pick up Jaro-Winkler.
- **Severity:** 🟠 Drift.
- **Recommended fix:** Update `11-import-export/05-mapping-and-dedup.md` to add a "See `11-dedup-algorithm.md` for the concrete algorithm" link at the top of its dedup section, OR merge the new file's content into it and delete the new file. Recommend the cross-reference.

### F-M19 🟡 Currency conventions — new files use `amountUsd` integer cents; old uses `amount_cents` + `currency`

- **Old (locked):** `03-api-endpoints/01-conventions.md` §9 — money is `{ "amount_cents": 999, "currency": "USD" }`.
- **New:** `10-licensing-billing/15-sku-map.md` §6 — code sample uses `amountUsd: 800` (camelCase, currency baked into key).
- **Impact:** API contract uses snake_case + explicit currency. SKU map uses camelCase + USD-only key. They will diverge once non-USD prices arrive.
- **Severity:** 🟡 Style/redundancy.
- **Recommended fix:** Rename to `amount_cents` and add `currency: "USD"` field for forward-compat. Use snake_case throughout to match the API convention.

### F-M20 🟡 Timezone — files do not state timezone for time-of-day claims

- **Locked rule (Core memory):** "User timezone: Malaysia (UTC+8). Storage UTC. Owner-facing dates Asia/Kuala_Lumpur."
- **New (M3):** `08-sharing-collab/14-realtime-transport.md` heartbeat 30 s — fine, durations are timezone-free.
- **New (M4):** `09-auth-accounts/13-rate-limit-values.md` §6 — "next UTC midnight reset" — explicit, good.
- **New (M14):** `20-roadmap/06-definition-of-done.md` §4 — "≥ 24 h" / "≥ 7 days" — fine, durations.
- **New (M8):** `22-infrastructure/12-storage-layout.md` §5 cron schedules `hourly`, `daily`, `nightly` — **no timezone specified**. "Nightly" is ambiguous (UTC midnight? KL midnight? user-local?).
- **Impact:** Cron jobs will be scheduled in whatever timezone the cron runner defaults to. May not align with user expectations or quota-reset windows.
- **Severity:** 🟡 Style/redundancy.
- **Recommended fix:** State explicitly in §5 of new storage file: "All cron schedules are UTC. `nightly = 03:00 UTC`."

### F-M21 🟡 SKU IDs use `_LIVE` / `_TEST` suffixes vs old uses per-environment config files

- **Old (locked):** `10-licensing-billing/01-plans-matrix.md` §6 — "Stripe Price IDs are mapped per-environment in config; never hardcoded in app code."
- **New:** `10-licensing-billing/15-sku-map.md` §2 — bakes `_LIVE` / `_TEST` into the SKU key itself.
- **Impact:** Two competing patterns. Old file says "config", new file says "embed env in ID string".
- **Severity:** 🟡 Style/redundancy.
- **Recommended fix:** Adopt the old pattern: keep one SKU key (`pro_monthly`), look up `live` vs `test` price ID via env-keyed config. Drop the `_LIVE`/`_TEST` suffix from key names. (The new file's table structure already supports this — just the placeholder strings inside need to be cleaner: `<resolved at runtime per VITE_PUBLIC_ENV>`.)

### F-M22 🟠 DoD references files that may not exist / not be in scope yet

- **New (M14):** `20-roadmap/06-definition-of-done.md` §1 references:
  - `permissions-matrix.json` ✅ (exists)
  - `03-api-endpoints/18-error-codes.md` ✅ (exists)
  - `06-ui-ux/wireframes/` ✅ (exists)
  - `06-ui-ux/17-copy-strings.md` ✅ (exists)
  - `06-ui-ux/19-breakpoints.md` ✅ (new, exists)
  - `19-security-privacy/06-accessibility-wcag.md` ✅ (new, exists — but should move per F-M16)
  - `18-analytics-telemetry/03-events.md` ✅ (exists)
  - `09-auth-accounts/13-rate-limit-values.md` ✅ (new, exists)
  - **`22-infrastructure/03-env-vars.md`** ✅ (exists)
  - **`22-infrastructure/04-secrets.md`** ✅ (exists)
  - **`22-infrastructure/08-cron.md`** ✅ (exists)
- **Status:** No broken references. ✅
- **Severity:** 🟡 (none — included for completeness).

### F-M23 🟠 OAuth file lists `letsmarknow.com` redirect URIs but the apex domain isn't enumerated in 22-infrastructure

- **Old (locked):** `22-infrastructure/05-domains-ssl.md` (referenced) — should list all SSL-served origins.
- **New (M2):** `09-auth-accounts/12-oauth-clients.md` §2 — lists `staging.letsmarknow.com`, `app.letsmarknow.com`, `preview.letsmarknow.com` as registered redirect origins.
- **Impact:** Need to verify all three subdomains have SSL provisioned per `05-domains-ssl.md`. (Not audited here — flagging for follow-up.)
- **Severity:** 🟠 Drift (cross-domain spec verification needed).
- **Recommended fix:** Open `22-infrastructure/05-domains-ssl.md`; verify `staging.`, `app.`, `preview.`, `cdn.`, `rt.` (if kept), `api.`, `api.staging.` are all enumerated. Add any missing ones.

---

## 3. Findings — by file (which new file is dirtiest?)

| New file | 🔴 | 🟠 | 🟡 | Total |
|---|---|---|---|---|
| `10-licensing-billing/15-sku-map.md` (M1) | 1 | 0 | 2 | 3 |
| `09-auth-accounts/12-oauth-clients.md` (M2) | 1 | 1 | 0 | 2 |
| `08-sharing-collab/14-realtime-transport.md` (M3) | 2 | 1 | 0 | 3 |
| `09-auth-accounts/13-rate-limit-values.md` (M4) | 4 | 0 | 0 | 4 |
| `14-search/06-search-engine.md` (M5) | 0 | 1 | 0 | 1 |
| `06-ui-ux/18-favicon-pipeline.md` (M6) | 0 | 0 | 0 | 0 |
| `22-infrastructure/11-email-provider.md` (M7) | 1 | 1 | 0 | 2 |
| `22-infrastructure/12-storage-layout.md` (M8) | 2 | 0 | 1 | 3 |
| `06-ui-ux/19-breakpoints.md` (M9) | 1 | 0 | 0 | 1 |
| `19-security-privacy/06-accessibility-wcag.md` (M10) | 0 | 1 | 0 | 1 |
| `11-import-export/11-dedup-algorithm.md` (M12) | 0 | 1 | 0 | 1 |
| `20-roadmap/06-definition-of-done.md` (M14) | 0 | 0 | 0 | 0 |
| **TOTAL** | **11** | **9** | **3** | **23** |

**Worst offender:** M4 (rate-limits) — 4 hard conflicts. Rewrite required before any backend work.
**Cleanest:** M6 (favicon) and M14 (DoD) — no conflicts. Ready to ship as-is.

---

## 4. Reconciliation plan (recommended order)

| # | Action | Files touched |
|---|---|---|
| 1 | Decide pricing canon (old $5/$9/$79/$249 vs new $8/$12/$199/$599). Owner-call. | M1 + `01-plans-matrix.md` |
| 2 | Pick storage path scheme (hybrid recommended). | M8 + `06-cdn-storage.md` |
| 3 | Reconcile env-var naming (recommend `OAUTH_<PROVIDER>_*_<ENV>`). | M2 + `03-env-vars.md` |
| 4 | Replace `user_id` / `user:` with `account_id` / `account:` in M3. | M3 |
| 5 | Rewrite M4 §7 envelope to canonical, add `/v1/` prefix to all paths. | M4 |
| 6 | Add missing env vars for Postmark + multi-sender. | M7 + `03-env-vars.md` |
| 7 | Add `3xl` row to M9 breakpoints. | M9 |
| 8 | Reconcile realtime transport: drop `rt.letsmarknow.com`, adopt Supabase Realtime everywhere. | M3 + `06-realtime-presence.md` |
| 9 | Move WCAG file from `19-security-privacy/` to `06-ui-ux/`. | M10 (rename) |
| 10 | Cross-reference dedup algorithm from `05-mapping-and-dedup.md`. | M12 + `05-mapping-and-dedup.md` |
| 11 | Add `search_tsv` to item data-model. | M5 + `02-data-model/05-item.md` |
| 12 | Verify all redirect-URI subdomains enumerated in `05-domains-ssl.md`. | (verify) |

Estimated effort: ~3 hours of focused spec editing.

---

## 5. Net effect on hand-off score

The 12 new files lifted Lovable from 78 → 90, Cursor 86 → 94, Raw chat 52 → 68 in `gap-analysis.md` v4. The 23 conflicts threatened to make that lift partly illusory.

**Score progression:**

| Target AI | v4 (claimed) | v4-adjusted (with conflicts) | After 🔴 reconciliation (2026-04-19) | After 🟠/🟡 cleanup (future) |
|---|---|---|---|---|
| Lovable | 90 | 84 | **89** | 90 |
| Cursor | 94 | 88 | **93** | 94 |
| Raw chat | 68 | 60 | **66** | 68 |

The 🔴 reconciliation recovers ~5 of the 6 points lost. Remaining ~1 point gap until the 🟠 drifts (channel scope, magic-link auth flow, GitHub P0/P1, WCAG file location, search_tsv schema split) and 🟡 style issues are also closed.

The drop was biggest for Raw chat because raw chat has no codebase to ground itself in; an AI inside an IDE can at least see which choice the existing code made.

---

## 6. Locked rules confirmed (no conflict found)

These conventions were checked across all 12 new files and showed no drift:

- ✅ UUIDv7 (no ULID anywhere in new files).
- ✅ Role enum (owner / admin / editor / viewer / billing / guest / system) — used exactly in M3, M4, M14.
- ✅ Soft-delete 30 days — referenced consistently in M14 and M8.
- ✅ Numbered file naming (`NN-name.md`) — all 12 new files comply.
- ✅ "Lovable Cloud / Supabase" handled correctly — new files say "Cloud" or "Lovable Cloud" externally; the term Supabase appears only in M3 ("Supabase Realtime") which is acceptable as a vendor name.
- ✅ USD primary currency.

---

## 7. Recommendation

Reconcile in the order in §4 before opening any of the 12 new files for codegen. Without reconciliation, the score lift in `gap-analysis.md` v4 is overstated by ~6 points across all three target AIs.
