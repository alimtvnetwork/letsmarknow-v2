# 11-import-export — Flow Diagram

**What this folder does:** bringing data IN (Pocket, Raindrop, Tab Extend, browser bookmarks, CSV, JSON, email-in, API) and getting data OUT (export, GDPR, migration).
**User perspective:** "I'm coming from another tool" or "I need a copy of my data."

```mermaid
flowchart LR
    SRC{Source} --> POC[Pocket]
    SRC --> RAI[Raindrop]
    SRC --> TBE[Tab Extend]
    SRC --> BMK[Browser bookmarks HTML]
    SRC --> CSV[CSV / JSON]
    SRC --> EML[Forward to email-in address]
    SRC --> API[Public API import]

    POC & RAI & TBE & BMK & CSV & EML & API --> UP[Upload / connect]
    UP --> MAP[Mapping + dedup preview]
    MAP --> QUE[Queued import job]
    QUE --> DONE[Toast: imported N items into Collection X]

    DONE --> EXP{Need to leave?}
    EXP -->|Export| FILE[Download zip: JSON + HTML + CSV]
    EXP -->|GDPR| GDP[Verified DSR -> full archive]
```

**Plain walkthrough:** User picks a source → uploads or connects → previews mapping + duplicates → job runs in the background → toast confirms. Later, they can export everything (or request a GDPR archive) and walk away with their data.
