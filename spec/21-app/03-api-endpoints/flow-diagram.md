# 03-api-endpoints — Flow Diagram

**What this folder does:** defines the request → response contracts between the web app / extension and the backend.
**User perspective:** the user clicks a button → an endpoint fires → data changes → UI updates.

```mermaid
sequenceDiagram
    participant U as User (web or extension)
    participant FE as Frontend
    participant API as API endpoint
    participant DB as Database (RLS)
    participant LOG as History log

    U->>FE: Click "Save tab"
    FE->>API: POST /items
    API->>DB: insert item (RLS checks role)
    DB-->>API: ok + new id
    API->>LOG: append history event
    API-->>FE: 201 + item payload
    FE-->>U: Toast "Saved" + item appears
    Note over API,U: On error -> 4xx with UPPER_SNAKE_CASE code<br/>(see 18-error-codes.md)
```

**Plain walkthrough:** User clicks → frontend calls the right endpoint → backend checks the user's role → DB writes → history log appended → response returned → UI shows the new item or an error toast with a stable error code.
