# Passwords & MFA

Credential rules, TOTP, recovery codes, breach checks.

---

## 1. Password rules

- Minimum length: 10.
- Maximum length: 128.
- No composition rules (no forced symbols/numbers — modern NIST guidance).
- Reject if found in **HIBP "Pwned Passwords"** (k-anonymity API; check first 5 chars of SHA-1).
- Reject if matches email local-part, display name, or common patterns (`password`, `letmein`, etc. — short curated list).
- Strength hint shown via `zxcvbn`-style estimator (UX hint only; not a gate above HIBP).

## 2. Storage

- **argon2id** with parameters: m=64MB, t=3, p=4.
- Per-row salt (16 bytes random).
- Hash + parameters stored together (`$argon2id$v=19$m=65536,t=3,p=4$<salt>$<hash>`).
- Re-hash on sign-in if parameters out of date (background, after successful verify).
- Never logged, never echoed in errors, never present in API responses.

## 3. Password change

- Requires current password (re-auth).
- New password must differ from last 5 (hash-compared).
- All other sessions revoked on success.
- Triggers email "your password was changed" with revert-via-support link.

## 4. Password reset

- Single-use token, 1-hour TTL, sha256-hashed at rest.
- On reset success: all sessions revoked, `token_version` bumped.
- Email confirmation sent.
- Rate-limited: 3 reset requests per email per 24 h.

## 5. MFA — TOTP

- RFC 6238, 30-sec windows, accept ±1 window for clock drift.
- Secret 20 bytes random, base32-encoded for display + QR.
- Stored encrypted at rest with envelope key (rotated yearly).
- Setup flow:
  1. Show QR + manual code.
  2. Require 2 successful codes back-to-back to confirm enrollment.
  3. Generate 10 recovery codes (single-use, 8 chars each).
  4. Display once; require user to download/copy and confirm.

## 6. MFA — recovery codes

- 10 codes per Account.
- Single-use.
- Stored hashed (sha256 + per-code salt).
- "Regenerate codes" requires re-auth + invalidates all existing.

## 7. MFA — WebAuthn (Pro+, future)

- Spec'd here for forward-compat; v1 ships TOTP only.
- Multiple authenticators per Account.
- Preferred over TOTP when both present.
- Resident key + UV preferred.

## 8. MFA enforcement

| Role / Plan | MFA |
|---|---|
| Free | optional |
| Pro | optional, prompted on signup |
| Team Owner | required |
| Team Admin | required (configurable; default required) |
| Team Member | configurable per Org |

Org Admins can require MFA Org-wide; non-MFA Members get 14-day grace then blocked from sensitive ops.

## 9. Sign-in with MFA

1. Password verified.
2. Server returns `mfa_required: true` + ephemeral `mfa_session_token` (5-min TTL).
3. Client prompts for TOTP code (or recovery code).
4. Client sends code + token; server verifies; issues JWT.
5. Failed code: 5 attempts → lockout 15 min on that ephemeral session.

## 10. Trusted devices (optional)

- After successful MFA, optional "Trust this device for 30 days" — sets a long-lived cookie tied to Account + device fingerprint.
- Subsequent sign-ins from trusted device skip TOTP step (still require password).
- User can revoke trusted devices in `/me/security`.

## 11. Breach monitoring

- Daily check of stored hashes against new HIBP datasets (k-anonymity comparison server-side).
- On match: forced password reset on next sign-in + notification email.

## 12. Telemetry

- `password.changed`
- `password.reset_requested` / `_completed`
- `password.breach_match_forced_reset`
- `mfa.enrolled` / `_disabled`
- `mfa.challenged` / `_passed` / `_failed`
- `mfa.recovery_used`
- `mfa.trusted_device_added` / `_revoked`

## 13. UX details

- Eye toggle on every password field.
- Live HIBP check: debounced 600 ms; fires on input once **≥ 8 chars** typed (catches weak-but-typo'd passwords before the user reaches the 10-char §1 minimum); also re-fires `on blur` if length condition is met. Below 8 chars, only the local `zxcvbn`-style hint runs (no network).
- TOTP input: 6-digit numeric, auto-submit on 6 chars.
- Recovery code input: 8-char alphanumeric, auto-format with hyphen for readability.
- Clear "lost device" link → recovery code form.

## 14. A11y

- Password rules in a `<ul>` with live `aria-live="polite"` announcing pass/fail.
- TOTP inputs use `inputmode="numeric"`; recovery code uses `inputmode="text"`.
- All errors announced.

## 15. Edge cases

| Case | Behavior |
|---|---|
| User loses TOTP + recovery codes | Identity verification flow via support (24-72h SLA); no instant self-serve |
| Clock drift > 1 window | Server tolerates ±1; suggests time sync |
| Multiple TOTP devices | Single secret shared by user across devices (TOTP doesn't require pairing) |
| MFA enforcement turned on with non-MFA Members | 14-day grace, daily reminder, then blocked |

## 16. Tests

- Argon2 parameter migration on sign-in.
- HIBP rejection (mocked).
- TOTP window tolerance.
- Recovery code single-use.
- MFA enforcement lockout after grace.
