# 08-sharing-collab — Flow Diagram

**What this folder does:** how content leaves the Org — public links, password links, invite-only shares, embeds, comments, presence, analytics, revocation.
**User perspective:** "I want someone outside (or inside) to see this."

```mermaid
flowchart TD
    OWNER[Owner / Editor] --> PICK[Pick Space/Collection/Group/Item]
    PICK --> MODE{Share mode}
    MODE -->|Public link| PUB[/t/:slug public/]
    MODE -->|Password| PWD[/t/:slug + password gate/]
    MODE -->|Invite only| INV[Invite email -> Guest role]
    MODE -->|Embed| EMB[<iframe> widget on external site]

    PUB --> VIEWER[Viewer opens link]
    PWD --> VIEWER
    INV --> VIEWER
    EMB --> VIEWER

    VIEWER --> READ[Read-only by default]
    VIEWER -. if granted .-> COMMENT[Comment / react]
    VIEWER -. if granted .-> EDIT[Edit]

    OWNER --> REV[Revoke or expire]
    REV --> GONE[Viewer sees: share removed]

    OWNER --> ANL[Share analytics: views · uniques]
```

**Plain walkthrough:** Owner picks what to share → chooses mode (public / password / invite / embed) → viewer opens the link → reads, optionally comments or edits. Owner can revoke any share or watch its analytics.
