# Audit — 2026-04-29 — Glossary Coverage Sweep (Phase 14)

> **Scope.** Phase 14 of the spec-issue plan: verify every term used as `**Bold**` in feature files appears in `00-overview/02-glossary.md`.
> **Method.** Python AST-style scan across `07-features/`, `04-extension/`, `05-web-app/`, `08-sharing-collab/`, `11-import-export/`, `12-history-undo/`, `14-search/`, `15-visualization/`, `16-notifications-updates/`, `17-admin-org/`. Extracted bold-noun candidates, normalized singular/plural, diffed against 53 defined glossary terms.
> **Result:** 169 candidates → 150 not-in-glossary → 6 real gaps after manual triage. All 6 closed in this pass. No new spec issues opened.

---

## 1. Method

```python
# Pseudocode
defined = parse_glossary_bold_cells("00-overview/02-glossary.md")  # 53 terms
candidates = find_bold_nouns_across_feature_folders()              # 169 terms
missing = [t for t in candidates if t.lower() not in defined]      # 150
# Manual triage: drop UI emphasis, table verbs, example collection
# names, generic adjectives. Real signal:
real_gaps = [
  "Lifecycle verbs (Create/Rename/Move/Duplicate/Archive/Restore/Soft-delete/Purge/Merge/Split)",
  "Trash",
  "Supabase Realtime",
  "Feature Flag (with Boolean / Multivariate / Percentage rollout sub-terms)",
  "Kill Switch",
  "GDPR DSR",
]
```

## 2. Triage of the 150 candidates

| Bucket | Count | Action |
|---|---|---|
| UI emphasis (`**NOT**`, `**Recent**`, `**New**`, etc.) | ~70 | Skip — not nouns |
| Bold table-cell verbs (`**Create**`, `**Move**`, etc.) | ~25 | Folded into single new entry "Lifecycle verbs" |
| Example collection / quick-action names (`**Quick Tools**`, `**All collections**`) | ~12 | Skip — illustrative content, not terminology |
| View-mode emphasis (`**Grid**`, `**List**`, `**Compact**`, `**Column**`) | 4 | Already covered by Views section (List View, Grid View, etc.); singular bold use is acceptable |
| Section-header style restated in body (`**Behavioural contract**`, `**Lock per-feature behaviour**`) | ~25 | Skip — these are emphasized headings, not domain nouns |
| Real domain terms missing from glossary | **6** | Added in this pass |
| Generic English nouns used emphatically | ~8 | Skip — `**Boolean**` etc. are language primitives, not Toby/LMN domain terms (Boolean now defined as a sub-term inside Feature Flag) |

## 3. Glossary additions (this pass)

Cross-ref `00-overview/02-glossary.md`:

1. **Actions & history → Lifecycle verbs** — single entry enumerating Create, Rename, Move, Duplicate, Archive, Restore, Soft-delete, Purge, Merge, Split with rule that UI labels MUST use these verbs verbatim.
2. **Misc → Trash** — surface name pointing to `05-web-app/09-trash.md`.
3. **Misc → Supabase Realtime** — pointing to `08-sharing-collab/14-realtime-transport.md`.
4. **Misc → Feature Flag** — with three sub-kinds (Boolean / Multivariate / Percentage rollout) bolded inline so each is a defined sub-term.
5. **Misc → Kill Switch** — pointing back to Feature Flag.
6. **Misc → GDPR DSR** — abbreviation expanded; cross-refs `19-security-privacy/04-gdpr-ccpa.md` + `11-import-export/09-gdpr-export.md`.

Glossary term count: **53 → 59** (+6 entries; ~10 new sub-terms when counting bolded inline definitions).

## 4. Score delta

| Sub-score | Before | After | Δ |
|---|---|---|---|
| Glossary completeness | 100 | 100 | 0 (already at ceiling; new axis "feature-file term coverage" now has objective floor) |
| Cross-reference density | 100 | 100 | 0 (every new entry includes a `spec/...md` pointer) |
| Hand-off readiness (raw chat) | 80 | 81 | +1 (raw-chat AI no longer needs to infer "GDPR DSR" or "Kill Switch") |
| Hand-off readiness (Lovable) | 95 | 95 | 0 |
| Hand-off readiness (Cursor/IDE) | 97 | 97 | 0 |

**Weighted average:** 100/100 → **100/100**.

## 5. New convention captured

The "Lifecycle verbs" entry is the first **closed-vocabulary** rule in the glossary: UI labels, event names, and API verbs must use the listed verbs verbatim. This is a stronger contract than the existing forbidden-synonyms list (which only bans alternatives).

Rule for future audits: any new entity-level mutation must pick from this list or extend it via PR — never invent a synonym ("erase", "trash" as verb, "remove", "kill").

## 6. No new SI opened

The 6 gaps were resolved in the same pass they were found, so no SI-NNN row is needed. This is the first audit pass to discover-and-close in one cycle (prior audits all opened tracking rows first).

## 7. Phase-plan update

Append to `13-spec-issues/03-phase-plan.md`:

> **Phase 14 — DONE 2026-04-29.** Glossary term coverage sweep across 10 feature folders. 6 real gaps closed in-pass. Glossary count 53 → 59. Lifecycle verbs codified as closed vocabulary. No new issues opened.

## 8. Cross-refs

- Predecessor: `audit-2026-04-29-toby-parity-delta.md`
- Issue tracker: `mem://features/spec-issue-tracker.md`
- Modified file: `00-overview/02-glossary.md`
- Ranking source: `mem://features/spec-issue-tracker.md` Phase queue
