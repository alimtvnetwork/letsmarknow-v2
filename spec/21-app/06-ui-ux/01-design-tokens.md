# Design Tokens

All design primitives, defined once in `index.css` and `tailwind.config.ts`, consumed everywhere via semantic names.

---

## 1. Color (HSL)

All colors stored as `H S% L%` triplets (no `hsl()` wrapper) so Tailwind can compose `hsl(var(--token) / <alpha-value>)`.

### 1.1 Brand

Toby pink. Anchor `--brand-500 = 343 79% 60%` ≈ `#EC4868`. Locked by SI-021 (2026-04-29). All ramp steps share hue `343` and saturation `~78–82%`; lightness varies. Mirrors Toby's primary CTA color so users porting from Toby see visual continuity.

```css
:root {
  --brand-50:  343 100% 97%;
  --brand-100: 343  96% 93%;
  --brand-200: 343  92% 86%;
  --brand-300: 343  86% 76%;
  --brand-400: 343  82% 68%;
  --brand-500: 343  79% 60%;   /* primary anchor — Toby pink #EC4868 */
  --brand-600: 343  74% 52%;
  --brand-700: 343  70% 44%;
  --brand-800: 343  64% 34%;
  --brand-900: 343  58% 24%;
  --brand-950: 343  56% 14%;
}
```

### 1.2 Semantic — Light

```css
:root {
  --background:        0 0% 100%;
  --foreground:        222 47% 11%;

  --card:              0 0% 100%;
  --card-foreground:   222 47% 11%;

  --popover:           0 0% 100%;
  --popover-foreground:222 47% 11%;

  --primary:           var(--brand-500);
  --primary-foreground:0 0% 100%;

  --secondary:         220 14% 96%;
  --secondary-foreground: 222 47% 11%;

  --muted:             220 14% 96%;
  --muted-foreground:  215 16% 47%;

  --accent:            220 14% 96%;
  --accent-foreground: 222 47% 11%;

  --destructive:       0 84% 60%;
  --destructive-foreground: 0 0% 100%;

  --success:           142 71% 45%;
  --success-foreground: 0 0% 100%;

  --warning:           38 92% 50%;
  --warning-foreground: 26 83% 14%;

  --info:              199 89% 48%;
  --info-foreground:   0 0% 100%;

  --border:            220 13% 91%;
  --input:             220 13% 91%;
  --ring:              var(--brand-500);

  --sidebar-background: 220 14% 98%;
  --sidebar-foreground: 222 47% 11%;
  --sidebar-accent:     220 14% 94%;
  --sidebar-accent-foreground: 222 47% 11%;
  --sidebar-border:     220 13% 88%;
}
```

### 1.3 Semantic — Dark

```css
.dark {
  --background:        222 47% 6%;
  --foreground:        210 40% 98%;
  --card:              222 47% 8%;
  --card-foreground:   210 40% 98%;
  --popover:           222 47% 8%;
  --popover-foreground:210 40% 98%;
  --primary:           220 88% 64%;
  --primary-foreground:222 47% 6%;
  --secondary:         217 33% 17%;
  --secondary-foreground: 210 40% 98%;
  --muted:             217 33% 17%;
  --muted-foreground:  215 20% 65%;
  --accent:            217 33% 17%;
  --accent-foreground: 210 40% 98%;
  --destructive:       0 73% 55%;
  --destructive-foreground: 210 40% 98%;
  --success:           142 71% 45%;
  --warning:           38 92% 50%;
  --info:              199 89% 48%;
  --border:            217 33% 17%;
  --input:             217 33% 17%;
  --ring:              220 88% 64%;
  --sidebar-background: 222 47% 8%;
  --sidebar-foreground: 210 40% 98%;
  --sidebar-accent:     217 33% 14%;
  --sidebar-accent-foreground: 210 40% 98%;
  --sidebar-border:     217 33% 14%;
}
```

### 1.4 Surfaces (elevation tints)

```css
:root {
  --surface-0: var(--background);
  --surface-1: 220 14% 98%;   /* subtle raised */
  --surface-2: 220 14% 96%;   /* card */
  --surface-3: 220 14% 93%;   /* popover */
  --surface-4: 220 14% 89%;   /* dropdown */
}
.dark {
  --surface-0: 222 47% 6%;
  --surface-1: 222 47% 8%;
  --surface-2: 222 47% 10%;
  --surface-3: 222 47% 12%;
  --surface-4: 222 47% 14%;
}
```

### 1.5 Org accent (Pro+)

```css
[data-org-accent] {
  --primary: var(--org-accent-h) var(--org-accent-s) var(--org-accent-l);
  --ring:    var(--org-accent-h) var(--org-accent-s) var(--org-accent-l);
}
```

Org accent injected at `<html>` level when active Org has a brand color.

## 2. Typography

```css
:root {
  --font-sans:  "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono:  "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --font-heading: "Inter Display", var(--font-sans);
}
```

Type scale (rem; 1rem = 16 px):

| Token | Size | Line | Weight | Use |
|---|---|---|---|---|
| `text-display` | 3.5  | 1.05 | 700 | Marketing hero |
| `text-h1`      | 2.25 | 1.15 | 700 | Page title |
| `text-h2`      | 1.75 | 1.2  | 700 | Section heading |
| `text-h3`      | 1.375| 1.25 | 600 | Sub-section |
| `text-h4`      | 1.125| 1.35 | 600 | Card heading |
| `text-base`    | 1.0  | 1.5  | 400 | Body |
| `text-sm`      | 0.875| 1.45 | 400 | Secondary body, table |
| `text-xs`      | 0.75 | 1.4  | 500 | Labels, captions, badges |
| `text-mono-sm` | 0.8125 | 1.5 | 500 | Code, IDs, slugs |

Letter-spacing: tight (`-0.01em`) for h1/h2; default elsewhere.

## 3. Spacing

4 px base. Tailwind scale (`1` = 4 px) unchanged. Custom additions:

```js
spacing: {
  '4.5': '1.125rem',   // 18 px — between dense-row gap
  '13':  '3.25rem',    // 52 px — top-bar height (web)
  '18':  '4.5rem',     // 72 px — sidebar collapsed width
}
```

Common rhythm: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.

## 4. Radius

```css
:root {
  --radius-sm: 0.375rem;
  --radius:    0.5rem;
  --radius-md: 0.625rem;
  --radius-lg: 0.875rem;
  --radius-xl: 1.25rem;
  --radius-full: 9999px;
}
```

Cards use `--radius-lg`; buttons `--radius`; pills `--radius-full`.

## 5. Shadow

```css
:root {
  --shadow-xs: 0 1px 2px 0 hsl(220 30% 10% / 0.04);
  --shadow-sm: 0 1px 3px 0 hsl(220 30% 10% / 0.08), 0 1px 2px -1px hsl(220 30% 10% / 0.06);
  --shadow:    0 4px 8px -2px hsl(220 30% 10% / 0.10), 0 2px 4px -2px hsl(220 30% 10% / 0.06);
  --shadow-md: 0 10px 20px -6px hsl(220 30% 10% / 0.15), 0 4px 8px -4px hsl(220 30% 10% / 0.08);
  --shadow-lg: 0 20px 40px -10px hsl(220 30% 10% / 0.2);
  --shadow-glow: 0 0 0 4px hsl(var(--ring) / 0.18);
}
.dark {
  --shadow-xs: 0 1px 2px 0 hsl(0 0% 0% / 0.4);
  --shadow-sm: 0 1px 3px 0 hsl(0 0% 0% / 0.5);
  --shadow:    0 4px 8px -2px hsl(0 0% 0% / 0.55);
  --shadow-md: 0 10px 20px -6px hsl(0 0% 0% / 0.6);
  --shadow-lg: 0 20px 40px -10px hsl(0 0% 0% / 0.7);
}
```

## 6. Motion

```css
:root {
  --duration-instant: 80ms;
  --duration-fast:    140ms;
  --duration-base:    200ms;
  --duration-slow:    320ms;
  --duration-lazy:    500ms;

  --ease-out:   cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:    cubic-bezier(0.7, 0, 0.84, 0);
  --ease-inout: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

Standard transition: `transition: all var(--duration-fast) var(--ease-out);`.

## 7. Z-index scale

```js
zIndex: {
  base: 0,
  raised: 10,
  sticky: 20,
  drawer: 30,
  dropdown: 40,
  modal: 50,
  popover: 60,
  toast: 70,
  tooltip: 80,
  command: 90,
  max: 9999,
}
```

## 8. Icons

- Stroke 1.75 px at 16 px and 20 px; 2 px at 24 px+.
- Color via `currentColor`.
- Sizes: `xs=12`, `sm=14`, `md=16`, `lg=20`, `xl=24`.

## 9. Border weights

`1px` default (`--border`); `2px` for focus rings; `3px` for drop-target highlight.

## 10. Opacity scale

`5 / 10 / 20 / 40 / 60 / 80 / 95`.

## 11. Tailwind config wiring

`tailwind.config.ts` extends `theme.colors` to map every CSS var to a class, e.g. `bg-primary`, `text-muted-foreground`, `border-border`, `ring-ring`. Components reference only these classes. **Never** raw values.
