# 07 — Build Readiness Summary

> **Purpose.** Single-page snapshot proving the spec corpus is implementation-ready before any code is written. Generated 2026-04-29 after SI-022 closure (score 100/100, 0 open spec issues).

---

## 1. Corpus state

| Dimension | Count | Source |
|---|---|---|
| Domain folders | 22 (`00-` … `20-` + `22-` + `23-`; `21-` is permanent buffer per `13-spec-issues/01-naming-conventions.md` §2) | `readme.md` |
| Total spec files | 187 `.md` | filesystem scan |
| Glossary terms | 59 | `00-overview/02-glossary.md` |
| Data-model entities | 11 (Org, Space, Collection, Group, Item, Tag, Share, Member, HistoryEvent, License, Account) | `02-data-model/` |
| API endpoints (declared) | **157** (GET 46 · POST 90 · PATCH 9 · PUT 1 · DELETE 11) | `03-api-endpoints/00-overview.md` §7 |
| API endpoints (referenced, undeclared) | **0** | `23-audits/audit-2026-04-29-orphan-endpoint-sweep.md` §8 |
| Open spec issues | 0 | `13-spec-issues/02-current-issues.md` |
| Closed spec issues | 26 | `13-spec-issues/04-closed-issues.md` |
| AI-readiness score | 100 / 100 | `23-audits/audit-2026-04-19-ai-readiness-score.md` |

## 2. Locked decisions (cannot drift in build phase)

The following are normative and any code MUST conform:

- **Identifiers:** UUIDv7 everywhere. Never ULID. (`mem://index.md` Core)
- **Role enum:** `owner, admin, editor, viewer, billing, guest, system`. New roles require glossary + `02-data-model/08-member.md` update in same PR.
- **Share model:** v1 = single-table per `02-data-model/07-share.md`. `08-sharing-collab/01-share-model.md` is a v2 design note **only**.
- **Folder slot 21:** permanent intentional buffer between domain (`00-`–`20-`) and meta (`22-`, `23-`).
- **Brand `--primary`:** Toby pink `#EC4868` / HSL `343 79% 60%`. Defined in `06-ui-ux/01-design-tokens.md` §1.1. Never hard-code.
- **Toby Workspace mapping:** SPLIT — Workspace-as-collection-container = our **Space**; Workspace-as-admin-surface = our **Organization**. Never collapse.
- **Item color label enum:** `none, red, orange, yellow, green, teal, blue, purple, pink`. Hex via `--color-label-*` tokens.
- **Path-param style:** `:name` (never `{name}`) per `03-api-endpoints/01-conventions.md` §1.1.
- **Endpoint aliases:** §16 of conventions is canonical; 17 forbidden→canonical mappings + 3 grep guards.
- **Withdrawn endpoints:** marked `~~WITHDRAWN: METHOD /v1/path~~` per §9 (do not implement).
- **Lifecycle verbs:** closed vocabulary — Create, Rename, Move, Duplicate, Archive, Restore, Soft-delete, Purge, Merge, Split (`00-overview/02-glossary.md`).

## 3. Phase-0 MVP — what's specced and ready

Spec coverage for every Phase-0 deliverable in `01-phase-0-mvp.md` §1:

| Deliverable | Spec lives in | Endpoints exist? |
|---|---|---|
| Account & Org signup/signin | `09-auth-accounts/02-signup-and-signin.md` | ✅ §2.1 |
| Data model (Org→Space→Collection→Group→Item+Tag) | `02-data-model/01-…07-` | ✅ §1.4–§1.5, §2.4–§2.7 |
| Web app shell | `05-web-app/02-shell.md` | n/a |
| List + Compact view | `../15-visualization/01-list-view.md`, `../15-visualization/03-compact-view.md` | ✅ filter via `/v1/items?...` |
| Quick-save (web form, popup, context menu) | `../04-extension/04-popup.md`, `../04-extension/07-context-menu.md`, `../04-extension/09-save-session.md` | ✅ `POST /v1/items` |
| Cmd+K global search | `14-search/01-global-search.md` | ✅ `/v1/search`, `/v1/search/quick` |
| Basic CRUD all entities | `03-api-endpoints/04-…09-` | ✅ all sections |
| Drag-and-drop within/between Collections | `07-features/04-collections.md` §13.3 | ✅ `POST /v1/items/:id/move`, `/reorder` |
| Star-pin Collections | `02-data-model/03-collection.md` (`starred_pin_position`) | ✅ via `PATCH /v1/collections/:id` |
| Item color labels | `02-data-model/05-item.md` (`color_label`) | ✅ via `PATCH /v1/items/:id` |
| Open Tabs panel (extension) | `04-extension/16-open-tabs-panel.md` | ✅ `POST /v1/sessions/save` (Save All) |
| Trash + 30-day soft delete | `05-web-app/09-trash.md`, `12-history-undo/` | ✅ `/v1/trash`, `/v1/trash/restore` |
| History event log (read-only) | `12-history-undo/01-event-log.md` | ✅ `GET /v1/history` |

**Result:** every Phase-0 deliverable has both a feature spec AND a declared endpoint. **Zero gaps.**

## 4. Inline open questions parked for full Toby spec re-paste

These are **not** spec defects — they are design choices deferred until the user re-pastes the truncated Toby reference (the original was cut at ~25 k chars). Each has a stub answer that won't block Phase-0 build:

| # | File | Section | Question | Default if not answered |
|---|---|---|---|---|
| 1 | `07-features/04-collections.md` | §13.9 | Open All — cap at how many tabs? | 50 (browser perf safe) |
| 2 | `07-features/04-collections.md` | §13.9 | Nested Groups — allowed depth? | 1 (Group cannot contain Group) |
| 3 | `07-features/04-collections.md` | §13.9 | Color label palette size — extend to 16? | 9 (locked enum) |
| 4 | `04-extension/16-open-tabs-panel.md` | §15 | Save All — cap at how many tabs? | 100 (matches Save Session limit) |
| 5 | `04-extension/16-open-tabs-panel.md` | §15 | Display Chrome tab groups in panel? | No (flat list in v1) |
| 6 | `04-extension/16-open-tabs-panel.md` | §15 | Incognito windows — show in panel? | No (`incognito: split` mode in `manifest`) |

Build can proceed using defaults; user override lands as a spec patch.

## 5. Recommended build sequencing (within Phase 0)

Built in 5 weeks of an 8-week sprint, leaving 3 weeks for QA/telemetry/migration prep:

1. **Week 1 — Foundations:** Lovable Cloud setup (auth, DB, storage, edge functions). Schema migration for all 11 entities. RLS policies + `has_role()` per `mem://user-roles`. CI/CD per `22-infrastructure/09-ci-cd.md`.
2. **Week 2 — Auth + shell:** Signup/signin/MFA, web app shell, Org bootstrap on first signin.
3. **Week 3 — CRUD + List view:** Spaces/Collections/Groups/Items/Tags endpoints + List view UI + drag-drop.
4. **Week 4 — Save loop:** Extension popup, context menu, Open Tabs panel, web "Save URL" form.
5. **Week 5 — Search + history + trash:** Global search, history event log viewer, trash UI, color labels + star-pin.

## 6. What blocks lifting `no-implementation-mode`

The `mem://constraints/no-implementation-mode.md` constraint is permanent by default. To lift it the user must explicitly say so. This file documents that the **spec side has no remaining blockers** — only a user decision is left.

## 7. Cross-references

- **Roadmap entry:** `00-overview.md`
- **Phase 0 deliverables:** `01-phase-0-mvp.md`
- **Definition of Done:** `06-definition-of-done.md`
- **Spec issue tracker:** `../13-spec-issues/02-current-issues.md`
- **Latest audit:** `../23-audits/audit-2026-04-29-orphan-endpoint-sweep.md`
- **AI readiness score:** `../23-audits/audit-2026-04-19-ai-readiness-score.md`
