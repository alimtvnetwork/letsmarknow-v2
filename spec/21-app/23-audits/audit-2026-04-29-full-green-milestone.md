# Audit — Full-Green Milestone Re-audit

**Date:** 2026-04-29 (Session 37, Malaysia time UTC+8)
**Author:** Lovable agent + user
**Scope:** Whole spec corpus + linter infrastructure + spec-issue tracker.
**Reason:** Document the state of the spec at the moment **all 16 active CI linters report `clean`** and **0 spec issues are open**, before any phase transition (e.g. lifting `no-implementation-mode` and starting Phase 0 build).

> **Append-only.** Per `23-audits/readme.md`, this file is historical. Do not edit retroactively. Future updates go in a new dated audit file or in the live tracker `audit-2026-04-19-ai-readiness-score.md`.

---

## 1. Headline numbers

| Metric | Value | Source |
|---|---|---|
| Spec files (`*.md` under `spec/21-app/`) | **296** | `find spec/21-app -name '*.md' \| wc -l` |
| Active CI linters | **16** | `ls scripts/lint/*.ts \| wc -l` |
| Linters reporting `clean` | **16 / 16** | full sweep, this session |
| Allowlist files | **11** | `ls scripts/lint/*.allowlist.txt \| wc -l` |
| Spec issues — open | **0** | `13-spec-issues/02-current-issues.md` |
| Spec issues — closed | **31** (SI-001 … SI-025 + sub-IDs) | `13-spec-issues/04-closed-issues.md` |
| Endpoint registry | **171 declared / 171 catalogued / 0 duplicates** | `endpoint-counts` |
| Conversation-log sessions | **37** | `00-conversation-log.md` |
| AI readiness score (canonical) | **100 / 100 / 100** | `audit-2026-04-19-ai-readiness-score.md` (live) |

---

## 2. Linter sweep — full results

All 16 linters were executed in this session (`bun run scripts/lint/*.ts`). Every one exited 0 with a `clean` status line:

| # | Linter | Status line |
|---|---|---|
| 1 | `allowlist-discipline` | clean — 11 allowlist file(s) validated against 20 known sub-checks |
| 2 | `audit-cadence` | OK — 18 audit files validated. ad-hoc=0o/7c/0s retrospective=0o/1c/0s ai-readiness=1o/0c/4s parity=0o/2c/0s glossary=0o/1c/0s endpoint-sweep=0o/1c/1s |
| 3 | `endpoint-counts` | OK — 21 files, 171 rows, 171 distinct, 0 duplicate path(s) |
| 4 | `env-var-naming` | clean (296 files, 57 cataloged vars) |
| 5 | `error-code-casing` | clean — 296 files scanned; catalog size = 84 |
| 6 | `folder-overview` | clean |
| 7 | `link-check` | clean — 36 relative links resolved across 296 files |
| 8 | `money-units` | clean |
| 9 | `naming-convention` | clean |
| 10 | `next-singleton-invariants` | clean — 296 files scanned |
| 11 | `pagination-param` | clean — 43 files scanned across 03-api-endpoints/ + 05-web-app/ |
| 12 | `pricing-source` | clean |
| 13 | `realtime-channel-syntax` | clean — 17 files scanned |
| 14 | `role-enum` | clean — 296 files scanned |
| 15 | `sku-naming` | clean |
| 16 | `storage-path` | clean (28 files in scope, 10 cataloged buckets) |

**Allowlist debt.** 11 allowlist files exist; all entries carry `PR:#... reason:... review-by:YYYY-MM-DD` per "Allowlist Discipline" schema, with `review-by` dates within the strict 180-day window (verified Session 34).

**Linters parked under `no-implementation-mode`** — not counted in the 16 above; they will be lifted when Phase 0 build starts:
- `brand-pink-anchor`
- `color-label-tokens`
- `collection-kind-discriminator`
- `toast-placement`

These four are spec'd, registered as orphan-aware in `22-infrastructure/09-ci-cd.md`, but inert until `src/` exists.

---

## 3. Spec-issue tracker — current state

- **Open:** 0.
- **Closed in 2026-04-29 surge (Sessions 17 → 37):** SI-021, SI-022, SI-023, SI-024, SI-025. All five carry full evidence + closing notes in `04-closed-issues.md` and (where applicable) a paired audit file in `23-audits/`.
- **Notable closures this date:**
  - **SI-022** orphan-endpoint sweep: 19 undeclared endpoints reconciled to 0. Final inventory **157 declared / 0 undeclared** (per closing note); endpoint-counts linter now reports **171 / 171** after §7 rebase under SI-025. The 14-row delta between SI-022's 157 and the linter's 171 is fully accounted for by the SI-025 rebase — see SI-025 closing note.
  - **SI-024** toast placement locked (bottom-right desktop / top-center mobile, max 3 stacked); Save Session v1 bottom-left request rejected.
  - **SI-025** §7 row count rebased 183 / 182 → 171 / 171 via `--write`; 5 real undeclared endpoints found and added.

---

## 4. What changed since `audit-2026-04-29-post-fix-reaudit.md`

Sessions **30 → 37** (this date) added the following infrastructure, all verified clean:

| Session | Linter shipped / cleanup | Allowlist work |
|---|---|---|
| 30 | `pagination-param` | new |
| 31 | `realtime-channel-syntax` | new |
| 32 | `role-enum` | new + allowlist + later format fix |
| 33 | `error-code-casing` | new + allowlist |
| 33 | `env-var-naming` | new + allowlist |
| 33 | `storage-path` | new + allowlist |
| 34 | Allowlist hygiene pass + `next-singleton-invariants` registration in `09-ci-cd.md §2.1.1` | reformat 5 allowlists; `review-by` dates fixed to 180-day window |
| 34 | Analytics: `next` domain added to `18-analytics-telemetry/03-events.md §2.15` (6 events) | — |
| 35 | Conv-log drift cleanup | `link-check`, `money-units`, `sku-naming` allowlists extended for `00-conversation-log.md` |
| 36 | Next-queue keyboard shortcuts section added to `06-ui-ux/02-keyboard-shortcuts.md` (closed `17-next-queue.md §8` dangling cross-ref) | — |
| 37 | **This audit.** | — |

---

## 5. Posture statement (for next phase)

The spec corpus is in a **publishable, AI-ready state**:

- 100 / 100 / 100 score holds on all canonical metrics.
- All static checks the corpus knows how to run are green.
- Every spec-issue with a stable ID is closed.
- The 4 src-dependent linters are pre-built and waiting; lifting `no-implementation-mode` is a one-flag decision, not an engineering task.

**Recommended next action after this audit** (per `00-roadmap` and the standing suggestion list): re-paste the full Toby parity spec to close the 6 inline ergonomics defaults parked in `20-roadmap/`, OR lift `no-implementation-mode` and start Phase 0 build. Either is unblocked.

**Stopping milestone:** This is a clean cut-point. 37 sessions; 16 fully-green linters; 31 closed SIs; 0 open SIs; 100/100/100.

---

## 6. Reproducibility

To reproduce the headline numbers in §1:

```bash
find spec/21-app -name '*.md' | wc -l                  # → 296
ls scripts/lint/*.ts | wc -l                            # → 16
ls scripts/lint/*.allowlist.txt | wc -l                 # → 11
for f in scripts/lint/*.ts; do bun run "$f"; done       # → 16× clean
```

Spec-issue counts are read directly from `13-spec-issues/02-current-issues.md` (open table) and `13-spec-issues/04-closed-issues.md` (closed table).

---

**End of audit.**
