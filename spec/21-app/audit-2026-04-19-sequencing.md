# Sequencing Audit — `spec/21-app/`

> **Date:** 2026-04-19 (UTC+8)
> **Scope:** Cross-folder dependency ordering against the locked phase plan in `20-roadmap/01-phase-0-mvp.md` … `05-phase-4-cross-browser.md`.
> **Looking for:** features that depend on other features not yet specced, P0 items requiring P1+ infra, P1 items requiring P2+ infra, circular references, missing per-feature phase markers.
> **Method:** grep sweep of every `*.md` for phase markers + cross-folder references + dependency keywords; manual reconciliation against the four phase scope-tables.

---

## 0. Executive verdict

| Category | Count | Severity | Status |
|---|---|---|---|
| 🔴 Hard sequencing breaks (P0 spec demands P1+ infra to function) | **3** | | ✅ **All resolved 2026-04-19** |
| 🟠 Soft sequencing leaks (P1 spec assumes P2 realtime; degrades cleanly) | **4** | | open |
| 🟡 Missing phase markers on shipped features | **2** | | open |
| 🟢 Forward-spec done correctly (data-model > feature, OAuth deferred) | **3** | | n/a |
| ⚪ Circular references | **0** | | n/a |

**Total findings: 9** (3 hard ✅ closed, 4 soft, 2 missing markers).
**Cycles:** none detected (clean DAG of cross-refs).

**Resolution log (2026-04-19, hard breaks):**
- **S-1** closed by `15-visualization/06-resizable-sections.md` §3, §10 — split into P0 (local + `BroadcastChannel`) vs P2 (cross-device realtime, flag-gated).
- **S-2** closed by `15-visualization/readme.md` §C5 (rewritten to "Cache invalidation P0 vs realtime P2") + propagated to `01-list-view.md` §13 + `03-compact-view.md` §11 + test rows.
- **S-3** closed by `20-roadmap/02-phase-1-v1.md` §9 (cron pipeline added as explicit P1 deliverable) + `15-visualization/05-tabextend-column-view.md` §5 (now references `22-infrastructure/08-cron.md` and the new P1 deliverable).

---

## 1. 🔴 Hard sequencing breaks

### S-1 — `15-visualization/06-resizable-sections.md` requires realtime sync (P2) for cross-device pane sizes

**Files:** `15-visualization/06-resizable-sections.md` §3, §10
**Phase:** file is P0 (resizable panes are in P0 scope per `20-roadmap/01-phase-0-mvp.md` §1).

**Issue:** the spec mandates "Synced across devices via realtime channel `account:{account_id}` per `08-sharing-collab/14-realtime-transport.md` §2." Supabase Realtime infra is **Phase 2** per `20-roadmap/03-phase-2-collab.md` §4 ("Real-time transport: WebSocket fleet … per `08-sharing-collab/06-realtime-presence.md`").

**Impact:** A P0 implementer reading this file will think they need realtime infra to ship resizable panes. They don't — local persist + load-on-page-load is fine for P0 (single-device anyway since multi-device sync UX is P4).

**Fix:** Tag the cross-device sync paragraphs as **"P2 enhancement"**. P0 reads from `account.preferences.layout` on page load; PATCHes on debounce; no live channel.

---

### S-2 — P0 view files reference `08-sharing-collab/14-realtime-transport.md` for "realtime invalidation"

**Files:**
- `15-visualization/01-list-view.md` §13 row "Realtime delete arrives while row focused"
- `15-visualization/02-grid-view.md` §C5 (folder canon, but propagated)
- `15-visualization/03-compact-view.md` §11 row "Realtime delete arrives mid-edit"
- `15-visualization/readme.md` §C5 ("Realtime invalidation")

**Phase:** these views are P0 (List + Compact) and P1 (Grid). Realtime transport is **P2** per phase plan.

**Issue:** The §C5 canon says "Item / Collection mutations broadcast on the realtime channels per `08-sharing-collab/14-realtime-transport.md` §2." A P0 implementer is single-user single-device; no broadcast happens because no other client exists. The handler code is harmless if dead, but the **spec wording implies infra dependency** on a P2 system.

**Impact:** Confuses phasing; risks pulling Supabase Realtime client SDK forward to P0 just to satisfy the spec.

**Fix:** Reword §C5 as: "**P0**: tab-local invalidation via TanStack Query refetch on window focus. **P2**: cross-tab/cross-device realtime invalidation via the channels in `08-sharing-collab/14-realtime-transport.md` §2." Apply same pattern to the row-level edge-case rows.

---

### S-3 — `15-visualization/05-tabextend-column-view.md` (P1) auto-archive cron requires P2-style infra not yet listed in P0/P1 deliverables

**File:** `15-visualization/05-tabextend-column-view.md` §5 ("Auto-archive (Pro+) … cron job per `22-infrastructure/12-storage-layout.md` §5: `auto_archive_columns` runs daily at 02:30 UTC").

**Phase:** column view ships in P1. The Pro entitlement `view.column.auto_archive` requires:
- Cron infra (`22-infrastructure/08-cron.md`) — exists as a spec but **not in P0 or P1 deliverables checklist** (P0 §10 has no cron item; P1 §9 has no cron item).
- Entitlements engine (`10-licensing-billing/02-entitlements-engine.md`) — Pro tier launches in P1 ✓ so this is fine.

**Issue:** Auto-archive depends on the cron pipeline. The pipeline is *specced* but not *scheduled* in any phase deliverables list. So the file demands infra that no phase has officially booked.

**Fix (one of):**
1. Add "Cron pipeline operational (per `22-infrastructure/08-cron.md`)" to `20-roadmap/02-phase-1-v1.md` §9 deliverables checklist (auto-archive needs it; so do dunning per `09-dunning-and-recovery.md` and import retries per `06-large-imports.md`).
2. Or downgrade auto-archive to **P2 enhancement** in the column-view file (rest of column view ships P1; auto-archive lights up P2).

Option 1 recommended — cron infra is small and unblocks 3+ features.

---

## 2. 🟠 Soft sequencing leaks

### S-4 — `15-visualization/05-tabextend-column-view.md` (P1) references Supabase Realtime channels for column drag sync

**File:** `15-visualization/05-tabextend-column-view.md` §12 ("Realtime — Per `08-sharing-collab/14-realtime-transport.md` §2 (Supabase Realtime — locked transport): Subscribe to `collection:{collection_id}` channel.")

**Phase:** Column view = P1; Realtime = P2.

**Why soft:** drag-and-drop column moves work fine without realtime in P1 (single-user, single-tab). The realtime layer is genuinely an enhancement when teams arrive in P2.

**Fix:** Tag §12 as "P2 enhancement". P1 ships with optimistic local-only; P2 adds the channel subscription.

---

### S-5 — `15-visualization/04-mindmap-view.md` (P3) references entitlements + bulk operations + share model

**File:** `15-visualization/04-mindmap-view.md` §7 ("Sharable read-only with team via the standard share model `02-data-model/07-share.md` (scope: `mindmap_layout`).")

**Phase:** mind-map = P3; share model is data-model (foundational); sharing UX/feature = P2; bulk ops = P3 per phase 3 §1 "Bulk operations with progress + undo" and §1 "Hover-to-jump preview for items in mind-map and grid".

**Why soft:** all dependencies will exist by P3 (P2 is complete by then). The mind-map file references them legitimately.

**Fix:** None required — this is correct forward-cohabitation. **Document in the P3 deliverables that `02-data-model/07-share.md` must already include the `mindmap_layout` scope by P2.** Add line to `02-data-model/07-share.md` §scope-types listing.

---

### S-6 — `12-history-undo/01-event-log.md` (P0) emits `share.*` and `member.*` events before sharing/members ship

**File inferred from cross-refs:** `12-history-undo/01-event-log.md` §4 enumerates event kinds including `share.created`, `member.invited`, `comment.added`.

**Phase:** event log = P0 (per `20-roadmap/01-phase-0-mvp.md` §1 "History event log (read-only viewer; no Undo UI yet)"). `share.*` events = P2; `member.*` events = P2; `comment.*` = P2.

**Why soft:** the event-log table can hold the kinds; emitter code only ships when the feature ships. The catalog is forward-spec ✓ (correct pattern, like data-model).

**Fix:** Add a header to `12-history-undo/01-event-log.md` §4: "**Event-kind catalog is forward-spec.** Emitters ship in the phase that ships the feature. Phase column on each row indicates first emission."

---

### S-7 — `09-auth-accounts/07-org-membership.md` (P1) describes invite/role flows but P0 is "single personal Org"

**File:** `09-auth-accounts/07-org-membership.md` §2 (Invite flow), §65 (Domain-restricted invites).

**Phase:** P0 = "single personal Org, MFA optional"; multi-Org switcher = P1; full Team membership UX = P2.

**Why soft:** the file describes the canonical model; it doesn't claim P0 ships invites. Multi-Org switcher in P1 enables Free → 1 Org cap; Team plan in P2 enables seat invites. The order is fine.

**Fix:** Add explicit phase markers per section: §1-3 = P1 (account creates extra Orgs); §4 (bulk invite via CSV), §5 (domain-restricted) = P2.

---

## 3. 🟡 Missing phase markers

### S-8 — None of the 16 files in `07-features/` declare a phase

**Folder:** `07-features/` (16 files: `01-save-tab.md` … `16-delete-with-undo.md`).

**Issue:** `07-features/readme.md` §locked-rules says "Every feature lists its **entitlement gate** (Free / Pro / Team / Lifetime tier)." It does **not** say "Every feature lists its phase." Yet phase is implicit and varies wildly:
- `01-save-tab.md` → P0
- `02-save-session.md` → P1
- `03-quick-find.md` → P0 (Cmd+K basic) but operators are P1
- `04-collections.md` → P0
- `05-groups.md` → P0
- `06-tags.md` → P1 (per phase-1 plan §1.organize)
- `07-notes-and-descriptions.md` → P1 (CRDT bodies = P2)
- `08-view-modes.md` → P0 (list+compact) / P1 (grid+column) / P3 (mindmap)
- `09-hover-to-jump.md` → P3 per phase-3 §1
- `10-bulk-operations.md` → P3
- `11-starring-and-pinning.md` → P1
- `12-embeds-and-previews.md` → Pro feature, ships P1
- `13-command-palette.md` → P0 (basic) / P1 (operators)
- `14-extensions-os-integrations.md` → P1 (omnibox/sidepanel) / P4 (Raycast/Alfred/CLI)
- `15-feature-flags-and-rollouts.md` → P0 (foundational)
- `16-delete-with-undo.md` → P0 (Trash) / P1 (undo toast UI per phase-1 §1)

**Fix:** Add a `> **Phase:** P0 | P1 | P2 | P3 | P4` line under each file's H1, OR add a phase column to the table in `07-features/readme.md`. The latter is faster.

---

### S-9 — `15-visualization/readme.md` table column "Phase" exists but other folders don't have it

**File:** `15-visualization/readme.md` §Files (added in this session).

**Issue:** The 15-visualization rewrite added a Phase column (P0/P1/P3). Other folders' readmes (`07-features`, `09-auth-accounts`, `08-sharing-collab`, `11-import-export`) have similar tables without Phase. Inconsistent.

**Fix:** Roll out the Phase column to the other 6 folder readmes in a follow-up pass.

---

## 4. 🟢 Forward-spec done correctly (no action)

These look like sequencing breaks but are deliberate, locked patterns.

### S-10 — `02-data-model/07-share.md` exists in spec; sharing feature is P2

✅ Correct. Locked rule: data-model is foundational and ahead of features. Tables exist; UX ships when ready. Same pattern for `06-tag.md`, `10-license.md`.

### S-11 — `09-auth-accounts/12-oauth-clients.md` lists GitHub as P1, SAML as P2

✅ Reconciled this week (F-M14, 2026-04-19). Provider listing UI hides P1 rows in P0 per locked rule §8.5.

### S-12 — `08-sharing-collab/14-realtime-transport.md` notes Y.js as "❌ Phase 0" with Phase-3 upgrade path

✅ Correct. Decision logged in §1 and §11 of that file.

---

## 5. ⚪ Circular references — none

A grep across all `*.md` for cross-folder `XX-*/` references produced a strict DAG:

- `02-data-model/` → no outbound refs to other folders ✓ (foundational).
- `03-api-endpoints/` → refs `02-data-model/` only ✓.
- `06-ui-ux/` → refs `02-data-model/`, `03-api-endpoints/` only ✓.
- `15-visualization/` → refs `02-data-model/`, `03-api-endpoints/`, `06-ui-ux/`, `08-sharing-collab/14-realtime-transport.md`, `12-history-undo/`, `10-licensing-billing/`, `18-analytics-telemetry/`, `22-infrastructure/`, `20-roadmap/` — all downstream / utility ✓.
- `07-features/` → refs `02-data-model/`, `03-api-endpoints/`, `15-visualization/` ✓.
- `08-sharing-collab/` → refs `02-data-model/`, `09-auth-accounts/`, `12-history-undo/` — but `12-history-undo` does NOT ref back into `08-sharing-collab` for behavior (only catalog event names) ✓.
- `12-history-undo/` → refs `02-data-model/`, `03-api-endpoints/` ✓.
- `22-infrastructure/` → refs only utility-level files ✓.

**No cycles.**

---

## 6. Cross-cutting: P0 ↔ P1 ↔ P2 boundary stress test

| P0 deliverable (per `20-roadmap/01-phase-0-mvp.md` §10) | Cross-folder dependency | OK? |
|---|---|---|
| Auth + Org single-tenant | `09-auth-accounts/01-identity-model.md`, `12-oauth-clients.md` (Google+Apple only in P0) | ✅ |
| Data model + RLS | `02-data-model/*` | ✅ |
| Web shell + List + Compact views | `15-visualization/01-list-view.md`, `03-compact-view.md`, `06-resizable-sections.md` | ⚠️ S-1, S-2 |
| Cmd+K search (basic) | `14-search/01-global-search.md`, `06-search-engine.md` (basic Postgres tsvector) | ✅ |
| Extension popup + context menu | `04-extension/04-popup.md`, `07-context-menu.md`, `11-auth-bridge.md` | ✅ |
| Quick-save flows | `07-features/01-save-tab.md`, `03-api-endpoints/08-items.md` | ✅ |
| Trash + soft delete | `05-web-app/09-trash.md`, `02-data-model/05-item.md` (`trashed_at` column) | ✅ |
| History log (read-only) | `12-history-undo/01-event-log.md` | ⚠️ S-6 (forward-spec OK; just label it) |
| Bookmarks HTML importer | `11-import-export/02-importers.md`, `03-import-pipeline.md` | ✅ |
| CI/CD + envs | `22-infrastructure/02-environments.md`, `09-ci-cd.md` | ✅ |
| Sentry + PostHog | `18-analytics-telemetry/01-opt-in-analytics.md`, `02-error-reporting.md` | ✅ |

| P1 deliverable | Cross-folder dependency | OK? |
|---|---|---|
| Grid + Column views | `15-visualization/02-grid-view.md`, `05-tabextend-column-view.md` | ⚠️ S-3 (auto-archive cron), S-4 (realtime) |
| Save Session | `07-features/02-save-session.md`, `03-api-endpoints/12-sessions-save.md` | ✅ |
| Side panel + Omnibox | `04-extension/05-new-tab.md`, `06-omnibox.md` | ✅ |
| Search operators | `14-search/04-filters.md` | ✅ |
| Tags + Star + Pin + Archive | `07-features/06-tags.md`, `11-starring-and-pinning.md` | ✅ |
| Multi-Org switcher | `09-auth-accounts/07-org-membership.md` §1 | ⚠️ S-7 (label sub-sections) |
| Email verification + password reset | `09-auth-accounts/03-passwords-and-mfa.md`, `09-email-verification.md` | ✅ |
| Pricing page + Stripe/Paddle live | `10-licensing-billing/03-stripe-integration.md`, `04-paddle-integration.md` | ✅ |
| Lifetime SKU | `10-licensing-billing/05-lifetime-licenses.md`, `15-sku-map.md` | ✅ |
| Themes (light + dark + accents) | `06-ui-ux/02-theming.md` | ✅ |
| In-app updates feed | `16-notifications-updates/01-in-app-updates-feed.md` | ✅ |
| GDPR/CCPA flows | `19-security-privacy/04-gdpr-ccpa.md`, `11-import-export/09-gdpr-export.md` | ✅ |
| Importers (7 sources) | `11-import-export/02-importers.md` | ✅ |

---

## 7. Recommended fix order

Smallest leverage-per-edit first:

1. **S-8** — add Phase column to `07-features/readme.md` table (1 file, 1 minute).
2. **S-6** — add "Event-kind catalog is forward-spec" header to `12-history-undo/01-event-log.md` §4 (1 file, 30 sec).
3. **S-9** — add Phase column to 6 other folder readmes (6 files, 5 min).
4. **S-1, S-2** — tag P0 view files' realtime sections as "P2 enhancement" (4 files, 10 min).
5. **S-7** — add per-section phase markers to `09-auth-accounts/07-org-membership.md` (1 file, 5 min).
6. **S-3** — add cron pipeline to `20-roadmap/02-phase-1-v1.md` §9 deliverables checklist (1 file, 1 min).
7. **S-4** — tag column-view §12 as "P2 enhancement" (1 file, 1 min).
8. **S-5** — add `mindmap_layout` to `02-data-model/07-share.md` scope-types list (1 file, 1 min).

Total ~30 minutes; all spec-only; no code.

---

## 8. Decisions deferred to owner

None. All findings are AI-resolvable propagation of already-locked phase boundaries from `20-roadmap/`.

---

## 9. Cross-references

- Phase canon: `20-roadmap/01-phase-0-mvp.md`, `02-phase-1-v1.md`, `03-phase-2-collab.md`, `04-phase-3-mindmap-ai.md`, `05-phase-4-cross-browser.md`
- Realtime locked transport (referenced as future infra): `08-sharing-collab/14-realtime-transport.md`
- Cron infra (under-booked): `22-infrastructure/08-cron.md`
- Event log forward-spec pattern: `12-history-undo/01-event-log.md`
- Visualization rewrite (this week): `audit-2026-04-19-weakest-files-plan.md`
- Spec-wide audit (other dimension): `audit-2026-04-19-spec-wide.md`
- M-gap audit (closed): `audit-2026-04-19-m-gaps.md`
