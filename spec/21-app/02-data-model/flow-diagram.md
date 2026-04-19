# 02-data-model — Flow Diagram

**What this folder does:** lists every table behind the scenes (Org, Space, Collection, Group, Item, Tag, Share, Member, History, License, Account).
**User perspective:** the user never sees this directly, but every click in the UI reads from or writes to one of these tables.

```mermaid
flowchart LR
    subgraph User actions
      A1[Save a tab]
      A2[Create a Collection]
      A3[Invite a teammate]
      A4[Share a Collection]
      A5[Upgrade plan]
    end

    A1 --> ITEM[(items)]
    A2 --> COLL[(collections)]
    A3 --> MEM[(members + member_roles)]
    A4 --> SHR[(shares)]
    A5 --> LIC[(licenses)]

    ITEM --> COLL
    COLL --> SPACE[(spaces)]
    SPACE --> ORG[(organizations)]
    MEM --> ORG
    SHR --> COLL
    LIC --> ORG

    ITEM -. logged .-> HIST[(history_events)]
    COLL -. logged .-> HIST
    MEM  -. logged .-> HIST
```

**Plain walkthrough:** Every user action lands in a table. Items live inside Collections, Collections inside Spaces, Spaces inside an Organization. Members + roles + licenses are also attached to the Organization. Almost every change is mirrored into `history_events` so the user can undo it later.
