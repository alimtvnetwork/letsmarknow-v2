# 07-features — Flow Diagram

**What this folder does:** the product features themselves — Save Tab, Save Session, Quick Find, Collections, Groups, Tags, Notes, Views, Hover-to-Jump, Bulk ops, Star/Pin, Embeds, Command Palette, OS integrations, Feature flags, Delete-with-Undo.
**User perspective:** the verbs the user can perform.

```mermaid
flowchart TD
    USER[User] --> CAPTURE{Capture}
    CAPTURE --> ST[Save Tab]
    CAPTURE --> SS[Save Session]

    USER --> ORGZ{Organize}
    ORGZ --> NC[New Collection]
    ORGZ --> NG[New Group]
    ORGZ --> TAG[Tag items]
    ORGZ --> NOTE[Add note]
    ORGZ --> STAR[Star / Pin]
    ORGZ --> BULK[Bulk move/delete]

    USER --> FIND{Find}
    FIND --> QF[Quick Find]
    FIND --> CMD[Command Palette]
    FIND --> HOV[Hover-to-Jump]

    USER --> CONS{Consume}
    CONS --> VIEW[Switch view: list/grid/compact/mindmap/column]
    CONS --> EMB[Embed widget elsewhere]

    USER --> UNDO[Delete -> Undo toast]
```

**Plain walkthrough:** User has 4 verbs — capture, organize, find, consume — plus an always-available Undo. Each box maps to one file in this folder.
