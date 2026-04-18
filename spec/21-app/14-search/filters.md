# Filters

Chip-based refinement of search and listing views.

---

## 1. Where filters appear

- Cmd+K results dropdown.
- Collection / Space header (filter the visible items).
- Tag page (filter by other tags / dates).
- Trash, Archive, Shared lists.
- Saved-search editor.

## 2. Chip anatomy

```
[ tag: ai ✕ ]   [ before: 2026-01-01 ✕ ]   [ is: starred ✕ ]
```

- Label = field name + colon + value.
- Click chip → opens value picker for quick edit.
- ✕ removes chip.
- Chips wrap to second line if > 4 simultaneously visible.

## 3. Filter types

### Tag chips
- Multi-select; AND between distinct tag chips, OR within one chip's value list.
- "Exclude tag" via `-tag:wip` chip variant.
- Picker: searchable tag list with usage counts.

### Date range
- Calendar picker.
- Presets: Today / Last 7 days / Last 30 days / This year / Custom.
- Field selector: `created` (default) / `updated` / `last_opened`.

### State chips
- `is:starred`, `is:pinned`, `is:shared`, `is:archived`, `has:note`, `has:image`.
- Toggle on/off; mutually exclusive only when logically opposite (e.g., `is:starred` + `is:not_starred`).

### Domain / host
- Text input with suggestions from existing items.
- Autocomplete shows top 10 hosts in scope.

### Author (Team Orgs)
- Member picker.
- `by:@alim` filters by who created the item.

### Color
- Collection color picker (8 colors).
- Filters items whose containing Collection has the chosen color.

### Type
- `link`, `note-only`, `image`, `pdf`, `video`, `code`.
- Inferred from content-type / URL pattern.

## 4. Combination logic

- Distinct chip types combined with **AND**.
- Multi-value within one chip type combined with **OR** (unless chip is "exclude").
- Free text query combined with chips via AND.
- Boolean operators in the query bar still parse alongside chips.

## 5. URL state

Chips reflected in URL query params:
```
/c/reading-list?q=llm&tag=ai&tag=research&before=2026-01-01&is=starred
```
- Shareable / bookmarkable.
- Browser back/forward navigates filter history.
- Restored on reload.

## 6. Saved presets

- "Save these filters as preset" → named smart filter.
- Listed in sidebar under Collection.
- Editable / deletable.
- Per-Account scope (don't pollute teammates' sidebars).

## 7. Per-view defaults

- Each Collection can have a default filter set (e.g., always hide `is:archived`).
- Owner-configurable; persists Org-wide.
- Personal override always wins.

## 8. Performance

- All filter changes debounced 80 ms before triggering query.
- Local cache filter applied instantly; server query completes in background.
- Animation: chip appears with 120 ms slide-in; results re-flow with `prefers-reduced-motion` respected.

## 9. Accessibility

- Chips keyboard-accessible: Tab to focus, Enter to edit, Backspace/Delete to remove.
- Screen reader: "Filter: tag, AI. Press Delete to remove."
- High-contrast border in light/dark themes.

## 10. Empty + reset

- "Clear all filters" link appears when ≥ 1 chip present.
- Empty results respect `no-results` UX from `global-search.md`.
- "Reset to default" returns to view's owner-set defaults.

## 11. Telemetry

- `filter.added` `{ type }`
- `filter.removed` `{ type }`
- `filter.preset_saved`
- `filter.preset_applied`
- `filter.cleared_all`
- `filter.combo_count` `{ count }` (sampled, periodic)

## 12. Edge cases

| Case | Behavior |
|---|---|
| Filter references deleted tag | Chip shows "tag: <deleted>" greyed; click removes |
| Date range invalid (end < start) | Chip turns red; tooltip explains |
| > 10 chips active | Warn with "Many filters · Reset?" toast |
| Filter would exclude everything | "No results — adjust filters" with one-click "Clear filters" |
| Default filter conflicts with user's chip | User's chip wins for the session; banner explains |

## 13. Tests

- URL roundtrip (apply chips → reload → identical state).
- Combination logic correctness across types.
- Preset save/load.
- Owner-default vs personal-override precedence.
- Keyboard removal sequence.
- Performance: 10 chips applied / removed without jank.
