# Copy & Voice

Tone, terminology, microcopy patterns, error wording.

---

## 1. Voice principles

1. **Plain.** Read-aloud test: would a non-technical friend understand?
2. **Direct.** Say the thing. Skip "please" except where genuinely warranted.
3. **Honest.** No "Oops!" for serious errors. No fake celebrations.
4. **Warm, not cute.** We're competent and friendly; we are not your sassy bestie.
5. **Specific over generic.** "Couldn't save 'Marketing reads'" beats "Error".
6. **Verb-led.** CTAs and headings start with action verbs.
7. **Sentence case.** Everywhere. "Save current tab", not "Save Current Tab".

## 2. Terminology lock

Use exactly these terms; never substitute synonyms.

| Concept | Use | Don't use |
|---|---|---|
| Account | "account" | user, profile (profile = settings page only) |
| Organization | "organization" | team, workspace, group |
| Member | "member" | teammate, user, collaborator |
| Space | "Space" (capitalized as a noun naming the entity) | folder, area, board |
| Collection | "Collection" | folder, list, board |
| Group | "Group" | section, cluster, stack |
| Item | "item" (lowercase in body), "tab" only when describing browser context | bookmark (avoid; old-school) |
| Save (verb) | "Save", "Save tab" | Add, Bookmark, Clip |
| Share | "Share", "Shared link" | Public link, URL share |
| Tag | "tag" | label, keyword |
| Sign in / Sign out | always two words | Login, Logout |
| Sign up | two words | Signup, Register |
| Email | "email" | e-mail |
| OK | "OK" | Okay, Ok |

Plural Spaces/Collections/Groups: "Spaces", "Collections", "Groups" (capitalized in product noun usage; lowercase in generic usage e.g. "create a collection" → also fine, but be consistent within a feature).

## 3. CTAs

- Verb + noun: "Create collection", "Invite member", "Save tab".
- For destructive actions: include the noun ("Delete forever", "Cancel subscription").
- Avoid "Submit", "OK", "Click here".

## 4. Tone by surface

| Surface | Tone |
|---|---|
| Marketing | Confident, slightly playful |
| Onboarding | Warm, encouraging, brief |
| Empty states | Helpful, never apologetic |
| Errors | Honest, specific, action-oriented |
| Settings | Neutral, precise |
| Billing | Trustworthy, no surprises |
| Legal | Plain English with legal terms in parentheses |
| Notifications | Quick, scannable |
| Audit log | Factual, chronological |

## 5. Error messages

Pattern: **What happened — Why (if known) — What to do.**

Examples:

✅ "Couldn't save 'Marketing reads' — your connection dropped. Try again."
✅ "This invite has expired. Ask the organization owner to send a new one."
✅ "Password is too short. Use at least 12 characters."

❌ "An error occurred."
❌ "Something went wrong! Please try again later."
❌ "ECONNRESET"

For unknown errors, include `error_id`:
"Couldn't load this collection. Please [contact support](mailto:?subject=Error%20E-2025-0418-9F2A) (error E-2025-0418-9F2A)."

## 6. Confirmations

- Match the verb of the action: "Delete forever" → "Yes, delete forever".
- Cancel button always says "Cancel" (never "No").
- Type-to-confirm pattern for irreversible org/account actions.

## 7. Empty states

- 1 line headline + 1 line subline.
- Headline neutral or hopeful, never apologetic ("Nothing here yet" not "Sorry, nothing yet").
- Subline explains *what* will appear here.

## 8. Loading text

- "Loading…" generic; better: "Loading your collections…".
- For long ops: "This usually takes a few seconds."
- Imports: "Importing 142 items… 38% done".

## 9. Microcopy patterns

| Context | Pattern |
|---|---|
| Field hint | Sentence under field, `text-muted-foreground` |
| Required marker | `*` only when not all fields are required |
| Optional marker | "(optional)" suffix when most fields are required |
| Help link | "Learn more" linking to docs (always opens new tab) |
| "What's this?" tooltip | trailing `?` icon next to label |
| "New" badge | text "New" not "🆕" |
| "Pro" badge | text "Pro" not lock icon alone (icon + text) |
| Beta features | "Beta" badge and short tooltip |

## 10. Numbers & dates

- Numbers formatted via `Intl.NumberFormat` per locale.
- Dates: "Apr 16, 2026" (short) or "April 16, 2026" (long); always include year.
- Relative times: "just now", "2m ago", "3h ago", "Yesterday", "Apr 16" (more than 7 days uses absolute).
- Currency: `Intl.NumberFormat("en-AU", { style: "currency", currency: "USD" })`.

## 11. Pricing copy

- Always show full price + interval ("$9 / month").
- Yearly: "$84 / year ($7/mo)".
- Tax disclaimer: "Plus tax where applicable."
- Lifetime: "One-time $X — no subscription".

## 12. Notifications copy

- Subject line: noun phrase, ≤ 60 chars ("New invitation to Atto Property").
- Body: 1–2 lines + CTA button.
- No emoji in subject lines.

## 13. Legal

- ToS, Privacy, DPA, Cookies — written in plain language with legal jargon parenthesized.
- Last updated date prominent.
- Diff link to previous version.

## 14. A11y of copy

- No "click here" links — link the descriptive phrase.
- No "see below" — use anchors or expandable sections.
- Avoid spatial directions ("the box on the right") — describe by name.

## 15. Localization

- Source strings in `i18n/<locale>/<surface>.json`.
- Sentence-level keys (avoid concatenation).
- ICU MessageFormat for plurals + selects.
- Pseudo-locale `en-XA` for QA.

## 16. Forbidden

- Exclamation marks in errors ("Error!").
- "Oops" / "Whoops" / "Yikes".
- "Awesome!" / "You rock!" celebratory copy.
- Emoji in product chrome (only in user content).
- ALL CAPS except acronyms and "OK".
- "Just" / "Simply" / "Easy" — patronizing.
- Negative phrasing ("Don't forget…") — say what to do instead.

## 17. Editorial review

- All new strings reviewed by content owner before merge.
- `00-overview/02-glossary.md` lists locked terms + translations.
- Lint rule flags forbidden phrases in source strings.
