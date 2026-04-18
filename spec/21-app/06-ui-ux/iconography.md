# Iconography

A single icon set, used everywhere.

---

## 1. Source

**Lucide React** is the only icon library. ~1,500 icons, MIT-licensed, tree-shakeable, stroke-based.

```tsx
import { Bookmark, Search, Settings } from "lucide-react";
```

No raw SVGs in components except brand logos and illustrations.

## 2. Sizing

| Token | px | Use |
|---|---|---|
| `xs` | 12 | Inside small badges |
| `sm` | 14 | Compact rows |
| `md` | 16 | Default in buttons, inputs |
| `lg` | 20 | Section headers, tabs |
| `xl` | 24 | Empty states, top-bar |
| `2xl` | 32 | Onboarding, splash |

In Tailwind: `[&_svg]:size-4` baseline in buttons.

## 3. Stroke

- Default Lucide stroke 2.
- Override to 1.75 for sizes ≤ 16 to keep visual weight consistent.

```tsx
<Bookmark className="size-4" strokeWidth={1.75} />
```

## 4. Color

Always `currentColor`. Never set fill/stroke colors directly. Parent's `text-*` controls icon color.

```tsx
<Button variant="ghost" className="text-muted-foreground hover:text-foreground">
  <Trash2 />
</Button>
```

## 5. Accessibility

- Icon-only button → `aria-label` required.
- Decorative icon next to text → `aria-hidden="true"`.
- Icon that conveys status → paired with screen-reader text:
  ```tsx
  <CheckCircle aria-hidden="true" />
  <span className="sr-only">Saved</span>
  ```

## 6. Semantic mapping

A locked dictionary so the same concept always uses the same icon:

| Concept | Icon |
|---|---|
| Save bookmark | `Bookmark` |
| Saved (success) | `BookmarkCheck` |
| Search | `Search` |
| Filter | `SlidersHorizontal` |
| Sort | `ArrowUpDown` |
| Tag | `Tag` |
| Add | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Restore (from trash) | `RotateCcw` |
| Move | `MoveRight` (or `FolderInput`) |
| Duplicate | `Copy` |
| Share | `Share2` |
| Star | `Star` / `StarOff` |
| Pin | `Pin` |
| Settings | `Settings` |
| Account | `User` |
| Sign out | `LogOut` |
| Sign in | `LogIn` |
| Open external | `ExternalLink` |
| Jump to tab | `ArrowUpRightFromCircle` |
| Drag handle | `GripVertical` |
| Collapse / Expand | `ChevronDown` / `ChevronRight` |
| Close | `X` |
| More menu | `MoreHorizontal` (rows), `MoreVertical` (cards) |
| Lock (private) | `Lock` |
| Globe (public) | `Globe2` |
| Key (password) | `KeyRound` |
| Mail | `Mail` |
| Bell | `Bell` |
| Bell off | `BellOff` |
| Check (success) | `CheckCircle2` |
| Warning | `AlertTriangle` |
| Error | `AlertCircle` |
| Info | `Info` |
| Loading | `Loader2` (with `animate-spin`) |
| Sync | `RefreshCw` |
| Offline | `WifiOff` |
| Upload | `Upload` |
| Download | `Download` |
| Import | `FileInput` |
| Export | `FileOutput` |
| Copy link | `Link2` |
| Theme: light | `Sun` |
| Theme: dark | `Moon` |
| Theme: system | `Monitor` |
| Org | `Building2` |
| Member | `Users` |
| Billing | `CreditCard` |
| Plan: Free | `Sparkles` |
| Plan: Pro | `Crown` |
| Plan: Team | `Building2` |
| Lifetime | `Infinity` |
| Audit | `ScrollText` |
| Activity | `Activity` |
| Trash | `Trash2` |
| Undo | `Undo2` |
| Redo | `Redo2` |
| Keyboard shortcuts | `Keyboard` |
| Help | `HelpCircle` |
| What's new | `Megaphone` |

If a needed concept is not in the table, add it here in the same PR; never invent ad-hoc icon usage.

## 7. Brand & third-party logos

- Stored in `src/assets/brands/` as SVG.
- Used only on integration tiles, sign-in provider buttons, import source picker.
- Always with brand-correct colors (do not tint via `currentColor`).

## 8. Custom icons (LMN-only)

A small set in `src/assets/icons/` for things Lucide doesn't cover:

- `lmn-mark.svg` — circle-mark logo
- `lmn-wordmark.svg` — wordmark
- `lmn-collection.svg` — stacked-cards icon used in marketing
- `lmn-session.svg` — windowed-tabs icon used for "Save Session"

All match Lucide stroke style (1.75 px stroke, 24×24 viewport).

## 9. Animation

- `Loader2` always with `animate-spin`.
- `RefreshCw` on sync state animates while syncing.
- `Bell` shakes once on new notification (`animate-bell` keyframes; respects reduced-motion).

## 10. Testing

- Storybook page `Icons / All` lists every Lucide icon used in the app for quick visual diff.
- Linter rule disallows direct imports from `lucide-react/dist/esm/icons/*`; must import top-level.
