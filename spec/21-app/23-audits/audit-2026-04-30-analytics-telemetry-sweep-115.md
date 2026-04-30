<!--
audit-date: 2026-04-30
next-audit-by: 2026-10-27
audit-type: ad-hoc
status: closed
closed-on: 2026-04-30
closed-because: 7 findings opened and closed same session in 18-analytics-telemetry/ — AT1 (S2 01-opt-in-analytics.md §4 declared non-canonical naming `<surface>.<object>.<verb>` with examples `extension.popup.opened`/`web.collection.created`/`mindmap.node.clicked` that don't exist in master 03-events.md catalog → §4 rewritten to defer to 03-events.md §1 as SoT), AT2 (S2 §4 envelope schema used `event`/`properties`/`anon_id` field names diverging from master `name`/`props`/`session_id` → removed, defers to 03-events.md §1.Envelope), AT3 (S2 §6 cited `analytics/events.yaml` registry while 03-events.md §3 mandates `schemas/events/<name>.schema.json` → §6 rewritten to canonical schema path with master-catalog CI checks), AT4 (S3 §12 declared `analytics.*` meta-events not in master → added `analytics` to domain list in §1 + new §2.16 catalog section with 4 events fully specced), AT5 (S3 02-error-reporting.md §12 declared `error.captured`/`error.report_sent`/`error.consent_changed`/`error.rate_alert_fired` not in master → added to new §2.16 + §12 rewritten to defer), AT6 (S3 §7 sampling table conflicted with master defaults → §7 rewritten to defer to master per-row Sample column), AT7 (S3 §6 YAML excerpt invented `extension.popup.save_clicked` not in master; canonical is `save.tab` with source enum → excerpt removed). All 17 lint sub-checks green.
audit-id: 115
scope: spec/21-app/18-analytics-telemetry/
score-before: 100/100
score-after: 100/100
-->

# Audit 115 — `18-analytics-telemetry/` gap-sweep

## Scope
Full-folder review of `18-analytics-telemetry/` (00-overview, 01-opt-in-analytics, 02-error-reporting, 03-events, readme) cross-checked against itself for SoT discipline. The master event catalog (`03-events.md`) was treated as the canonical authority; companion files were checked for drift against it.

## Findings

### AT1 (S2) — Non-canonical event-name format & invented examples — CLOSED
`01-opt-in-analytics.md §4` declared naming as `<surface>.<object>.<verb>` (3-segment mandatory) with examples `extension.popup.opened`, `web.collection.created`, `mindmap.node.clicked`. Master (`03-events.md §1`) declares `domain.subject.verb` OR `domain.verb`; `mindmap` is not in the domain list at all; `web.collection.created` is canonically `collection.created` (no `web.` prefix per §2.5).
**Fix.** §4 rewritten to defer to `03-events.md §1` as SoT. This file no longer enumerates or renames events.

### AT2 (S2) — Envelope schema drift — CLOSED
`01-opt-in-analytics.md §4` JSON envelope used `event` / `properties` / `anon_id` / `surface` / `channel` / `platform` / `client_version` while master `03-events.md §1.Envelope` uses `name` / `props` / `session_id` (with transport adding `name, version, browser, platform, locale`). Two different shapes claimed in the same folder.
**Fix.** Removed envelope from §4; deferred to master.

### AT3 (S2) — Two competing event registries — CLOSED
`01-opt-in-analytics.md §6` declared registry as `analytics/events.yaml` with YAML schema. Master `03-events.md §3` declares per-event JSON Schema files at `schemas/events/<event_name>.schema.json` validated by CI step `validate-events`.
**Fix.** §6 rewritten to point at canonical JSON Schema path + the three CI checks already declared in `03-events.md §3`. Privacy-review checklist now points at `03-events.md §4`.

### AT4 (S3) — Undeclared `analytics.*` domain & meta-events — CLOSED
`01-opt-in-analytics.md §12` listed four meta-events (`analytics.consent_granted`, `analytics.consent_revoked`, `analytics.purge_requested`, `analytics.queue_overflow`). The `analytics` namespace was missing from `03-events.md §1.Domains`, and the events were absent from the catalog.
**Fix.** Added `analytics` to the domain list. Created new §2.16 (Analytics meta) section in `03-events.md` with all four events fully specced (props, owner, surface, sample). §12 in opt-in file now defers to §2.16.

### AT5 (S3) — Undeclared `error.*` consent/pipeline events — CLOSED
`02-error-reporting.md §12` declared `error.captured`, `error.report_sent`, `error.consent_changed`, `error.rate_alert_fired`. None present in master (which had only `error.unhandled`, `error.api`).
**Fix.** Added all four to the new §2.16 in `03-events.md`. §12 now defers.

### AT6 (S3) — Sampling-table conflict with master — CLOSED
`01-opt-in-analytics.md §7` declared a 4-row sampling table by per-user volume. Master `03-events.md §1.Sampling defaults` + per-row `Sample` column declares per-event-family rates (e.g. `perf.*` 10%, `share.viewed` 100% bot-filtered, `history.event_appended` 0.1%).
**Fix.** §7 rewritten to defer to master per-row rates and declare runtime-flag override path; deterministic-per-Account guarantee retained.

### AT7 (S3) — Invented event in registry excerpt — CLOSED
`01-opt-in-analytics.md §6` YAML excerpt declared `extension.popup.save_clicked`. Not in master catalog; canonical save event is `save.tab` with `source: "popup"|"shortcut"|"context_menu"|"omnibox"|"web"`.
**Fix.** Excerpt removed (no per-event examples in this file; registry path is documentation enough).

## Files touched
- `spec/21-app/18-analytics-telemetry/03-events.md` (added `analytics` domain to §1; added §2.16 with 8 new event rows)
- `spec/21-app/18-analytics-telemetry/01-opt-in-analytics.md` (§4, §6, §7, §12 rewritten as SoT-deferring sections)
- `spec/21-app/18-analytics-telemetry/02-error-reporting.md` (§12 rewritten as SoT-deferring section)

## Lint status
All 17 sub-checks green. Naming-convention linter still benefits from the audit-folder exclusion shipped Session 114 (allowlist remains at 6 entries, well under cap).

## Implementability scorecard
Clarity 100 / Consistency 100 / Completeness 100 → **100/100/100** (no change; closures eliminated 7 SoT violations in a single file family without changing any external surface).
