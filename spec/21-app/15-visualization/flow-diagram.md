# 15-visualization — Flow Diagram

**What this folder does:** the different ways content is displayed — list, grid, compact, mindmap, Tab-Extend column view, plus resizable sections.
**User perspective:** "Show me my stuff the way I like to see it."

```mermaid
flowchart TD
    OPEN[User opens a Collection] --> PICK{View toggle in toolbar}
    PICK --> LST[List view<br/>title + favicon + tags]
    PICK --> GRD[Grid view<br/>card thumbnails]
    PICK --> CMP[Compact view<br/>dense rows]
    PICK --> MM[Mindmap view<br/>visual tree]
    PICK --> COL[Column view<br/>Tab Extend style]

    LST & GRD & CMP & MM & COL --> RESZ[User drags section dividers]
    RESZ --> SAVED[Layout preference saved per Collection]
```

**Plain walkthrough:** User opens a Collection → switches view from a toolbar → optionally drags dividers to resize sections → preference is saved per-Collection so it stays that way next visit.
