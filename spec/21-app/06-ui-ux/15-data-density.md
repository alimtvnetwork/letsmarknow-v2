# Data Density

Three density modes for information-dense surfaces.

---

## 1. Modes

| Mode | Row height | Padding | Type | Use |
|---|---|---|---|---|
| Comfortable | 56 px | `py-4` | `text-base` | Default for casual users |
| Cozy | 40 px | `py-3` | `text-sm` | Default for app dashboard, members table |
| Compact | 28 px | `py-2` | `text-sm` (tabular-nums) | Power users, large datasets |

## 2. Where it applies

- Items list / compact view
- Members table
- Activity feed
- Audit log
- Trash table
- Invoices
- Search results
- Tag manager

Doesn't apply: hero sections, marketing, onboarding, empty states, modal forms.

## 3. Switching

- Density toggle in `<DensitySwitch>` component, top-right of applicable surfaces.
- Persisted per Account in `prefs.density`; applied via `<html data-density="cozy">`.
- Optionally per-surface override via URL `?density=compact`.

## 4. Token wiring

```css
:root {
  --row-h: 40px;        /* cozy */
  --row-py: 0.75rem;
  --row-text: 0.875rem;
}
[data-density="comfortable"] {
  --row-h: 56px;
  --row-py: 1rem;
  --row-text: 1rem;
}
[data-density="compact"] {
  --row-h: 28px;
  --row-py: 0.5rem;
  --row-text: 0.875rem;
  --tabular: tabular-nums;
}
```

Components consume via Tailwind arbitrary values referencing CSS vars where dynamic.

## 5. Visual rules

- All three modes hit ≥ 32×32 px touch targets via row hover-zone padding.
- Compact mode uses `tabular-nums` for any numeric column for cleaner alignment.
- Truncation grows more aggressive with density (Compact uses `truncate` even on title columns).

## 6. Keyboard

- `Cmd/Ctrl+,` cycles density (Comfortable → Cozy → Compact → Comfortable).

## 7. Mobile

- Density switch hidden on touch devices (always Comfortable for fat-finger safety).
- Tablets: switch available but defaults to Cozy.

## 8. Telemetry

- `density.changed` `{ from, to, surface }`

## 9. A11y

- High-contrast mode forces minimum density to Cozy (Compact reduces hit targets too much).
- `prefers-reduced-data: reduce` (where supported) hints to render lighter (smaller avatars, fewer columns) but doesn't change density.

## 10. Forbidden

- Inline density overrides not driven by `data-density` attribute.
- Custom row heights below 24 px (touch + a11y minimum).
