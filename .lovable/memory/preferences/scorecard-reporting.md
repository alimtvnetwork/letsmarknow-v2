---
name: Always show implementability scorecard during spec work
description: Every spec-improvement session must end with the implementability scorecard (Lovable/Cursor/Raw-LLM) and delta vs prior baseline.
type: preference
---

**Rule:** Every session that touches `spec/21-app/` (audits, sweeps, drift fixes, new findings, SI work, drain batches) MUST end the response with the **Implementability Scorecard** block, BEFORE the "Remaining tasks" section.

**Format (always render exactly this):**

```
### Implementability Scorecard
| Pass | Lovable | Cursor/Claude-Code | Raw-LLM |
|---|---:|---:|---:|
| Baseline (v2, 2026-04-29) | 100 | 100 | 100 |
| Current (Session NN) | XXX | XXX | XXX |

**Delta:** <none | +N (reason) | -N (reason)>
**Gating checks:** <all hold | list any tripped>
**Score invalidation triggers tripped:** <none | list>
```

**Source of truth:** `spec/21-app/23-audits/audit-2026-04-29-ai-readiness-score-v2.md` §1 (baseline) and §3 (gating checks).

**Score invalidation triggers** (per v2 §4 item 4): new W- or F- issue opened; CI drift-linter check failing; orphan endpoints re-appearing; role/identifier/share-model rules violated.

**Parked items do NOT depress score:** SI-029 (privacy-pack legal copy, blocked on legal counsel) is content-blocked, not a spec-quality defect.

**Why:** User explicitly requested this on 2026-04-29 after I forgot it across multiple sessions. Do not omit again.
