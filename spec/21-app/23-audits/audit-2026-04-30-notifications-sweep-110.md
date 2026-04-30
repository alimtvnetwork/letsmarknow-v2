<!--
audit-date: 2026-04-30
next-audit-by: 2026-10-27
audit-type: ad-hoc
status: closed
closed-on: 2026-04-30
closed-because: 3 findings opened and closed same session — NU1 (S1 02-app-updater.md §8 cited undeclared error code `UPGRADE_REQUIRED` + bare HTTP 426 → added `SYS_UPGRADE_REQUIRED` to 18-error-codes.md §3.9 with `min_client_version`/`current_version`/`surface` details, rewrote §8 to use envelope), NU2 (S2 version-floor field name drift `min_client_version` vs `min_extension_version` between updater spec and `/v1/health/extension` registry → harmonised to `min_client_version` everywhere), NU3 (S2 whats-new query contract drift `?since=ts&channel=...` in feed §6 vs registry "user locale + last-seen cursor" → registry rewritten to declare canonical `?since={iso8601}&channel={stable|beta}` and reference feed §6 as SoT). All 17 lint sub-checks green.
audit-id: 110
scope: spec/21-app/16-notifications-updates/
score-before: 100/100
score-after: 100/100
findings: 3 (all closed same session)
-->

# Audit 110 — `16-notifications-updates/` gap-sweep

## Scope

All 5 files in `spec/21-app/16-notifications-updates/` plus cross-folder dependencies (`03-api-endpoints/18-error-codes.md`, `03-api-endpoints/00-overview.md §1.15`, `03-api-endpoints/22-internal.md`, `04-extension/03-service-worker.md`, `22-infrastructure/09-ci-cd.md §2.4`).

## Method

1. Read all 5 notifications files end-to-end.
2. Walk every cited error code, HTTP status, endpoint, and field name back to its declared SoT.
3. Verify cross-folder anchors (CI/CD §2.4, sharing-collab notifications, feature flags, extension rollout) resolve.
4. Check Lovable-team-only `/admin/whats-new` route + `/v1/internal/feedback` endpoint exist in their declared homes.

## Findings

### NU1 — `UPGRADE_REQUIRED` undeclared error code (S1)

`02-app-updater.md §8` (Forced upgrade) declared:

> Server returns `426 UPGRADE_REQUIRED` with `min_client_version` header.

Two violations:
1. **Undeclared error code:** `UPGRADE_REQUIRED` is not in `03-api-endpoints/18-error-codes.md` master catalog. The `error-code-casing` linter would have caught this if the token had appeared on a line with an error-context anchor, but it appeared inside prose without backticks adjacent to `code:` / `error_code:` markers — exposing a blind spot in the linter scope (logged as future tuning idea, not a fix this session).
2. **Header vs envelope confusion:** the spec says "with `min_client_version` header" but the canonical error contract per `01-conventions.md` is a JSON envelope `{ error: { code, message, details } }` — never out-of-band headers. Bare HTTP 426 also bypasses the standard envelope.

**Fix:** Added new code `SYS_UPGRADE_REQUIRED | 426 | no | toast.sys.upgrade_required | min_client_version, current_version, surface` to `18-error-codes.md §3.9`. Rewrote `02-app-updater.md §8` to use the envelope and reference §3.9. The `426` HTTP status is preserved (semantically correct).

### NU2 — Version-floor field name drift (S2)

Two SoTs disagreed on the name of the same field:
- `02-app-updater.md §8` + §11 edge-case row: `min_client_version`.
- `03-api-endpoints/00-overview.md §1.15` `/v1/health/extension`: returns `min_extension_version`.

Same concept, two names. AI codegen would produce one name in the auth handler (which raises `SYS_UPGRADE_REQUIRED`) and the other in the SW probe handler — guaranteeing client logic has to handle both.

**Fix:** Harmonised to `min_client_version` (matches the canonical name carried in `SYS_UPGRADE_REQUIRED.details`). Updated `/v1/health/extension` row in `00-overview.md §1.15` to return `{ ok, server_time, min_client_version }`. `04-extension/03-service-worker.md §lmn.kill-switch-poll` only references the endpoint URL (no field name), so no edit needed there.

### NU3 — `/v1/whats-new` query-param contract drift (S2)

`01-in-app-updates-feed.md §6` declared `GET /v1/whats-new?since=ts&channel=stable|beta`. The endpoint registry row in `03-api-endpoints/00-overview.md §1.15` instead said "Filtered by user locale + last-seen cursor" — neither `since` nor `channel` appears, and "last-seen cursor" suggests opaque pagination cursor (different from a timestamp).

Per the locked path-stem convention (audit-106), the registry must declare query contracts that match the owning spec file.

**Fix:** Rewrote registry row to: `Query: ?since={iso8601}&channel={stable|beta} (canonical per 01-in-app-updates-feed.md §6). Server additionally applies user-locale + audience-filter narrowing per feed §7.` The feed file's audience-filter behaviour (§7) is preserved — it's server-side narrowing applied AFTER the query filters, not a query parameter.

## Non-findings (verified clean)

- `03-release-channels.md §6` reference to `POST /v1/internal/feedback` ✅ matches `03-api-endpoints/22-internal.md`.
- `00-overview.md §5` cross-refs to `09-ci-cd.md §2.4`, `15-feature-flags-and-rollouts.md`, `04-extension/13-update-and-rollout.md` ✅ all resolve.
- `00-overview.md §4` "Not collaboration notifications" pointer to `08-sharing-collab/08-notifications.md` ✅ file exists.
- `02-app-updater.md §1` Phase-4 deferral of Edge/Firefox/Brave update paths matches `00-overview/05-browser-scope.md`.
- `01-in-app-updates-feed.md §13` Lovable-team-only `/admin/whats-new` admin route is intentionally NOT in the public API registry (gated by `is_staff`); not a finding.

## Linter status after closure

All 17 sub-checks green. No allowlist additions required — new error code is properly tabulated; new audit filename allowlisted in `naming-convention.allowlist.txt`.

## Implementability scorecard (after)

| Tier | Score | Δ |
|---|---|---|
| Lovable | 100 | 0 |
| Cursor | 100 | 0 |
| Raw LLM | 100 | 0 |

Baseline preserved. Three contract-drift defects plugged, one of which (NU1) was a codegen blocker — Lovable would have invented an `UPGRADE_REQUIRED` handler with no toast key, no copy-string, and a header-based contract that conflicts with the JSON envelope canon.

## Cross-references

- `16-notifications-updates/02-app-updater.md §8` — rewritten this session.
- `03-api-endpoints/18-error-codes.md §3.9` — `SYS_UPGRADE_REQUIRED` added this session.
- `03-api-endpoints/00-overview.md §1.15` — two rows rewritten this session (health/extension + whats-new).
- `06-ui-ux/17-copy-strings.md` — `toast.sys.upgrade_required` key MUST be added when a content-author session next touches that file (P3 follow-up; not codegen-blocking because §5 of the catalog locks the process).
