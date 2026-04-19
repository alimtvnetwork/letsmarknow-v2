# Accessibility (WCAG)

> **Closes gap M10.** Sets WCAG conformance target, per-component checklist, and CI gating.
> **Locked target:** **WCAG 2.1 Level AA** (Level AAA aspirational for color contrast).

---

## 1. Conformance target

| Standard | Level | Status |
|---|---|---|
| WCAG 2.1 | **AA** | **Required** for every shipped UI |
| WCAG 2.1 | AAA | Aspirational for text contrast (7:1) and focus visibility |
| EN 301 549 | Aligned via WCAG 2.1 AA | Required for EU compliance |
| Section 508 | Aligned via WCAG 2.1 AA | Required for US gov pilots |

## 2. Per-component checklist (every shippable component)

- [ ] Reachable via Tab key in logical order
- [ ] Focus indicator visible (3:1 contrast against background, ≥ 2 px outline)
- [ ] Operable with Enter / Space / Esc as appropriate
- [ ] `aria-label` or visible label present on interactive elements
- [ ] `role` set when not implied by element
- [ ] Color is not the sole means of conveying state (icon + text accompanies)
- [ ] Text contrast ≥ 4.5:1 (normal) or 3:1 (≥ 18 px or bold ≥ 14 px)
- [ ] Non-text contrast (icons, borders) ≥ 3:1
- [ ] Resizable to 200% without horizontal scrolling
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Form errors announced via `aria-live="polite"`
- [ ] Modal traps focus and restores it on close
- [ ] No keyboard trap outside modals
- [ ] Heading hierarchy semantically correct (single H1, no skipped levels)
- [ ] Images have `alt` (decorative → `alt=""`)

PR template includes this checklist. PR cannot merge if any item is unchecked or marked N/A without justification.

## 3. CI gating

| Tool | Stage | Fails build on |
|---|---|---|
| `axe-core` (Playwright integration) | E2E | Any `serious` or `critical` violation |
| `eslint-plugin-jsx-a11y` | Lint | All errors enabled; warnings = error in CI |
| `pa11y-ci` | Per-route smoke | Sitewide config in `.pa11yci.json` |
| Lighthouse CI | Per-PR preview | a11y score < 95 |

Routes audited by pa11y-ci on every PR:
- `/` (marketing)
- `/auth/sign-in`, `/auth/sign-up`
- `/dashboard`
- `/share/[token]` (public viewer)
- `/billing`
- `/settings/account`

## 4. Manual audit cadence

- Quarterly **NVDA + JAWS + VoiceOver** smoke test on top 5 flows.
- Annual **third-party WCAG audit** (target Q4 each year).
- Findings logged in `spec/21-app/audit-{date}-a11y.md`.

## 5. Reduced motion

Global CSS:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Custom animations (drag, mind-map zoom) gate on `useReducedMotion()` hook and replace with instant transitions.

## 6. Color & contrast tokens

Design tokens in `06-ui-ux/01-design-tokens.md` MUST pass AA at intended pairings. CI verifies pairings:

| Foreground | Background | Required ratio | Min in tokens |
|---|---|---|---|
| `--text-primary` | `--surface-base` | 4.5 | 7.0 |
| `--text-muted` | `--surface-base` | 4.5 | 4.6 |
| `--text-on-primary` | `--brand-primary` | 4.5 | 5.1 |
| `--icon-default` | `--surface-base` | 3.0 | 4.0 |
| `--border-strong` | `--surface-base` | 3.0 | 3.2 |

## 7. Keyboard shortcut conflicts

Registry maintained at `spec/21-app/06-ui-ux/08-keyboard-input.md`. New shortcuts MUST be added there with conflict check; CI fails on duplicates.

## 8. Locked rules

1. WCAG 2.1 AA is the floor. PRs that drop below it cannot merge.
2. `axe-core` violations of `serious` or `critical` block merge.
3. Every interactive element MUST have a non-color affordance (icon, label, or shape).
4. Modals MUST trap focus and restore on close; verified by E2E test per modal.
5. `prefers-reduced-motion` respected globally, no per-component opt-out without owner approval.
