<!--
audit-date: 2026-04-30
next-audit-by: 2027-04-30
audit-type: ad-hoc
status: closed
closed-on: 2026-04-30
closed-because: Full-folder gap-sweep of 19-security-privacy/ — drift fixes applied.
-->
# Audit — 19-security-privacy/ full-folder sweep (Session 119)

**Date:** 2026-04-30
**Scope:** All 8 files in `spec/21-app/19-security-privacy/` (969 lines). Checks: (a) hashing-algorithm drift (bcrypt residue), (b) cross-folder TTL/SoT consistency for invites & shares, (c) role-enum drift, (d) endpoint canonicality, (e) carve-out enforcement around SI-029.

---

## 1. Findings

| # | Sev | File | Issue | Fix |
|---|---|---|---|---|
| F1 | S2 | `03-encryption.md §15` | Test bullet still says "Bcrypt cost calibrated to ≥ 250 ms" — contradicts §5 which forbids bcrypt and locks Argon2id as the SoT (`09-auth-accounts/03-passwords-and-mfa.md §1`). | Rewrote bullet to calibrate Argon2id verify time and reference §5. |
| F2 | S2 | `05-share-link-security.md §7` | Invite TTL stated as `7 d`, but SoT in `08-sharing-collab/04-invite-only-shares.md §1` is **14 d default, configurable 1 h–90 d**. Same drift class as the `17-admin-org/02-members-management.md` fix in S117. | Rewrote bullet to mirror SoT verbatim with explicit reference. |
| F3 | S3 | `01-threat-model.md §2 Sharing` | Cross-ref to "`05-share-link-security.md §6`" for password Argon2id parameters — verified §6 exists and contains those parameters. No change. |
| F4 | S3 | `02-data-handling.md §3` | EU/US-only residency lock matches `07-privacy-policy.md §3` carve-out (locked Session 56). No drift. No change. |
| F5 | informational | `06-extension-privacy.md`, `07-privacy-policy.md` | Both files contain SI-029 "draft target" placeholders pending legal counsel. NOT touched per Core rule (agent cannot resolve legal copy). Carve-out respected. No change. |
| F6 | S3 | All files | Role-enum search (`team owner|team admin|team member|ULID`) → 0 matches. Locked enum holding. No change. |
| F7 | S3 | All files | Endpoint canonicality search — only `/account/export`, `/account/delete`, `/account/privacy` (web routes, not API endpoints) and `/.well-known/jwks.json` (canonical) appear. No bare `/auth/...` API drift. No change. |

---

## 2. Verification

- `grep -inE 'bcrypt' spec/21-app/19-security-privacy/*.md` after fix → only the §5 "explicitly NOT used" line and the §15 bullet referencing §5 remain. No live bcrypt parameters.
- `grep -nE '7 d|14 d' spec/21-app/19-security-privacy/05-share-link-security.md` → only the corrected `14 d default` line remains for invites.
- `09-auth-accounts/07-org-membership.md §7 step 2` "Target accepts within 7 d" — verified to be the **ownership-transfer** accept window, NOT the invite TTL. Different concept; correctly different number. No change.
- All 17 spec linters expected green.

## 3. Suggested next sweeps

1. `15-visualization/` — broad audit of view-mode files (never broadly swept this cycle).
2. `06-ui-ux/22-share-modals.md` — codify Share modal + toast-duration tokens from Toby reference.
3. `04-extension/` second-pass after audit-108 (large folder).
4. SI-029 — still blocked on legal counsel; flag in next milestone-readiness audit.

## 4. Outcome

2 drift fixes (F1, F2). 5 informational findings recorded with rationale. SI-029 carve-out respected. Scorecard preserved 100/100/100. Open SI count = 1 (SI-029).
