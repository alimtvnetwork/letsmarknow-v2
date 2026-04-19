# 04-extension — Flow Diagram

**What this folder does:** the Chrome extension that captures tabs/sessions and provides quick search from anywhere in the browser.
**User perspective:** the extension is the fastest way *into* Lets Mark Now without opening the web app.

```mermaid
flowchart TD
    START[User in Chrome] --> CHOICE{How to capture?}
    CHOICE -->|Click toolbar icon| POPUP[Popup opens]
    CHOICE -->|Press shortcut| POPUP
    CHOICE -->|Right-click page| CTX[Context menu: Save to Collection]
    CHOICE -->|Type in address bar| OMNI[Omnibox: lmn <query>]
    CHOICE -->|Open new tab| NEWTAB[New-tab page = dashboard]

    POPUP --> SAVE1[Save current tab]
    POPUP --> SAVE2[Save whole session/window]
    CTX --> SAVE1
    OMNI --> JUMP[Jump to existing Item]
    NEWTAB --> BROWSE[Browse Collections]

    SAVE1 --> SYNC[Service worker syncs to backend]
    SAVE2 --> SYNC
    SYNC --> DONE[Toast: Saved]
```

**Plain walkthrough:** User can save the current tab, the whole window, or jump to a saved item — from the popup, a keyboard shortcut, the right-click menu, the address bar, or the new-tab page. Anything saved goes to the service worker, which syncs it to the backend even if offline.
