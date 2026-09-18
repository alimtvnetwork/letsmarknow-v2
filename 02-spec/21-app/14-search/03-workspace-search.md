# Workspace Search

Cross-Org search for Accounts that belong to multiple Organizations.

---

## 1. When it matters

- A consultant in 4 client Orgs.
- Personal Org + a Team Org at work + a side-project Org.
- A migrated user with archived legacy Org + active new Org.

Without cross-Org search, users would have to switch Orgs to find a thing they know exists "somewhere".

## 2. Activation

- Default off (privacy + perf).
- Toggle in `/settings/search`: "Search across all my Orgs".
- Per-search override: a chip in Cmd+K labeled "All Orgs"; toggleable per query.

## 3. Scope rules

- Includes: every Org where Account has `status=active` Member row AND role ≥ Viewer.
- Excludes: Orgs where Account is suspended, removed, or pending invite.
- Excludes: archived/deleted Orgs unless explicitly viewing the trash.

## 4. Result decoration

Each result row gets an Org badge:
- Avatar + name of the Org.
- Color-coded per Org (user-customizable).
- Hover shows Org full name + role.
- Click on badge: switch to that Org filtered to the result's Collection.

## 5. Permissions

- Server-side filter by membership at request time.
- Items returned only if Member's role permits read on the containing Collection.
- Shared-out items not duplicated; counted once per Org.

## 6. Aggregation

- Server fans out to per-Org search; merges; ranks.
- Per-Org timeout 200 ms; slow Orgs excluded silently with subtle "(N Orgs unsearched)" hint.
- Ranking applies a per-Org recency boost (Orgs visited recently rank higher).

## 7. Performance

- p95 < 500 ms across up to 10 Orgs.
- Beyond 10 Orgs: parallelism capped; user sees streaming results (server-sent).
- Local cache: per-Org index in IndexedDB; cross-Org search joins them client-side first; server fills gaps.

## 8. Privacy

- Cross-Org search queries logged per-Org (so each Org's audit log shows its own slice).
- The Account-side log shows aggregated query without Org-specific detail.
- Org Owners can disable cross-Org search inclusion for their Org (Team+; security-conscious orgs may want this).

## 9. UI specifics

- Cmd+K modal: "All Orgs" chip top-right.
- When on: Org badges visible; results grouped by Org with collapse.
- Collapsed groups show "View all in <Org>" → switches Org.
- Empty Org panel suppressed unless 0 total results.

## 10. Saved cross-Org searches

- Pro+ Accounts can save a cross-Org search as a personal smart Collection.
- Visible only to that Account; never shared.
- Re-evaluated on each open.

## 11. Telemetry

- `workspace_search.toggled` `{ on }`
- `workspace_search.queried` `{ orgs_searched, orgs_excluded_by_owner }`
- `workspace_search.org_excluded_timeout` `{ org_id }` (server-side only; not sent to client)
- `workspace_search.org_badge_clicked` `{ target_org }`

## 12. Edge cases

| Case | Behavior |
|---|---|
| Account has 50+ Orgs | Top 10 by recency searched in foreground; rest in background; results streamed |
| Org bans cross-Org search | Excluded silently from results; Account NOT told which Org refused (privacy) |
| Item belongs to two Orgs (impossible by data model, but defensively) | Treated as separate items |
| User loses Member role mid-query | Excluded from response; UI updates on next refresh |
| Plan downgrade: cross-Org capability lost | Saved searches retained as data; can't re-run; CTA to upgrade |

## 13. Tests

- Membership filtering correctness.
- Per-Org timeout handling.
- Streamed results rendering.
- Org-disable enforcement.
- Aggregated ranking determinism.
- Saved cross-Org search persistence.
