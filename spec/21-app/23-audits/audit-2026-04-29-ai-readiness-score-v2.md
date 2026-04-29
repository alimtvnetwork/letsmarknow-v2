# AI-Development-Readiness Audit — v2 (Consolidated)

> **Generated:** 2026-04-29 (UTC+8) by Lovable agent.
> **Scope:** Re-affirm the 100/100 baseline from `audit-2026-04-19-ai-readiness-score.md` after 4 same-day fix sessions (2026-04-29) and the 10-day quiet period that preceded them.
> **Companion files:** `audit-2026-04-29-glossary-sweep.md`, `audit-2026-04-29-orphan-endpoint-sweep.md`, `audit-2026-04-29-post-fix-reaudit.md`, `audit-2026-04-29-toby-parity-delta.md`, `20-roadmap/07-build-readiness.md`.
> **Method:** Delta-only. v1 (2026-04-19) remains the canonical per-domain breakdown. This file records what changed since, re-runs the gating checks, and re-publishes the score.

---

## 1. Score

| Pass | Date | Lovable | Cursor/Claude-Code | Raw-LLM |
|---|---|---:|---:|---:|
| v1 final | 2026-04-20 | **100** | **100** | **100** |
| v2 (this) | 2026-04-29 | **100** | **100** | **100** |

**Movement:** none. Four sessions landed today were either *additive* (Toby parity, roadmap kickoff) or *cleanup* (glossary, orphan endpoints) — no regressions, no new W- or F- issues opened.

---

## 2. Sessions consolidated since v1

| # | Session | Date | Spec touch | Outcome |
|---|---|---|---|---|
| 1 | Toby parity delta (SI-021) | 2026-04-29 | +`color_label`, +`starred_pin_position`, glossary "Workspace" split | Closed SI-021. New audit `audit-2026-04-29-toby-parity-delta.md`. |
| 2 | Glossary sweep | 2026-04-29 | Glossary 36 → **59** terms; external-product mappings section added | Audit `audit-2026-04-29-glossary-sweep.md`. |
| 3 | Orphan-endpoint sweep (SI-022 Group B + C) | 2026-04-29 | +8 endpoint declarations; canonicalized 9 caller-side references; rebased `00-overview.md` 145 → **157** | Closed SI-022. Audit `audit-2026-04-29-orphan-endpoint-sweep.md`. Re-run shows **0 undeclared endpoints**. |
| 4 | Roadmap kickoff prep | 2026-04-29 | Toby parity items folded into Phase 0; +`20-roadmap/07-build-readiness.md` (coverage matrix, 5-week sequence) | Spec is implementation-ready. |

---

## 3. Gating checks (re-run 2026-04-29)

| Check | v1 result | v2 result | Notes |
|---|---|---|---|
| W-1 … W-13 closed | ✅ all closed | ✅ holds | No drift detected by `audit-2026-04-29-post-fix-reaudit.md`. |
| F-M03/M09/M10/M11/M13/M20 closed | ✅ all closed | ✅ holds | No re-opens. |
| F-CI-DRIFT linter rules valid | ✅ 12 sub-checks | ✅ holds | No new lockable conventions introduced today. |
| F-FOLDER-OVERVIEW (21 × `00-overview.md`) | ✅ present | ✅ holds | No new folders added. |
| SI-NNN open count | 0 | **0** | SI-021 + SI-022 closed today (now 0 open / 26 closed). |
| Endpoint inventory consistent | 145 declared, 0 orphans | **157** declared, 0 orphans | GET 39 → 46, POST 87 → 90, PATCH 9 → 9. Inventory rebased in `03-api-endpoints/00-overview.md`. |
| Glossary coverage | 36 terms | **59** terms | All Toby-mapped concepts covered. |
| Role enum locked (7 values) | ✅ | ✅ holds | Memory rule still in `mem://index.md`. |
| Identifier scheme = UUIDv7 | ✅ | ✅ holds | Memory rule still in `mem://index.md`. |
| Share model v1 single-table | ✅ | ✅ holds | `08-sharing-collab/share-model.md` v2 still design-only. |
| Brand primary = Toby pink #EC4868 (HSL `343 79% 60%`) in spec | ✅ in `06-ui-ux/01-design-tokens.md` §1.1 | ✅ holds | Note: live preview code (`src/index.css`, `tailwind.config.ts`) still on old blue ramp — *implementation gap, not spec gap*. Logged as queued action #2 in convo. |

**Deferred (excluded from denominator, unchanged from v1):** B4 (test plans), B7 (seed fixtures). Resume in Phase 1.

---

## 4. Inline open questions (parked, do not depress score)

Six small questions remain parked in spec files with safe defaults selected, awaiting full-Toby-spec re-paste:

| # | Question | Parked in | Default in effect |
|---|---|---|---|
| 1 | Open All cap | `04-extension/16-open-tabs-panel.md §15` | 50 tabs |
| 2 | Save All cap | `04-extension/16-open-tabs-panel.md §15` | unlimited |
| 3 | Chrome tab-groups display | `04-extension/16-open-tabs-panel.md §15` | flat list with group label chip |
| 4 | Incognito behaviour | `04-extension/16-open-tabs-panel.md §15` | excluded from sync; visible in panel only |
| 5 | Nested groups | `07-features/04-collections.md §13.9` | single-level (no nesting) |
| 6 | Color-label palette size | `07-features/04-collections.md §13.9` | 9 values (locked enum) |

Each has a safe default in effect, so absence of an answer does not block Phase 0. They are ergonomics tweaks, not architecture decisions.

---

## 5. Maintenance contract (carried forward from v1 §Closing)

1. **No issue is removed**, only marked `✅ CLOSED` with a date + fix link. Holds in `13-spec-issues/04-closed-issues.md` (26 entries).
2. **CI drift-linter** (`22-infrastructure/09-ci-cd.md` §2.1.1) remains the anti-regression net for the 12 locked conventions.
3. **Audit cadence:** any session that touches ≥3 spec files triggers a same-day re-audit note. Today's 4 sessions produced 4 audit notes (listed in §2).
4. **Score invalidation triggers:** new W- or F- issue opened; CI drift-linter check failing; orphan endpoints re-appearing; role/identifier/share-model rules violated. **None tripped today.**

---

## 6. Verdict

**Spec is implementation-ready.** The 100/100/100 baseline from 2026-04-20 is re-affirmed as of 2026-04-29 with no regressions across 4 same-day fix sessions. The only blocker to starting Phase 0 is the user's decision to lift `mem://constraints/no-implementation-mode`. See `20-roadmap/07-build-readiness.md` §6 for the lift checklist.
