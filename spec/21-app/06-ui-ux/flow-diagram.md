# 06-ui-ux — Flow Diagram

**What this folder does:** the design system — tokens, theming, components, motion, accessibility, copy strings.
**User perspective:** invisible plumbing that makes every screen feel consistent, fast, and accessible.

```mermaid
flowchart LR
    DT[Design tokens<br/>colors · spacing · type] --> THM[Theming light/dark]
    THM --> COMP[Component library<br/>buttons · inputs · cards]
    COMP --> SCR[Every screen in 05-web-app]
    SCR --> USR[User]

    DT --> ICN[Iconography]
    DT --> ILL[Illustration]
    DT --> MOT[Motion presets]
    COMP --> A11Y[Keyboard · ARIA · WCAG]
    COMP --> COPY[Copy strings · voice]
    USR -. feedback toast / empty / loading .-> SCR
```

**Plain walkthrough:** Tokens define color/space/type → theming applies them light/dark → components consume them → screens compose components → user sees a consistent UI with proper keyboard, motion, and copy. Feedback (toasts, empty states, loading) loops back to the user.
