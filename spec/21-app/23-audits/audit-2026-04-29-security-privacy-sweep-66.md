<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: gap-sweep
status: in_progress (6 of 10 closed: SP1, SP2 — session 67; SP3, SP4, SP5, SP6 — session 68)
opened-on: 2026-04-29
scope: 19-security-privacy/ folder — hashing-algorithm consistency, share-link cross-references, sub-processor SoT enforcement
-->

# Audit — Security & Privacy Sweep (Session 66)

**Date:** 2026-04-29 (Session 66, Malaysia time UTC+8)
**Author:** Lovable agent
**Scope:** All 7 markdown files in `spec/21-app/19-security-privacy/`, cross-checked against `09-auth-accounts/03-passwords-and-mfa.md` (auth source of truth) and `08-sharing-collab/13-share-link.md`.
**Reason:** First dedicated audit of this folder. SI-029 (privacy-pack stub expansion) is the only known open item but is blocked on legal counsel; this sweep finds adjacent agent-resolvable defects to bundle when legal lands.

> **Open audit.** Drain in subsequent sessions.

---

## 1. Headline findings

| # | Severity | Title | Owning file(s) for fix |
|---|---|---|---|
| SP1 | **S1** | **Password hashing algorithm contradiction.** `00-overview.md §3`, `01-threat-model.md §2 Sharing` row, AND `09-auth-accounts/03-passwords-and-mfa.md §1` all lock **Argon2id** (m=64MB, t=3, p=4). But `03-encryption.md §2` says `users.password_hash (already bcrypt)` and §5 says **bcrypt cost 12** is current with argon2id only as a "future migration path". Codegen / RLS / login implementation reading `03-encryption.md` would build the wrong hasher. Direct contradiction with the auth lock. | `03-encryption.md` §2 + §5 |
| SP2 | **S1** | **Share-password hashing contradiction.** `00-overview.md §3` and `01-threat-model.md §2 Sharing` say share-link passwords use **Argon2id**. But `03-encryption.md §2` lists `share_passwords.hash (bcrypt)` and `05-share-link-security.md §6.1` says "**bcrypt cost 12** (same as user passwords)". Both downstream files lie about both hashes. | `03-encryption.md` §2; `05-share-link-security.md` §6.1 |
| SP3 | **S2** | **Share-link URL surface drift vs locked spec.** `05-share-link-security.md §1` says public uses `/t/{token}` and password/invite uses `/s/{token}`. But `08-sharing-collab/13-share-link.md` (locked v1) defines a single `/t/{slug}` for ALL share modes plus the optional memorable `/lmk/{org_handle}/{memorable_slug}` (Pro+). The `/s/{token}` URL surface does not exist anywhere else in the spec — likely a pre-Session-50 holdover. | `05-share-link-security.md` §1 |
| SP4 | **S2** | **Custom-slug terminology drift.** `05-share-link-security.md §1` says "Custom slugs (Pro+) reserved separately; do NOT replace token". But the locked v1 model in `13-share-link.md` calls these **memorable slugs** (not "custom slugs") and they DO replace the token in the user-facing URL (`/lmk/{org_handle}/{memorable_slug}`). Both naming and behavior are wrong. | `05-share-link-security.md` §1 |
| SP5 | **S2** | **Embed sandbox attribute contradiction.** `05-share-link-security.md §11` says embed iframes use `sandbox="allow-scripts allow-same-origin"`. But `08-sharing-collab/10-embed-widget.md §3` (just patched in Session 65 audit closeout) explicitly omits `allow-same-origin` and instead uses `allow-scripts allow-popups allow-popups-to-escape-sandbox`. The sandbox attribute is a security primitive — these two specs MUST agree. The embed widget spec is more recent and was security-reviewed in Session 65; align share-link-security to it. | `05-share-link-security.md` §11 |
| SP6 | **S2** | **`X-Frame-Options: ALLOWALL` is not a real header value.** `05-share-link-security.md §11` says "`X-Frame-Options: ALLOWALL` (or omit)". `ALLOWALL` is non-standard and ignored by all modern browsers; the correct mechanism is omitting `X-Frame-Options` entirely and setting `Content-Security-Policy: frame-ancestors <allowlist>`. CSP frame-ancestors supersedes XFO per spec. | `05-share-link-security.md` §11 |
| SP7 | **S2** | **JWT algorithm fallback contradicts "no shared secret" stance.** `03-encryption.md §4` says "RS256 fallback only for legacy clients (none expected)". Listing a fallback at all weakens the EdDSA lock — implementers will read this as "accept RS256-signed JWTs". With "none expected", the line should be removed (or hardened to "RS256 NOT accepted; verifiers MUST reject `alg: RS256`"). | `03-encryption.md` §4 |
| SP8 | **S3** | **`02-data-handling.md §7` duplicates sub-processor table.** Section header explicitly says "Single source of truth: `07-privacy-policy.md §3`" and then re-lists all 5 sub-processors inline. `04-gdpr-ccpa.md §5` does the same. Triplication invites drift; the SoT pattern works only if mirrors stay short. Consider replacing the table with a one-line reference + "see `07-privacy-policy.md §3` for the full list". | `02-data-handling.md` §7; `04-gdpr-ccpa.md` §5 |
| SP9 | **S3** | **EU residency drift in `02-data-handling.md §3`.** Table row says "EU + UK + Switzerland (default) → Frankfurt + Dublin (multi-AZ)". But §3.v1-scope-note locks v1 regions to "EU and US" only. UK and Switzerland are not separately offered in v1 (they're served from EU). Table should match the lock or add a footnote. | `02-data-handling.md` §3 |
| SP10 | **S3** | **`03-encryption.md §1` TLS 1.2 sunset date is in the past for CI purposes.** "TLS 1.2 disabled at LB level Q4 2026" — current date is 2026-04-29, Q4 is ~5 months away. Should be a concrete date with an action item, or moved to roadmap. Low impact but the kind of thing CI cadence linters could trip on. | `03-encryption.md` §1 |

---

## 2. Recommended drain plan

| Session | Findings | Notes |
|---|---|---|
| Next | SP1 + SP2 | **S1 launch-blocker.** Both fixes in `03-encryption.md` (and one extra paragraph in `05-share-link-security.md §6`). Aligns with the locked auth spec. |
| Following | SP3 + SP4 + SP5 + SP6 | Four fixes all in `05-share-link-security.md`, one session. Aligns with `13-share-link.md` + `10-embed-widget.md`. |
| Following | SP7 + SP8 + SP9 + SP10 | S2/S3 polish — single session. |
| Blocked | SI-029 | Privacy-pack stubs — needs human legal counsel. |

Total estimated: 3 sessions to fully drain agent-resolvable items.

---

## 3. Files NOT audited but spot-checked clean

- `06-extension-privacy.md` — known-incomplete per SI-029; blocked on legal.
- `07-privacy-policy.md` — same; SI-029 owns it.
- `flow-diagram.mmd` + `readme.md` — not opened.

---

## 4. Cross-references

- Auth source of truth: `09-auth-accounts/03-passwords-and-mfa.md`.
- Share-link source of truth: `08-sharing-collab/13-share-link.md`.
- Embed widget source of truth: `08-sharing-collab/10-embed-widget.md`.
- Spec-issue tracker: `13-spec-issues/02-current-issues.md`.
- Last closed audit: `audit-2026-04-29-sharing-collab-sweep.md` (9/9).
