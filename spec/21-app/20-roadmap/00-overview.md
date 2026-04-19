# 00 — Roadmap Folder Overview

> **Purpose.** Define **what ships when** in five phases (0 = MVP, 1 = v1, 2 = collab, 3 = mindmap + AI, 4 = cross-browser) and the **Definition of Done** that gates each phase. The roadmap is the only folder allowed to talk about *time*; every other folder is timeless and describes the end state.

---

## 1. Responsibilities

1. **Phase scoping.** Per-phase feature list with explicit *in scope* and *out of scope* lists.
2. **Phase entry criteria.** What must be true to begin a phase.
3. **Phase exit criteria (Definition of Done).** What must be true to ship a phase.
4. **Browser-scope schedule.** Phase 4 = Edge / Brave / Arc / Opera / Firefox / Safari per `00-overview/05-browser-scope.md`.
5. **Sequencing dependencies.** Which phases unblock which features (e.g., real-time presence requires Phase 2 collab infra).

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-phase-0-mvp.md` | Smallest end-to-end loop: sign in, save tab from extension, see it on dashboard. |
| `02-phase-1-v1.md` | Public release set: collections/groups/tags, sharing v1, billing v1, import/export v1. |
| `03-phase-2-collab.md` | Real-time presence, comments, reactions, audit log v2. |
| `04-phase-3-mindmap-ai.md` | Mind-map view (15-visualization P2), AI features (auto-tag, summarise). |
| `05-phase-4-cross-browser.md` | Edge, Brave, Arc, Opera, Firefox, Safari extension parity. |
| `06-definition-of-done.md` | Cross-cutting acceptance criteria for any phase: a11y, perf, security, ops, docs, telemetry, deferred items resumption (B4, B7). |

---

## 3. Tasks performed by this folder

- **Lock phase scope** so Phase 1 cannot pull in Phase 3 features without a documented decision.
- **Lock Definition of Done** so "ship" means the same thing every time.
- **Document deferred items** (B4 test plans, B7 seed fixtures) and the phase that resumes them (`06-definition-of-done.md` §2).
- **Provide the upstream order** that issue trackers and milestone planning consume.

---

## 4. What this folder is NOT

- **Not a Gantt chart.** No dates, no estimates, only ordering and gating.
- **Not an audit.** Audits live in `audit/audit-2026-04-19-*.md` files at the folder root.
- **Not a status report.** Status of in-flight work is tracked outside the spec.

---

## 5. Cross-references

- Browser scope (Phase 4 anchor): `00-overview/05-browser-scope.md`.
- Mind-map (Phase 3 anchor): `15-visualization/04-mindmap-view.md`.
- Real-time (Phase 2 anchor): `08-sharing-collab/14-realtime-transport.md`.
- Definition-of-Done a11y: `06-ui-ux/20-accessibility-wcag.md`.
- Deferred items rationale: `mem://constraints/no-implementation-mode`.
