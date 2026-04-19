# 09-auth-accounts — Flow Diagram

**What this folder does:** identity — sign-up, sign-in, OAuth, SSO, sessions, MFA, email verification, account deletion, rate limits.
**User perspective:** how a person becomes (and stays) a logged-in user.

```mermaid
flowchart TD
    VIS[Visitor] --> CHO{Choose method}
    CHO -->|Email + password| EP[Enter email + password]
    CHO -->|Magic link| ML[Enter email -> click link in inbox]
    CHO -->|Google| GO[Google OAuth]
    CHO -->|Apple| AP[Apple OAuth]
    CHO -->|Enterprise SSO| SSO[SAML IdP]

    EP --> VER{Email verified?}
    ML --> VER
    GO --> SESS[Session created]
    AP --> SESS
    SSO --> SESS
    VER -->|no| EVMAIL[Send verification email]
    VER -->|yes| SESS

    SESS --> MFA{MFA enabled?}
    MFA -->|yes| TOTP[Enter 6-digit code]
    MFA -->|no| APP[Enter app]
    TOTP --> APP

    APP --> DEV[Device list · sign out other sessions]
    APP --> DEL[Account deletion -> grace period -> hard delete]
```

**Plain walkthrough:** Visitor picks a sign-in method → email is verified if needed → session created → MFA challenge if enabled → user is in. From settings they can manage devices or delete their account.
