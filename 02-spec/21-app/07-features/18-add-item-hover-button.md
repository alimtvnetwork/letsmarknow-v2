# Add-Item Hover Button

> **Audience.** Engineers implementing the in-context "+" button that appears on hover/focus over Collections, Groups, and the empty state.
>
> **Scope.** The colorful, single-purpose `+` affordance for adding an Item without opening the command palette or dragging from the browser. Toby-parity feature called out in `00-overview/04-competitive-analysis.md` row 10 (gap #7 in `readme.md §6`).
>
> **Not in scope.** The Save Tab / Save Session entry points (`07-features/01-save-tab.md`, `02-save-session.md`), the Quick-Find palette (`03-quick-find.md`), or drag-and-drop (`06-ui-ux/09-drag-and-drop.md`).

---

## 1. Why this exists

Toby and most bookmark apps push users into a modal or palette to add an item. Mark Now exposes a **persistent in-place affordance** that:

- Reveals on hover/focus over a Collection or Group container.
- Stays click-target-sized (≥ 36 px) and brand-colored to draw the eye.
- Adds an Item to the **exact** container it appeared on, with zero navigation.
- Becomes the obvious "first action" in empty states (see §5).

Result: 1-click add from any list view, beating Toby's modal flow.

---

## 2. Where it appears

| Surface | Container | Trigger | Position |
|---|---|---|---|
| Collection card (grid view) | Collection | Hover or keyboard focus on card | Top-right corner of card, overlaying header. |
| Collection page (detail view) | Collection | Always visible | Sticky at end of last Group's item list, plus one per Group header. |
| Group header | Group | Hover/focus on Group header row | Right side of header row. |
| Empty Collection | Collection | Always visible | Centered in empty-state illustration. |
| Empty Group | Group | Always visible | Inline below Group title. |
| Side panel (extension) | Active Collection | Hover on Collection row | Inline at row tail. |

It does **not** appear on: Item cards (would conflict with item actions), shared/read-only views (no permission), `next` queue (adds happen via star/save flows).

---

## 3. Visual spec

- **Shape.** 36 × 36 px circle (desktop), 44 × 44 px on touch surfaces (per `06-ui-ux/19-breakpoints.md` touch target).
- **Color.** `bg-primary` (Toby pink, `--primary` token from `06-ui-ux/01-design-tokens.md §1.1`). On hover: `bg-primary/90` + 4 px halo using `--ring`. On press: `bg-primary` with `scale-95`.
- **Icon.** `+` glyph at 20 px stroke 2 (16 px on touch). White (`text-primary-foreground`).
- **Elevation.** `shadow-md` resting; `shadow-lg` on hover. Detached from card surface for affordance clarity.
- **Reveal motion.** 120 ms `ease-out` opacity + 4 px upward translate. Per `06-ui-ux/07-motion.md §3` ("micro-affordance").
- **Focus ring.** 2 px `--ring` offset 2 px. Always visible via keyboard, never via mouse-only (`:focus-visible`).
- **Tooltip.** "Add item to {Collection name}" / "Add item to {Group name}". 500 ms hover delay; immediate on keyboard focus.

Never hard-code the pink. Always reference `bg-primary` / `--primary`.

---

## 4. Interaction

**Given** a signed-in user with `item.create` permission on the target Collection (`08-sharing-collab/05-permissions-matrix.md`),
**When** they activate the `+` button (click, `Enter`, or `Space`),
**Then** an inline composer opens at the button's position:

```
┌────────────────────────────────────────────┐
│ 🌐 https://… or paste text                 │
│                                  [Cancel]  │
└────────────────────────────────────────────┘
```

- The composer is a single 1-line input, autofocused.
- Accepts: a URL (parsed via `08-sharing-collab/url-normalization.md`), free text (becomes a Note Item), or paste-multiple (each line on its own becomes one Item; max 50 per submit).
- `Enter` commits. `Esc` cancels and restores focus to the `+` button.
- On commit: inline optimistic Item appears in the list with a 200 ms "settle" pulse. Composer stays open with empty input for chained adds. Outside-click closes it.
- Server failure: optimistic Item gets a red dot + retry; toast per `06-ui-ux/11-feedback.md §2`.

Without `item.create` permission, the button is **hidden** (not disabled) — viewers/guests should not see action affordances they cannot use.

---

## 5. Empty states

When a Collection or Group has zero Items:

- The hover affordance becomes a **pinned** primary CTA: "Add your first item" with the same `+` icon, full button width up to 240 px, centered.
- One-time tooltip on first visit: "Tip: paste any URL or just type a note."
- No "drag a tab here" copy — drag-and-drop is discoverable separately (`06-ui-ux/09-drag-and-drop.md`).

---

## 6. Keyboard

- `N` (no modifier) anywhere on a Collection/Group page → activates the nearest contextual `+` (composer opens at the focused container).
- Inside the composer: `Tab` cycles input → Cancel; `Shift+Tab` reverses.
- Cataloged in `06-ui-ux/22-keyboard-cheatsheet.md` group "Capture".

---

## 7. Telemetry

Per `18-analytics-telemetry/03-events.md`:

- `add_item_hover.shown { surface, container_kind: "collection" | "group" | "empty" }` — fires once per session per container (sampled).
- `add_item_hover.activated { surface, container_kind, trigger: "click" | "key_n" | "key_enter" }`
- `add_item_hover.committed { container_kind, item_kind: "url" | "note" | "bulk", count }`
- `add_item_hover.cancelled { reason: "esc" | "outside_click" | "blur" }`

---

## 8. Accessibility

- Button: `<button type="button" aria-label="Add item to {container name}">`.
- Hidden-until-hover variant: rendered with `opacity-0` not `display:none`, so screen readers and keyboard tab order always reach it. Visually hidden until `:hover`/`:focus-within` on the parent.
- Composer: `role="form"` with the input labeled by an `aria-label="New item"`.
- Optimistic Items announce via `aria-live="polite"`: "{Item title} added".
- Meets WCAG 2.2 AA per `06-ui-ux/20-accessibility-wcag.md`.

---

## 9. Permissions

| Role on Collection | Sees button | Can submit |
|---|---|---|
| owner / admin / editor | ✅ | ✅ |
| viewer / guest | ❌ | ❌ |
| billing / system | ❌ | ❌ |

Backed by `item.create` action in `08-sharing-collab/permissions-matrix.json`.

---

## 10. References

- `00-overview/04-competitive-analysis.md` row 10 — gap origin.
- `02-data-model/05-item.md` — Item shape.
- `06-ui-ux/01-design-tokens.md §1.1` — `--primary` (pink).
- `06-ui-ux/07-motion.md §3` — reveal motion class.
- `06-ui-ux/11-feedback.md §2` — toast placement.
- `06-ui-ux/22-keyboard-cheatsheet.md` — `N` binding entry.
- `08-sharing-collab/url-normalization.md` — URL parsing on commit.
- `08-sharing-collab/05-permissions-matrix.md` — `item.create` permission.
- `18-analytics-telemetry/03-events.md` — event catalog.
