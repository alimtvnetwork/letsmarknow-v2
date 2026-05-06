<!--
audit-date: 2026-05-06
next-audit-by: 2026-08-04
audit-type: ai-readiness
status: open
-->
# AI-Development-Readiness Audit — v3

> **Generated:** 2026-05-06 (UTC+8) by Lovable agent.
> **Scope:** Re-score the spec corpus against the question *"Can a mediocre AI implement this spec end-to-end with 100% confidence?"* — supersedes `audit-2026-04-29-ai-readiness-score-v2.md`.
> **Method:** Run all 18 `spec-drift-linter` sub-checks, reconcile open SI count, reconcile endpoint inventory, reconcile memory ↔ spec drift, and rubric-score across 8 axes.
> **Mode:** Spec-only (`mem://constraints/no-implementation-mode`). No code changes proposed; all fixes are spec-side.

---

## 1. Headline score

| Pass | Date | Lovable | Cursor / Claude-Code | Raw mediocre LLM |
|---|---|---:|---:|---:|
| v1 | 2026-04-19 | 100 | 100 | 100 |
| v2 | 2026-04-29 | 100 | 100 | 100 |
| **v3 (this)** | **2026-05-06** | **92** | **90** | **84** |

**Movement:** −8 / −10 / −16. Spec is **still implementation-ready in the large** but **regressions have accumulated since v2** that a mediocre AI would fail on without supervision.

**Verdict:** ⚠️ **Conditional pass.** Block "100% confidence" claim until the 6 failing sub-checks below are green and the v2→v3 inventory drift is reconciled.

---

## 2. Failing checks (ranked by codegen risk)

| # | Sev | Check | Evidence | Why a mediocre AI fails | Fix |
|---|---|---|---|---|---|
| F-1 | **S1** | `next-singleton-invariants/scope-drift` | `23-audits/audit-2026-05-03-infrastructure-sweep-151.md:26` uses forbidden phrase **"per-workspace Next"**. | Spec says Next is **per-Account, cross-Org**. AI reading the audit file as authoritative will scope the Next queue to a Space/Org and break the singleton invariant in `07-features/17-next-queue.md §2`. | Replace "per-workspace Next" → "per-Account Next" in that line. |
| F-2 | **S1** | `role-enum/foreign-role` | `23-audits/audit-2026-05-03-features-deeper-sweep-123.md:29` introduces role **"contributor"** in role-system context. Locked enum is `owner, admin, editor, viewer, billing, guest, system`. | AI will add a `contributor` role to enum migrations / RLS policies / permission matrices. Cascading data-model break. | Either (a) rewrite the line to use `editor`, or (b) escalate via the locked process: update glossary + `02-data-model/08-member.md` + `17-admin-org/03-roles.md` in one go. Recommend (a). |
| F-3 | **S1** | Endpoint inventory drift | Linter: **172 rows / 172 distinct** in `03-api-endpoints/`. `20-roadmap/07-build-readiness.md §1` and v2 audit both still claim **157**. v2's "0 undeclared" guarantee is no longer verified post-drift. | AI consuming `07-build-readiness.md` will under-scaffold by 15 endpoints, or scaffold without verifying caller-side references resolve. | Re-run `audit-2026-04-29-orphan-endpoint-sweep.md` methodology, rebase `00-overview.md §7` and `07-build-readiness.md §1` to 172, confirm 0 undeclared. |
| F-4 | S2 | `folder-overview` | `spec/21-app/25-references/` missing `00-overview.md`. Locked rule: every folder under `21-app/` must have one (`23-audits/audit-2026-04-19-100-retrospective.md` F-FOLDER-OVERVIEW). | AI navigating the corpus by folder index will treat `25-references/` as an orphan and either skip it or hallucinate its purpose. | Add `25-references/00-overview.md` describing the folder as the home for upstream-product source documents (e.g. Toby parity references). |
| F-5 | S2 | `naming-convention` | `25-references/toby-invite-share-v1.md` violates `^\d{2}-[a-z0-9-]+\.md$`. | AI applying the locked filename regex will rename the file or refuse to link to it. | Rename → `01-toby-invite-share-v1.md` (or similar `NN-` prefix). Update the 2 backticked references that point to it. |
| F-6 | S2 | `backticked-path-resolution` | `25-references/readme.md:9` references `audit-2026-04-30-toby-invite-share-parity-117.md` — file does not exist at that path. | AI following the cross-reference for context will dead-end. | Either fix the link (correct filename) or remove the reference. |
| F-7 | S3 | `audit-cadence` | 5 audit files in `23-audits/` from session 133, 143, 146, 158, 159 are missing the `<!-- audit-date: ... -->` metadata block required by `22-infrastructure/09-ci-cd.md §2.1.4`. | Cadence registry in `23-audits/00-overview.md` will silently desync. Not a codegen blocker but breaks the self-governing audit machine. | Backfill the 5 metadata blocks. |
| F-8 | S2 | Memory ↔ spec drift | `mem://features/spec-issue-tracker.md` says **Open: 2 (SI-029, SI-030), Closed: 31**. `13-spec-issues/02-current-issues.md` header says **Open: 1 (SI-029); SI-030 closed Session 148**. `04-closed-issues.md` actually has **35 SI- rows**. v2 audit and `07-build-readiness.md` say **0 open / 26 closed**. Three sources, three different counts. | AI deciding "is the spec ready?" by reading memory will believe SI-030 is still open and refuse to start. AI reading `07-build-readiness.md` will over-trust readiness. | Single-source-of-truth pass: rewrite memory tracker counts to match `02-current-issues.md` (Open: 1, Closed: 35), then rebase `07-build-readiness.md §1` "Closed spec issues: 26" → 35. |

---

## 3. Passing checks (15 of 18 lint sub-checks green)

`allowlist-discipline`, `endpoint-counts` (no duplicates — but inventory needs rebase, see F-3), `env-var-naming`, `error-code-casing`, `link-check`, `money-units`, `pagination-param`, `pricing-source`, `realtime-channel-syntax`, `sku-naming`, `storage-path`, `ulid-placeholder`. Plus locked rules holding: UUIDv7 invariant, share-model v1, folder-slot-21 buffer, brand-`--primary` token discipline, Workspace split.

---

## 4. Rubric (0–100 per axis)

| Axis | Score | Reasoning |
|---|---:|---|
| **Coverage** (every feature has a spec) | 95 | 187 spec files, 22 domain folders, all locked rules present. −5 for `25-references/` missing overview (F-4). |
| **Correctness** (spec internally consistent) | 80 | Three count discrepancies (F-3, F-8) and one role-enum violation (F-2). |
| **Edge cases** (errors, limits, defaults documented) | 95 | 91-code error catalog, pagination locked, idempotency keys defined. 6 inline parked questions still have safe defaults (per v2 §4). |
| **Error handling** (uniform error envelope, codes) | 100 | `03-api-endpoints/01-conventions.md` + `18-error-codes.md` complete and lint-clean. |
| **Maintainability** (audit machine self-governs) | 85 | 18 lint rules, audit cadence metadata, allowlist discipline. −15 for 5 missing cadence metadata blocks (F-7) and dead backtick (F-6). |
| **Testability** (acceptance criteria, deterministic flows) | 90 | 23 flow diagrams, deterministic share-model, copy-string keys. Test plans (B4) and seed fixtures (B7) explicitly deferred per v2. |
| **Security** (RLS-shaped policies, threat model, privacy) | 85 | Threat model, encryption, share-link security all present. SI-029 (privacy-pack legal copy) still open and gates Phase 1 launch. |
| **Scalability** (cursor pagination, queues, CDN, caching) | 95 | All cursor-based; queue + cron + CDN specced. No drift. |
| **Weighted average** | **91.0** | Coverage 0.10 + Correctness 0.20 + Edge 0.10 + Errors 0.10 + Maint 0.10 + Test 0.10 + Sec 0.15 + Scale 0.15. |

Per-AI adjustment:
- **Lovable** (this agent, can run linters live): 92 — sees + can self-correct most issues.
- **Cursor / Claude-Code** (file-aware, no live linter): 90 — would miss F-7, F-8 silently.
- **Mediocre LLM** (treats every doc as authoritative): 84 — F-1 and F-2 are landmines because the violating text lives inside *audit files* the model will read as truth.

---

## 5. Why "mediocre AI = 100% confidence" is not yet true

A mediocre LLM (no tool access, no linter, reads everything as gospel) will:

1. Encounter the phrase **"per-workspace Next"** in an audit file and scope the Next queue to a workspace. **Architecture break.** (F-1)
2. Encounter the role **"contributor"** and add it to an enum / migration. **Data-model break.** (F-2)
3. Trust the **"157 endpoints, 0 undeclared"** claim and not re-verify after recent additions. **Contract drift.** (F-3)
4. Hit dead links into `25-references/` and either skip context or invent it. **Hallucination risk.** (F-4, F-5, F-6)
5. Read 3 different "open spec issues" counts and not know which to trust. **Decision paralysis or wrong "ready" verdict.** (F-8)

Items 1–3 alone disqualify a 100/100 claim.

---

## 6. What is needed to reach 100 / 100 / 100

Single phase, ~30 min of spec work, no code:

1. **F-1 fix** — patch one line in `audit-2026-05-03-infrastructure-sweep-151.md:26`. (S1, 1 min)
2. **F-2 fix** — patch one line in `audit-2026-05-03-features-deeper-sweep-123.md:29` (`contributor` → `editor`). (S1, 1 min)
3. **F-3 fix** — re-run orphan-endpoint methodology, rebase counts to 172 in `00-overview.md §7` + `20-roadmap/07-build-readiness.md §1`. (S1, 10 min)
4. **F-4 fix** — write `spec/21-app/25-references/00-overview.md` (template at `templates/folder-overview.md`). (S2, 5 min)
5. **F-5 fix** — rename `25-references/toby-invite-share-v1.md` → `01-toby-invite-share-v1.md`; update 2 callers. (S2, 3 min)
6. **F-6 fix** — fix or remove the dead link in `25-references/readme.md:9`. (S2, 2 min, may resolve as part of F-5)
7. **F-7 fix** — backfill 5 audit-cadence metadata blocks. (S3, 5 min)
8. **F-8 fix** — reconcile counts across `mem://features/spec-issue-tracker.md`, `13-spec-issues/02-current-issues.md` header, and `20-roadmap/07-build-readiness.md §1`. Single source = `04-closed-issues.md` row count. (S2, 5 min)
9. **Re-run all 18 linters** → must be clean. **Re-publish** as `audit-2026-05-06-ai-readiness-score-v3.md` status `closed` and supersede this file. (5 min)

After step 9, the corpus returns to **100 / 100 / 100** with no deferred items beyond the still-open SI-029 (privacy-pack legal copy, requires human counsel — explicitly excluded from denominator per v1 §3).

---

## 7. Open spec issues snapshot (reconciled)

| ID | Sev | Status | Blocks |
|---|---|---|---|
| SI-029 | S2 | OPEN — needs human legal counsel | v1 Phase 1 launch (CWS submission, public privacy policy publish). Not a codegen blocker. |
| All others | — | CLOSED (35 in `04-closed-issues.md`) | — |

---

## 8. Maintenance contract reaffirmed

Carried from v2 §5, with one addition:

5. **Audit files are spec-authoritative for AI readers.** Therefore, the `next-singleton-invariants` and `role-enum` linters run over `23-audits/**` too — violations there are S1 even though the file is "just an audit". Today's F-1 and F-2 are proof. Do not regress this rule.

---

## 9. File summary

- **Created:** `spec/21-app/23-audits/audit-2026-05-06-ai-readiness-score-v3.md` (this file).
- **No spec files mutated.** Per `no-implementation-mode`, fixes for F-1 … F-8 are listed but not applied — await user `next` to execute as a single phase.
