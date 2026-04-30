<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: ad-hoc
status: closed
opened-on: 2026-04-29
closed-on: 2026-04-29
closed-because: 7 of 7 findings drained.
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
| SP1 | **S1** | ✅ **CLOSED Session 88.** `01-threat-model.md §36` numeric prose ("5 attempts → 1 min lockout, then exponential") replaced with cross-reference to `09-auth-accounts/13-rate-limit-values.md §4` (SoT). `05-share-link-security.md §6 Brute force` numeric prose ("5 wrong attempts / 15 min / IP", "1 min → 15 min → 1 h → 24 h") replaced with at-a-glance summary + SoT cross-reference + drift-prevention note citing audits SC1 + SP1. | `01-threat-model.md §36`, `05-share-link-security.md §6` |
| SP2 | **S1** | ✅ **CLOSED Session 88.** `05-share-link-security.md §2` rate-limit row replaced single-tier "60 /min /IP" with explicit two-tier SoT cross-reference (`/t/:slug` 60/min, `/items` 120/min, `/comments` 10/min). | `05-share-link-security.md §2` |
| SP3 | **S2** | ✅ **CLOSED Session 89.** Renamed `share.brute_force_lockout` → `share.locked_brute_force` in `05-share-link-security.md §16` to match the `09-audit-log.md` past-tense `share.{verb}` convention. Added the three missing events (`share.token_404_burst`, `share.auto_disabled`, `share.password_attempts`) with payload schemas and source-file cross-references to `08-sharing-collab/09-audit-log.md §3 Sharing`. SoT pointer added at top of §16. | `05-share-link-security.md §16`, `09-audit-log.md §3` |
| SP4 | **S2** | ✅ **CLOSED Session 89.** Added new §2.1 "CAPTCHA escalation" to `09-auth-accounts/13-rate-limit-values.md` with explicit thresholds (`/v1/auth/signin` ≥ 3 failures / 10 min / IP, plus `/password/forgot`, `/mfa/verify`, `/magic-link/send`), 30-min CAPTCHA-required window, response shape (`403 CAPTCHA_REQUIRED` + `X-Captcha-Solution` retry header). `01-threat-model.md §28` updated to cross-reference §2 + §2.1 SoTs. | `13-rate-limit-values.md §2.1`, `01-threat-model.md §28` |
| SP5 | **S2** | ✅ **CLOSED Session 89.** Created canonical cookie inventory at `09-auth-accounts/06-sessions.md §1.3` (8 cookies: `__Host-lmn_refresh`, `__Host-lmn_csrf`, `lmn_consent`, `lmn_active_account`, `lmn_active_org`, `lmn_locale`, `lmn_trust_device_<account_id>`, `lmn_analytics_id`) with attributes + TTL + naming convention. Cross-referenced from `04-gdpr-ccpa.md §11` (consent-classification view, drift-corrected: was `__Host-session`/`__Host-csrf`, now matches actual `__Host-lmn_refresh`/`__Host-lmn_csrf`) and `01-threat-model.md §27`. | `06-sessions.md §1.3`, `04-gdpr-ccpa.md §11`, `01-threat-model.md §27` |
| SP6 | **S3** | ✅ **CLOSED Session 90.** `02-data-handling.md §3` Sessions row now declares "30 d rolling refresh-cookie TTL (SoT: `06-sessions.md §1.2`); 15 min access-JWT (SoT: `06-sessions.md §1.1`)" with explicit purge triggers. Resolves the `04-gdpr-ccpa.md` "session / 30 d" ambiguity (already corrected to canonical inventory in SP5). | `02-data-handling.md §3` |
| SP7 | **S3** | ✅ **CLOSED Session 90.** `01-threat-model.md §29` (Elevation-of-privilege row) and §103 (top-10 risk #3) both updated: `has_role` signature spelled out, `<user-roles>` directive cited as pattern SoT, role enum cross-referenced to `00-overview/02-glossary.md` with full enum listed inline. | `01-threat-model.md §29 + §103` |

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
