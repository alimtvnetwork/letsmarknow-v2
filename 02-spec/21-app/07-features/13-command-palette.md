# Command Palette

A single registry powers the palette across web app and extension surfaces (popup, side-panel).

---

## 1. Trigger

- `Cmd/Ctrl+K` everywhere except inside textarea (use `Cmd+Shift+K` if needed).
- Top-bar search field opens it on focus.
- Extension popup defaults open with palette mode.

## 2. Sections

| Section | Purpose |
|---|---|
| Find | Items, Collections, Tags |
| Go | Routes (Spaces/Collections/Settings/Trash/Activity/etc.) |
| Do | Actions (New collection, Import, Toggle theme, Sign out, …) |
| Help | Cheat sheet, docs links, what's new |

## 3. Registry shape

```ts
type CommandEntry = {
  id: string;                       // stable across releases
  section: "find" | "go" | "do" | "help";
  label: string;
  description?: string;
  keywords?: string[];              // alias matching
  shortcut?: string;                // displayed only
  icon?: LucideIcon;
  badge?: "Pro" | "Team" | "Beta";
  entitlement?: string;             // gate
  perform: (ctx: AppContext) => Promise<void> | void;
  visibility?: (ctx: AppContext) => boolean;
};
```

Modules register entries in their own files; aggregated at app boot.

## 4. Ranking

Score = static rank by section + recency boost (recently used surfaces bubble up) + label match weight.

Find section pulls live results from `GET /v1/search/quick?limit=8` (latency-optimized variant per `03-api-endpoints/13-search.md §quick`) for plain queries (debounced 120 ms).

## 5. Extensibility

- Web app + extension share `packages/command-registry`.
- Extension surfaces add browser-specific entries (Save current tab, Save session, Pin to start) at runtime.
- Future: third-party plugins (Team) declare entries via webhooks (out of v1).

## 6. Entitlement gating

- Locked entries still visible with ⚡ badge and route to upsell.
- Hidden entries (per `visibility`) never appear (e.g. Billing entries hidden for non-Owners).

## 7. Performance

- Open-to-input p75 < 60 ms.
- First results p75 < 80 ms.
- Server-augmented results merged when ready.
- Virtualized list at > 100 entries.

## 8. Keyboard

- Up/Down navigate.
- Enter performs.
- Cmd/Ctrl+Enter open in new tab when navigation entry.
- Tab cycles section.
- Esc closes.
- `?` from palette opens cheat sheet (which is itself an entry).

## 9. UI

- Centered modal (640 px wide).
- Search input at top with section breadcrumb if user typed `>` (Do mode), `/` (Find), `@` (members), `#` (tags).
- Result rows: icon · label · description · shortcut · badge.
- Footer hints: "↑↓ to nav · ↵ to select · esc to close".

## 10. Telemetry

- `palette.opened` `{ surface }`
- `palette.action_executed` `{ id, section }`
- `palette.search_performed` `{ query_length, result_count }`
- `palette.gated_entry_clicked` `{ id }` (upsell intent)

## 11. A11y

- Combobox role with `aria-expanded`.
- Active option `aria-selected`.
- Live region for result count updates.
- Reduced motion: instant-open variant (no scale-in).

## 12. Edge cases

| Case | Behavior |
|---|---|
| Offline | Find limited to local index; Go/Do/Help still work |
| Multi-Org user | Org context inferred; some entries (Billing) act on active Org with explicit label |
| Prefix `>` typed | Restrict to "Do" entries |
| Empty query | Show recent commands (top 8) per Account |

## 13. Tests

- Unit: ranking determinism, entitlement gating, visibility predicates.
- E2E: open palette → type → select → assert action ran.
- Load: 5,000 entries → still < 80 ms first-paint.
