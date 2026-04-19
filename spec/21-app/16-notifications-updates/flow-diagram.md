# 16-notifications-updates — Flow Diagram

**What this folder does:** in-app updates feed, app self-updater, release channels (stable / beta / canary).
**User perspective:** "What changed? And why is the app reloading?"

```mermaid
flowchart TD
    REL[Team ships a release] --> CHAN{Channel}
    CHAN --> STB[Stable]
    CHAN --> BTA[Beta]
    CHAN --> CAN[Canary]

    STB & BTA & CAN --> PUSH[Push to subscribed users]
    PUSH --> FEED[In-app updates feed shows entry]
    PUSH --> UPD{App updater detects new version}
    UPD -->|Web| BANNER[Banner: New version available · Reload]
    UPD -->|Extension| AUTO[Auto-update on next browser restart]

    BANNER -->|User clicks Reload| FRESH[Fresh app loads]
    FEED -->|User clicks entry| DETAIL[Read full release note]
```

**Plain walkthrough:** Team publishes to a channel → users on that channel see the entry in the in-app feed and a "New version" banner → clicking reload gets the fresh version. Extensions update silently on next browser restart.
