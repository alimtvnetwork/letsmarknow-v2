# Onboarding

First-run experience. Three entry points: brand-new signup, accepting an invite, post-extension-install.

---

## 1. Goals

- Time-to-first-save (TTFS) < 90 seconds median.
- 70% of new accounts save at least one item in session 1.
- 40% install the extension within 7 days.
- 0 forced steps after sign-in (skip is always available).

## 2. Branching

```
sign up / sign in
   │
   ▼
detect state:
   • brand-new account → /onboarding (welcome flow)
   • accepted invite → land on shared Space, show 1-step coach
   • from extension install → /welcome on letsmarknow.com first, then /onboarding-ext
   • returning user → /dashboard
```

## 3. `/onboarding` (welcome flow) — 4 steps

### Step 1 — "Pick your starting Space" (2 cards)
- "**Personal**" (default) — for your own bookmarks.
- "**Team**" — invite teammates now (skips to invite UI; creates Personal anyway in background).
- Both create a Space named "My Collections" with two seed Collections: "Read Later" and "Favorites" (empty).

### Step 2 — "Bring your bookmarks" (skippable)
- Three big tiles: Chrome bookmarks (one click via extension prompt) · Toby JSON · Pocket / Raindrop / Other (file upload).
- Or "I'll add them later".
- If extension installed and user picks Chrome: extension reads `chrome.bookmarks.getTree()` (after one-time `bookmarks` optional permission grant), uploads via `/v1/imports`.

### Step 3 — "Install the extension" (if not detected)
- Animated GIF of save-tab flow.
- Big "Add to Chrome" button → CWS listing.
- **v1 (Chrome-only):** No per-browser CTAs for Edge/Brave/Firefox. Single line: "Coming soon for Edge, Brave, Arc, Firefox, and Safari." See `00-overview/browser-scope.md`.
- Skip → "Use the bookmarklet instead" with drag-to-bar instruction.

### Step 4 — "Try it" (fully optional)
- Pre-seeded sample Collection appears: "Welcome to Lets Mark Now" with 5 starred items demonstrating tags, groups, notes, hover-to-jump.
- "Open dashboard" CTA.

Progress bar visible at top (1/4, 2/4, …). "Skip" link top-right closes the flow and lands on `/dashboard`.

## 4. Invite-accept flow (`/invite/:token`)

1. Server resolves invite via `POST /v1/members/invites/accept`.
2. If `requires_signup=true`, route to `/signup?invite_token=…` first.
3. After acceptance, route to `/dashboard?org=<slug>`. Show one-step coach: "You're now a member of **Atto Property**. Try saving a tab."

## 5. Post-extension-install (`/welcome`)

- Marketing-domain landing (SSR for SEO).
- Three sections:
  1. "Click the LMN icon in your toolbar" (animated arrow pointing top-right).
  2. "Or hit `Alt+S` to save the current tab."
  3. CTA: "Sign in / Create account" → `app.letsmarknow.com/login?next=/onboarding-ext&from=ext`.

`/onboarding-ext` (in app):
- 1 step: "All set! Try saving a tab now from the toolbar." with confetti when first save event arrives via WebSocket.
- Auto-redirects to `/dashboard` after first save or after 60 s.

## 6. Empty-state coachmarks

After onboarding, if user lands on a Space with 0 Collections, show coachmark "Create your first collection" with arrow.

If user has 0 Items after 24 h, show banner "Your bookmarks library is empty. Try the [Save current tab](?) button or [import from another app](?)."

## 7. Telemetry (server-side)

| Event | When |
|---|---|
| `onboarding.started` | first visit to `/onboarding` |
| `onboarding.step_completed` | each step finish |
| `onboarding.skipped` | skip click |
| `onboarding.completed` | step 4 finished or skipped |
| `onboarding.first_save` | first item created within 7 days of signup |
| `onboarding.extension_installed` | first ping from extension within 7 days |
| `onboarding.first_share` | within 7 days |

Used to compute activation funnel.

## 8. Re-onboarding

If user disables/uninstalls the extension and reinstalls, `/welcome` re-runs but `/onboarding` does not (one-shot per Account).

A "Restart tour" link in `/me/profile` resets `onboarded=false` for users who want to see it again.

## 9. Locale & accessibility

- All strings in `_locales/<locale>/onboarding.json`.
- Keyboard navigable end to end.
- Skip link present on every step.
- Animations respect `prefers-reduced-motion`.
