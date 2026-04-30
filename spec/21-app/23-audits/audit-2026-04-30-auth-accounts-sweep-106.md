<!--
audit-date: 2026-04-30
next-audit-by: 2026-10-27
audit-type: ad-hoc
status: closed
opened-on: 2026-04-30
closed-on: 2026-04-30
closed-because: All 4 findings (AA1 S1, AA2 S2, AA3+AA4 S3) drained same session.
scope: 09-auth-accounts/ folder — second-pass after audit-70 closed AU2-AU10. Verifies AU1 (SameSite contradiction) and sweeps for new drift in cookies, magic-link endpoint contracts, and §-anchor accuracy.
-->

# Audit: Auth & Accounts Sweep — Second Pass (Session 106)

**Date:** 2026-04-30 (MYT)
**Scope:** Verify AU1 closure from audit-70; sweep `09-auth-accounts/` for new drift introduced or surfaced since session 73.
**Verdict:** READY after 4 patches. All 17 lint sub-checks green.

---

## Findings

| ID | Sev | Title | Status |
|---|---|---|---|
| AA1 | **S1** | Magic-link consume endpoint contract drift: `03-api-endpoints/03-auth.md` declared `POST /v1/auth/magic-link/consume` (JSON body) while `09-auth-accounts/02-signup-and-signin.md §5.1` (canonical SoT) declared `GET /v1/auth/magic-link/callback?t={token}` with a **locked path-stem rule**. Two different verbs + paths for the same flow. | **CLOSED** |
| AA2 | **S2** | Trust-cookie name + SameSite contradicted across 3 files: `06-sessions.md §1.3` (cookie-inventory SoT) → `lmn_trust_device_<account_id>` / SameSite=Lax. `10-device-and-security.md §1` → `__Host-lmn_trust` / SameSite=Strict (with rationale). `19-security-privacy/04-gdpr-ccpa.md §11` → `lmn_trust_device_<account_id>`. Two cookie names AND two SameSite policies for the same cookie. | **CLOSED** |
| AA3 | **S3** | Broken §-anchor: `06-sessions.md §1.3` trust-cookie row pointed to `03-passwords-and-mfa.md §85`. That file has only 16 sections; trusted-devices is §10. | **CLOSED** |
| AA4 | **S3** | Broken §-anchor: `06-sessions.md §1.3` cookie-inventory blurb pointed to `19-security-privacy/01-threat-model.md §27`. That file has only 9 sections; the security-attribute view lives in §2. | **CLOSED** |

## Resolutions

- **AA1:** Rewrote the "Consume magic link" entry in `03-api-endpoints/03-auth.md` from `POST /v1/auth/magic-link/consume` (JSON body) to `GET /v1/auth/magic-link/callback?t={token}` matching the SoT. Added a **Canonical SoT** callout pointing back to `02-signup-and-signin.md §5.1, §5.4`, and explicitly withdrew both legacy forms (`POST /consume` and `/magic/callback`). Updated `00-overview.md §7` count table: GET 50→51, POST 99→98 (net 0).
- **AA2:** Standardized the trust cookie row in `06-sessions.md §1.3` to `__Host-lmn_trust` with `SameSite=Strict, Path=/, no Domain` and inline rationale ("only consulted on same-site sign-in form submit; never needs cross-site send"). Updated `19-security-privacy/04-gdpr-ccpa.md §11` to use the same canonical name. The `__Host-` prefix is now consistent with the other two auth-critical cookies (`__Host-lmn_refresh`, `__Host-lmn_csrf`).
- **AA3:** Updated cross-ref in `06-sessions.md §1.3` from `03-passwords-and-mfa.md §85` → `03-passwords-and-mfa.md §10` and `10-device-and-security.md §1`.
- **AA4:** Updated cross-ref in `06-sessions.md §1.3` from `19-security-privacy/01-threat-model.md §27` → `§2`.

## AU1 verification (audit-70 carry-over)

The S1 SameSite=Strict-vs-Lax contradiction tracked as AU1 in audit-70 was **already resolved between sessions 73 and 105**: `06-sessions.md §1` now correctly declares the refresh cookie as `SameSite=Lax` with rationale; `19-security-privacy/01-threat-model.md §2` aligns. The `SameSite=Strict` in `10-device-and-security.md §1` is intentional, scoped to the trust cookie (NOT the refresh cookie), and now matches the canonical inventory after AA2's fix. **AU1 confirmed closed.**

## Verified clean (post-fix)

```
✓ allowlist-discipline   ✓ audit-cadence            ✓ backticked-path-resolution
✓ endpoint-counts        ✓ env-var-naming           ✓ error-code-casing
✓ folder-overview        ✓ link-check               ✓ money-units
✓ naming-convention      ✓ next-singleton-invariants ✓ pagination-param
✓ pricing-source         ✓ realtime-channel-syntax  ✓ role-enum
✓ sku-naming             ✓ storage-path
```

## Not in scope / no findings

- ULID, hard-coded hex, role-enum drift: clean across folder.
- Folder-overview structure: `09-auth-accounts/00-overview.md` already conforms to canonical 5-section layout.
- Rate-limit values: `13-rate-limit-values.md` already aligns with `11-rate-limits-and-abuse.md` and `03-api-endpoints/03-auth.md` after audit-70 AU5.

## Outcome

`09-auth-accounts/` is build-ready. Cookie inventory is now the unambiguous SoT; magic-link contract is consistent end-to-end; all §-anchors resolve.
