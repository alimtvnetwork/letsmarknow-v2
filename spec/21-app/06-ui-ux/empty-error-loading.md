# Empty / Error / Loading

Every async surface MUST have an explicit state for each of: loading, empty, error. No bare spinners, no blank screens, no white pages.

---

## 1. The contract

For any data-fetched surface, the implementation must define four render branches:

```tsx
if (isLoading) return <LoadingState surface={SURFACE_KEY} />;
if (error)     return <ErrorState surface={SURFACE_KEY} error={error} onRetry={refetch} />;
if (isEmpty)   return <EmptyState surface={SURFACE_KEY} onPrimary={...} />;
return <Content data={data} />;
```

`SURFACE_KEY` indexes a registry (`packages/ui/states-registry.ts`) that returns the right copy + illustration + CTAs per surface.

ESLint rule (`lmn-design/three-state`) flags any TanStack Query usage that doesn't render all three branches.

## 2. Loading

### 2.1 Skeletons (preferred)

- Match the shape of the eventual content (item card → card-shaped skeleton).
- Animate via `shimmer` keyframe (see `motion.md`).
- Show after 100 ms (avoid flash for cached data).
- Replace cleanly with content (no layout shift; same dimensions).

### 2.2 Inline spinner

- Only inside buttons or small inline regions.
- 16 px `Loader2` with `animate-spin`.

### 2.3 Progress bar

- For known-progress operations (uploads, imports).
- Indeterminate variant for unknown duration but > 2 s expected.

### 2.4 Splash

- Used only on initial app boot before auth resolved.
- Centered logo + 1-line tagline + subtle pulsing dot.
- Times out after 3 s → falls back to error state with retry.

## 3. Empty

Standard composition:

```
[ Illustration 240 wide ]
Headline (text-h3, sentence case, 1 line)
Subline (text-base, text-muted-foreground, 1–2 lines)
[ Primary CTA ]   [ Secondary link ]
```

Examples per surface:

| Surface | Illustration | Headline | CTA |
|---|---|---|---|
| Empty Collection | `marko-empty-shelf` | "Nothing here yet" | "Save your first tab" |
| Empty Space | `marko-empty-room` | "Your space is wide open" | "Create a collection" |
| Empty Search | `telescope-no-results` | "No matches for '%query%'" | "Clear filters" |
| Empty Trash | `sleeping-marko` | "Trash is empty" | (none; tip text only) |
| Empty Activity | `marko-quiet` | "No activity yet" | "Save a tab" |
| Empty Members | `marko-greeting` | "Just you here" | "Invite teammates" |
| Empty Shares | `crate-empty` | "No shares yet" | "Share your first collection" |
| Empty Imports | `crate-importing` | "No imports yet" | "Start an import" |
| Empty Exports | `crate-empty` | "No exports yet" | "Create an export" |

Empty state never blocks navigation; user can still use sidebar/top-bar.

## 4. Error

### 4.1 Inline (single API call failed)

- Same shape as empty.
- Illustration: `marko-broken-bookmark`.
- Headline: "Couldn't load <thing>".
- Subline: shows error category if known.
- Buttons: `[Retry]` `[Contact support]` (links with `error_id` deep-linked).

### 4.2 Form / mutation errors

See `feedback.md` and `forms.md`.

### 4.3 Page-level (route boundary)

- Triggered by Error Boundary in route loader.
- Same composition; back button to `/dashboard` always available.
- Reports to telemetry with `error_id`, stack, surface.

### 4.4 Network down

- Detected via `navigator.onLine` + ping check.
- Banner "You're offline." appears at top.
- Surfaces use cached data with "Offline" badge.
- Mutations queued (see `04-extension/sync-and-offline.md` for shared logic).

### 4.5 Permission denied

- Specific empty-style state: "You don't have access to this collection."
- Subline names the role required.
- CTA: "Request access" emails the owner.

### 4.6 Not found (404)

- `marko-lost` illustration.
- Headline: "We couldn't find that".
- Subline: includes path that wasn't found.
- CTAs: "Go to dashboard", "Search".

### 4.7 Gone (410, revoked share)

- `crate-empty` illustration.
- "This share is no longer available."
- CTA: "Create your own collection" → marketing.

### 4.8 Server error (500)

- "Something went wrong on our end."
- "We've been notified. Try again in a moment."
- Buttons: `[Retry]` `[Status page]`.

## 5. Mixed states

When some data loaded but partial errors occurred:

- Show what loaded.
- Inline error region for failed slice ("Couldn't load tags — Retry").
- Don't blank the whole page.

## 6. Retry behavior

- Manual retry on every error state.
- Auto-retry by TanStack Query: 2 attempts, exponential backoff (1 s, 2 s), max 5 s — only for idempotent GETs.
- Mutations never auto-retry.

## 7. Telemetry

- `state.loading_shown` `{ surface }` (sampled 5%)
- `state.empty_shown` `{ surface }`
- `state.error_shown` `{ surface, error_code, error_id }`
- `state.empty_cta_clicked` `{ surface }`
- `state.error_retry_clicked` `{ surface }`

## 8. A11y

- Loading skeletons have `aria-busy="true"` on container; `role="status"` with hidden "Loading <surface>" text.
- Empty states are static content; no special role.
- Error states use `role="alert"` if shown after page already rendered; static otherwise.

## 9. Tests

- Each surface has Storybook stories: `Loading`, `Empty`, `Error`, `Loaded`.
- Cypress smokes: force-empty database → assert empty UI; force 500 → assert error UI.
- Chromatic snapshots for all four states.

## 10. Forbidden

- Bare `<Spinner />` as the entire screen.
- White flash between loading and content (always render a skeleton at the right size).
- Generic "Error" without explanation.
- Empty states with no CTA on actionable surfaces.
- Different empty illustrations for the same logical surface across web/extension.
