# 18-analytics-telemetry — Flow Diagram

**What this folder does:** opt-in usage analytics + error reporting + a fixed event vocabulary.
**User perspective:** mostly invisible, but the user controls whether it runs.

```mermaid
flowchart TD
    NEW[New user signs up] --> ASK[Onboarding asks: share usage data?]
    ASK -->|Opt in| ON[Telemetry ON]
    ASK -->|Opt out| OFF[Telemetry OFF]
    ASK -.toggle later in settings.- ON
    ASK -.toggle later in settings.- OFF

    USE[User uses the app] --> EV{Telemetry ON?}
    EV -->|yes| TRK[track event from 03-events.md vocab]
    EV -->|no| SKIP[Nothing sent]
    TRK --> AGG[Aggregated dashboards · PII-free]

    USE --> ERR{Crash / error?}
    ERR --> RPT[Error report sent with stack only]
    RPT --> TRIAGE[Team triages]
```

**Plain walkthrough:** During onboarding the user picks opt-in or opt-out. If opted in, predefined events are sent (no PII). Errors are reported with stack traces only, regardless of opt-in (per spec policy).
