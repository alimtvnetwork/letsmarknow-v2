# 10-licensing-billing — Flow Diagram

**What this folder does:** plans, entitlements, Stripe/Paddle, lifetime licenses, seats, invoices, dunning, coupons, refunds, webhooks.
**User perspective:** "I want to upgrade / change plan / pay / cancel."

```mermaid
flowchart TD
    USR[User on Free plan] --> HIT{Hits a limit?}
    HIT -->|yes| MODAL[Upgrade modal]
    HIT -->|no| OK[Keep using]

    USR --> BIL[/billing page/]
    BIL --> PICK[Pick plan: Pro · Team · Lifetime]
    PICK --> CHK[Stripe / Paddle checkout]
    CHK --> WH[Webhook -> backend]
    WH --> LIC[(licenses table updated)]
    LIC --> ENT[Entitlements engine recalculates]
    ENT --> UI[Limits + features unlock instantly]

    BIL --> INV[Invoices · payment method · tax]
    BIL --> CAN[Cancel -> grace -> downgrade]
    CAN --> DUN[Dunning emails on failed payment]
```

**Plain walkthrough:** User hits a Free limit → upgrade modal → checkout → webhook updates the license → entitlements engine flips features on. From the billing page they manage invoices, payment method, cancellation, and tax info.
