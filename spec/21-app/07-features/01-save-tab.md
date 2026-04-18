# Save Tab

The primary action of the product. Must feel instant.

---

## 1. Surfaces

| Surface | Trigger |
|---|---|
| Extension popup | Click toolbar icon `Alt+S` → "Save" |
| Extension shortcut | `Alt+Shift+S` from any tab |
| Context menu | Right-click page / link / image → "Save to LMN" |
| Side panel | "Save current tab" button |
| Web app | "+ New item" → URL form |
| Bookmarklet | Click → opens prefilled save form |
| OS share sheet (PWA) | Share → Lets Mark Now |
| Omnibox | `lmn save` |

## 2. Performance budgets

- Time-to-saved (TTS) p75 < 350 ms from trigger to confirmation.
- Optimistic UI: success shown before server ACK.
- Server commit p95 < 800 ms.

## 3. Flow

1. Trigger fired.
2. Extension/web reads tab info (title, URL, favicon, page-detected metadata).
3. Picks default destination (last-used Collection in active Org).
4. Posts to `/v1/items` with `client_request_id` for idempotency.
5. Optimistic toast: "Saved to <Collection name> · Undo".
6. On success, replaces optimistic ID with server ID; updates IndexedDB.
7. On failure, queues mutation in offline buffer; toast remains "Saved (will sync)".

## 4. Default destination logic

- Last Collection used by this Account in active Org (per local cache).
- If first save ever → default Space's seed Collection ("Read Later").
- Per-Account override available in `/me/profile` ("Default save destination").
- Per-Org override (Owner): "Force default destination" → all members save to a specific Collection (used by Team plan).

## 5. Captured metadata

| Field | Source | Notes |
|---|---|---|
| `url` | tab.url | Stripped of `#fragment` unless setting `keep_hash=true` (Pro+) |
| `title` | tab.title | Falls back to URL host |
| `favicon_url` | tab.favIconUrl | Re-resolved server-side; cached 30 d |
| `og_image_url` | scraped server-side post-save | Async; not on hot path |
| `description` | OG/meta tag | Async |
| `selection` | content script reads `getSelection()` | If user invoked from context menu on selection |
| `note` | (empty) | User can add later |
| `tags` | auto if "Auto-tag by domain" Org setting ON | e.g. `youtube.com` |
| `created_by` | account_id | |
| `org_id` / `space_id` / `collection_id` / `group_id?` | from destination | |
| `position_hint` | top of Collection by default | Settings can change to bottom |

## 6. Disambiguation

If the URL already exists in the destination Collection:
- Prompt: "Already saved here. Save again? Move to top? Skip?".
- Setting `dedupe_within_collection` (default: prompt, options: skip / always-save).

If exists elsewhere in Org: subtle hint "Already in <Collection>" with quick-link.

## 7. Permissions

- Editor and above: can save anywhere in Org.
- Viewer: cannot save (toolbar shows lock badge with explanation).
- Multi-Org: dropdown to choose Org if popup invoked while signed into multiple.

## 8. Entitlement gates

| Feature | Free | Pro | Team |
|---|---|---|---|
| Save tab | ✅ | ✅ | ✅ |
| Auto-tag by domain | ❌ | ✅ | ✅ |
| Keep URL hash | ❌ | ✅ | ✅ |
| Force default destination (Org) | ❌ | ❌ | ✅ |
| Save with selection text | ✅ | ✅ | ✅ |
| Save link from context menu (without opening) | ✅ | ✅ | ✅ |

Free tier item cap: 200 active items per Account (across all Orgs). When at cap, save still succeeds but a banner suggests upgrade or pruning Trash.

## 9. Offline mode

- Mutation queued in IndexedDB with `pending=true`.
- Toast shows "Saved (will sync when online)".
- On reconnect, queue flushed in order; `client_request_id` ensures no double-save.

## 10. Edge cases

| Case | Behavior |
|---|---|
| `chrome://`, `about:`, `file://` URLs | Saveable but flagged "private/local" — not shareable |
| `data:` URLs | Reject with toast "Can't save data URLs" |
| Very long URL (> 2 KB) | Reject with explanation |
| Tab is a PDF served by browser | Save with `type=pdf` and use first-page thumbnail (Pro+) |
| Tab is a Google Doc / Notion page | Save normally; show small badge "private (auth needed)" |
| Page in Reader mode | Use canonical URL when available |
| AMP page | Resolve to canonical non-AMP URL when available |
| Tab in Incognito | Save still works if extension allowed in incognito; otherwise toast asks user to enable |

## 11. Telemetry

- `save.tab.invoked` `{ surface, has_selection }`
- `save.tab.completed` `{ duration_ms, surface, dedupe_outcome }`
- `save.tab.failed` `{ error_code }`
- `save.tab.queued_offline`

## 12. Tests

- E2E: Cypress drives popup → asserts toast + cache update.
- Backend: contract test on `/v1/items` with `client_request_id`.
- Performance: Lighthouse trace asserts TTS budget.
- Resilience: simulate offline → queue → reconnect → assert flush.
