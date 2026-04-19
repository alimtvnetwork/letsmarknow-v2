# 20-roadmap — Flow Diagram

**What this folder does:** the phased build plan — Phase 0 MVP → Phase 1 v1 → Phase 2 collab → Phase 3 mindmap+AI → Phase 4 cross-browser → Definition of Done.
**User perspective:** "What can I expect, and when?"

```mermaid
flowchart LR
    P0[Phase 0<br/>MVP<br/>save tab · collections · share link · Chrome ext] --> P1
    P1[Phase 1<br/>v1<br/>billing · import · history · search] --> P2
    P2[Phase 2<br/>Collab<br/>members · roles · presence · comments] --> P3
    P3[Phase 3<br/>Mindmap + AI<br/>visual views · smart suggestions] --> P4
    P4[Phase 4<br/>Cross-browser<br/>Edge · Brave · Arc · Firefox · Safari]

    P0 -. each phase exits via .-> DOD[Definition of Done<br/>06-definition-of-done.md]
    P1 -. .-> DOD
    P2 -. .-> DOD
    P3 -. .-> DOD
    P4 -. .-> DOD
```

**Plain walkthrough:** Five sequential phases. Each phase only ships when it passes the Definition of Done checklist. v1 in this repo = Phases 0 + 1.
