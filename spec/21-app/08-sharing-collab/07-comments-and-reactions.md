# Comments & Reactions (Pro+)

Lightweight discussion attached to Items.

---

## 1. Scope

- Comments on **Items** only in v1 (not Collections / Groups).
- Reactions (emoji) on Items AND on individual Comments.
- Pro+ entitlement; visible read-only on Free plan if Org-mate is Pro.

## 2. Data

### `Comment`
| Field | Type | Notes |
|---|---|---|
| `id` | UUIDv7 | |
| `item_id` | UUIDv7 | |
| `author_account_id` | UUIDv7? | null for invited share viewer |
| `author_invite_email` | citext? | for invited shares |
| `body` | text | Markdown-lite, 4 KB |
| `parent_comment_id` | UUIDv7? | one level of threading |
| `created_at`, `updated_at`, `deleted_at?` | | |

### `Reaction`
| Field | Type | Notes |
|---|---|---|
| `id` | UUIDv7 | |
| `target_type` | `item \| comment` | |
| `target_id` | UUIDv7 | |
| `account_id` | UUIDv7? | |
| `invite_email` | citext? | |
| `emoji` | string | one of allowed set (~30) |
| `created_at` | | |

Unique `(target_type, target_id, account_id|invite_email, emoji)`.

## 3. UI

- Item detail panel: "Discussion" tab with comment thread + reactions row.
- Inline on Item card: little chat bubble with count if > 0; emoji counts.
- Compose box: textarea + emoji picker + submit; Cmd+Enter sends.
- Threading: 1 level deep; reply nests once.
- Mention syntax: `@alim` → autocomplete from Org Members; renders as chip; triggers notification.

## 4. Editing & deletion

- Author can edit within 15 min; after that, `(edited)` tag.
- Author can soft-delete anytime → "[deleted]" placeholder kept for thread continuity.
- Owner/Admin can hard-delete (placeholder removed).

## 5. Realtime

- New comment broadcasts on `item:{item_id}` channel.
- Optimistic UI: comment appears immediately with pending state.
- Reactions optimistic + debounced server sync.

## 6. Notifications

Triggers (subject to recipient prefs):
- New comment on an item I created.
- @-mention.
- Reply to my comment.
- Reaction on my comment (digested daily, opt-in).

See `08-notifications.md` for delivery channels.

## 7. Moderation

- Per-Org Owner toggles "Allow share viewers to comment".
- Profanity filter (basic) on share-viewer comments before publish.
- Owner can lock comments per Item (no new comments; existing visible).
- Reports route to Org Admins (and LMN T&S if from public share).

## 8. Reactions allowed set

Curated emoji palette (no custom emoji v1):
👍 👎 ❤️ 🎉 🔥 🚀 ✅ 💡 🤔 👀 🙌 😄 😮 😢 😡 🙏 💯 🤖 ☕ 🐤

(Full set defined in `06-ui-ux/05-iconography.md` adjacent.)

## 9. Performance

- Comment thread paginated 20 per page; "Load older".
- Reactions aggregated server-side with counts + which emojis you used.
- Realtime updates batched 200 ms.

## 10. Entitlements

| Feature | Free | Pro | Team |
|---|---|---|---|
| Read comments | ✅ | ✅ | ✅ |
| Add comments | ❌ | ✅ | ✅ |
| Reactions | ✅ (👍 only) | ✅ (full set) | ✅ |
| Mentions | ❌ | ✅ | ✅ |
| Threaded replies | ❌ | ✅ | ✅ |
| Allow share viewer comments | ❌ | ✅ | ✅ |
| Moderation tools | ❌ | basic | full |

## 11. Privacy

- Comments visible to all Members of the Item's Org.
- Comments visible to share viewers ONLY if Owner enabled it for the share.
- Email of invited share commenter visible only to Owner/Admins.

## 12. Telemetry

- `comment.created` `{ length, has_mention, in_share }`
- `comment.edited`
- `comment.deleted` `{ by: "author" | "admin" }`
- `comment.reaction_toggled` `{ emoji }`
- `comment.share_viewer_comment` `{ allowed: bool }`

## 13. A11y

- Compose textarea labeled.
- Reactions buttons `aria-pressed` for "I reacted".
- Live region announces "Alim added a comment" (debounced 5 s; max 1 per 30 s).

## 14. Edge cases

| Case | Behavior |
|---|---|
| Item deleted with comments | Comments cascade soft-delete; restore brings them back |
| Comment author leaves Org | Comment retained; author shows "Former member" |
| Share revoked while viewer typing | Save fails 403; draft preserved in viewer's localStorage |
| Two reactions toggled rapidly | Server idempotency by `(target, account, emoji)` |

## 15. Tests

- Threading depth enforced (no 2nd-level reply).
- Mention parser → notifications dispatched.
- Optimistic UI: pending → confirmed → reordered correctly.
- Moderation: blocked profanity; report flow.
