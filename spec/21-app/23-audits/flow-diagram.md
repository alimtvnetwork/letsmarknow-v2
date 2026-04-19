# 23-audits — Flow Diagram

**What this folder does:** scheduled and ad-hoc audits of the spec and the implementation, with a locked rubric and re-score policy.
**User perspective:** the *team* uses this to keep quality honest; the end user never sees it.

```mermaid
flowchart TD
    TRIG{Trigger} --> SCH[Scheduled quarterly]
    TRIG --> ADH[Ad-hoc after big change]
    TRIG --> REQ[User requests audit]

    SCH & ADH & REQ --> RUN[Run audit using rubric in<br/>audit-2026-04-19-ai-readiness-score.md]
    RUN --> WRITE[Write new audit-YYYY-MM-DD-*.md]
    WRITE --> RANK[Rank issues by risk]
    RANK --> FIX{Fix in spec or code}
    FIX -->|spec edit| SPEC[Update spec file]
    FIX -->|code change| LIFT[Requires lift no-impl turn]
    SPEC --> RESCORE[Append rescore-delta.md]
    LIFT --> RESCORE
    RESCORE --> CLOSE[Mark issue closed inline + date]
    CLOSE --> NEXT[Next audit picks up remaining]
```

**Plain walkthrough:** Audits are triggered on a schedule, after big changes, or on user request → run with the locked rubric → produce a dated report → fixes are applied (spec or, with permission, code) → a rescore-delta is appended → closed issues are marked inline so nothing is silently dropped.
