<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: gap-sweep
status: in_progress (0 of 7 closed)
opened-on: 2026-04-29
scope: 19-security-privacy/ folder — rate-limit SoT drift, audit-event naming drift, undeclared CAPTCHA thresholds, cookie inventory SoT, role enum cross-refs, session TTL pointer
-->

# Audit — Security & Privacy Sweep (Session 87)

**Date:** 2026-04-29 (Session 87, Malaysia time UTC+8)
**Author:** Lovable agent
**Scope:** All 8 markdown files (~930 lines) in `spec/21-app/19-security-privacy/`, cross-checked against `09-auth-accounts/13-rate-limit-values.md §4` (rate-limit SoT — re-canonized in Sessions 84 + 85), `08-sharing-collab/09-audit-log.md` (share-event SoT), `09-auth-accounts/03-passwords-and-mfa.md §1` (Argon2id SoT), `00-overview/02-glossary.md` (role enum SoT).
**Reason:** First audit of this folder. High-stakes (security-privacy is the constraint folder per `00-overview.md`). Recently surfaced via Session 86 next-action queue.

> **Open audit.** Drain in subsequent sessions.

---

## 1. Headline findings

| # | Severity | Title | Owning file(s) for fix |
|---|---|---|---|
| SP1 | **S1** | **Password-share rate-limit prose drifts from SoT in TWO files.** `01-threat-model.md §36` says "5 attempts → 1 min lockout, then exponential". `05-share-link-security.md §52-53` says "5 wrong attempts / 15 min / IP per share → 1 min lockout. Continued failures: exponential lockout (1 min → 15 min → 1 h → 24 h)." But the canonical SoT in `09-auth-accounts/13-rate-limit-values.md §4` (re-canonized Session 84 closing SC1) is **10 / 15 min per slug; 5 / 15 min per IP; 100 / 24 h slug lockout**. Both files must replace numeric prose with cross-reference to the SoT. Same root cause as SC1 (rate-limit SoT split). | `01-threat-model.md §36`, `05-share-link-security.md §52-53` |
| SP2 | **S1** | **Public-share rate-limit prose drifts from two-tier SoT.** `05-share-link-security.md §20` says single-tier "60 /min /IP on `/t/{slug}` and `/lmk/{org_handle}/{memorable_slug}`". But `09-auth-accounts/13-rate-limit-values.md §4` (re-canonized Session 84 closing SC2) is two-tier: `/t/:slug` 60/min, nested `/items` 120/min, nested `/comments` 10/min. Replace with cross-reference. Same root cause as SC2. | `05-share-link-security.md §20` |
| SP3 | **S2** | **Audit-event naming drift between `19-security-privacy/` and `08-sharing-collab/09-audit-log.md`.** `05-share-link-security.md §128-131` declares `share.brute_force_lockout`, `share.token_404_burst`, `share.auto_disabled`, `share.password_attempts` — but `09-audit-log.md §3` only lists `share.locked_brute_force` (naming inversion: `brute_force_lockout` vs `locked_brute_force`) and does NOT enumerate the other three. Codegen will fail. Pick canonical names (recommend the `09-audit-log.md` style: `share.{verb}` past-tense), update both files, and add the three missing events to `09-audit-log.md §3`. | `05-share-link-security.md §11` (Telemetry section), `08-sharing-collab/09-audit-log.md §3` |
| SP4 | **S2** | **CAPTCHA thresholds undeclared.** `01-threat-model.md §28` says "Per-IP + per-account rate limits on `/auth/*`; CAPTCHA after thresholds" but does not pin the threshold or cross-reference any SoT. `09-auth-accounts/13-rate-limit-values.md` is the natural SoT. Either declare the threshold here (e.g. "CAPTCHA after 3 failed `/auth/login` attempts per IP per 10 min") and migrate to `13-rate-limit-values.md`, or cross-reference if already there. | `01-threat-model.md §28` + `09-auth-accounts/13-rate-limit-values.md` (verify or add) |
| SP5 | **S2** | **Cookie inventory has no SoT pointer.** `04-gdpr-ccpa.md §107-108` enumerates `__Host-session` (TTL "session / 30 d") and `__Host-csrf` (TTL "session"). But `01-threat-model.md §27 + §49 + §68` and `03-encryption.md §4` (refresh tokens) all describe cookie behavior without converging on one inventory. No single file declares the canonical cookie list. Pick a SoT (recommend `09-auth-accounts/` since it owns sessions) and cross-reference from both `04-gdpr-ccpa.md` and the threat-model entries. | new section in `09-auth-accounts/` (or existing sessions file) + cross-refs from `04-gdpr-ccpa.md §13`, `01-threat-model.md` |
| SP6 | **S3** | **Session TTL is vague.** `02-data-handling.md §32` declares retention row "Sessions \| Per session TTL \| n/a \| n/a \| on logout / TTL" without a numeric value or SoT pointer. `04-gdpr-ccpa.md §107` says `__Host-session` is "session / 30 d" — possibly inconsistent. Pin to SoT (likely `09-auth-accounts/`). | `02-data-handling.md §3` (retention table) |
| SP7 | **S3** | **`has_role` SECURITY DEFINER pattern referenced but not anchored to Core memory rule.** `01-threat-model.md §29 + §103` say "RLS + `has_role` SECURITY DEFINER; no client-side role checks". The Core memory locks the role enum (owner/admin/editor/viewer/billing/guest/system) and the `<user-roles>` directive locks the SECURITY DEFINER pattern, but no spec file cross-references the role-enum SoT (`00-overview/02-glossary.md`). Add a one-line cross-reference. | `01-threat-model.md §29` |

---

## 2. Recommended drain plan

| Session | Findings | Notes |
|---|---|---|
| Next | SP1 + SP2 | Two **S1** — same root cause (rate-limit SoT drift, mirrors SC1+SC2). Two files, three sections. Trivial. |
| Following | SP3 + SP4 + SP5 | Three **S2** — audit-event reconciliation + CAPTCHA threshold declaration + cookie inventory SoT. Touches 4-5 files. |
| Following | SP6 + SP7 | Two **S3** polish — session TTL pointer + role-enum cross-ref. Single session. |

Total estimated: 3 sessions to fully drain.

---

## 3. Files NOT deeply audited (spot-checked only)

`00-overview.md`, `06-extension-privacy.md`, `07-privacy-policy.md`, `flow-diagram.mmd`, `readme.md` — read for keyword matches only (rate limits, audit events, role names, cookie names, identifier rules, share-model, retention windows, encryption parameters). No drift detected on those passes. `02-data-handling.md`, `03-encryption.md`, `04-gdpr-ccpa.md` audited deeply for the findings above.

## 4. Cross-references

- Rate-limit SoT: `09-auth-accounts/13-rate-limit-values.md §4` (re-canonized Sessions 84 + 85).
- Share audit-event SoT: `08-sharing-collab/09-audit-log.md §3`.
- Argon2id SoT: `09-auth-accounts/03-passwords-and-mfa.md §1` (correctly cross-referenced from `03-encryption.md §5` and `05-share-link-security.md §48`).
- Role enum SoT: `00-overview/02-glossary.md` (Core memory locks the enum).
- Idempotency-Key SoT: `03-api-endpoints/01-conventions.md §6`.
- Last closed audit: `audit-2026-04-29-sharing-collab-sweep-83.md` (7/7).
