<!--
audit-date: 2026-04-30
next-audit-by: 2026-10-26
audit-type: gap-sweep
status: in_progress (0 of 2 closed)
opened-on: 2026-04-30
scope: 06-ui-ux/ folder — readme/overview drift after SI-026 drain (sessions 45 + later)
-->

# Audit — UI/UX Sweep (Session 103)

**Date:** 2026-04-30 (Session 103, Malaysia time UTC+8)
**Author:** Lovable agent
**Scope:** 24 markdown files (~3,579 lines) in `spec/21-app/06-ui-ux/`. Cross-checked against Core memory ("Brand primary = Toby pink #EC4868", "color_label enum locked + `--color-label-*` tokens"), `13-spec-issues/04-closed-issues.md` SI-024 (toast placement) + SI-027 (W-3 pricing) + SI-028 (SI-026 drain), `01-information-architecture/` folder-overview convention.

---

## 1. Baseline strengths (no findings — verified clean)

- ✅ **HSL-only color discipline.** `rg "rgb\(|rgba\(|hsl\([0-9]"` against `06-ui-ux/` (excluding `01-design-tokens.md` and `02-theming.md`) returns **zero hits**. Brand primary `#EC4868` appears only in `01-design-tokens.md` §1.1 as the comment annotating `--brand-500: 343 79% 60%`. The single hex elsewhere (`readme.md:50`) is `#3b82f6` cited as a counter-example ("never `#3b82f6`") — correctly framed.
- ✅ **`color_label` enum-to-token resolution.** §1.6 enumerates exactly the 9 locked values (`none`, red, orange, yellow, green, teal, blue, purple, pink) as `--color-label-*` HSL tokens, matching Core memory.
- ✅ **Typography / spacing / radius / shadow / motion / z-index / icon / opacity scales.** All 11 token sections present in `01-design-tokens.md`, semantically named, no raw values leaked.
- ✅ **SI-024 toast placement** locked in `11-feedback.md §2.1` and cross-referenced from Save Session refs.
- ✅ **SI-027 W-3 pricing** drift in `14-copy-voice.md` rewritten to `{plan.price}` template tokens.
- ✅ **wireframes/ subfolder** correctly carries `readme.md` + `00-overview.md` + 5 numbered files, no `flow-diagram.mmd` per `13-spec-issues/01-naming-conventions.md §3` exemption.

---

## 2. Headline findings

| # | Severity | Title | Owning file(s) for fix |
|---|---|---|---|
| UI1 | **S3** | **`06-ui-ux/readme.md` drift after SI-026 drain.** The "Reading order" list (lines 9–24) and the "Files" table (lines 28–45) both stop at `16-print-stylesheet.md`. Files **17-copy-strings.md, 18-favicon-pipeline.md, 19-breakpoints.md, 20-accessibility-wcag.md, 21-options-page.md, 22-keyboard-cheatsheet.md** all exist on disk (verified `wc -l`) but are not listed in either table. The `00-overview.md` file table covers 17–20 but still misses 21–22 (added in SI-026 drain Session 45 per `13-spec-issues/04-closed-issues.md` SI-028 row). Folder-overview discipline (`templates/folder-overview.md` + `scripts/lint/folder-overview.ts`) requires the file table to enumerate every numbered file. Fix: rewrite readme.md "Reading order" to span 01-22 and "Files" table to enumerate all 22 numbered files; add rows for `21-options-page.md` and `22-keyboard-cheatsheet.md` to `00-overview.md §2`. | `06-ui-ux/readme.md`, `06-ui-ux/00-overview.md` |
| UI2 | **S3** | **`flow-diagram.mmd` does not include the late-added surface nodes (`Options page`, `Keyboard cheatsheet`).** Spot-check shows the diagram terminates at the original 16-file vocabulary (Tokens → Theming → Iconography → Illustration → Motion → …). Files 21 + 22 represent user-visible surfaces that compose the same tokens; flow diagram should at minimum carry a node for each. Lower priority than UI1 because the file-table drift is the lint-checkable surface. Fix: append two leaf nodes `OPT[Options page]` and `KBD[Keyboard cheatsheet]` reading from `DT` (tokens) + `KEY[Keyboard input]` respectively. | `06-ui-ux/flow-diagram.mmd` |

---

## 3. Recommended drain plan

| Session | Findings | Notes |
|---|---|---|
| Same session (103) | UI1 + UI2 | Both mechanical and short. Drain immediately. |

**Scorecard impact NOW (audit-opening):** No F-class, no S2. Two **S3** doc-hygiene findings. Score holds 100/100/100 (S3 issues do not depress passes per `audit-2026-04-29-ai-readiness-score-v2.md §3` gating checks).

| Pass | Lovable | Cursor/Claude-Code | Raw-LLM |
|---|---:|---:|---:|
| Audit-103 opening | **100** | **100** | **100** |

---

## 4. Files NOT deeply audited (spot-checked only)

`03-component-library.md`, `07-motion.md`, `10-forms.md`, `11-feedback.md`, `14-copy-voice.md`, `17-copy-strings.md`, `20-accessibility-wcag.md` — token discipline + cross-references confirmed clean via grep; full prose review deferred.

## 5. Cross-references

- Folder-overview lint rule: `scripts/lint/folder-overview.ts` + `spec/21-app/templates/folder-overview.md`.
- SI-026 drain history: `13-spec-issues/04-closed-issues.md` SI-028 row (S45 added the 21+22 files).
- Brand primary SoT: `06-ui-ux/01-design-tokens.md §1.1` + Core memory.
- Color-label SoT: `06-ui-ux/01-design-tokens.md §1.6` + Core memory.
- Last closed audit: `audit-2026-04-29-data-model-sweep-99.md` (4/4).
