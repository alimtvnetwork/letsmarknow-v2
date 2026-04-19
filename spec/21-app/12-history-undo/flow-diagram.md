# 12-history-undo — Flow Diagram

**What this folder does:** every change is logged so the user can undo it, redo it, or resolve a conflict if two people edited at once.
**User perspective:** "Oops, bring it back."

```mermaid
flowchart TD
    ACT[User action: edit · move · delete] --> LOG[Append to history_events]
    LOG --> UI[Undo toast appears for ~10s]
    UI -->|Click Undo| REV[Revert action]
    UI -->|Ignore| KEEP[Action stands]

    REV --> REDO[Redo available in command palette]
    KEEP --> ACT

    PAR[Two users edit same item] --> CONF{Conflict?}
    CONF -->|same field| RESOLVE[Last-write-wins + diff toast]
    CONF -->|different fields| MERGE[Auto-merge]
```

**Plain walkthrough:** Every edit/move/delete is logged → an Undo toast pops up → click it to revert. If two people edit at the same time, the system either auto-merges (different fields) or applies last-write-wins with a notification (same field).
