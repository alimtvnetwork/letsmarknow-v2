# 14-search — Flow Diagram

**What this folder does:** finding things — global search, item search, workspace search, filters, jump-to-result, the underlying search engine.
**User perspective:** "Where is that thing I saved last week?"

```mermaid
flowchart TD
    USR[User] --> ENTRY{How to search?}
    ENTRY -->|Cmd/Ctrl+K| QF[Quick Find palette]
    ENTRY -->|Top bar input| GS[Global search]
    ENTRY -->|Inside a Collection| WS[Workspace search]
    ENTRY -->|Browser address bar| OMNI[Omnibox lmn ...]

    QF --> QRY[Type query -> debounced]
    GS --> QRY
    WS --> QRY
    OMNI --> QRY

    QRY --> ENG[Search engine: tsvector + trigram]
    ENG --> RES[Ranked results: items · collections · tags]
    RES --> FIL[Apply filters: tag · date · type · org]
    FIL --> CLK[User clicks result]
    CLK --> JUMP[Jump-to-result: scroll + highlight OR open URL]
```

**Plain walkthrough:** User opens search from any of 4 entry points → types → backend ranks results → user filters/clicks → either jumps inside the app or opens the saved URL.
