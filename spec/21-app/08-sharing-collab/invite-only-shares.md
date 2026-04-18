# Invite-Only Shares

Per-email allowlist with magic-link auth. Best for client work.

---

## 1. Concept

- Owner enters one or more emails.
- Each email gets a one-time magic-link `?inv=<token>`.
- Click → exchanges for a `share_session` cookie scoped to that slug + email.
- Subsequent visits work seamlessly while cookie valid (30 d).

## 2. Token mechanics

- 32-byte random; URL-safe base64.
- Stored hashed (sha256) server-side as `share_invite.token_hash`.
- Single-use: consumed on first exchange; further uses 410.
- TTL: 14 d default; configurable 1 h–90 d.

## 3. Adding invitees

- Modal in Share settings: paste comma/newline-separated emails.
- Validation: RFC 5322 lite + MX existence check.
- Throttle: 100 invites per Owner per hour.
- Optional message: short note included in email.

## 4. Email content

- From: `notifications@letsmarknow.com`.
- Subject: `<Owner name> shared "<Collection name>" with you`.
- Body: Owner avatar + name, optional message, "Open shared collection" button (the magic link), small "or paste this URL" fallback.
- Footer: "If you didn't expect this, ignore." + report-abuse link.

## 5. Auth flow

1. Viewer clicks magic link → `GET /t/{slug}?inv=<token>`.
2. Server: lookup hashed token, ensure unconsumed + unexpired.
3. Issue `share_session` JWT (cookie, 30 d, slug+email scoped); mark token consumed; record `accepted_at`.
4. Redirect to `/t/{slug}` clean URL (token stripped from history).
5. Viewer can refresh / return; cookie valid until 30 d.

## 6. Sign-in suggestion

- During acceptance, gentle suggestion: "Create a free LMN account to comment, react, and save items to your own collections."
- Skip respected; share access not blocked.

## 7. Capabilities

- Read all (same as public).
- Comment + react if owner enabled (no extra sign-in needed; identity = invited email).
- Save items to own LMN if viewer creates an Account.

## 8. Owner controls

- See list of invitees with status (`pending / accepted / last seen`).
- Revoke individual invitee → cookie invalidated next request.
- Re-send invite → new token, old token revoked.
- Bulk revoke / bulk re-send.

## 9. Caching

- Per-cookie content; edge cache only on assets and shells.
- Profile lookups for invitee identity cached 5 min in viewer JS.

## 10. SEO

Always `noindex`.

## 11. Telemetry

- `invite_share.invite_sent` `{ count }`
- `invite_share.invite_accepted` `{ time_to_accept_h }`
- `invite_share.invite_revoked`
- `invite_share.invite_expired`
- `invite_share.viewer_signup_converted`

## 12. Anti-abuse

- Email send rate-limited per Owner; abuse score increases on bounces, spam reports.
- Owner exceeding bounce threshold (>2%) loses send rights for 24 h.
- Magic-link tokens single-use + short TTL prevent forwarding-as-share-link.

## 13. Edge cases

| Case | Behavior |
|---|---|
| Email forwarded to colleague | Anyone with link can claim; first-clicker wins; original invitee notified by email |
| Same email invited twice | Idempotent; reuses pending invite if exists |
| Invitee email changes | Owner re-invites with new email |
| Token in browser history | Clean URL after redirect; token still single-use so no replay value |
| Owner deletes invitee mid-session | Next request invalidates cookie; viewer sees "Access removed" |

## 14. Privacy

- Invitee emails visible only to Owner / Org Admins.
- Aggregate counts visible to all Org Editors+.
- Emails never exposed to viewer JS.

## 15. Tests

- Unit: token generation, hashing, single-use logic.
- Integration: email sending mock; bounce handling.
- E2E: invite → click → cookie set → revoke → next request 401.
- Security: token timing-safe compare; URL stripped from referer.
