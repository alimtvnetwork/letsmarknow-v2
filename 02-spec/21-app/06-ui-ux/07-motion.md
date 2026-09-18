# Motion

Animation system: tokens, easings, durations, choreography rules.

---

## 1. Principles

1. **Functional, not decorative.** Every animation must communicate change, hierarchy, or causality.
2. **Fast.** Most transitions ≤ 200 ms.
3. **Consistent.** Same kind of change → same easing + duration.
4. **Interruptible.** Never block input. Spring-back if interrupted mid-animation.
5. **Reduced motion respected.** No exceptions.

## 2. Tokens

(See `01-design-tokens.md` for the full list.)

| Duration | ms | Use |
|---|---|---|
| `instant` | 80 | Tooltip, micro-feedback (button press) |
| `fast` | 140 | Hover, focus, color change |
| `base` | 200 | Open/close (popover, dropdown), tab switch |
| `slow` | 320 | Modal, drawer, page transition |
| `lazy` | 500 | Onboarding flourish, success confetti |

| Easing | Use |
|---|---|
| `out` `cubic-bezier(0.16, 1, 0.3, 1)` | Most enter animations (decelerate to rest) |
| `in`  `cubic-bezier(0.7, 0, 0.84, 0)` | Exit animations (accelerate away) |
| `inout` `cubic-bezier(0.65, 0, 0.35, 1)` | Reposition, layout shifts |
| `spring` `cubic-bezier(0.34, 1.56, 0.64, 1)` | Save toast, drag-drop landing, thumbs-up |

## 3. Standard animations

### 3.1 Color / opacity

`transition: colors var(--duration-fast) var(--ease-out)`. All hover/focus states.

### 3.2 Popover / dropdown

```css
@keyframes pop-in {
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-pop-in { animation: pop-in var(--duration-base) var(--ease-out); }
```

### 3.3 Modal / drawer

- Backdrop fade 200 ms.
- Content slide from edge (drawer) or scale-in 0.96→1 (modal).
- Exit reverses with `--duration-fast`.

### 3.4 Toast

- Slide in from bottom-right 220 ms `spring`.
- Auto-dismiss after 4 s (5 s for important, 8 s for actions).
- Exit slide-out 140 ms `in`.

### 3.5 Card add / remove (dashboard)

- Add: opacity 0 + scale 0.95 → 1, 200 ms `spring`.
- Remove: opacity → 0, scale → 0.97, 140 ms `in`. Sibling reflow 200 ms `inout`.

### 3.6 Drag & drop

- Pickup: 120 ms scale 1.02 + shadow elevate.
- Hover over drop zone: drop-target outline pulses (2 px → 3 px → 2 px) 800 ms loop.
- Drop landing: 200 ms `spring` settle.

### 3.7 Skeleton shimmer

```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg,
    hsl(var(--muted)) 0%,
    hsl(var(--muted) / 0.6) 50%,
    hsl(var(--muted)) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.6s linear infinite;
}
```

### 3.8 Confirmation flourishes

- Save success: `BookmarkCheck` scales 0→1 with overshoot (spring) over 320 ms; then settles.
- Onboarding step done: confetti burst, 600 ms; respects reduced motion (replaced with single check).

### 3.9 Realtime arrival

- New activity row: slide down 200 ms + brief 1 s background tint with `--info / 0.08`.

### 3.10 Theme switch

- 200 ms cross-fade overlay (see `02-theming.md` § 8).

## 4. Reduced-motion contract

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  /* explicit replacements */
  .animate-pop-in { animation: none; opacity: 1; }
  .animate-spin { animation: none; }
  .skeleton { animation: none; background: hsl(var(--muted)); }
}
```

Components must not rely on animations *finishing* to set state — always set final state via React, with animation as visual sugar.

## 5. Choreography

When multiple elements animate together:

- **Stagger**: 30 ms between siblings (max 8 elements; clamp after that to keep < 240 ms total).
- **Hierarchy**: parent enters first, children stagger after parent settles (≥ 80 ms delay).
- **Page transition**: outgoing fades 100 ms, incoming fades 140 ms with 50 ms overlap.

## 6. Performance budgets

- All transitions on `transform` and `opacity` only (cheap; GPU-composited).
- Layout-affecting animations use `FLIP` technique (`react-flip-toolkit` or manual).
- Watch `requestAnimationFrame` budget; warn in dev if a frame spans > 16 ms during animation.

## 7. Animation library

- **Framer Motion** for orchestrated animations (modals, drawers, drag presence).
- **CSS animations** for everything atomic (hover, skeleton, spinners).
- **No GSAP**, no Lottie except for marketing hero (lazy-loaded).

## 8. Testing

- Visual regression via Chromatic with `pauseAnimations: true`.
- Cypress checks `data-state` transitions, not animation end (avoid flake).
- Storybook "Reduced Motion" toolbar toggles `prefers-reduced-motion` for QA.

## 9. Telemetry

- `motion.reduced_motion_active` (one-shot per session) for prevalence stats.
- `motion.frame_jank_detected` if dev profile mode catches > 32 ms frame in production.

## 10. Don'ts

- No bouncing, looping, attention-grabbing animations on persistent elements.
- No spinners > 600 ms — use skeleton instead.
- No animating text content (only containers).
- No motion on print stylesheet.
