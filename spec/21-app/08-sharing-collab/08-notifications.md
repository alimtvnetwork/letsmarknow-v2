# Notifications

Inbox + email + push delivery for collab and system events.

---

## 1. Channels

| Channel | Default | Notes |
|---|---|---|
| In-app inbox | Always on | Bell icon in top bar; `/me/notifications` |
| Email | On for high-signal events | Per-event opt-out |
| Web push | Off | User opts in via browser prompt |
| Extension toast | On for save/undo events | Per-Account toggle |
| Mobile push (PWA) | Off | Future |

## 2. Event taxonomy

| Event | Inbox | Email | Push | Default |
|---|:---:|:---:|:---:|---|
| `member.invite_received` | ✅ | ✅ | ✅ | on |
| `member.invite_accepted` (you invited) | ✅ | digest | ❌ | digest |
| `member.role_changed` | ✅ | ✅ | ❌ | on |
| `member.removed` | ✅ | ✅ | ❌ | on |
| `share.password_first_unlock` | ✅ | ✅ | ❌ | on |
| `share.locked_brute_force` | ✅ | ✅ | ✅ | on |
| `share.viewed_milestone` (1, 10, 100, 1k) | ✅ | weekly | ❌ | weekly |
| `comment.created_on_my_item` | ✅ | ✅ | ✅ | on |
| `comment.mention_me` | ✅ | ✅ | ✅ | on |
| `reaction.on_my_comment` | digest | digest | ❌ | digest |
| `import.completed` | ✅ | ✅ | ❌ | on |
| `import.failed` | ✅ | ✅ | ✅ | on |
| `billing.past_due` | ✅ | ✅ | ✅ | on |
| `billing.trial_ending` | ✅ | ✅ | ❌ | on |
| `entitlement.changed` | ✅ | ❌ | ❌ | on |
| `version.update_required` | ✅ banner | ❌ | ❌ | on |
| `system.security_alert` | ✅ | ✅ | ✅ | on (non-disable) |

## 3. Inbox

- Bell icon shows unread count badge (cap "9+").
- Popover lists last 20.
- Item rows: avatar/icon · headline · time · action button.
- "Mark all read"; per-row check.
- Full page `/me/notifications` with filters by event type, time range.
- Retention: 90 d; older auto-archived (Pro+: 1 y).

## 4. Email

- From: `notifications@letsmarknow.com`.
- Reply-To: bounces address.
- Branded template (logo, colors, single CTA, plain footer).
- Unsubscribe link per-event-class (CAN-SPAM).
- Digest emails (weekly Monday 9am local) for low-signal events.
- Localized copy (i18n keys; v1 ships English, Spanish, German, Portuguese, Indonesian).

## 5. Web push

- Workbox-registered service worker handles `push` events.
- Payload: `{ title, body, icon, url, tag, data }`.
- `tag` deduplicates (e.g., spam comments collapse).
- Click → focus app + navigate to `data.url`.
- VAPID keys per environment.
- Opt-in flow: contextual prompt only after a relevant event (never on first visit).

## 6. Preferences

- `/me/notifications/preferences` UI:
  - Per-event-class toggle for inbox / email / push.
  - "Pause all" 1 h / 4 h / today / custom.
  - Quiet hours (per Account timezone) affect email + push.
- Server stores in `account_notification_prefs`.

## 7. Delivery infra

- Producer: app server emits `NotificationEvent` to queue.
- Consumer: notification worker fans out to enabled channels per recipient prefs.
- Idempotency: `(event_type, recipient, dedupe_key)` ensures no double-send.
- Retries: 3 attempts on email/push with backoff.
- Bounce/complaint handling: provider webhook → mark address invalid → suppress future emails.

## 8. Performance

- Inbox fetch p75 < 150 ms.
- New notification realtime push within 1 s of source event.
- Email enqueue → send p75 < 30 s.

## 9. Telemetry

- `notification.created` `{ event_type }`
- `notification.delivered` `{ channel, latency_ms }`
- `notification.opened` `{ channel, event_type }`
- `notification.dismissed`
- `notification.unsubscribed` `{ event_class, channel }`
- `notification.bounced` `{ reason }`

## 10. A11y

- Bell button `aria-label="Notifications, N unread"`.
- Each row keyboard-actionable.
- Live region announces new notifications when popover open.
- Reduced motion: no slide-in.

## 11. Edge cases

| Case | Behavior |
|---|---|
| Account deleted | All pending notifications purged |
| Recipient unsubscribes mid-queue | In-flight sends suppressed |
| Push subscription expires | Marked invalid; user re-prompted next visit |
| Org-wide event (e.g. plan downgrade) | Fan-out to all Members + Owners |
| Massive comment flood | Aggregated into "5 new comments on X" digest |

## 12. Tests

- Producer-consumer integration with mock channels.
- Idempotency: same event twice → one notification.
- Pref enforcement: opting out blocks delivery.
- Bounce handling: 2nd email skipped after hard bounce.
