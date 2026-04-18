# Email Verification

Verifying email ownership at signup and on email change.

---

## 1. When required

- After email/password signup (immediate, non-blocking; banner until verified).
- After email change (blocking on the new address; old address used until verified).
- After magic-link signup (verified implicitly by clicking link).
- After OAuth (skipped if provider returns `email_verified=true`; required otherwise).

## 2. Token

- 32-byte random; URL-safe base64.
- Hashed (sha256) at rest in `email_verifications` table.
- TTL: 24 h.
- Single-use.
- One pending verification per Account at a time (new request invalidates older).

## 3. Email content

- Subject: "Verify your email for Lets Mark Now".
- Plain CTA button: "Verify email" → `/auth/verify?t=<token>`.
- Fallback URL displayed.
- Expiry note: "Link expires in 24 hours."
- Footer: "Didn't request this? Ignore."

## 4. Verification endpoint

- `GET /auth/verify?t=<token>`:
  - Lookup hashed token → mark Account `email_verified_at = now()`.
  - On change-email flow: replace `email` field; revoke other sessions.
  - Redirect to `/dashboard?verified=1` with success toast.
- Idempotent for already-verified Accounts (returns same success page).
- Errors → friendly page with "Resend verification" CTA.

## 5. Unverified state restrictions

Until verified:
- Cannot create public/password/invite shares.
- Cannot invite Members.
- Cannot change email again.
- Cannot upgrade plan (requires verified email for billing receipts).
- Banner persistent at top: "Verify {email} to unlock sharing. Resend · Change email."

## 6. Resending

- "Resend verification" → throttled 1 per 60 s per Account; 5 per 24 h per Account.
- Generic UI feedback ("Sent" or "Try again later").

## 7. Email change flow

1. User submits new email + current password at `/me/profile`.
2. Server validates: not same as current; not used by another Account (case-insensitive).
3. Sends verification to NEW address; OLD remains canonical until verified.
4. User clicks link → server swaps email; emails old address: "Your email was changed. Was this you? Recovery link inside (24 h)."
5. Recovery link reverts swap; recommended for compromised-account recovery.

## 8. Bounces & invalid emails

- Provider webhooks classify bounces (hard / soft / complaint).
- Hard bounce on verification email → mark Account `email_undeliverable=true`; suppression list.
- User must change email to escape suppression.

## 9. Performance

- Token lookup p95 < 50 ms.
- Email enqueue → send p75 < 30 s.

## 10. Security

- Tokens never logged.
- Verification page sets short-cache headers; no token-in-referrer leak.
- Old email kept in `account_email_history` for 90 d for audit/recovery.

## 11. Telemetry

- `email_verification.sent` `{ trigger: "signup" | "change" | "resend" }`
- `email_verification.completed` `{ time_to_verify_min }`
- `email_verification.failed` `{ reason }`
- `email_change.requested` / `_completed` / `_recovered`
- `email_bounce.suppressed`

## 12. A11y

- Verification page uses single H1.
- Banner uses live region on appearance; dismissable from keyboard.
- Resend button announces success/failure.

## 13. Edge cases

| Case | Behavior |
|---|---|
| Token expired but Account not yet verified | "Resend" CTA prominent |
| Token clicked twice | Idempotent success |
| Email change to same as current | Reject with "Already your address" |
| Email change to address with another Account | Reject ambiguously to avoid enumeration |
| User loses access to old email mid-change | Recovery via support after identity verification |

## 14. Tests

- Token TTL enforcement.
- Single-use enforcement.
- Email change swap + revert flow.
- Bounce suppression.
- Throttle on resend.
