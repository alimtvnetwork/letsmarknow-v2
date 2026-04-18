# Tags

Flat, org-scoped labels attached to Items.

---

## 1. Model

- One namespace per Org (no per-Space scoping).
- Tag is `{ id, name, color, created_at }`.
- Many-to-many to Items via `item_tags` join table.
- Names case-insensitive but display preserves casing of first creation.
- Max 64 chars; lowercase letters, digits, `-`, `_`, `:` (allowing namespacing like `team:design`, `state:wip`).

## 2. Creation

- Inline from Item card or detail (chip input).
- Bulk from "+ Tag" in selection bar.
- Auto on Save (Pro+ Auto-tag-by-domain).
- From Tag manager (Settings → Tags).

## 3. Color

- Auto from name hash by default (consistent across surfaces).
- User can override via Tag manager.
- Color used as chip background (light tint) + dot (full).

## 4. Operations

- Rename: in Tag manager; cascades to all references.
- Merge: select 2+ tags → "Merge into…" → all references updated to target tag.
- Delete: removes from all Items.
- Recolor.

## 5. Filtering

- URL: `?tag=react` (repeatable for AND).
- Search: `tag:react`.
- Sidebar Tags section shows top tags by usage; click to filter active Collection.
- Bulk view: `/c/:slug?tag=react,vue` shows union/intersection per setting.

## 6. Suggestions

- When typing in chip input, suggest existing tags first (substring + alias match).
- "Create new tag '<x>'" appears at bottom of dropdown.
- Limit per request: 10 suggestions.

## 7. Limits

| Plan | Tags per Org | Tags per Item |
|---|---|---|
| Free | 50 | 10 |
| Pro | 500 | 30 |
| Team | unlimited | 50 |

## 8. Permissions

- Editor+ can create / attach / detach.
- Owner/Admin can rename / merge / recolor / delete.

## 9. Special tags (system-prefixed)

Reserved prefixes (read-only to users):
- `imported:<source>` (set by importer)
- `system:archived`
- `system:private`

Users can filter by them but cannot detach.

## 10. Entitlements

| Feature | Free | Pro | Team |
|---|---|---|---|
| Create + attach | ✅ | ✅ | ✅ |
| Auto-tag by domain | ❌ | ✅ | ✅ |
| Tag manager (rename/merge/delete) | ✅ | ✅ | ✅ |
| Tag aliases (Pro+) | ❌ | ✅ | ✅ |
| Smart tags (rules) | ❌ | ❌ | ✅ |

## 11. Smart tags (Team)

- Rule-based auto-tagging (e.g. "if URL contains 'youtube.com' → tag 'video'").
- Defined in Settings → Tags → Smart rules.
- Run on save AND retroactively (one-shot or scheduled).

## 12. Telemetry

- `tag.created`
- `tag.attached` `{ via }`
- `tag.detached`
- `tag.merged`
- `tag.renamed`
- `tag.deleted`
- `tag.filter_applied` `{ tag_count }`

## 13. Edge cases

| Case | Behavior |
|---|---|
| Tag created in two clients simultaneously | Server dedupes case-insensitively; second client receives canonical id |
| Rename collides with existing tag | Treated as merge after confirmation |
| Tag name with reserved prefix | Rejected with explanation |
| Bulk attach causes Item to exceed per-Item cap | Skipped; toast lists offenders |

## 14. A11y

- Chip input announces additions/removals via live region.
- Color-only differentiation paired with text label (chips always show text).

## 15. Tests

- Unit: name normalization, color hash determinism.
- E2E: create, attach, filter, merge.
- Concurrency: parallel create same name → one row.
