# 19-security-privacy — Flow Diagram

**What this folder does:** threat model, data handling, encryption, GDPR/CCPA, share-link security.
**User perspective:** "Is my data safe? Can I get it deleted? Can a bad actor steal a share link?"

```mermaid
flowchart TD
    REQ[Any request] --> AUTH[Auth check -> auth.uid]
    AUTH --> RLS[Row Level Security policies]
    RLS -->|allowed| DB[(Encrypted at rest)]
    RLS -->|denied| F403[403 FORBIDDEN]

    DB --> TRANS[TLS in transit]

    SL[Share link] --> ENT[High-entropy slug]
    ENT --> RATE[Rate-limit guess attempts]
    ENT --> EXP[Optional expiry · password]

    USER[User] --> DSR{GDPR / CCPA request}
    DSR -->|Export| ARCH[Full archive within 30d]
    DSR -->|Delete| HARD[Bypass 30d soft-delete -> hard delete PII]
```

**Plain walkthrough:** Every request is gated by auth + RLS; data is encrypted at rest and in transit. Share links use unguessable slugs and optional password/expiry. Verified GDPR requests bypass the normal trash grace period.
