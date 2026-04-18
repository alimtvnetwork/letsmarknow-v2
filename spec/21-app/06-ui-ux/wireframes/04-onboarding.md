# Wireframe — Onboarding

> **Route:** `/welcome`, `/welcome/:step`
> **Spec ref:** `05-web-app/onboarding.md`

Five steps; user can skip individual steps but completion is tracked for the activation funnel.

---

## 1. Layout shell (all steps)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Logo]                                                          [Skip step → ]│ ← 64px
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ●━━━●━━━○━━━○━━━○                                                           │ ← Progress (5 dots)
│  1   2   3   4   5                                                           │
│                                                                              │
│       ┌────────────────────────────────────────────────────────────┐         │
│       │                                                            │         │
│       │                  [Step content here]                       │         │
│       │                                                            │         │
│       │   max-width 560px, centered, padding 48px                  │         │
│       │                                                            │         │
│       └────────────────────────────────────────────────────────────┘         │
│                                                                              │
│                  [← Back]                       [Continue →]                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Step 1 — Welcome

```
       ┌────────────────────────────────────────────────────────────┐
       │                                                            │
       │              [Hero illustration]                           │
       │                                                            │
       │       {onboarding.welcome.title}                           │
       │       {onboarding.welcome.body}                            │
       │                                                            │
       │              [Continue →]                                  │
       │                                                            │
       └────────────────────────────────────────────────────────────┘
```

No "Back" button on step 1.

---

## 3. Step 2 — Install browser extension

> **v1 (Chrome-only):** Render only the Chrome card. The Edge / Firefox cards shown in the Phase 4 layout below are postponed — **do not render in v1**. See `00-overview/browser-scope.md`.

### v1 layout (Chrome only)

```
       ┌────────────────────────────────────────────────────────────┐
       │       {onboarding.step.install_extension.title}            │
       │       {onboarding.step.install_extension.body}             │
       │                                                            │
       │              ┌─────────────────┐                           │
       │              │     Chrome      │                           │
       │              │  [Add to Chrome]│                           │
       │              └─────────────────┘                           │
       │                                                            │
       │   ✓ Detected: Chrome                                       │
       │                                                            │
       │   Coming soon for Edge, Brave, Arc, Firefox, and Safari.   │
       │                                                            │
       │   [Skip — I'll do this later]                              │
       └────────────────────────────────────────────────────────────┘
```

### Phase 4 layout (cross-browser — POSTPONED)

```
       ┌────────────────────────────────────────────────────────────┐
       │   ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
       │   │ Chrome  │  │  Edge   │  │ Firefox │  ← detected first  │
       │   │  [Add]  │  │  [Add]  │  │  [Add]  │                    │
       │   └─────────┘  └─────────┘  └─────────┘                    │
       └────────────────────────────────────────────────────────────┘
```

Detection state polls `chrome.runtime` from extension; updates in-place when installed.

---

## 4. Step 3 — Save your first tab

```
       ┌────────────────────────────────────────────────────────────┐
       │       {onboarding.step.first_save.title}                   │
       │       {onboarding.step.first_save.body}                    │
       │                                                            │
       │   ┌──────────────────────────────────────────────────────┐ │
       │   │ Paste a URL                                          │ │
       │   │ https://...                                          │ │
       │   └──────────────────────────────────────────────────────┘ │
       │                                                            │
       │   [Save it]                                                │
       │                                                            │
       │   ─── or ───                                               │
       │                                                            │
       │   Click the extension icon in your toolbar                 │
       │   ↑↑↑   (animated arrow pointing up-right)                 │
       └────────────────────────────────────────────────────────────┘
```

Auto-advances when first item is saved (any source).

---

## 5. Step 4 — Make a collection

```
       ┌────────────────────────────────────────────────────────────┐
       │       {onboarding.step.organize.title}                     │
       │       {onboarding.step.organize.body}                      │
       │                                                            │
       │   ┌──────────────────────────────────────────────────────┐ │
       │   │ {label.name}                                         │ │
       │   │ e.g. "Reading list"                                  │ │
       │   └──────────────────────────────────────────────────────┘ │
       │                                                            │
       │   Choose an icon: [📚] [💼] [🎨] [🔬] [🎯] [More…]         │
       │                                                            │
       │   [Create collection]                                      │
       └────────────────────────────────────────────────────────────┘
```

---

## 6. Step 5 — Invite team (optional)

```
       ┌────────────────────────────────────────────────────────────┐
       │       {onboarding.step.invite.title}                       │
       │       {onboarding.step.invite.body}                        │
       │                                                            │
       │   ┌──────────────────────────────────────────────────────┐ │
       │   │ name@company.com, alice@…, …                         │ │
       │   └──────────────────────────────────────────────────────┘ │
       │                                                            │
       │   Role for invitees: [▾ Editor]                            │
       │                                                            │
       │   [Send invites]      [Skip — I work solo]                 │
       └────────────────────────────────────────────────────────────┘
```

---

## 7. Completion

```
       ┌────────────────────────────────────────────────────────────┐
       │              [Confetti / hero illustration]                │
       │                                                            │
       │       {onboarding.complete.title}                          │
       │                                                            │
       │              [Open dashboard →]                            │
       └────────────────────────────────────────────────────────────┘
```

Redirects to `/dashboard`.

---

## 8. Mobile (< 768px)

- Progress dots shrink, stay top-center
- Content padding reduces to 24px
- CTAs become full-width, stacked
- Step 2 (extension install) shows "Open this on desktop to install" message

---

## 9. Telemetry

- `onboarding_started`
- `onboarding_step_viewed` (`{step}`)
- `onboarding_step_completed` (`{step}`)
- `onboarding_step_skipped` (`{step}`)
- `onboarding_completed` (`{steps_completed, total_seconds}`)
- `onboarding_abandoned` (`{last_step}`)
