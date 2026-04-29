# Canonical Event Taxonomy

> **This is the single source of truth for every analytics/telemetry event emitted by any LMN client or server.** All other spec files that mention events MUST reference this file by event name. Adding a new event = PR against this file first.

---

## 1. Conventions

### Naming
- **Format:** `domain.subject.verb` or `domain.verb` — dot-namespaced, lowercase, snake_case segments.
- **Stability:** event names are PUBLIC API. Renames require a deprecation cycle (emit both for ≥ 1 release).
- **Domains:** `extension`, `web`, `save`, `quickfind`, `search`, `item`, `collection`, `group`, `space`, `tag`, `share`, `member`, `org`, `auth`, `entitlements`, `upsell`, `sync`, `offline`, `import`, `export`, `billing`, `share_analytics`, `history`, `next`, `error`, `perf`, `system`.

### Envelope (every event)
```json
{
  "name": "string (this catalog)",
  "ts": "ISO-8601",
  "session_id": "UUIDv7",
  "props": { ... per event schema ... }
}
```
Plus client envelope (`name`, `version`, `browser`, `platform`, `locale`) added by transport — see `04-extension/14-analytics-telemetry.md §3` and `18-analytics-telemetry/01-opt-in-analytics.md`.

### Props rules
- All values are scalars (`string` ≤ 200 chars, `number`, `bool`) or short string arrays.
- **Forbidden keys** (CI-enforced): `url`, `title`, `email`, `name`, `notes`, `description`, `query`, `password`, `token`, `ip`.
- Free-text fields → send only `length`, `has_operators`, `word_count`.
- IDs (`item_id`, `collection_id`, etc.) are allowed (opaque UUIDv7, no PII).

### Sampling defaults
- Product events: 100%.
- `perf.*`, `sync.cycle`, `history.*`: 10% (server-flag overridable).
- `share.viewed`: 100% but bot-filtered before counting.

### Retention
Raw 90 d • Aggregated 2 y (per `18-analytics-telemetry/readme.md`).

---

## 2. Master event catalog

Legend — **Owner** = feature spec file that defines the trigger. **Surface** = where it fires. **Sample** = sampling rate.

### 2.1 Extension lifecycle

| Event | When fires | Props schema | Owner | Surface | Sample |
|---|---|---|---|---|---|
| `extension.installed` | `chrome.runtime.onInstalled` reason=install | `{}` | `04-extension/03-service-worker.md` | ext-sw | 100% |
| `extension.updated` | onInstalled reason=update | `{ from_version: string, to_version: string, migrations_run: number, duration_ms: number }` | `04-extension/13-update-and-rollout.md` | ext-sw | 100% |
| `extension.opened_popup` | popup root mounts | `{ trigger: "icon"\|"shortcut"\|"omnibox" }` | `04-extension/04-popup.md` | ext-popup | 100% |
| `extension.opened_newtab` | new-tab root mounts | `{}` | `04-extension/05-new-tab.md` | ext-newtab | 100% |
| `extension.opened_sidepanel` | sidepanel root mounts | `{}` | `04-extension/02-surfaces.md` | ext-sidepanel | 100% |
| `extension.shortcut_used` | `commands.onCommand` | `{ command: string, latency_ms: number }` | `04-extension/08-keyboard-shortcuts.md` | ext-sw | 100% |
| `extension.context_menu_used` | `contextMenus.onClicked` | `{ item: "save-link"\|"save-page"\|"save-image"\|"save-selection" }` | `04-extension/07-context-menu.md` | ext-sw | 100% |
| `extension.omnibox_used` | `omnibox.onInputEntered` | `{ query_length: number, chosen_index: number, latency_first_render_ms: number, latency_server_ms: number }` | `04-extension/06-omnibox.md` | ext-sw | 100% |

### 2.2 Web app lifecycle

| Event | When fires | Props schema | Owner | Surface | Sample |
|---|---|---|---|---|---|
| `web.app_loaded` | first meaningful paint after auth | `{ route: string, ttfb_ms: number, lcp_ms: number, cold: bool }` | `05-web-app/02-shell.md` | web | 10% |
| `web.route_changed` | client-side nav | `{ from_route: string, to_route: string, duration_ms: number }` | `05-web-app/01-routes.md` | web | 10% |
| `web.command_palette_opened` | `Cmd/Ctrl+K` | `{ trigger: "shortcut"\|"button" }` | `07-features/13-command-palette.md` | web | 100% |
| `web.command_palette_action` | command run | `{ command_id: string, latency_ms: number }` | `07-features/13-command-palette.md` | web | 100% |
| `web.view_mode_changed` | list/grid/compact/mindmap toggle | `{ from: string, to: string, scope: "collection"\|"space"\|"search" }` | `15-visualization/readme.md` | web | 100% |
| `web.resize_section` | resizable handle drag end | `{ section: "sidebar"\|"detail-pane", new_pct: number }` | `15-visualization/06-resizable-sections.md` | web | 10% |

### 2.3 Save flow

| Event | When fires | Props schema | Owner | Surface | Sample |
|---|---|---|---|---|---|
| `save.tab` | single-tab save success | `{ destination_kind: "collection"\|"group"\|"inbox", had_tags: bool, had_notes: bool, latency_ms: number, source: "popup"\|"shortcut"\|"context_menu"\|"omnibox"\|"web" }` | `07-features/01-save-tab.md` | ext+web | 100% |
| `save.session` | multi-tab session save success | `{ tabs_input: number, tabs_saved: number, tabs_skipped: number, dedupe_on: bool, close_after: bool, latency_ms: number }` | `07-features/02-save-session.md` | ext | 100% |
| `save.failed` | save error path | `{ source: string, error_code: string, latency_ms: number }` | `07-features/01-save-tab.md` | ext+web | 100% |
| `save.duplicate_detected` | URL already exists in destination | `{ action_taken: "skipped"\|"saved_anyway"\|"updated", source: string }` | `11-import-export/05-mapping-and-dedup.md` | ext+web | 100% |

### 2.4 Search & navigation

| Event | When fires | Props schema | Owner | Surface | Sample |
|---|---|---|---|---|---|
| `quickfind.used` | quick-find result chosen | `{ result_count: number, chosen_index: number, latency_ms: number }` | `07-features/03-quick-find.md` | ext+web | 100% |
| `search.used` | full search executed | `{ result_count: number, filters_count: number, has_operators: bool, query_length: number, latency_ms: number }` | `14-search/01-global-search.md` | web | 100% |
| `search.filter_changed` | filter chip toggled | `{ filter_type: string, action: "added"\|"removed" }` | `14-search/04-filters.md` | web | 100% |
| `search.no_results` | 0 results returned | `{ filters_count: number, query_length: number }` | `14-search/01-global-search.md` | web | 100% |
| `item.opened` | item opened from any surface | `{ source: "popup"\|"newtab"\|"sidepanel"\|"omnibox"\|"web"\|"share", action: "new_tab"\|"jumped"\|"new_window"\|"preview" }` | `07-features/09-hover-to-jump.md` | all | 100% |

### 2.5 CRUD & bulk

| Event | When fires | Props schema | Owner | Surface | Sample |
|---|---|---|---|---|---|
| `item.created` | item insert (non-save flow) | `{ source: string, has_tags: bool }` | `02-data-model/05-item.md` | web+api | 100% |
| `item.updated` | any item field change | `{ field: string, source: string }` | `02-data-model/05-item.md` | all | 100% |
| `item.moved` | item changed Collection/Group | `{ same_collection: bool, same_group: bool }` | `12-history-undo/01-event-log.md` | web | 100% |
| `item.tagged` | tag added to item | `{ tag_count_after: number }` | `07-features/06-tags.md` | web | 100% |
| `item.starred` | star toggle on | `{}` | `07-features/11-starring-and-pinning.md` | web | 100% |
| `item.pinned` | pin toggle on | `{}` | `07-features/11-starring-and-pinning.md` | web | 100% |
| `item.trashed` | soft delete | `{ source: string, bulk: bool }` | `07-features/16-delete-with-undo.md` | all | 100% |
| `item.restored` | restored from trash | `{ source: "trash"\|"undo"\|"history" }` | `05-web-app/09-trash.md` | web | 100% |
| `item.deleted` | hard delete after grace OR DSR | `{ reason: "retention"\|"dsr"\|"manual_purge" }` | `07-features/16-delete-with-undo.md` | server | 100% |
| `bulk.action` | bulk operation committed | `{ operation: "move"\|"tag"\|"untag"\|"delete"\|"archive"\|"export", item_count: number, latency_ms: number }` | `07-features/10-bulk-operations.md` | web | 100% |
| `collection.created` | collection insert | `{ from_template: bool }` | `02-data-model/03-collection.md` | web | 100% |
| `collection.shared` | first share created on collection | `{ mode: "public"\|"password"\|"invite" }` | `08-sharing-collab/01-share-model.md` | web | 100% |
| `group.created` | group insert | `{}` | `07-features/05-groups.md` | web | 100% |
| `space.created` | space insert | `{}` | `02-data-model/02-space.md` | web | 100% |
| `tag.created` | tag insert | `{ source: "inline"\|"manage" }` | `07-features/06-tags.md` | web | 100% |
| `tag.merged` | tags merged | `{ items_affected: number }` | `02-data-model/06-tag.md` | web | 100% |
| `undo.used` | undo button/shortcut fired | `{ event_type_undone: string, age_ms: number }` | `12-history-undo/02-undo-redo.md` | all | 100% |
| `redo.used` | redo fired | `{ event_type_redone: string }` | `12-history-undo/02-undo-redo.md` | all | 100% |

### 2.6 Sharing & collaboration

| Event | When fires | Props schema | Owner | Surface | Sample |
|---|---|---|---|---|---|
| `share.created` | share row inserted | `{ mode: "public"\|"password"\|"invite", target_type: "collection"\|"space", with_expiry: bool }` | `08-sharing-collab/01-share-model.md` | web | 100% |
| `share.updated` | share settings changed | `{ field: string }` | `02-data-model/07-share.md` | web | 100% |
| `share.revoked` | share killed | `{ reason: "manual"\|"expiry"\|"plan_downgrade" }` | `08-sharing-collab/12-revocation-and-expiry.md` | web+server | 100% |
| `share.viewed` | viewer hit share endpoint | `{ share_id: string, mode: string, country: string, device_class: "mobile"\|"tablet"\|"desktop", is_bot: bool, dnt: bool }` | `08-sharing-collab/11-share-analytics.md` | server | 100% (bot-filtered before count) |
| `share.password_attempt` | unlock attempt | `{ share_id: string, success: bool }` | `08-sharing-collab/03-password-shares.md` | server | 100% |
| `share.reaction_added` | emoji reaction | `{ share_id: string, emoji: string }` | `08-sharing-collab/07-comments-and-reactions.md` | viewer | 100% |
| `share.comment_posted` | comment inserted | `{ share_id: string, length: number }` | `08-sharing-collab/07-comments-and-reactions.md` | viewer | 100% |
| `share_analytics.viewed` | owner opens share dashboard | `{ share_id: string }` | `08-sharing-collab/11-share-analytics.md` | web | 100% |
| `share_analytics.exported` | CSV export | `{ row_count: number }` | `08-sharing-collab/11-share-analytics.md` | web | 100% |
| `share_analytics.range_changed` | time range changed | `{ days: number }` | `08-sharing-collab/11-share-analytics.md` | web | 100% |

### 2.7 Members & org

| Event | When fires | Props schema | Owner | Surface | Sample |
|---|---|---|---|---|---|
| `member.invited` | invite sent | `{ role: string, channel: "email"\|"link" }` | `05-web-app/07-member-management.md` | web | 100% |
| `member.joined` | invite accepted | `{ role: string, latency_since_invite_ms: number }` | `09-auth-accounts/07-org-membership.md` | web | 100% |
| `member.role_changed` | role updated | `{ from_role: string, to_role: string }` | `17-admin-org/03-roles.md` | web | 100% |
| `member.removed` | member ejected | `{ role_was: string, by_self: bool }` | `17-admin-org/02-members-management.md` | web | 100% |
| `org.created` | org insert | `{ during_onboarding: bool }` | `02-data-model/01-organization.md` | web | 100% |
| `org.renamed` | org name change | `{}` | `17-admin-org/01-organization-settings.md` | web | 100% |
| `org.deleted` | org soft-deleted | `{ member_count: number }` | `17-admin-org/05-data-export-delete.md` | web | 100% |

### 2.8 Auth

| Event | When fires | Props schema | Owner | Surface | Sample |
|---|---|---|---|---|---|
| `auth.signed_up` | account created | `{ method: "password"\|"magic"\|"oauth_google"\|"oauth_apple"\|"sso" }` | `09-auth-accounts/02-signup-and-signin.md` | web+ext | 100% |
| `auth.signed_in` | sign-in success | `{ method: string }` | `09-auth-accounts/02-signup-and-signin.md` | web+ext | 100% |
| `auth.signed_out` | sign-out | `{ everywhere: bool }` | `09-auth-accounts/06-sessions.md` | web+ext | 100% |
| `auth.refresh_failed` | token refresh failed | `{ status_code: number }` | `04-extension/11-auth-bridge.md` | ext+web | 100% |
| `auth.mfa_enrolled` | MFA factor added | `{ factor: "totp"\|"webauthn"\|"sms" }` | `09-auth-accounts/03-passwords-and-mfa.md` | web | 100% |
| `auth.mfa_challenged` | MFA prompt shown | `{ factor: string, success: bool }` | `09-auth-accounts/03-passwords-and-mfa.md` | web | 100% |
| `auth.password_reset_requested` | forgot-password submit | `{}` | `09-auth-accounts/02-signup-and-signin.md` | web | 100% |
| `auth.email_verified` | verification link clicked | `{ latency_since_signup_ms: number }` | `09-auth-accounts/09-email-verification.md` | web | 100% |

### 2.9 Entitlements & billing

| Event | When fires | Props schema | Owner | Surface | Sample |
|---|---|---|---|---|---|
| `entitlements.changed` | entitlements hash diff | `{ from_plan: string, to_plan: string }` | `10-licensing-billing/02-entitlements-engine.md` | server | 100% |
| `upsell.shown` | upgrade modal/banner displayed | `{ trigger: "item_cap"\|"share_cap"\|"feature_locked"\|"trial_ending", required_entitlement: string, surface: string }` | `10-licensing-billing/01-plans-matrix.md` | all | 100% |
| `upsell.clicked` | upgrade CTA clicked | `{ trigger: string, required_entitlement: string, surface: string }` | `10-licensing-billing/01-plans-matrix.md` | all | 100% |
| `billing.checkout_started` | Stripe/Paddle checkout opened | `{ provider: "stripe"\|"paddle", plan: string, period: "monthly"\|"yearly"\|"lifetime", currency: string }` | `10-licensing-billing/03-stripe-integration.md` | web | 100% |
| `billing.checkout_completed` | webhook received | `{ provider: string, plan: string, amount_cents: number, currency: string }` | `10-licensing-billing/12-billing-webhooks.md` | server | 100% |
| `billing.subscription_canceled` | cancel webhook | `{ provider: string, plan: string, reason: string }` | `10-licensing-billing/13-cancellations-and-refunds.md` | server | 100% |
| `billing.refund_issued` | refund processed | `{ provider: string, amount_cents: number, currency: string }` | `10-licensing-billing/13-cancellations-and-refunds.md` | server | 100% |
| `billing.dunning_email_sent` | recovery mail | `{ attempt: number }` | `10-licensing-billing/09-dunning-and-recovery.md` | server | 100% |
| `license.redeemed` | lifetime license key applied | `{ source: string }` | `10-licensing-billing/05-lifetime-licenses.md` | web | 100% |

### 2.10 Sync & offline

| Event | When fires | Props schema | Owner | Surface | Sample |
|---|---|---|---|---|---|
| `sync.cycle` | every pull cycle complete | `{ pulled: number, pushed: number, failed: number, duration_ms: number }` | `04-extension/10-sync-and-offline.md` | ext | 10% |
| `sync.conflict` | 409 STALE | `{ entity_type: string, resolved_via: "auto"\|"keep_mine"\|"use_theirs" }` | `12-history-undo/03-conflict-resolution.md` | ext+web | 100% |
| `offline.queued` | mutation queued offline | `{ op: string, queue_size: number }` | `04-extension/10-sync-and-offline.md` | ext | 100% |
| `offline.flushed` | queue drained | `{ count: number, success: number, failed: number, duration_ms: number }` | `04-extension/10-sync-and-offline.md` | ext | 100% |

### 2.11 Import / export

| Event | When fires | Props schema | Owner | Surface | Sample |
|---|---|---|---|---|---|
| `import.started` | import job accepted | `{ source: "html"\|"json"\|"csv"\|"raindrop"\|"pocket"\|"pinboard"\|"chrome"\|"firefox", file_size_bytes: number }` | `11-import-export/02-importers.md` | web+server | 100% |
| `import.committed` | import success | `{ source: string, items_imported: number, collections_created: number, duration_ms: number }` | `11-import-export/03-import-pipeline.md` | server | 100% |
| `import.failed` | import error | `{ source: string, error_code: string, items_processed: number }` | `11-import-export/03-import-pipeline.md` | server | 100% |
| `export.requested` | user clicks export | `{ format: "json"\|"csv"\|"html"\|"gdpr", scope: "org"\|"space"\|"collection" }` | `11-import-export/04-export-pipeline.md` | web | 100% |
| `export.delivered` | export ready | `{ format: string, size_bytes: number, duration_ms: number }` | `11-import-export/04-export-pipeline.md` | server | 100% |

### 2.12 History (meta)

| Event | When fires | Props schema | Owner | Surface | Sample |
|---|---|---|---|---|---|
| `history.event_appended` | any history insert | `{ kind: string }` | `12-history-undo/01-event-log.md` | server | 0.1% |
| `history.read` | history API call | `{ scope: "org"\|"item"\|"collection", count: number, latency_ms: number }` | `12-history-undo/01-event-log.md` | server | 10% |
| `history.retention_purge` | retention job | `{ org_id: string, events_purged: number }` | `12-history-undo/01-event-log.md` | server | 100% |
| `history.outbox_lag_ms` | outbox monitor | `{ p95: number }` | `12-history-undo/01-event-log.md` | server | 100% |

### 2.13 Errors & performance

| Event | When fires | Props schema | Owner | Surface | Sample |
|---|---|---|---|---|---|
| `error.unhandled` | uncaught exception | `{ message_truncated: string, stack_truncated: string, surface: "ext-sw"\|"ext-popup"\|"ext-newtab"\|"web"\|"viewer", route: string }` | `18-analytics-telemetry/02-error-reporting.md` | all | 100% |
| `error.api` | API call returned 5xx | `{ endpoint_template: string, status_code: number, latency_ms: number }` | `03-api-endpoints/01-conventions.md` | all | 100% |
| `perf.cold_start` | SW boot → first handle | `{ ms: number }` | `04-extension/03-service-worker.md` | ext | 10% |
| `perf.first_render` | popup/newtab first paint | `{ surface: string, ms: number }` | `04-extension/04-popup.md` | ext | 10% |
| `perf.dashboard_lcp` | web dashboard LCP | `{ ms: number }` | `05-web-app/03-dashboard.md` | web | 10% |
| `perf.search_latency` | search round-trip | `{ ms: number, result_count: number }` | `14-search/01-global-search.md` | web | 10% |

### 2.14 System / server-only

| Event | When fires | Props schema | Owner | Surface | Sample |
|---|---|---|---|---|---|
| `system.entitlement_changed` | server-side plan/entitlement diff | `{ org_id: string, from_plan: string, to_plan: string, reason: string }` | `10-licensing-billing/02-entitlements-engine.md` | server | 100% |
| `system.cron_run` | cron job execution | `{ job_name: string, duration_ms: number, success: bool }` | `22-infrastructure/08-cron.md` | server | 100% |
| `system.queue_drain_lag` | queue lag monitor | `{ queue: string, lag_ms_p95: number }` | `22-infrastructure/07-queues.md` | server | 100% |
| `system.webhook_received` | inbound webhook | `{ provider: string, event_type: string, signature_valid: bool }` | `10-licensing-billing/12-billing-webhooks.md` | server | 100% |

### 2.15 Next (focused to-do queue)

> Per `07-features/17-next-queue.md §13`. All `next.*` events are scoped to the
> per-Account Next singleton; no `org_id` prop is emitted (Next is per-Account
> by lock, not per-Org).

| Event | When fires | Props schema | Owner | Surface | Sample |
|---|---|---|---|---|---|
| `next.item.added` | "Add to Next" succeeds (any of the 8 entry points) | `{ source_kind: "hover_toolbar"\|"popup_save"\|"item_menu"\|"keyboard"\|"command_palette"\|"drag"\|"api"\|"import", source_collection_id?: string, position_index: number, queue_size_after: number, was_already_done: bool }` | `07-features/17-next-queue.md` | ext, web | 100% |
| `next.item.opened` | user activates a Next row (click / Enter / middle-click) | `{ open_target: "current_tab"\|"new_tab"\|"new_window", is_tombstone: bool, age_seconds: number, position_index: number }` | `07-features/17-next-queue.md` | ext, web | 100% |
| `next.item.done` | done flag toggled true OR false | `{ to_done: bool, age_seconds: number, position_index: number, queue_size_after: number }` | `07-features/17-next-queue.md` | ext, web | 100% |
| `next.item.removed` | row removed from Next (post-undo-window) | `{ was_done: bool, age_seconds: number, queue_size_after: number, removal_reason: "user"\|"source_purged"\|"clear_completed" }` | `07-features/17-next-queue.md` | ext, web | 100% |
| `next.item.reordered` | drag or `Alt+↑`/`Alt+↓` commits new position | `{ from_index: number, to_index: number, queue_size: number, method: "drag"\|"keyboard" }` | `07-features/17-next-queue.md` | ext, web | 100% |
| `next.popup.opened` | extension popup's Next tab becomes visible | `{ queue_size: number, done_count: number, surface: "popup"\|"newtab", trigger: "tab_switch"\|"deep_link"\|"keyboard" }` | `04-extension/04-popup.md §14` | ext | 100% |

---

## 3. Schema validation

- Per-event JSON Schemas live at `schemas/events/<event_name>.schema.json` (one file per row).
- CI step `validate-events`:
  1. Lints this file's tables for shape correctness.
  2. Verifies every event referenced in code/spec is listed here.
  3. Verifies forbidden prop keys (§ 1) are absent from every schema.
  4. Verifies `Owner` file paths exist.

## 4. Adding a new event — checklist

1. Add row to the appropriate sub-table in § 2.
2. Create `schemas/events/<name>.schema.json`.
3. Reference event by exact name in the owning feature spec.
4. Update extension catalog in `04-extension/14-analytics-telemetry.md` if extension-emitted (cross-reference, not duplicate).
5. PR review requires sign-off from telemetry owner.

## 5. Deprecation

- Mark event `[DEPRECATED in vX.Y, remove in vX.Z]` in its row.
- Keep emitting for ≥ 1 minor release.
- Remove the row + schema in the removal release; add to `CHANGELOG.md`.

## 6. Cross-references

- Transport, batching, opt-out: `04-extension/14-analytics-telemetry.md`, `18-analytics-telemetry/01-opt-in-analytics.md`.
- Error reporting pipeline: `18-analytics-telemetry/02-error-reporting.md`.
- Privacy posture: `19-security-privacy/04-gdpr-ccpa.md`.
- History event taxonomy (DB-side mutations, distinct from analytics): `12-history-undo/01-event-log.md §4`.
- Share-viewer analytics specifics: `08-sharing-collab/11-share-analytics.md`.
