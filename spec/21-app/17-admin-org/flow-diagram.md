# 17-admin-org — Flow Diagram

**What this folder does:** organization-level controls — settings, members, roles & permissions, audit log, data export/delete.
**User perspective:** "I'm the Owner/Admin and I need to manage my team."

```mermaid
flowchart TD
    ADM[Owner / Admin] --> SET[/settings/org/]
    SET --> NAME[Edit name · logo · domain]
    SET --> MEM[Members tab]
    SET --> AUD[Audit log]
    SET --> DAT[Data export · delete]

    MEM --> INV[Invite by email]
    MEM --> ROLE[Change role: viewer/editor/admin/billing]
    MEM --> RM[Remove member]
    MEM --> XFER[Transfer ownership -> Owner only]

    INV --> NOTIF[Invitee gets email -> accepts -> joins Org]
    ROLE --> RLS[has_role updates -> RLS enforces instantly]
    RM --> ITEMS[User's items stay in Org · created_by retained]
    DAT --> EXP[Download full Org archive]
    DAT --> DEL[Delete Org -> 30d grace]
```

**Plain walkthrough:** Owner/Admin opens Org settings → manages name, members, roles, audit log, and data. Inviting sends an email; changing a role takes effect immediately; removing a member keeps their content but logs the change.
