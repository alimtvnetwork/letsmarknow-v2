# 05-web-app — Flow Diagram

**What this folder does:** the website at letsmarknow.com — every route, screen, and navigation rule.
**User perspective:** what the user actually sees and clicks in the browser.

```mermaid
flowchart TD
    LAND[/ Marketing landing/] -->|Sign up| ONB[/onboarding/]
    LAND -->|Sign in| AUTH[/auth/]
    AUTH --> DASH[/dashboard/]
    ONB --> DASH

    DASH --> SHELL[App shell:<br/>left rail Orgs · sidebar Spaces · main content]
    SHELL --> COL[/c/:id Collection view/]
    SHELL --> GRP[/g/:id Group view/]
    SHELL --> ITM[/i/:id Item detail/]
    SHELL --> TR[/trash/]
    SHELL --> ACT[/activity/]
    SHELL --> IMP[/import/]
    SHELL --> SET[/settings/*/]
    SHELL --> BIL[/billing/]
    SHELL --> SHM[/share/* manage shares/]

    COL -->|click item| OPEN[Opens saved URL in new tab]
    LAND -. anyone .-> SV[/t/:slug Public share viewer/]
```

**Plain walkthrough:** Anonymous user lands on marketing → signs up → onboarding → dashboard. Inside the app shell they navigate to Collections, Groups, Items, Trash, Activity, Import, Settings, Billing, or Share management. Anyone (even logged-out) can open `/t/{slug}` to view a public share.
