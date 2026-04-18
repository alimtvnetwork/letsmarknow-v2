# Personas

Three primary personas drive every product decision. When in doubt, optimize for **Persona 1 (Solo Power User)** first, **Persona 2 (Small Team)** second, **Persona 3 (Public Sharer)** third.

---

## Persona 1 — Solo Power User ("Riad")

**Role:** Senior developer / founder. Lives in 80+ tabs across 3 Chrome windows daily.

**Goals**
- Save and re-find any tab in under 5 seconds.
- Group tabs by client / project / topic.
- Never lose context when restarting the browser or the laptop.
- Keep work, personal, and side-project tabs strictly separate.

**Frustrations with current tools**
- Toby's free tier is too small (60 tabs); paid is fine but UI feels old.
- Tab Extend has only 8 categories — not enough for 6 clients.
- Neither tool has Ctrl+K.
- Neither remembers which window a tab came from.
- No undo when accidentally deleting a Collection.

**Key flows we must nail**
- New Tab opens → instantly sees their Workspace bubbles, Spaces, Collections.
- Ctrl+K → type 3 letters → Enter → tab opens (or focuses if already open).
- Drag a tab from the Open Tabs panel → drops into a Collection → tab closes.
- Ctrl+Z immediately after a delete → restored.

**Plan they will buy:** Pro or Lifetime.

---

## Persona 2 — Small Team Lead ("Sara")

**Role:** Marketing manager at a 12-person agency. Coordinates campaigns across 4 clients.

**Goals**
- One shared Space per client, with sub-Collections per campaign.
- Onboard new hires by handing them a single share link.
- Audit who added or removed what.
- Use her company Google Workspace to log everyone in (SSO).

**Frustrations with current tools**
- Toby's collaboration is shallow (no roles beyond view/edit).
- Tab Extend doesn't allow group-level sharing at all.
- No SSO means manual user management.
- No audit log.

**Key flows we must nail**
- Invite teammate by email → role = Editor → they see only the Spaces they're invited to.
- Share a single Collection externally with a password and 30-day expiry.
- Audit log shows: "Sara moved 12 items from 'Drafts' to 'Published' on 2026-04-18 14:22".
- SSO with Google Workspace logs the whole team in automatically.

**Plan they will buy:** Team.

---

## Persona 3 — Public Sharer / Creator ("Alex")

**Role:** YouTuber / blogger / educator. Curates lists of tools, gear, articles, courses.

**Goals**
- Maintain a public link like `letsmarknow.com/t/my-gear` for the audience.
- Update the link's contents anytime — viewers always see the latest.
- Optionally password-protect premium lists for paying followers.
- Track how many times the link was viewed and which items were clicked.

**Frustrations with current tools**
- Toby's public share URLs are ugly and not customizable.
- Tab Extend can't share at all publicly.
- No view/click analytics on shared lists.
- No password protection.

**Key flows we must nail**
- Right-click a Collection → "Share publicly" → custom slug `my-gear` → copy link.
- Edit any Item — the public viewer reflects the change within seconds.
- Toggle password ON → set "patreon2026" → only paying followers get in.
- View analytics: "1,247 views this month, top-clicked: Sony A7IV (412 clicks)."

**Plan they will buy:** Pro.

---

## Secondary personas (out of scope for v1 design decisions, in scope for v1 functionality)

- **Researcher / PhD student** — long-lived Spaces of academic sources, citations, papers. Behaves like Persona 1.
- **Designer** — heavy use of Compact view (favicons of inspiration sites). Behaves like Persona 1 with stronger preference for visual modes.
- **Enterprise IT admin** — provisions seats, configures SSO, enforces data retention. Light user of the product itself; heavy user of `17-admin-org/`.

---

## Anti-personas (we are NOT building for these)

- ❌ Casual web user with < 10 bookmarks — Chrome's built-in bookmarks bar is enough.
- ❌ Notion power user wanting full WYSIWYG inside notes — use Notion.
- ❌ Read-it-later reader (Pocket / Instapaper) — no offline article rendering.
- ❌ Password manager replacement — we never store credentials.
