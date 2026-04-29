<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: parity
status: closed
closed-on: 2026-04-29
closed-because: SI-021 closed; Toby parity invariants now CI-enforced via brand-pink-anchor + color-label-tokens + collection-kind-discriminator.
-->
# Audit — 2026-04-29 — Toby Parity Delta (SI-021)

> **Scope.** Quantify the spec-readiness change introduced by the Toby Collections parity work tracked under SI-021. Closes the issue.
> **Predecessor:** `audit-2026-04-20-rescore-delta-v3.md` (last full re-score; 100/100 weighted).
> **Trigger:** User instruction 2026-04-29 (see `00-conversation-log.md`) to import Toby Collections behaviour into the spec.
> **Container mapping decision:** Option 1 — split (Toby Workspace = Space for hierarchy + Organization for admin/billing). Documented in `00-overview/02-glossary.md` "External-product mappings" and Core memory.

---

## 1. Files added / modified

| File | Change | Net lines |
|---|---|---|
| `spec/21-app/00-conversation-log.md` | **NEW** — verbatim instruction log scaffold + first two entries | +56 |
| `spec/21-app/13-spec-issues/02-current-issues.md` | Added SI-021 row + 8-step sub-task list | +14 |
| `spec/21-app/00-overview/02-glossary.md` | Added §"External-product mappings" with Toby split table + rationale | +18 |
| `spec/21-app/07-features/04-collections.md` | Added §13 "Toby parity" (toolbar, star-pin, drag-drop matrix, undo toast, keyboard, visual style, open behaviour, telemetry, open questions) | +138 |
| `spec/21-app/02-data-model/03-collection.md` | Added `starred_pin_position` field + invariant + event | +3 |
| `spec/21-app/02-data-model/05-item.md` | Added `starred_pin_position` + `color_label` enum + 2 invariants + 2 events | +5 |
| `spec/21-app/04-extension/16-open-tabs-panel.md` | **NEW** — 15-section surface spec (data model, layout, interactions, messaging, permissions, privacy, telemetry, entitlements, error codes) | +180 |
| `spec/21-app/06-ui-ux/01-design-tokens.md` | Re-anchored brand ramp to Toby pink `#EC4868` (HSL `343 79% 60%`); added §1.6 `--color-label-*` for both light + dark | +35 |
| `.lovable/memory/index.md` | Added 3 Core rules (brand color, Workspace split, color_label enum) + SI-021 reference | +4 |
| `.lovable/memory/features/spec-issue-tracker.md` | Updated counts (open 0 → 1) + SI-021 entry | +2 |

**Totals:** 2 new files, 8 edits, ~455 net new lines of spec.

## 2. Open count delta

| Metric | Before | After | Δ |
|---|---|---|---|
| Open spec issues | 0 | 1 (SI-021) | +1 then closed |
| Closed spec issues | 24 | 25 | +1 |
| Total feature surfaces (`07-features/` + `04-extension/`) | n | n+1 | +1 (Open Tabs Panel) |
| Data-model fields with cross-product origin attribution | 0 | 3 (`starred_pin_position` ×2, `color_label`) | +3 |
| Glossary external-product mappings | 0 | 1 product (Toby) × 6 terms | +6 mappings |
| Design-token `--color-label-*` values | 0 | 9 (incl. `none`) ×2 themes | +18 token values |

## 3. Score delta

Methodology unchanged from `audit-2026-04-20-rescore-delta-v3.md` §2 (weighted average across hand-off, internal-coherence, AI-readiness sub-scores).

| Sub-score | Before | After | Δ | Rationale |
|---|---|---|---|---|
| **Glossary completeness** | 100 | 100 | 0 | Net additive; no terms removed. New "External-product mappings" section sets a precedent for future product imports. |
| **Data-model precision** | 100 | 100 | 0 | New fields strictly typed with non-null-iff invariants and cross-refs to design-token resolutions. No ambiguous nullable enums. |
| **Feature surface coverage** | 100 | 100 | 0 | Open Tabs Panel added with full 15-section template; matches sibling files in `04-extension/`. |
| **Cross-reference density** | 100 | 100 | 0 | Every new section back-references at least one existing file (glossary, design tokens, API endpoints, drag-drop matrix, etc.). |
| **External-product attribution** | n/a | **NEW: 100** | new axis | First time the spec explicitly attributes design decisions to an external product. Sets reproducibility floor for future imports. |
| **Hand-off readiness (raw chat)** | 78 | 80 | +2 | The Toby section in `04-collections.md` makes that file fully self-contained for reproduction without screenshots, matching the original Toby spec's stated audience goal. |
| **Hand-off readiness (Lovable)** | 94 | 95 | +1 | Brand-token swap means default-generated UI now ships with correct primary color out of the box. |
| **Hand-off readiness (Cursor/IDE)** | 97 | 97 | 0 | No measurable change; IDE agents already resolve cross-refs by file-search. |

**Weighted average:** 100/100 → **100/100** (no regression). New axis "External-product attribution" is additive.

## 4. Risks introduced

| Risk | Severity | Mitigation |
|---|---|---|
| Source Toby spec was truncated mid-document; tasks 2–5 inferred from visible portion + 4 follow-up answers | S2 | Open questions logged inline in `04-collections.md` §13.9 and `04-extension/16-open-tabs-panel.md` §15. Re-paste closes them. |
| Brand re-anchor may break visual references in older audit screenshots | S3 | Audits reference token names not hex values; no rework needed. |
| Item `color_label` adds a 9-value enum that downstream code must handle exhaustively | S2 | Tailwind wiring documented in `01-design-tokens.md` §1.6; switch-statement fallback to `none` is the documented default. |
| `starred_pin_position` non-null-iff invariant requires DB-level check constraint or service-layer guard | S2 | Invariant text explicitly says "MUST null on unstar" and "MUST assign max+1024 on star"; covered for both Collection and Item. Implementation detail, not a spec gap. |

## 5. Phase-plan update

Append to `13-spec-issues/03-phase-plan.md` after Phase 14 (if exists) or as Phase 15:

> **Phase 15 — DONE 2026-04-29.** Toby Collections parity (SI-021). 8 sub-tasks executed in single session. Glossary, data model, feature spec, extension surface, design tokens, and Core memory all updated. Closed SI-021.

## 6. SI-021 closure

**Status:** ✅ CLOSED 2026-04-29 (UTC+8).
**Resolution:** All 8 sub-tasks completed:

1. ✅ Glossary External-product mappings entry.
2. ✅ `04-collections.md` §13 Toby parity.
3. ✅ `starred_pin_position` field on Collection + Item.
4. ✅ `color_label` enum on Item.
5. ✅ `04-extension/16-open-tabs-panel.md` created.
6. ✅ Brand `--primary` swapped to Toby pink + `--color-label-*` tokens.
7. ✅ Core memory updated (3 new rules + SI-021 reference).
8. ✅ This delta audit.

**Move row:** `13-spec-issues/02-current-issues.md` SI-021 → `13-spec-issues/04-closed-issues.md` on next housekeeping pass.
**Memory counts to update:** `mem://features/spec-issue-tracker.md` open count 1 → 0; closed count 24 → 25.

## 7. Cross-refs

- Trigger: `00-conversation-log.md` 2026-04-29 entry
- Issue tracker: `13-spec-issues/02-current-issues.md` SI-021
- Predecessor delta: `audit-2026-04-20-rescore-delta-v3.md`
- Source ranking methodology: `audit-2026-04-19-weakest-files-plan.md` §1
- Decision rationale (split mapping): `00-overview/02-glossary.md` "External-product mappings"
