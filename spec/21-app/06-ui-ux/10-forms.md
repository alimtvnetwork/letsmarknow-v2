# Forms

Patterns, validation, autosave, dirty-state UX.

---

## 1. Stack

- `react-hook-form` for state.
- `zod` for schemas.
- `@hookform/resolvers/zod` adapter.
- shadcn `Form*` primitives for layout.

## 2. Schema-first

Every form starts with a Zod schema:

```ts
const ProfileSchema = z.object({
  display_name: z.string().min(1, "Required").max(80, "Too long"),
  email: z.string().email("Invalid email"),
  locale: z.enum(["en", "fr", "es", "de", "ja", "zh"]),
  timezone: z.string(),
});
type ProfileInput = z.infer<typeof ProfileSchema>;
```

Server reuses the same schema (shared `packages/schemas/`) so client + server validation can never drift.

## 3. Patterns by intent

### 3.1 Settings page (autosave)
- One field at a time edited.
- Save on blur (debounced 800 ms while typing).
- Inline saved/saving indicator beside field label.
- Errors appear inline below field; field border turns `--destructive`.

### 3.2 Settings group (bulk save)
- Cluster of related fields (e.g. "Defaults & policy").
- Sticky bottom bar appears when ANY field dirty: "You have unsaved changes" + `[Discard]` `[Save]`.
- Save submits whole group atomically with `If-Match`.

### 3.3 Modal form (create / quick edit)
- Primary CTA at bottom-right; cancel left.
- Submit on `Enter` from any input (except textarea: `Cmd+Enter`).
- Loading: button shows spinner + label changes ("Saving…").
- Success: modal closes + toast.
- Error: modal stays; banner at top with error; preserve user input.

### 3.4 Multi-step wizard
- Progress bar at top.
- Each step its own RHF form; data persisted in parent state.
- Back / Next / Skip / Finish buttons.
- Cannot Next until current step valid.
- Progress saved to local storage to survive refresh during step ≥ 2.

## 4. Inputs

- `<Input>`, `<Textarea>`, `<Select>`, `<Combobox>`, `<DatePicker>`, `<ColorPicker>` from shadcn.
- Always paired with `<Label>` (visible or `sr-only`).
- Placeholder text is *example*, never label substitute.
- `autocomplete` attribute set per [WHATWG list].

## 5. Validation timing

| Trigger | When |
|---|---|
| `onBlur` | All fields by default |
| `onChange` | Async checks (slug uniqueness, password score) — debounced 400 ms |
| `onSubmit` | Final pass via `mode: "onTouched"` + submit revalidation |

Don't show errors before the user has interacted (avoid red-on-load).

## 6. Error display

- Inline message under field (`<FormMessage>`).
- Field gets `aria-invalid="true"` and `aria-describedby` linking to message.
- Field border `border-destructive`, label `text-destructive`.
- Server-side errors merged into RHF via `setError`.

Top-level form error (e.g. "Couldn't save"): `Alert variant="destructive"` at form top with retry CTA.

## 7. Dirty-state UX

- Bottom save bar (bulk save).
- Warn before navigating away if dirty: `<NavigationGuard>` uses TanStack Router's `useBlocker`.
- "You have unsaved changes — leave anyway?" modal.
- Browser `beforeunload` set when dirty + form has destructive consequences.

## 8. Autosave specifics

- Debounce 800 ms after last keystroke.
- Optimistic update of cache (TanStack Query `setQueryData`).
- On success: small "Saved" indicator fades in for 1.5 s.
- On error: indicator turns into "Couldn't save · [Retry]" until resolved or dismissed.
- On 409 conflict: open conflict resolver (3-way merge) modal.

## 9. Number, date, currency inputs

- Numbers: `inputMode="numeric"` + custom mask via `react-imask` if needed (e.g. seat counts).
- Dates: `react-day-picker` via shadcn `<Calendar>` + Popover trigger.
- Currency: shows symbol prefix per locale via `Intl.NumberFormat`.
- Color: HSL picker with hex/rgb fallback inputs (writes HSL canonical).

## 10. Combobox patterns

- Email chips (invite member): comma/Enter to commit; backspace removes last.
- Tag picker: same; allows "create new" inline.
- Member picker: searches server (debounced 300 ms); shows avatar + name + email.

## 11. File inputs

- Hidden native `<input type="file">` driven by styled button + drop zone.
- Validate type, size client-side; show preview if image.
- Upload via signed URL; progress bar; abort button.
- Error states explicit (size/type/network).

## 12. Accessibility

- Every input has visible or `sr-only` label.
- Required fields marked with `aria-required="true"` and visible asterisk if visually relevant.
- Error messages announced via `aria-live="polite"`.
- Focus moves to first error on submit failure.
- No floating labels (hard to read for low-vision users); always above input.

## 13. Anti-patterns (forbidden)

- Disabling the submit button without explanation (use error messages instead).
- Submitting on blur for destructive operations.
- Using form fields for non-form interactions (e.g. checkbox-as-button).
- Multi-column forms without responsive collapse.
- Hidden errors below the fold without scroll-into-view.

## 14. Internationalization

- All labels and validation messages from `i18n` catalogs.
- Validation messages parameterized (`min`, `max`) via interpolation.
- RTL layouts mirror form bar buttons.

## 15. Telemetry

- `form.submitted` `{ form_id, success: bool, duration_ms }`
- `form.validation_failed` `{ form_id, field_count }`
- `form.autosave_conflict` `{ form_id }`
- `form.dirty_navigation_blocked` `{ form_id }`

## 16. Testing

- Each form has a happy-path Cypress test + a validation-failure test.
- RHF schemas snapshot-tested to detect breaking changes.
- A11y axe checks per form story.
