# Revocation & Expiry

Lifecycle controls for shares — TTLs, manual revoke, slug rotation, kill switches.

---

## 1. Manual revoke

- Owner / Admin / share creator (Editor) can revoke.
- Revoke whole `Share` → all `ShareLink`s `is_active=false`.
- Revoke single `ShareLink` → only that link.
- Confirmation modal: "Revoke 'Quick Tools'? Anyone with the link will lose access immediately."
- Optional reason (free-text, stored in audit log).

## 2. Effect propagation

- Server flips `is_active=false` synchronously.
- Redis cache key `share:{slug}` busted.
- Edge cache (Cloudflare) tag-purged for share assets.
- Active viewer JWTs (24 h) denied via in-memory denylist; viewers see "revoked" within 5 s.
- All WebSocket subscribers receive `share.revoked` event.

## 3. TTL (expiry)

- Set per `Share` (`expires_at`) or per `ShareLink` (`expires_at`, narrower wins).
- Common presets: 1 h, 24 h, 7 d, 30 d, 90 d, never.
- After expiry, server returns `410 Gone` with friendly page: "This share expired on …".
- Owner can extend before/after expiry (un-archives the link).

## 4. Auto-revoke triggers

| Trigger | Action |
|---|---|
| Scope deleted | Share auto-revoked; cache busted; "scope deleted" reason in audit |
| Org plan downgrade exceeding share cap | Oldest excess shares revoked; owner notified, can re-enable manually |
| Brute-force lockout (password mode) | Single ShareLink locked (special state distinct from revoke); owner can rotate password to unlock |
| Trust & Safety violation | Auto-revoke; appeal flow opens for owner |
| Account/Org deletion | All Shares revoked; data purged per retention rules |

## 5. Slug rotation

- Owner can change slug at any time (Pro+ feature).
- Old slug → 410 Gone (or optional 301 to new for 30 d).
- New slug propagates to viewers via cache bust.
- Custom domain mappings updated atomically.

## 6. Token rotation

- Password rotation: single click; invalidates existing share-session cookies.
- Invite token rotation: per invitee; old token denied; new email sent.
- API tokens (for webhooks): manual rotate, 24h overlap window.

## 7. Kill switch

- Two layers:
  - **Per-Org kill switch**: Owner panic button "Disable all my shares" → flips `org.shares_disabled=true`; 5-second propagation.
  - **Global kill switch**: LMN ops only; for incidents (e.g. compromised slug-generation). Disables all shares matching a predicate.
- Both layers reversible; audited; require typed confirmation.

## 8. Grace period

- After revoke, viewers see message "This share has been revoked" for 7 d, then 410 with no message.
- After expiry, owner has 30 d to "re-activate without re-creating" (settings preserved).
- Hard delete of `Share` record after 90 d post-revoke (cascades to `ShareLink`, `ShareInvite`, `ShareView`).

## 9. UI

- `/settings/shares` lists all shares with status badges:
  - 🟢 Active
  - 🟡 Expiring soon (< 7 d)
  - 🔴 Locked (brute force)
  - ⚫ Revoked
  - ⏱ Expired
- Bulk actions: revoke, extend, rotate password.
- Per-row: copy link, edit, view analytics, audit history.

## 10. Notifications

- Owner notified on:
  - Auto-revoke (any reason).
  - Brute-force lockout.
  - 7 d / 24 h before TTL expiry (if `expires_at` set).
  - Plan-downgrade-driven revokes.

## 11. Telemetry

- `share.revoked` `{ scope_type, mode, reason, manual: bool }`
- `share.expired` `{ scope_type, ttl_days }`
- `share.extended` `{ from_ttl, to_ttl }`
- `share.slug_rotated`
- `share.killswitch_engaged` `{ scope: "org" | "global" }`

## 12. Privacy

- Revoked shares preserve enough data for analytics (until 90-d hard delete) unless Owner explicitly purges (`POST /v1/shares/:id/purge`).
- Purge is irreversible; double-confirmation; audited.

## 13. Edge cases

| Case | Behavior |
|---|---|
| Mass revoke during outage | Queued; ordered by priority (paying customers first) |
| Edge cache stale > 5 s | Serves "revoked" page from origin; client retries |
| Owner revokes then re-enables | Same slug reactivated; viewers re-prompted if password changed |
| Last share of an embed-only client | Embed page surfaces "Share unavailable" stable message |

## 14. Tests

- Revoke → assert 410 within 5 s on edge.
- Expiry job correctness (clock-skew tolerant).
- Brute-force lock → password rotate → unlock.
- Kill-switch propagation latency budget.
- Hard-delete cascade integrity.
