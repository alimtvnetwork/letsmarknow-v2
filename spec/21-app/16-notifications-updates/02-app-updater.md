# App Updater

> **v1 scope (LOCKED):** Chrome Web Store update path **only**. Edge / Firefox / Brave update paths are **postponed to Phase 4**. See `00-overview/05-browser-scope.md`.

How the extension and web app receive new versions — and how users find out.

---

## 1. Extension update mechanism

### Default path: Chrome Web Store (v1)

- Chrome auto-checks every ~5 hours.
- New version installed silently when extension is idle.
- Service worker restarts on next activation; UI surfaces detect via `chrome.runtime.onUpdateAvailable`.

### Edge / Firefox / Brave — POSTPONED (Phase 4)

- ⏭ **Not implemented in v1.** Documented for future reference only.
- Same pattern via their respective stores when implemented.
- Manifest v3 update_url default; no self-hosted updates.

### Self-hosted (enterprise, Pro+)

- Optional `.crx` published to S3 with `update_url` in enterprise manifest.
- Signed with stable key; rotation policy in `19-security-privacy/`.
- Update interval: 4 h.

## 2. Update detection in extension

```js
chrome.runtime.onUpdateAvailable.addListener((details) => {
  // details.version = "1.5.0"
  showUpdateBadge(details.version);
});
```

- Surfaces a small "Update ready" badge on the popup icon (no force).
- User clicks → "Reload to update" toast in popup → calls `chrome.runtime.reload()`.
- Auto-reload after 24 h if user ignores (unless they're mid-save).

## 3. Update detection in web app

- Build emits a `meta.json` with `{ version, build_hash, published_at }` at site root.
- App polls every 5 min on focus; compares hash.
- New hash detected → soft prompt:
  ```
  ┌───────────────────────────────────────┐
  │ A new version is available.           │
  │ [Reload now]   [Later]                │
  └───────────────────────────────────────┘
  ```
- Toast persists; doesn't block work.
- Auto-reload after 7 days OR on next idle navigation (not mid-edit).

## 4. Manual check

- Extension: Options → "Check for updates" → calls `chrome.runtime.requestUpdateCheck()`.
- Web app: Settings → About → "Check for updates" → forces `meta.json` revalidate.
- Both show clear status: "Up to date" / "Update available (vX.Y.Z)".

## 5. Reload safety

Never reload while:
- A save / mutation is in flight.
- An inline edit is unsaved.
- A modal is open with unsaved input.
- A drag operation is active.

Defer reload until safe; show "Reload pending" indicator in shell.

## 6. Migration on reload

- New version may include schema migrations for local IndexedDB.
- Migration runs in service worker before SPA boot.
- Failure: rollback IndexedDB to last-known-good; surface error toast; user can re-import data if needed.

## 7. Version display

- Web app: Settings → About → version + build hash + channel.
- Extension: Options → About → version + channel + Chrome version.
- Both link to release notes for current version.

## 8. Forced upgrade (rare)

- Reserved for security-critical fixes or breaking API changes.
- Server returns `426 UPGRADE_REQUIRED` with `min_client_version` header.
- App shows blocking modal: "Update required to continue. [Reload now]".
- Used at most a few times per year.

## 9. Rollout pacing

- New extension version: published to Chrome Web Store with rollout percentage (10% → 50% → 100% over 48 h) when feature is risky.
- Web app: progressive rollout via CDN feature flag (`X-Build-Variant` header) — see `15-feature-flags-and-rollouts.md`.

## 10. Telemetry

- `update.detected` `{ surface: ext | web, current_version, new_version }`
- `update.applied` `{ version, method: auto | manual | forced }`
- `update.deferred_due_to_unsaved`
- `update.failed` `{ stage: download | install | migrate, error }`
- `update.forced_upgrade_shown`

## 11. Edge cases

| Case | Behavior |
|---|---|
| User pins extension on old version (disabled auto-update) | Honored; badge shown but no force unless `min_client_version` violated |
| Update fires during sync push | Sync completes; reload defers |
| Multiple browser windows open | Reload coordinated via BroadcastChannel; all windows reload together |
| Web app open in 5 tabs | Single reload prompt; reloading one reloads all (via channel) |
| Migration fails in production | Auto-revert + sentry alert + user-visible apology toast with "Contact support" |

## 12. Tests

- onUpdateAvailable handler fires correctly.
- Mid-save reload deferral.
- Multi-tab coordinated reload.
- Migration rollback on failure.
- Forced upgrade modal blocks UI fully.
- Build hash detection works against CDN cache headers.
