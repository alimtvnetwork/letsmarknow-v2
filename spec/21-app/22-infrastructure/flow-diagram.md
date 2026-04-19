# 22-infrastructure — Flow Diagram

**What this folder does:** hosting, environments, env vars, secrets, domains/SSL, CDN/storage, queues, cron, CI/CD, observability, email, storage layout, IaC.
**User perspective:** the user never sees this, but every page-load + every saved item depends on it.

```mermaid
flowchart TD
    DEV[Developer pushes code] --> CI[CI/CD pipeline<br/>09-ci-cd.md]
    CI --> LINT[Spec-drift linter checks]
    LINT --> BUILD[Build]
    BUILD --> ENV{Environment}
    ENV --> STG[Staging]
    ENV --> PRD[Production]

    USER[End user] --> CDN[CDN edge<br/>06-cdn-storage.md]
    CDN --> APP[Web app on hosting<br/>01-hosting.md]
    APP --> DB[(Database)]
    APP --> Q[Queues<br/>07-queues.md]
    Q --> CRON[Cron jobs<br/>08-cron.md]
    APP --> MAIL[Email provider<br/>11-email-provider.md]
    APP --> OBS[Observability<br/>logs · metrics · traces]
    APP --> SEC[Secrets manager]
```

**Plain walkthrough:** Devs push → CI lints + builds + deploys to staging then prod. End users hit the CDN → app → database, with queues handling background work, cron handling schedules, email sending notifications, and observability watching it all.
