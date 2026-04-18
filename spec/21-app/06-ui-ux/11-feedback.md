# Feedback

Toasts, banners, modals, confirms — when to use which.

---

## 1. Decision matrix

| Severity | User must act? | Surface | Example |
|---|---|---|---|
| Info, transient | No | Toast | "Saved", "Copied", "Sync done" |
| Info, persistent | No | Inline notice / banner | "Trial ends in 3 days" |
| Confirmation needed | Yes (low risk) | Inline confirm / popover | "Remove tag?" |
| Confirmation needed | Yes (destructive) | Modal `AlertDialog` | "Delete forever?" |
| System-wide alert | Maybe | Top app banner | "Payment failed", "New version available" |
| Recoverable error | Soft | Toast w/ Retry | "Couldn't save. Retry" |
| Blocking error | Hard | Inline error in surface | Form field error |
| Catastrophic error | Hard | Full-page error state | 500, network down for app |

## 2. Toasts (sonner)

- Bottom-right (top on mobile to avoid thumb area).
- Max 3 stacked; older auto-dismiss.
- Default 4 s; with action 8 s; success 3 s.
- Variants: `default | success | warning | destructive | loading`.
- Loading toast can be promoted to success/error via `sonner.promise()`.

Anatomy:
```
[ icon ] [ message ]            [ action ]   [ × ]
```

Uses:
- "Saved", "Copied to clipboard"
- "Couldn't save — Retry"
- "Item moved to Quick Tools — Undo"
- "Imported 142 items"

Don'ts:
- Never stack > 3 (older slide out).
- Never use for confirmations.
- Never reduce font below `text-sm`.

## 3. Banners (in-app)

Stacked at top of `<main>`. Persistent until resolved or dismissed (per banner rules).

| Banner type | Persist | Dismissable | Color |
|---|---|---|---|
| `subscription.past_due` | Until resolved | No | destructive |
| `subscription.trial_ending` | Until 24h before | Yes (24h) | warning |
| `entitlement.changed` | 5s | Auto | success |
| `extension.recommend_install` | Forever or until dismissed | Yes (forever) | info |
| `version.update_required` | Until reload | No | warning |
| `org.member_invited_you` | Until accepted/declined | No (clickable) | info |
| `offline` | While offline | No | muted |

## 4. Modals

### 4.1 `Dialog` (informational/edit)

- Used for create/edit forms, share sheet, picker, analytics drawer (drawer variant).
- Max width 560 px (default), 720 px for large forms.
- Vertical scroll inside body if content overflows; sticky header + footer.
- Close on backdrop click and `Escape`.

### 4.2 `AlertDialog` (destructive confirmation)

- Used for: delete, purge, transfer ownership, cancel subscription.
- Cannot close on backdrop click; only explicit Cancel or Confirm.
- Confirm button is `destructive` variant for delete/purge; primary otherwise.
- Type-to-confirm pattern for high-stakes actions ("delete <name>").

### 4.3 Drawer (mobile + analytics)

- Slides from right (desktop) or bottom (mobile).
- Drag-handle on mobile; swipe down dismisses.
- Used for: item analytics, share analytics, filter panel on mobile.

## 5. Inline confirms

- For low-risk actions (remove tag, dismiss banner): inline popover `"Remove? [Yes] [No]"`.
- Don't use modals for these — too disruptive.

## 6. Empty / error / loading

Three-state guarantee enforced — see `12-empty-error-loading.md`.

## 7. Microcopy patterns

- **Action-led**: "Delete collection" not "Delete?".
- **Specific**: "Couldn't save 'Marketing reads' — try again" beats "Error".
- **Honest**: "We're investigating" not "Everything is fine" when something is broken.
- **No jargon**: "couldn't connect" not "ECONNREFUSED".

## 8. Loading states (during action)

| Duration | Treatment |
|---|---|
| < 100 ms | Nothing (don't flash) |
| 100–600 ms | Button shows spinner + label change |
| 600–2000 ms | Skeleton or progress bar |
| > 2000 ms | Inline progress with explanation; cancel button if possible |
| > 30 s | Background job; freed UI; status checked via polling |

## 9. Success patterns

- Subtle: toast or inline check.
- Celebratory (rare, intentional): confetti for first-save, first-share, first-payment, account anniversary. Respects reduced-motion.
- Always show *what* succeeded ("Invited 3 members"), never just "Success".

## 10. Error patterns

- Always include: what happened + why (when known) + what to do next.
- Pair color with icon (color-blind safe).
- Provide retry whenever possible; provide "Contact support" for unknown errors.
- Log to telemetry with `error_id` so support can find it.

## 11. Long-running operations

- Imports, exports, large purges → background jobs.
- Toast on start ("Import started"); progress visible in `/org/:id/import` page or recent-jobs panel.
- Email + push when complete (per user prefs).
- Failed jobs surface in same panel + via banner.

## 12. Optimistic UI

- Most mutations are optimistic.
- On failure: revert + toast "Couldn't <verb>. Retry" + log.
- On 409: open conflict resolver.

## 13. Confirmation skip

- High-frequency safe destructive actions (single-item soft-delete) skip confirmation; rely on toast Undo.
- Bulk delete (≥ 5 items) re-introduces confirmation.

## 14. A11y

- Toasts: `role="status"` (default) or `role="alert"` (errors).
- Banners: `role="status"` or `role="alert"` based on severity.
- Modals: focus trap, restore on close, `aria-labelledby` on dialog.
- AlertDialogs: `role="alertdialog"` + initial focus on Cancel (safe default).

## 15. Telemetry

- `feedback.toast_shown` `{ variant }`
- `feedback.toast_action_clicked` `{ action_id }`
- `feedback.banner_shown` `{ id }`
- `feedback.banner_dismissed` `{ id }`
- `feedback.modal_opened` `{ id }`
- `feedback.modal_confirmed` / `_canceled`
- `feedback.error_shown` `{ surface, error_code }`
