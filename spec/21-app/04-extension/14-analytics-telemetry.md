# Analytics & Telemetry (Extension-side)

Minimal, opt-out, no PII, privacy-first. Every event documented here.

---

## 1. Principles

1. **No URLs of saved tabs** are ever sent to telemetry.
2. **No tab titles, item names, or notes content** in events.
3. **No personally identifying info** (email, name, IP). Server already has account context via auth.
4. **Aggregable counters and timings only.**
5. **Opt-out** via Options "Help improve LMN by sending anonymous usage data" — default ON, but a GDPR-consent banner appears in EU/UK/CH on first run.
6. **Opt-out is honored locally** — no events sent at all when off.

## 2. Transport

- Single endpoint: `POST https://api.letsmarknow.com/v1/telemetry/events`
- Batched: events buffered in `chrome.storage.local.telemetry_buffer`; flushed every 60 s OR when 50 events accumulated OR on `chrome.runtime.onSuspend`.
- Auth: extension's bearer token (account scope known server-side; no PII in body).
- Retries: same backoff as other API calls; drop after 10 retries.

## 3. Event envelope

```json
{
  "events": [
    {
      "name": "extension.shortcut_used",
      "ts": "2026-04-18T14:22:31.123Z",
      "session_id": "01J...",
      "props": { "command": "save_current_tab", "latency_ms": 312 }
    }
  ],
  "client": {
    "name": "chrome-ext",
    "version": "1.4.0",
    "browser": "chrome/124",
    "platform": "macos",
    "locale": "en-AU"
  }
}
```

`session_id` = random UUID per SW boot; rotates when SW restarts. Not linkable to account beyond what auth already shows.

## 4. Event catalog

| Event | When | Props |
|---|---|---|
| `extension.installed` | onInstalled(install) | `{}` |
| `extension.updated` | onInstalled(update) | `{ from_version, to_version, migrations_run, duration_ms }` |
| `extension.opened_popup` | popup mount | `{ trigger: "icon"\|"shortcut"\|"omnibox" }` |
| `extension.opened_newtab` | new-tab mount | `{}` |
| `extension.opened_sidepanel` | sidepanel mount | `{}` |
| `extension.shortcut_used` | command fired | `{ command, latency_ms }` |
| `extension.context_menu_used` | menu click | `{ item: "save-link"\|... }` |
| `extension.omnibox_used` | onInputEntered | `{ query_length, chosen_index, latency_first_render_ms, latency_server_ms }` |
| `save.tab` | save success | `{ destination_kind, had_tags: bool, had_notes: bool, latency_ms, source }` |
| `save.session` | session save success | `{ tabs_input, tabs_saved, tabs_skipped, dedupe_on, close_after, latency_ms }` |
| `save.failed` | save error | `{ source, error_code, latency_ms }` |
| `quickfind.used` | quick-find fire | `{ result_count, chosen_index, latency_ms }` |
| `search.used` | full search | `{ result_count, filters_count, latency_ms }` |
| `item.opened` | open item from any surface | `{ source: "popup"\|"newtab"\|"sidepanel"\|"omnibox", action: "new_tab"\|"jumped"\|"new_window" }` |
| `item.deleted` | delete | `{ source }` |
| `undo.used` | undo button fired | `{ event_type_undone, age_ms }` |
| `sync.cycle` | every pull | `{ pulled, pushed, failed, duration_ms }` |
| `sync.conflict` | 409 STALE | `{ entity_type, resolved_via: "auto"\|"keep_mine"\|"use_theirs" }` |
| `offline.queued` | mutation queued offline | `{ op, queue_size }` |
| `offline.flushed` | queue drained | `{ count, success, failed, duration_ms }` |
| `auth.signed_in` | sign-in success | `{ method: "password"\|"magic"\|"oauth_google"\|... }` |
| `auth.signed_out` | sign-out | `{ everywhere: bool }` |
| `auth.refresh_failed` | token refresh fail | `{ status_code }` |
| `entitlements.changed` | hash changed | `{ from_plan, to_plan }` |
| `upsell.shown` | upgrade modal | `{ trigger: "item_cap"\|"share_cap"\|"feature_locked", required_entitlement }` |
| `upsell.clicked` | upgrade clicked | same |
| `error.unhandled` | sw catch | `{ message_truncated, stack_truncated, surface }` |
| `perf.cold_start` | sw boot to first handle | `{ ms }` |

## 5. Sampling

- All events 100% by default.
- `perf.*` and `sync.cycle` may be downsampled to 10% for high-volume users (configured server-side via flag in `/v1/health/extension`).

## 6. PII guards

- Lint rule: any new event must declare `props` as a typed schema; CI rejects schemas containing keys named `url`, `title`, `email`, `name`, `notes`, `description`.
- Runtime: telemetry serializer strips any `string` value > 200 chars and replaces with `"<truncated>"`.

## 7. Crash reports

- Uncaught SW errors → `error.unhandled` with truncated message+stack (max 1 KB total).
- No source-map symbolication client-side; server resolves with bundled sourcemaps (private upload at release).

## 8. Diagnostics export (user-initiated)

Options page "Send debug report" button:
- Compiles the last 200 sync log entries + last 50 telemetry events + storage snapshot (no tokens) into a JSON blob.
- User reviews in a textarea; one-click "Send to support" attaches to a support ticket; or "Copy" to share manually.

## 9. Compliance

- Telemetry is described in the privacy policy (see `19-security-privacy/privacy-policy.md`).
- Toggle reflected in CWS "Privacy practices" form.
- We honor "Do Not Track" implicitly: opt-out by default in EU/UK/CH; opt-in elsewhere is OK per CWS rules but we still default to opt-OUT for new installs everywhere starting with v1.4 (decided to be safer than sorry).

> Update to § 6 of `00-overview/01-vision.md`: telemetry default is **opt-out everywhere from v1.4**, even outside EU. Earlier drafts said opt-in for EU only.
