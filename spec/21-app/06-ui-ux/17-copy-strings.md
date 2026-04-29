# Copy Strings — Master EN Catalog

> **Purpose:** Every user-visible string in the product, keyed for i18n. Components reference keys, never hard-coded English.
>
> **Closes:** Blocker B3 from `23-audits/gap-analysis.md`.
>
> **Voice & tone:** see `14-copy-voice.md`. This file is the *content*; that file is the *style*.

---

## 1. Key conventions

- **Dot-notation namespaces:** `<surface>.<group>.<element>` — e.g. `dashboard.empty.title`.
- **Lowercase, snake_case** within segments.
- **Variables** use ICU MessageFormat: `"{count, plural, one {# item} other {# items}}"`.
- **Never concatenate** strings in code. Compose via interpolation only.
- **Locale:** `en` is the source of truth. All other locales translate from `en`.

---

## 2. Global / shared

### 2.1 Buttons (`btn.*`)
| Key | EN |
|---|---|
| `btn.save` | Save |
| `btn.cancel` | Cancel |
| `btn.delete` | Delete |
| `btn.confirm` | Confirm |
| `btn.continue` | Continue |
| `btn.back` | Back |
| `btn.next` | Next |
| `btn.done` | Done |
| `btn.close` | Close |
| `btn.edit` | Edit |
| `btn.duplicate` | Duplicate |
| `btn.move` | Move |
| `btn.share` | Share |
| `btn.copy_link` | Copy link |
| `btn.invite` | Invite |
| `btn.upgrade` | Upgrade |
| `btn.try_again` | Try again |
| `btn.undo` | Undo |
| `btn.redo` | Redo |
| `btn.import` | Import |
| `btn.export` | Export |
| `btn.signin` | Sign in |
| `btn.signup` | Sign up |
| `btn.signout` | Sign out |
| `btn.signin_google` | Continue with Google |
| `btn.signin_apple` | Continue with Apple |
| `btn.signin_email` | Continue with email |

### 2.2 Common labels (`label.*`)
| Key | EN |
|---|---|
| `label.email` | Email |
| `label.password` | Password |
| `label.name` | Name |
| `label.url` | URL |
| `label.title` | Title |
| `label.description` | Description |
| `label.tags` | Tags |
| `label.created` | Created |
| `label.updated` | Updated |
| `label.owner` | Owner |
| `label.role` | Role |
| `label.search` | Search |
| `label.filter` | Filter |
| `label.sort` | Sort |
| `label.required` | Required |
| `label.optional` | Optional |

### 2.3 Status (`status.*`)
| Key | EN |
|---|---|
| `status.loading` | Loading… |
| `status.saving` | Saving… |
| `status.saved` | Saved |
| `status.unsaved` | Unsaved changes |
| `status.syncing` | Syncing… |
| `status.offline` | You're offline |
| `status.reconnecting` | Reconnecting… |

---

## 3. Auth (`auth.*`)

### 3.1 Sign-in / sign-up
| Key | EN |
|---|---|
| `auth.signin.title` | Welcome back |
| `auth.signin.subtitle` | Sign in to your workspace. |
| `auth.signup.title` | Create your account |
| `auth.signup.subtitle` | Free to start. No credit card required. |
| `auth.divider.or` | or |
| `auth.signup.terms` | By continuing, you agree to our [Terms]({tos_url}) and [Privacy Policy]({privacy_url}). |
| `auth.forgot_password` | Forgot your password? |
| `auth.no_account` | Don't have an account? [Sign up]({signup_url}) |
| `auth.has_account` | Already have an account? [Sign in]({signin_url}) |

### 3.2 Email verification
| Key | EN |
|---|---|
| `auth.verify.title` | Check your email |
| `auth.verify.body` | We sent a verification link to **{email}**. It expires in 24 hours. |
| `auth.verify.resend` | Resend email |
| `auth.verify.resent` | Sent. Check your inbox. |

### 3.3 MFA
| Key | EN |
|---|---|
| `auth.mfa.title` | Two-factor verification |
| `auth.mfa.body` | Enter the 6-digit code from your authenticator app. |
| `auth.mfa.recovery_link` | Use a recovery code instead |

---

## 4. Dashboard (`dashboard.*`)

| Key | EN |
|---|---|
| `dashboard.title` | Dashboard |
| `dashboard.greeting.morning` | Good morning, {name} |
| `dashboard.greeting.afternoon` | Good afternoon, {name} |
| `dashboard.greeting.evening` | Good evening, {name} |
| `dashboard.section.recent` | Recently opened |
| `dashboard.section.pinned` | Pinned |
| `dashboard.section.shared_with_me` | Shared with you |
| `dashboard.empty.title` | Nothing here yet |
| `dashboard.empty.body` | Save your first item to get started. |
| `dashboard.empty.cta` | Save a tab |

---

## 5. Spaces / Collections / Groups / Items

### 5.1 Space (`space.*`)
| Key | EN |
|---|---|
| `space.new` | New space |
| `space.rename` | Rename space |
| `space.delete.confirm.title` | Delete this space? |
| `space.delete.confirm.body` | {count, plural, one {# collection} other {# collections}} will move to Trash. You have 30 days to restore. |
| `space.empty.title` | This space is empty |
| `space.empty.body` | Create a collection to organize your items. |
| `space.empty.cta` | New collection |

### 5.2 Collection (`collection.*`)
| Key | EN |
|---|---|
| `collection.new` | New collection |
| `collection.rename` | Rename collection |
| `collection.move` | Move collection |
| `collection.delete.confirm.title` | Delete "{name}"? |
| `collection.delete.confirm.body` | {count, plural, one {# item} other {# items}} will move to Trash. Undo for 30 days. |
| `collection.empty.title` | Empty collection |
| `collection.empty.body` | Drag items here, or save from the extension. |

### 5.3 Group (`group.*`)
| Key | EN |
|---|---|
| `group.new` | New group |
| `group.rename` | Rename group |
| `group.ungroup` | Ungroup |

### 5.4 Item (`item.*`)
| Key | EN |
|---|---|
| `item.open` | Open |
| `item.open_new_tab` | Open in new tab |
| `item.copy_url` | Copy URL |
| `item.move_to` | Move to… |
| `item.add_tag` | Add tag |
| `item.add_note` | Add note |
| `item.delete.confirm.title` | Delete this item? |
| `item.delete.confirm.body` | Moves to Trash. Undo for 30 days. |
| `item.deleted.toast` | Item moved to Trash. |
| `item.deleted.toast.undo` | Undo |

---

## 6. Sharing (`share.*`)

| Key | EN |
|---|---|
| `share.dialog.title` | Share "{name}" |
| `share.dialog.public.label` | Anyone with the link |
| `share.dialog.invite_only.label` | Only people you invite |
| `share.dialog.password.label` | Require a password |
| `share.dialog.password.placeholder` | Enter a password |
| `share.dialog.expiry.label` | Expires |
| `share.dialog.expiry.never` | Never |
| `share.dialog.copy` | Copy link |
| `share.dialog.copied` | Link copied |
| `share.dialog.revoke` | Revoke share |
| `share.dialog.revoked.toast` | Share revoked. The link no longer works. |
| `share.viewer.password.title` | Password required |
| `share.viewer.password.body` | This share is protected. |
| `share.viewer.expired.title` | Link expired |
| `share.viewer.expired.body` | This share link is no longer active. |
| `share.viewer.revoked.title` | Link revoked |
| `share.viewer.revoked.body` | The owner revoked this share. |
| `share.viewer.empty` | This share has no items yet. |

---

## 7. Search & quick-find (`search.*`)

| Key | EN |
|---|---|
| `search.placeholder` | Search your workspace… |
| `search.empty` | No results for "{query}" |
| `search.empty.hint` | Try a different keyword or check your filters. |
| `search.recent` | Recent searches |
| `search.section.items` | Items |
| `search.section.collections` | Collections |
| `search.section.tags` | Tags |
| `search.shortcut_hint` | Press {shortcut} to search |

---

## 8. Trash (`trash.*`)

| Key | EN |
|---|---|
| `trash.title` | Trash |
| `trash.subtitle` | Items here will be permanently deleted after 30 days. |
| `trash.empty.title` | Trash is empty |
| `trash.restore` | Restore |
| `trash.delete_forever` | Delete forever |
| `trash.delete_forever.confirm.title` | Delete forever? |
| `trash.delete_forever.confirm.body` | This cannot be undone. |
| `trash.empty_all` | Empty trash |

---

## 9. Onboarding (`onboarding.*`)

| Key | EN |
|---|---|
| `onboarding.welcome.title` | Welcome to {product_name} |
| `onboarding.welcome.body` | Save tabs, sessions, and links. Find them later in seconds. |
| `onboarding.step.install_extension.title` | Install the browser extension |
| `onboarding.step.install_extension.body` | Save tabs with one click from any browser. |
| `onboarding.step.install_extension.cta` | Add to Chrome |
| `onboarding.step.first_save.title` | Save your first tab |
| `onboarding.step.first_save.body` | Try the extension button now, or paste a URL below. |
| `onboarding.step.organize.title` | Make a collection |
| `onboarding.step.organize.body` | Group related items together. |
| `onboarding.step.invite.title` | Invite your team (optional) |
| `onboarding.step.invite.body` | Share collections with collaborators. |
| `onboarding.skip` | Skip for now |
| `onboarding.complete.title` | You're all set |
| `onboarding.complete.cta` | Open dashboard |

---

## 10. Billing (`billing.*`)

| Key | EN |
|---|---|
| `billing.title` | Billing |
| `billing.plan.current` | Current plan: **{plan_name}** |
| `billing.plan.change` | Change plan |
| `billing.plan.upgrade` | Upgrade |
| `billing.plan.downgrade` | Downgrade |
| `billing.seats.label` | Seats |
| `billing.seats.usage` | {used} of {total} used |
| `billing.payment.title` | Payment method |
| `billing.payment.update` | Update card |
| `billing.invoices.title` | Invoices |
| `billing.invoices.download` | Download |
| `billing.invoices.empty` | No invoices yet. |
| `billing.cancel.title` | Cancel subscription |
| `billing.cancel.confirm.body` | You'll keep access until {until_date}. After that, your workspace becomes read-only. |
| `billing.past_due.banner` | Your last payment failed. [Update payment method]({url}) to keep access. |

---

## 11. Member management (`members.*`)

| Key | EN |
|---|---|
| `members.title` | Members |
| `members.invite.title` | Invite people |
| `members.invite.placeholder` | name@company.com, comma-separated |
| `members.invite.role.label` | Role |
| `members.invite.send` | Send invites |
| `members.invite.sent` | {count, plural, one {# invite sent} other {# invites sent}} |
| `members.role.owner` | Owner |
| `members.role.admin` | Admin |
| `members.role.editor` | Editor |
| `members.role.viewer` | Viewer |
| `members.role.billing` | Billing |
| `members.role.guest` | Guest |
| `members.remove.confirm.title` | Remove {name}? |
| `members.remove.confirm.body` | They lose access immediately. Their items stay in the workspace. |

---

## 12. Import / export (`import.*`, `export.*`)

| Key | EN |
|---|---|
| `import.title` | Import |
| `import.choose.body` | Choose where to import from. |
| `import.source.bookmarks` | Browser bookmarks |
| `import.source.raindrop` | Raindrop.io |
| `import.source.pocket` | Pocket |
| `import.source.csv` | CSV file |
| `import.upload.cta` | Choose file |
| `import.upload.dragdrop` | or drag and drop here |
| `import.progress` | Importing… {done} of {total} |
| `import.complete.title` | Import complete |
| `import.complete.body` | {count, plural, one {# item imported} other {# items imported}}. {dupes, plural, =0 {} one {# duplicate skipped.} other {# duplicates skipped.}} |
| `export.title` | Export |
| `export.format.label` | Format |
| `export.start` | Start export |
| `export.ready.title` | Your export is ready |
| `export.ready.cta` | Download |

---

## 13. Empty / error / loading (`state.*`)

| Key | EN |
|---|---|
| `state.loading.generic` | Loading… |
| `state.empty.generic.title` | Nothing here yet |
| `state.empty.generic.body` | Get started by adding your first item. |
| `state.error.generic.title` | Something went wrong |
| `state.error.generic.body` | Please try again. If it keeps happening, contact support. |
| `state.error.network.title` | Connection lost |
| `state.error.network.body` | Check your internet and try again. |
| `state.error.404.title` | Page not found |
| `state.error.404.body` | The page you're looking for doesn't exist. |
| `state.error.404.cta` | Go to dashboard |
| `state.error.500.title` | Server error |
| `state.error.500.body` | We're working on it. Please try again in a moment. |
| `state.error.403.title` | Access denied |
| `state.error.403.body` | You don't have permission to view this. |

---

## 14. Toast messages (`toast.*`) — used by `../03-api-endpoints/18-error-codes.md`

### 14.1 Auth
| Key | EN |
|---|---|
| `toast.auth.invalid_credentials` | Wrong email or password. |
| `toast.auth.email_not_verified` | Verify your email to continue. |
| `toast.auth.mfa_required` | Two-factor code required. |
| `toast.auth.mfa_invalid` | That code didn't work. Try again. |
| `toast.auth.session_expired` | Your session expired. Please sign in again. |
| `toast.auth.session_revoked` | This session was signed out elsewhere. |
| `toast.auth.oauth_failed` | {provider} sign-in failed. Try again. |
| `toast.auth.oauth_state_mismatch` | Sign-in link expired. Start again. |
| `toast.auth.password_too_weak` | Choose a stronger password. |
| `toast.auth.email_taken` | An account with this email already exists. |
| `toast.auth.reset_token_invalid` | This reset link is invalid. |
| `toast.auth.reset_token_expired` | This reset link expired. Request a new one. |
| `toast.auth.device_not_trusted` | Verify this device from your email. |
| `toast.auth.sso_required` | Your organization requires SSO sign-in. |

### 14.2 Permissions
| Key | EN |
|---|---|
| `toast.perm.denied` | You don't have permission to do that. |
| `toast.perm.role_required` | You need {required_role} access. |
| `toast.perm.org_mismatch` | This belongs to a different workspace. |
| `toast.perm.not_member` | You're not a member of this workspace. |
| `toast.perm.owner_required` | Only the owner can do this. |
| `toast.perm.billing_locked` | Billing issue — access is restricted. |

### 14.3 Not found / conflict / gone
| Key | EN |
|---|---|
| `toast.notfound.generic` | Not found. |
| `toast.notfound.item` | This item no longer exists. |
| `toast.notfound.collection` | This collection no longer exists. |
| `toast.notfound.space` | This space no longer exists. |
| `toast.notfound.group` | This group no longer exists. |
| `toast.notfound.org` | Workspace not found. |
| `toast.notfound.share` | This share link is invalid. |
| `toast.conflict.duplicate` | Already exists. |
| `toast.conflict.version` | Someone else updated this. Refresh to see changes. |
| `toast.conflict.name_taken` | That name is already in use. |
| `toast.gone.soft_deleted` | This is in Trash. Restore it from there. |
| `toast.gone.hard_deleted` | This was permanently deleted. |

### 14.4 Validation
| Key | EN |
|---|---|
| `toast.validation.failed` | Please fix the highlighted fields. |
| `toast.validation.required_field` | {field} is required. |
| `toast.validation.invalid_format` | {field} format is invalid. |
| `toast.validation.too_long` | {field} is too long (max {max}). |
| `toast.validation.too_short` | {field} is too short (min {min}). |
| `toast.validation.invalid_url` | Enter a valid URL. |
| `toast.validation.invalid_email` | Enter a valid email address. |
| `toast.validation.invalid_enum` | Choose one of: {allowed}. |

### 14.5 Sharing
| Key | EN |
|---|---|
| `toast.share.expired` | This share link expired. |
| `toast.share.revoked` | This share was revoked. |
| `toast.share.password_required` | Password required. |
| `toast.share.password_invalid` | Wrong password. {attempts_remaining} attempts left. |
| `toast.share.password_locked` | Too many tries. Try again at {unlock_at}. |
| `toast.share.invite_only` | This share is invite-only. |
| `toast.share.domain_blocked` | Your email domain isn't allowed. |
| `toast.share.quota_exceeded` | Share limit reached. Upgrade to share more. |
| `toast.share.link_invalid` | This link is invalid. |

### 14.6 Billing
| Key | EN |
|---|---|
| `toast.billing.payment_failed` | Payment failed. Update your card to continue. |
| `toast.billing.card_expired` | Your card expired. Add a new one. |
| `toast.billing.past_due` | Payment past due. Access ends {grace_until}. |
| `toast.billing.subscription_canceled` | Subscription canceled. |
| `toast.billing.seat_limit` | Seat limit reached ({current}/{limit}). Upgrade to invite more. |
| `toast.billing.quota_exceeded` | You hit your {quota} limit. Upgrade for more. |
| `toast.billing.downgrade_blocked` | Can't downgrade: {reason} |
| `toast.billing.coupon_invalid` | Coupon code invalid. |
| `toast.billing.coupon_expired` | Coupon expired. |
| `toast.billing.provider_error` | Billing provider error. Try again. |
| `toast.license.invalid` | License key invalid. |
| `toast.license.expired` | License expired. |
| `toast.license.device_limit` | Device limit reached for this license ({limit}). |

### 14.7 Import / export
| Key | EN |
|---|---|
| `toast.import.file_too_large` | File too large (max {max_bytes}). |
| `toast.import.format_unsupported` | Unsupported format. Try: {supported}. |
| `toast.import.parse_failed` | Couldn't read file at line {line}: {reason} |
| `toast.import.quota_exceeded` | Import would exceed your quota. |
| `toast.import.job_failed` | Import failed. We'll keep what was imported. |
| `toast.import.duplicate` | {count} duplicates skipped. |
| `toast.export.job_failed` | Export failed. Try again. |
| `toast.export.not_ready` | Your export isn't ready yet. |

### 14.8 Rate limiting
| Key | EN |
|---|---|
| `toast.rate.limited` | Too many requests. Try again at {reset_at}. |
| `toast.rate.limited_auth` | Too many sign-in attempts. Try again at {unlock_at}. |
| `toast.rate.limited_share_password` | Too many wrong passwords. Try again at {unlock_at}. |
| `toast.abuse.detected` | Unusual activity detected. Contact support. |
| `toast.abuse.ip_blocked` | Your IP is temporarily blocked. |

### 14.9 System
| Key | EN |
|---|---|
| `toast.sys.internal` | Something broke on our end. (ID: {request_id}) |
| `toast.sys.timeout` | Request timed out. Try again. |
| `toast.sys.unavailable` | Service unavailable. Retrying… |
| `toast.sys.maintenance` | We're doing maintenance. Back at {eta}. |
| `toast.sys.dependency_down` | {dependency} is having issues. Try again soon. |
| `toast.sys.feature_disabled` | This feature is currently disabled. |

### 14.10 Realtime
| Key | EN |
|---|---|
| `toast.rt.connection_lost` | Lost connection. Reconnecting… |
| `toast.rt.channel_denied` | You don't have access to this live session. |
| `toast.rt.presence_full` | This session is full. |

---

## 15. Email subjects & bodies (`email.*`)

### 15.1 Subjects
| Key | EN |
|---|---|
| `email.verify.subject` | Verify your {product_name} email |
| `email.welcome.subject` | Welcome to {product_name} |
| `email.password_reset.subject` | Reset your {product_name} password |
| `email.invite.subject` | {inviter_name} invited you to {workspace_name} |
| `email.share_received.subject` | {sharer_name} shared "{name}" with you |
| `email.share_expiring.subject` | Your share "{name}" expires soon |
| `email.payment_failed.subject` | Payment failed for {workspace_name} |
| `email.payment_succeeded.subject` | Receipt from {product_name} |
| `email.subscription_canceled.subject` | Your {product_name} subscription was canceled |
| `email.export_ready.subject` | Your {product_name} export is ready |
| `email.import_complete.subject` | Your import to {workspace_name} is complete |
| `email.security_alert.subject` | Security alert for your {product_name} account |
| `email.weekly_digest.subject` | Your week on {product_name} |

### 15.2 Body openers (lead lines)
| Key | EN |
|---|---|
| `email.verify.lead` | Click below to confirm this is your email. The link expires in 24 hours. |
| `email.welcome.lead` | You're in. Here are three things to try first. |
| `email.password_reset.lead` | We got a request to reset your password. If it wasn't you, ignore this email. |
| `email.invite.lead` | {inviter_name} added you to **{workspace_name}** as a {role}. |
| `email.share_received.lead` | {sharer_name} shared a collection with you. |
| `email.payment_failed.lead` | We couldn't charge your card. Update your payment method to keep access. |
| `email.export_ready.lead` | Your export is ready to download. The link expires in 7 days. |
| `email.security_alert.lead` | New sign-in to your account from {device} in {location}. |

### 15.3 CTAs
| Key | EN |
|---|---|
| `email.cta.verify` | Verify email |
| `email.cta.reset_password` | Reset password |
| `email.cta.accept_invite` | Accept invite |
| `email.cta.view_share` | Open share |
| `email.cta.update_payment` | Update payment |
| `email.cta.download` | Download |
| `email.cta.review_activity` | Review activity |

### 15.4 Footers
| Key | EN |
|---|---|
| `email.footer.support` | Need help? Reply to this email. |
| `email.footer.unsubscribe` | [Unsubscribe]({url}) from {category} emails. |
| `email.footer.address` | {company_legal_name}, {company_address} |

---

## 16. Notifications — in-app (`notif.*`)

| Key | EN |
|---|---|
| `notif.invite_received` | {inviter} invited you to {workspace}. |
| `notif.share_viewed` | Someone viewed "{name}". |
| `notif.share_expiring` | Your share "{name}" expires in {days} days. |
| `notif.import_complete` | Imported {count} items. |
| `notif.payment_failed` | Payment failed. Update your card. |
| `notif.member_joined` | {name} joined the workspace. |
| `notif.empty.title` | You're all caught up |
| `notif.empty.body` | New activity will show up here. |

---

## 17. Locked rules

- **No hard-coded English** in components. Always reference a key.
- **Keys are stable contracts.** Renaming a key requires a deprecation entry.
- **Pluralization** uses ICU plural — never `if (count === 1) ...`.
- **Variables in curly braces** must match the key's documented variable list.
- **Sentence case** for buttons, labels, titles. Never Title Case.
- **No exclamation marks** except in confirmed marketing/onboarding moments.
- **Errors don't blame the user.** "We couldn't…" beats "You did wrong."
- **All toast messages** map 1:1 to an `error_code` in `../03-api-endpoints/18-error-codes.md` or to a system event.
