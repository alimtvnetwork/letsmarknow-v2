# 01-information-architecture — Flow Diagram

**What this folder does:** defines the tree the user lives inside — Account → Organization → Space → Collection → Group → Item.
**User perspective:** how a person navigates *down* into their content and *up* back out.

```mermaid
flowchart TD
    U[User signs in] --> ACC[Account]
    ACC --> ORG{Pick Organization<br/>left-rail bubble}
    ORG --> SPC{Pick Space<br/>sidebar}
    SPC --> COL[Open Collection]
    COL --> GRP[Open Group<br/>optional]
    COL --> IT1[Click Item -> opens URL in new tab]
    GRP --> IT2[Click Item -> opens URL in new tab]
    COL -. share .-> SHR[/t/{slug} public viewer/]
    GRP -. share .-> SHR
    IT1 -. share .-> SHR
```

**Plain walkthrough:** User logs in → picks which Organization (e.g. Personal vs Atto Property) → picks a Space → opens a Collection → either clicks an Item directly or opens a Group first → clicking an Item launches the saved URL. Any Space / Collection / Group / Item can be shared via `/t/{slug}`.
