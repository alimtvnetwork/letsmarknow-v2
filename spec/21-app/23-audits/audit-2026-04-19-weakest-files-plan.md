<!--
audit-date: 2026-04-19
next-audit-by: 2027-04-19
audit-type: ad-hoc
status: closed
closed-on: 2026-04-29
closed-because: Weak-file remediation complete; all targeted files now ≥40 lines per folder-overview lint.
-->
# Hand-off Readiness — Rewrite Plan for Top-5 Weakest Folders

> **Date:** 2026-04-19 (UTC+8)
> **Source ranking:** `gap-analysis.md` §4 (per-folder readiness scorecard, Raw-chat column = truest "self-contained" measure).
> **Status of round 1:** `15-visualization/` rewrite complete (this round). 4 folders remain in plan form below.

---

## 1. Ranking (by Raw-chat score, ascending — lowest first)

| Rank | Folder | Lov | Cur | **Raw** | Status |
|---|---|---|---|---|---|
| 1 | `15-visualization` | 45 | 55 | **25** | ✅ **Rewritten** this round (all 6 files + readme) |
| 2 | `04-extension` | 70 | 85 | **45** | 📝 plan below |
| 3 | `12-history-undo` | 70 | 75 | **50** | 📝 plan below |
| 4 | `05-web-app` | 75 | 85 | **60** | 📝 plan below |
| 5 | `11-import-export` | 78 | 88 | **60** | 📝 plan below |

(Tied at Raw=60 — `11-import-export` is already partially closed by M12 dedup file, so `05-web-app` ranks higher need.)

---

## 2. What changed in `15-visualization/` (this round)

Each of the 7 files (readme + 6 view files) gained:

1. **Folder-wide canon section** in readme (§C1–C13) — data shape, `view_mode` storage, API surface, items payload, realtime channels, selection state, virtualization, animation, breakpoints, entitlement gates, copy-string keys, error codes, telemetry namespace.
2. **Cross-references resolved** — every "see X" now points to a specific file + section.
3. **Orphan ADR removed** — `15-visualization-engine.md` reference replaced by inline decision (D3-force vs Cytoscape) in `04-mindmap-view.md` §4.
4. **Stale references fixed** — `/rt` WebSocket → Supabase Realtime channels per F-M06; ULID → UUIDv7 per Core memory rule.
5. **Entitlement keys named explicitly** per `10-licensing-billing/02-entitlements-engine.md` (`view.list.extra_columns`, `view.grid.size_xl`, `view.mindmap.access`, `view.column.wip_limit`, etc.).
6. **Copy-string keys enumerated** in §15 of each file (`view.list.empty.headline`, `view.column.starter.hint`, etc.) — references `06-ui-ux/17-copy-strings.md`.
7. **Error codes named** per `03-api-endpoints/18-error-codes.md` (`BILLING_QUOTA_EXCEEDED`, `CONFLICT`, `VALIDATION_FAILED`).
8. **Cron schedule UTC-explicit** for column auto-archive (`02:30 UTC`) per F-M20.
9. **Phase markers added** — mind-map view marked **P3** per `20-roadmap/04-phase-3-mindmap-ai.md`; rest P0/P1.

**Estimated new score:** Lovable 75 (+30), Cursor 90 (+35), Raw chat 65 (+40).

---

## 3. Plan for `04-extension/` (rank 2, raw=45)

**Files:** 15 files (`01-manifest.md` through `15-dev-loop.md`).

**Why weak:** raw chat can't see the extension build context; many files reference Chrome MV3 APIs without enumerating which permissions / hosts / lifecycle hooks. `03-service-worker.md` is dense but assumes reader knows MV3 SW lifecycle.

**Rewrite scope (estimated):**
- Add a `00-canon.md` (or expand readme) with: MV3 manifest values that propagate (permissions, host_permissions, web_accessible_resources, version), CSP literal, OAuth flow per `09-auth-accounts/12-oauth-clients.md` (Chrome Identity API specifics), `chrome.storage.local` schema, IndexedDB store names (locked: `lmn-cache`).
- Cross-ref every shortcut to `06-ui-ux/08-keyboard-input.md` §3.
- Replace bespoke `wss://` realtime references with Supabase Realtime per F-M06 (already partially done in `06-realtime-presence.md`).
- Enumerate every message type sent between popup ↔ SW ↔ content script with payload shape (currently scattered across `12-messaging.md`).
- Lock the build artifact name (`lmn-<version>.zip`) and its location per `15-dev-loop.md`.
- Add cross-ref to `22-infrastructure/03-env-vars.md` for `EXT_*` env vars (already exists).

**Estimated new score:** Lovable 78 (+8), Cursor 92 (+7), Raw 65 (+20).

**Effort:** ~15 file edits, mostly cross-ref injection + 2 net-new sections in `01-manifest.md` and `03-service-worker.md`.

---

## 4. Plan for `12-history-undo/` (rank 3, raw=50)

**Files:** 4 files (readme + 3 content).

**Why weak:** the spec is internally consistent and detailed but uses `/rt` WebSocket terminology pre-F-M06 reconciliation. Also still says "ULIDs" in `02-undo-redo.md` line 48 (Core rule says UUIDv7).

**Rewrite scope:**
- `02-undo-redo.md` line 48: replace "optimistic IDs (ULIDs)" → "optimistic IDs (UUIDv7)".
- `03-conflict-resolution.md` line 18: replace "Each client connects to `/rt` WebSocket per Org" → "Each client connects to a Supabase Realtime channel per `08-sharing-collab/14-realtime-transport.md` §2 (`org:{org_id}`)".
- `01-event-log.md` line 167: replace "Clients subscribe via WebSocket (`/rt`)" → same Supabase Realtime cross-ref.
- Add §0 "Canon" to readme listing all referenced specs (events ↔ telemetry ↔ realtime ↔ entitlements).
- Cross-ref every `kind` in §4 of `01-event-log.md` to where it's emitted in feature spec files (e.g. `item.moved` → `15-visualization/05-tabextend-column-view.md` §4).
- Document `correlation_id` ID format explicitly: UUIDv7.

**Estimated new score:** Lovable 80 (+10), Cursor 88 (+13), Raw 70 (+20).

**Effort:** small — ~4 targeted line-replaces + 1 readme expansion.

---

## 5. Plan for `05-web-app/` (rank 4, raw=60)

**Files:** 16 files (`01-routes.md` through `16-seo.md`).

**Why weak:** large folder; many files reference UI components / pages without binding to the data they fetch. Several reference `WebSocket` generically (W-2 from spec-wide audit) without saying which channel.

**Rewrite scope:**
- Add a `00-canon.md` listing: routing library (TanStack Router locked), data-fetching library (TanStack Query), state library (Zustand for app-shell, TanStack Query for server cache), realtime client (Supabase Realtime per `08-sharing-collab/14-realtime-transport.md`).
- Replace 8 generic "WebSocket" references with channel names (per W-2 in `audit-2026-04-19-spec-wide.md`).
- Pricing references in `08-billing-page.md` already canonized via W-3 fix path; verify post-fix.
- Bind each page in `01-routes.md` to the API endpoints that hydrate it (currently routes named but API contracts not cross-linked).
- `10-activity-feed.md`: change `?limit=50` → `?page_size=50` per W-13.
- Add `15-pwa.md` cross-ref to `04-extension/10-sync-and-offline.md` for the IndexedDB cache strategy parity.

**Estimated new score:** Lovable 85 (+10), Cursor 92 (+7), Raw 75 (+15).

**Effort:** medium — ~12 file edits, mostly cross-ref additions + 1 new canon file.

---

## 6. Plan for `11-import-export/` (rank 5, raw=60)

**Files:** 11 files (`01-formats.md` through `11-dedup-algorithm.md`).

**Why weak:** importer files describe per-format mapping but don't all cross-ref the dedup algorithm (M12) and the storage layout for staging files. Email-in (`08-email-in.md`) doesn't cross-ref the inbound mail provider env vars.

**Rewrite scope:**
- Each importer file in `02-importers.md` gains a §X.dedup row pointing to `11-dedup-algorithm.md` §X (the relevant matcher stage).
- `04-export-pipeline.md` §6 (delivery): cross-ref `22-infrastructure/11-email-provider.md` §3 for the `share.exported` template.
- `06-large-imports.md`: cross-ref `22-infrastructure/07-queues.md` for the queue-name (`imports`) and retry policy.
- `08-email-in.md`: cross-ref Postmark inbound config in `22-infrastructure/11-email-provider.md` §3 (needs adding to env-vars file too: `POSTMARK_INBOUND_DOMAIN`).
- `09-gdpr-export.md`: cross-ref `19-security-privacy/04-gdpr-ccpa.md` for the legal-side spec.
- `10-migration-out.md`: cross-ref `02-data-model/` per-entity files for the JSON shape.

**Estimated new score:** Lovable 85 (+7), Cursor 92 (+4), Raw 72 (+12).

**Effort:** small-medium — ~14 cross-ref additions, no new files.

---

## 7. Aggregate impact (if all 5 plans executed)

| Target AI | Current weighted avg | After all 5 rewrites | Δ |
|---|---|---|---|
| Lovable | ~91% | **~94%** | +3 |
| Cursor / IDE | ~95% | **~97%** | +2 |
| Raw chat | ~70% | **~78%** | +8 |

Raw chat gains the most because the rewrites add cross-references that an in-IDE AI would discover by file-search, but a pure-chat AI can't.

---

## 8. Recommended order

1. **`12-history-undo`** — smallest, highest leverage (4 files, fixes ULID + `/rt` drift that affects 3 other folders downstream).
2. **`05-web-app`** — fixes 8 ambient "WebSocket" references that span the codebase.
3. **`04-extension`** — biggest absolute gain for raw-chat (no codebase to ground in).
4. **`11-import-export`** — last because it's already partially closed.

---

## 9. Cross-refs

- Source ranking: `gap-analysis.md` §4
- Triage rubric: `audit-2026-04-19-decisions-needed.md` §1
- Memory: `mem://features/gap-analysis-state.md` v6
- Spec-wide audit (overlapping concerns): `audit-2026-04-19-spec-wide.md`
