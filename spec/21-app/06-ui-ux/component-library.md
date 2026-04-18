# Component Library

Inventory of every reusable component, where it lives, its variants, and rules.

---

## 1. Foundation: shadcn / Radix

Out-of-the-box shadcn primitives (already in `src/components/ui/`):

`accordion · alert · alert-dialog · avatar · badge · breadcrumb · button · calendar · card · carousel · chart · checkbox · collapsible · command · context-menu · dialog · drawer · dropdown-menu · form · hover-card · input · input-otp · label · menubar · navigation-menu · pagination · popover · progress · radio-group · resizable · scroll-area · select · separator · sheet · sidebar · skeleton · slider · sonner · switch · table · tabs · textarea · toast · toggle · toggle-group · tooltip`

**Rules**
- Never modify these directly (they're regenerated). Wrap in `src/components/<Name>/` if customizing.
- Prefer composition over forking.
- All variants added via `cva` in the wrapper, not inline `className`.

## 2. Custom components (LMN-specific)

Lives in `packages/ui/` (shared with extension) and `src/components/`:

| Component | Path | Purpose |
|---|---|---|
| `OrgSwitcher` | `packages/ui/org-switcher` | Avatar list + dropdown |
| `SpaceTree` | `packages/ui/space-tree` | Sidebar tree of Spaces/Collections |
| `CollectionCard` | `packages/ui/collection-card` | Grid tile representing a Collection |
| `ItemCard` | `packages/ui/item-card` | The bookmark card (4 view modes) |
| `GroupBlock` | `packages/ui/group-block` | Collapsible cluster of items inside a Collection |
| `TagChip` | `packages/ui/tag-chip` | Color-coded tag pill |
| `SaveToast` | `packages/ui/save-toast` | "Saved to ___" with Undo |
| `CommandPalette` | `packages/ui/command-palette` | Cmd+K palette |
| `ShareSheet` | `packages/ui/share-sheet` | Share-config modal |
| `ImportProgress` | `packages/ui/import-progress` | Polled progress card |
| `EntityBreadcrumbs` | `packages/ui/breadcrumbs` | Space › Collection › Group |
| `MemberRow` | `packages/ui/member-row` | One row in members table |
| `EntitlementGate` | `packages/ui/entitlement-gate` | Wraps content; shows upsell if locked |
| `EmptyState` | `packages/ui/empty-state` | Illustration + headline + CTA |
| `ErrorState` | `packages/ui/error-state` | Same shape, error variant |
| `LoadingState` | `packages/ui/loading-state` | Skeleton + dim shimmer |
| `RealtimeIndicator` | `packages/ui/realtime-indicator` | Tiny dot showing WS connected |
| `OfflineBanner` | `packages/ui/offline-banner` | Top banner with queued-mutation count |
| `KeyboardHint` | `packages/ui/kbd` | Visual `<kbd>` chip |
| `MarkdownLite` | `packages/ui/markdown-lite` | Read + edit Markdown subset |
| `FaviconImg` | `packages/ui/favicon` | Favicon with fallback chain |
| `DragGhost` | `packages/ui/drag-ghost` | Custom DnD preview |
| `DensitySwitch` | `packages/ui/density-switch` | Comfortable/Cozy/Compact |
| `ViewModeSwitch` | `packages/ui/view-mode-switch` | Grid/List/Compact/Column |
| `OrgAccentProvider` | `packages/ui/org-accent` | Sets `data-org-accent` on root |
| `BulkActionBar` | `packages/ui/bulk-action-bar` | Sticky bar when items selected |

## 3. Variants policy

Each component defines variants via `cva`. Standard axes:

- `variant`: `default | secondary | ghost | outline | destructive | success | premium`
- `size`: `xs | sm | md | lg | xl`
- `density`: `comfortable | cozy | compact` (where applicable)
- `state`: implicit (hover, focus, disabled, loading)

`premium` variant uses gradient `bg-gradient-to-r from-primary to-brand-700` reserved for upgrade CTAs.

## 4. Button — canonical example

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        success: "bg-success text-success-foreground hover:bg-success/90",
        premium: "bg-gradient-to-r from-primary to-brand-700 text-primary-foreground shadow hover:opacity-95",
      },
      size: {
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-3",
        md: "h-9 px-4 py-2",
        lg: "h-10 px-6",
        xl: "h-12 px-8 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);
```

## 5. ItemCard — view modes

Same component, four prop-driven layouts:

| Mode | Layout | Use |
|---|---|---|
| `grid` | 200×140 thumbnail + title + tag row | Default Collection view |
| `list` | 36 px row, title + url + tags | Read-heavy users |
| `compact` | Favicon + title only, 24 px row | Power users |
| `column` | Kanban-style stacks, 220 px wide | Space overview |

DnD, keyboard, hover-to-jump behave identically across modes.

## 6. Storybook (mandatory)

- Every shared component has stories covering each variant.
- Visual regression via Chromatic on PR.
- A11y tab in Storybook surfaces axe violations; PR blocked on new violations.

## 7. Documentation per component

Each component folder contains:

```
<name>/
  index.tsx
  variants.ts
  <name>.stories.tsx
  <name>.test.tsx
  README.md     ← props, examples, do/don't
```

## 8. Naming

- Files: `kebab-case` (`item-card.tsx`)
- Components: `PascalCase` (`ItemCard`)
- Props: `camelCase`; boolean props prefixed with `is` / `has` / `can`.
- Event handlers: `onAction` (consumer side); internal handlers `handleX`.

## 9. Forbidden in components

- Custom color classes (`text-[#fff]`, `bg-white`).
- Direct hex / rgb / oklch.
- `style={{ color: ... }}` for static colors (allowed for dynamic transforms only).
- Inline gradients except via tokens.
- `!important` (use specificity properly).
- Hard-coded font sizes outside the type scale.

## 10. Adoption tracking

A linter (`eslint-plugin-lmn-design`) flags:
- Use of forbidden classes.
- Imports of `@/components/ui/*` from feature code (must go through wrappers if customization needed).
- Missing `aria-label` on icon-only buttons.

CI fails on new violations; existing violations tracked in baseline file.
