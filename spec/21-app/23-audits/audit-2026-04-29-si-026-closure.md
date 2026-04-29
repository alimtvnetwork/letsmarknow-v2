<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: retrospective
status: closed
closed-on: 2026-04-29
closed-because: Append-only retrospective documenting the 12-session drain pattern that closed SI-026 (forward-ref backlog 21 → 0). Not a tracking audit.
-->

# Audit — SI-026 Closure Retrospective

**Date:** 2026-04-29 (Session 50, Malaysia time UTC+8)
**Author:** Lovable agent + user
**Scope:** SI-026 lifecycle from open (Session 38) to closed (Session 50). Process lessons for future bulk-drain spec issues.
**Reason:** Capture the drain cadence, the recurring tooling failure modes, and the file-authoring patterns used so the next bulk SI can be closed faster.

> **Append-only.** Per `23-audits/readme.md`, this file is historical.

---

## 1. Headline numbers

| Metric | Value | Source |
|---|---|---|
| SI-026 entries at open (Session 38) | **21** | `13-spec-issues/04-closed-issues.md` SI-026 row |
| SI-026 entries at close (Session 50) | **0** | `scripts/lint/backticked-path-resolution.allowlist.txt` (4 remaining are non-SI-026) |
| Sessions to drain | **12** (S38 → S50, with idle sessions interleaved) | conversation log |
| New spec files authored to close refs | **9** | see §3 |
| Citing refs rewritten in-place (no new file) | **6** | see §3 |
| Allowlist entries removed | **17** | git history of allowlist file |
| Final allowlist size | **4 entries** (artifact filenames + syntax-template) | allowlist file head |
| Open SIs at close | **0** | `13-spec-issues/02-current-issues.md` |
| CI linters green at close | **17 / 17 active** | last full sweep |

---

## 2. Drain progression (per session)

| Session | Closed | Approach | Notes |
|---|---|---|---|
| S39 | −6 | Authored 6 release-ops stub files | First batch — folder did not exist, created `19-security-privacy/` slots |
| S41 | −2 | Authored 2 privacy stubs | Same pattern as S39 |
| S44 | −1 | Authored `08-sharing-collab/url-normalization.md` | Single-file slot |
| S45 | −2 | Authored `06-ui-ux/21-options-page.md` + `22-keyboard-cheatsheet.md` | Both NN- prefixed; renamed citing refs in `04-extension/02-surfaces.md` + `08-keyboard-shortcuts.md` |
| S46 | −2 | Authored `07-features/18-add-item-hover-button.md` | Renamed 2 citing refs (`00-overview/04-competitive-analysis.md` + `readme.md`) |
| S47 | −1 | Authored `10-licensing-billing/16-billing-emails.md` | **Slot collision** — slot 07 occupied, used 16; rewrote citing ref in `03-api-endpoints/17-billing-webhooks.md` |
| S48 | −1 | Converted v2 share-model ref to plain prose (no new file) | `03-api-endpoints/10-shares.md`. Also repaired bloated SI-026 tracker row (5 stitched-together failed `line_replace` versions) |
| S49 | −1 | Converted payments-integration ref to plain prose | Pointed at existing `10-licensing-billing/03-stripe-integration.md` + `04-paddle-integration.md`; repaired `readme.md` tree (lines 214-222: 7 fictitious filenames → real NN- billing files) |
| S50 | −5 | Authored `17-i18n-a11y/00-overview.md` + `01-extension-strings.md`, renamed 2 citing refs, scrubbed 1 latent backtick + 3 orphan self-reference allowlist entries | **Closed.** SI-026 renamed to SI-028 in tracker to preserve history given an earlier numbering collision |

**Cadence:** ~1.75 entries/session across active sessions; idle sessions broke the streak but no regressions occurred between drains.

---

## 3. File-authoring vs prose-rewrite

Two valid strategies emerged:

1. **Author the file** (used for 9 entries). Best when the forward-ref names a coherent topic that warrants its own spec page (`url-normalization`, `options-page`, `keyboard-cheatsheet`, `add-item-hover-button`, `billing-emails`, `i18n-a11y/*`, release-ops/privacy stubs).
2. **Rewrite the citing prose to point at existing files** (used for 6 refs). Best when the forward-ref was a synthesis name (`payments-integration.md`) whose real content already lived in adapter files (`03-stripe-integration.md` + `04-paddle-integration.md` + `12-billing-webhooks.md`), or when the target was an explicit v2 design note (`08-sharing-collab/share-model.md`) that should not be elevated to a normative ref.

**Lesson:** Default to prose-rewrite if the target name is a *category* rather than a *page*. New files should each carry unique normative content.

---

## 4. Recurring tooling failure modes

### 4.1 `line_replace` prefix-bug row bloat
Multiple sessions produced rows in `13-spec-issues/02-current-issues.md` that contained 2–5 stitched-together versions of the same SI row, because `line_replace` matched a partial prefix and appended rather than replacing. Repaired with one-shot Python rewrites in S48 and S50. **Mitigation:** when editing the SI tracker, prefer `code--write` of the whole row block, or verify with `code--view` immediately after each `line_replace`.

### 4.2 Slot collisions in numbered folders
S47 hit a collision: planned slot `07` in `10-licensing-billing/` was occupied, forcing `16-billing-emails.md`. **Mitigation:** before authoring, run `ls spec/21-app/{folder}/` and pick the next free NN.

### 4.3 Orphan allowlist entries
S50 found 3 SI-026 self-reference allowlist entries whose targets had been authored several sessions earlier but whose allowlist rows were never removed. **Mitigation:** drain script should `grep` each remaining allowlist entry against the file tree and warn on orphans.

### 4.4 Citing-ref discovery
After authoring a new file, 2–3 other files typically still cited the *old aspirational name*. Without renaming those, the linter would resurface a near-identical ref. **Mitigation:** after authoring, run `rg -l "old-name.md" spec/21-app/` and rename in the same session.

---

## 5. Final allowlist composition

After SI-026 closure, `scripts/lint/backticked-path-resolution.allowlist.txt` contains **4 entries**, none of which are SI-026:

1. `04-extension/README.md` — extension package's bundled README, not a spec doc.
2. `notes.md` — export-bundle artifact filename, not a spec doc.
3. `CHANGELOG.md` — release artifact, not a spec doc.
4. `NN-name.md` — syntax-template example in `22-infrastructure/09-ci-cd.md §2.1.1`, not a real ref.

These are intentionally permanent. Any future addition to this allowlist must open a new SI.

---

## 6. Score impact

- **Before SI-026 (S37):** 100/100/100 with 0 open SIs (`audit-2026-04-29-full-green-milestone.md`).
- **During SI-026 (S38–S49):** score held at 100/100 because SI-026 was S3 (cosmetic, allowlisted, no AI-codegen impact).
- **After SI-026 close (S50):** 100/100 with 0 open SIs again, but with **17 green linters** (was 16) and **2011 backticked refs across 309 files** (was 1844 across 296 files). Net spec growth: +13 files, +167 verified refs, all clean.

---

## 7. Recommendations for next bulk SI

1. Open the SI with a complete numbered checklist of every entry (SI-026 grew its checklist incrementally — slower).
2. Pre-decide author-vs-prose for each entry at open time.
3. After every batch of 2–3 closures, run a full `code--view` of the SI tracker row to detect `line_replace` bloat early.
4. Keep memory's `spec-issue-tracker.md` updated each session with the drain delta (`SXX:−N`) — the trail in `mem://` was invaluable for writing this audit.
