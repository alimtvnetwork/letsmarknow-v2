<!--
audit-date: 2026-04-19
next-audit-by: 2027-04-19
audit-type: retrospective
status: closed
closed-on: 2026-04-29
closed-because: F-FOLDER-OVERVIEW closure retrospective; locked via folder-overview sub-check.
-->
# 100/100/100 Retrospective — How We Closed the Last 1% on Raw-LLM

> **Generated:** 2026-04-19 (UTC+8) by AI auditor.
> **Purpose:** Standalone narrative explaining how the spec corpus reached **100/100/100** AI-readiness — what the final gaps were, why they survived earlier passes, the closing moves, and the maintenance contract that keeps the score at 100.
> **Companions:** `audit-2026-04-19-ai-readiness-score.md` (Live Issue Tracker), `audit-2026-04-19-rescore-delta-v2.md` (cumulative per-domain math).
> **Audience:** Future maintainer (human or AI) who needs to understand the closing logic without re-reading the entire 14-pass timeline.

---

## 1. Where the last 1% was hiding

By Pass 13 (after CI drift-linter spec) the scores were **Lovable 100 / Cursor-Claude 100 / Raw-LLM 99**. Lovable and Cursor-Claude had reached the ceiling. Raw-LLM — a cold-start agent with no project memory, no editor, no file-tree intuition — was held back by **one specific class of ambiguity**:

> *"I am opening a folder I have never seen before. What is this folder for? What lives here, and what does NOT live here? What other folders does it depend on?"*

Cursor-Claude could resolve this by globbing the folder and reading the `readme.md`. Lovable could resolve it via project memory. Raw-LLM had to *infer* the folder's purpose from the file names alone — and inference is exactly what an audit-grade spec is supposed to eliminate.

The remaining 1 point on Raw-LLM was the cost of that inference, distributed across 21 folders. No single folder was broken; the *aggregate cold-start tax* across all 21 was the issue.

---

## 2. The closing moves (Passes 13 → 14)

Two moves landed in Pass 14, in this order:

### Move A — `F-FOLDER-OVERVIEW`: per-folder `00-overview.md` × 21

A single new file in every folder, written to a fixed template:

1. **Purpose** — one paragraph stating what the folder owns and what is downstream of it.
2. **Responsibilities** — numbered list, 1–14 items depending on folder size.
3. **File-by-file behaviour** — table with one row per file in the folder, what it owns, locked decisions.
4. **Tasks performed by this folder** — verbs the folder enables at the system level.
5. **What this folder is NOT** — explicit anti-scope, naming the folders that *do* own each excluded concern.
6. **Cross-references** — pointers to upstream and downstream folders.

The §4 "what it is NOT" section is the load-bearing one. Cold-start agents waste tokens by *re-deriving* boundaries; an explicit anti-scope kills that immediately.

This move alone moved Raw-LLM from 99 → 100.

### Move B — `F-M03 IaC`: closing the last domain still inferring infra structure

`22-infrastructure/` had spec for hosting topology, env vars, secrets, CI/CD, observability, etc. — but no concrete IaC examples. A cold-start agent generating a Terraform module had to *invent* the module boundaries, the variable names, the state backend conventions. `22-infrastructure/13-iac.md` removed that final inference: full Terraform snippets, full Pulumi mirror, repository layout, module contracts, drift detection, import workflow, DR hooks.

This move did not affect the headline score (already 100/100/100 after Move A) but eliminated the last domain where a cold-start agent could plausibly invent.

---

## 3. Why earlier passes did not catch this

The first 12 passes targeted **drift** (W-class) and **missing detail in named domains** (M-class). Both of those classes are *visible* — they show up as contradictions or empty sections that a reviewer can point at.

`F-FOLDER-OVERVIEW` is a different class entirely: **the absence of meta-structure**. There was nothing wrong with any individual file; the gap was that the folder *as a unit* never introduced itself. This kind of gap is invisible to any reviewer who already knows the project. It is only visible to a fresh agent on first contact.

Detection rule learned: *if a domain consistently scores well on Lovable and Cursor-Claude but lags on Raw-LLM, suspect a cold-start meta-structure gap.* Apply the §1 inference test to every folder.

---

## 4. The 14-pass arc, compressed

| Phase | Passes | What was being fixed | Δ Raw-LLM |
|---|---|---|---:|
| **Drift cleanup** | 1–7 | W-1 … W-13 | 60 → 90 |
| **Detail completion** | 8–11 | F-M11, F-M13, F-M20, F-M09, F-M10, Paddle parity, deferral math | 90 → 97 |
| **Residue + non-regression** | 12–13 | W-1 residue sweep, CI drift-linter | 97 → 99 |
| **Cold-start meta-structure** | 14 | F-FOLDER-OVERVIEW + F-M03 IaC | 99 → **100** |

The pattern: drift first (else fixes contradict each other), then detail (else fixes have nothing to attach to), then non-regression (else gains erode), then meta-structure (else cold-start tax persists). This ordering is the recommended sequence for any future audit cycle.

---

## 5. What 100/100/100 does NOT mean

Repeating the boundary from `audit-2026-04-19-rescore-delta-v2.md` §6 because it is the most-misread part of this work:

- **Not "the spec is done."** Phase-1 work (B4 test plans, B7 seed fixtures) remains intentionally deferred. The score is computed against the active denominator, with deferred items excluded per the math note in `audit-2026-04-19-ai-readiness-score.md`.
- **Not "the implementation is correct."** This audit measures *implementability of the spec*, not *correctness of code*. Code-side audits are a separate exercise with separate rubrics.
- **Not "the score will stay at 100 forever."** New domains, new features, new providers introduce new drift. The maintenance contract in §6 is the only thing that keeps it at 100.

---

## 6. Maintenance contract — how 100 stays 100

Five rules. Each is enforced by either CI, review process, or scheduled work.

### 6.1 Every spec PR passes `spec-drift-linter`
Wired in `22-infrastructure/09-ci-cd.md` §2.1.1. Eleven sub-checks lock W-1, W-3, W-4, W-5, W-6, W-7, W-8, W-10, W-12, W-13, F-M09/F-M10. **Failing means the PR cannot merge.** No bypass label exists; if the linter is wrong, fix the linter in the same PR.

### 6.2 Every new folder ships a `00-overview.md`
Template = the 22 written in this session. A 12th sub-check should be added to the linter to enforce this (recommended follow-up — see §8).

### 6.3 Quarterly re-audit
Re-score every domain against the same rubric. Schedule:
- **Next due:** ~2026-07-19 (90 days from this closure).
- **Trigger:** Calendar-driven; do not skip even if no spec changes were merged.
- **Output:** A new `audit-{date}-rescore-delta-v3.md` with per-domain scores and any new closures opened.
- **Acceptance:** Any domain scoring <95 opens a P1 ticket the same day.

### 6.4 New drift class → new sub-check in same PR
When a reviewer or auditor identifies a new drift class (e.g., a misspelled enum value, an inconsistent date format, a renamed column), the closing PR **must** include a new sub-check in `spec-drift-linter`. No exceptions. This is what keeps the linter ahead of the corpus.

### 6.5 Deferred items return through their own pass
B4 (test plans) and B7 (seed fixtures) are scheduled for Phase-1 per `20-roadmap/06-definition-of-done.md` §2. When they land, they get a fresh re-score pass — they do not retroactively lower the current 100/100/100 because they were excluded from the active denominator.

---

## 7. The detection rules earned in this audit cycle

These are the operational lessons. They are not in the rubric; they are in the playbook.

1. **Drift is detectable by grep.** Every W-class issue could have been caught by a regex sweep against the spec corpus. The `spec-drift-linter` formalises this.
2. **Cold-start tax is detectable by Raw-LLM scoring lag.** When Raw-LLM trails Lovable/Cursor by >5 points, the gap is meta-structure, not detail.
3. **Provider parity is a one-time cost per provider.** Stripe and Paddle each took one focused pass for webhook payload schemas; future providers will take exactly one pass each.
4. **Rate-limit envelope is a single artefact.** Every rate-limit and quota error in the spec must reconcile to *one* canonical envelope (`03-api-endpoints/18-error-codes.md`). Sub-pages that re-define the envelope are a drift class — `error-code-casing` linter catches this.
5. **Idempotency keys are tuples, not single fields.** `(provider, event_id)` for webhooks; `(account_id, request_idempotency_key)` for client requests. Single-field idempotency keys are a drift class.
6. **Deferral is a first-class status.** Items that are deferred must be marked, dated, and excluded from the denominator with a math note. Silent deferral is indistinguishable from a missing item.

---

## 8. Recommended follow-up work (spec-only, optional)

In rough order of leverage:

1. **Lock the folder-overview rule in CI.** Add a 12th sub-check to `spec-drift-linter` enforcing `every folder under spec/21-app/ has a 00-overview.md`. Makes F-FOLDER-OVERVIEW non-regressable.
2. **Cross-reference QA sweep on the 21 new `00-overview.md` files.** Verify every cited file path and `mem://` reference resolves. The link-check sub-check covers file paths; `mem://` paths need a separate validator.
3. **Quarterly re-audit dry run.** Exercise the §6.3 process on one currently-perfect domain (e.g., `15-visualization`) before the actual ~2026-07-19 cycle. Validates that the rubric is still applicable and the linter is still complete.
4. **Document the `00-overview.md` template formally.** A new file `spec/21-app/templates/folder-overview.md` would let future folder authors copy the structure verbatim, removing any improvisation.

These are recommendations, not commitments. The corpus is at 100/100/100 without them.

---

## 9. Cross-references

- Live Issue Tracker (every closure with date + fix reference): `audit-2026-04-19-ai-readiness-score.md` §Live Issue Tracker.
- Cumulative per-domain math: `audit-2026-04-19-rescore-delta-v2.md`.
- v1 rescore (lowest-4 domains, post W-1/W-2/W-3 only): `audit-2026-04-19-rescore-delta.md`.
- W-issues catalogue: `audit-2026-04-19-spec-wide.md`.
- M-issue closures: `audit-2026-04-19-m-gaps.md`.
- Sequencing decisions: `audit-2026-04-19-sequencing.md`.
- Anti-regression contract: `22-infrastructure/09-ci-cd.md` §2.1.1.
- IaC examples: `22-infrastructure/13-iac.md`.
- Spec-only mode (why B4/B7 are deferred): `mem://constraints/no-implementation-mode`.
- Gap-analysis state memory (current at v7): `mem://features/gap-analysis-state`.
