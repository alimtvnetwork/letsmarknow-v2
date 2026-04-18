# Update & Rollout

How extension versions are released, staged, force-updated, and killed.

---

## 1. Channels

| Channel | Audience | Source |
|---|---|---|
| **Stable** | All users | Chrome Web Store public listing |
| **Beta** | Opt-in via Web Store "Beta" tab | CWS Beta listing (separate item id) |
| **Internal** | Team / QA | Loaded unpacked OR signed CRX hosted on `https://updates.letsmarknow.com/internal.xml` (with `update_url` set in dev manifest) |

Production manifest uses default Web Store update URL; never sets `update_url`.

## 2. Versioning

- SemVer: `MAJOR.MINOR.PATCH` + 4th `BUILD` integer for CWS uniqueness (`1.4.0.20260418`).
- MAJOR: API or storage schema breaking; requires migration script.
- MINOR: new features; backward compatible.
- PATCH: bug fixes only.
- BUILD: CI run id; bumped automatically.

## 3. Release pipeline

```
PR merged to main
  → CI builds prod bundle
  → uploads to CWS Draft (one click "Publish" in CWS dashboard)
  → CWS staged rollout: 5% → 25% → 50% → 100% over 72 h
  → metrics watch: error rate, sync failures, sign-out spikes
  → if regression → halt + rollback (republish previous .zip with bumped BUILD)
```

Beta channel: same pipeline, instant 100% to opted-in users.

## 4. Migrations

- Each MAJOR/MINOR ships a `migrations/<from>-to-<to>.ts` module.
- SW `onInstalled({ reason: "update", previousVersion })` runs all migrations between versions in order.
- Migrations operate on `chrome.storage.local` and IndexedDB only (server data is server's problem).
- Each migration is idempotent and writes a `migrations_applied: ["1.3.0->1.4.0"]` array.

## 5. Force-update / kill-switch

Polled via `GET /v1/health/extension?version=1.4.0` (alarm `lmn.kill-switch-poll`, every 6 h):

```json
{
  "ok": true,
  "min_supported_version": "1.2.0",
  "min_recommended_version": "1.4.0",
  "kill_switch": {
    "disabled": false,
    "reason": null,
    "until": null
  },
  "messages": [
    { "level": "info", "title": "What's new", "url": "https://letsmarknow.com/changelog/1.4.0" }
  ]
}
```

Behavior:
- `version < min_supported_version` → SW disables all mutating actions; popup shows full-screen "Update required" with link to CWS.
- `version < min_recommended_version` → soft banner "Update available" with link.
- `kill_switch.disabled=true` → SW refuses all API calls; UI shows reason + ETA; only "Sign out" + "Export local cache" buttons enabled. Used in case of catastrophic data-loss bug.

`messages` displayed in popup footer or new-tab banner (one per session, dismissable; tracked by message id).

## 6. Rollback

- Web Store does not support true rollback. We re-publish the previous source code with `BUILD` bumped (`1.4.0.20260418` → `1.3.5.20260419`) which CWS accepts as a "newer" version.
- Server `min_supported_version` lowered if needed to keep the rolled-back users functional.

## 7. Data loss prevention

- Before any destructive migration, SW writes a backup snapshot to IndexedDB store `_migration_backups/<from-version>` (kept for 30 days).
- Options page exposes "Restore pre-update backup" link if a backup exists.

## 8. Update notifications (UX)

- Soft: footer badge in popup "Updated to 1.4 — see what's new".
- Major: first popup open after update shows a 1-screen modal with 3 bullets + "Continue".
- Suppressed if user has `prefs.show_update_notes = false`.

## 9. Telemetry on update

Single event `extension.updated`:
```json
{
  "from_version": "1.3.5",
  "to_version": "1.4.0",
  "migrations_run": ["1.3.0->1.4.0"],
  "duration_ms": 142,
  "errors": []
}
```

## 10. Privacy of CWS metadata

The Chrome Web Store sees install counts, ratings, country distribution. We do not request additional permissions over time without explanation; new permission requests trigger a Chrome modal at update time, which spikes uninstalls. Therefore: never add a required permission in a minor; bundle additive permissions into MAJOR releases.

## 11. Edge / Brave / Opera / Arc

All Chromium-based; the same CRX works. We submit to:
- Microsoft Edge Add-ons store (separate listing)
- Opera Add-ons (separate listing)

Brave & Arc auto-pull from CWS by default (no separate submission needed).

Firefox: separate XPI build with WebExtensions polyfill (`browser.*` namespace). Tracked as a future milestone — see `20-release-ops/firefox-port.md`.
