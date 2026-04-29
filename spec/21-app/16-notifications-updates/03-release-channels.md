# Release Channels

Two channels: `stable` (default, everyone) and `beta` (opt-in power users).

---

## 1. Channel definitions

| Channel | Audience | Cadence | Stability |
|---|---|---|---|
| **stable** | All users (default) | Weekly Tuesday | Production-grade; 2 QA cycles |
| **beta** | Opt-in | Daily / continuous | Feature-complete but may have bugs |

No `dev` / `nightly` channel exposed publicly.

## 2. How to opt in

- Web: Settings → About → "Join beta program" toggle.
- Extension: Options → Channel → "Beta".
- Beta users get distinct visual indicator (small chip "BETA" near app logo).
- Toggle off → next update reverts to stable channel.

## 3. Distribution mechanics

### Web app
- Single CDN serves both; channel determined by Account preference.
- App fetches `/meta.json?channel=beta` for beta users.
- Edge function rewrites HTML asset hashes to point at beta build paths.

### Extension
- Two separate Chrome Web Store listings:
  - `Lets Mark Now` (stable).
  - `Lets Mark Now (Beta)` (separate ID, separate icon w/ beta dot).
- Switching channel = uninstall one, install the other (with data migration via shared `externally_connectable` handoff).
- Self-hosted enterprise: separate `update_url`s per channel.

## 4. Data compatibility

- Beta and stable speak the same API.
- Beta MAY introduce new fields (server tolerates; stable ignores unknown).
- Beta MUST NOT break stable's data shapes.
- Migrations are forward-only; rollback from beta to stable always safe.

## 5. Beta-only features

- Gated by feature flag.
- Flag eval includes channel: `flags.eval('mind_map_v2', { channel: 'beta' })`.
- Spec'd in `07-features/15-feature-flags-and-rollouts.md`.
- "Beta features" page in Settings lists them with toggles.

## 6. Feedback

- Beta UI shows a persistent floating "Send feedback" button (bottom-right).
- Click opens a modal: text + optional screenshot (auto-captured) + console log dump (opt-in).
- Submits to `POST /v1/internal/feedback` → routes to support inbox tagged `beta`.
- Replies via email; in-app reply via notifications panel (future).

## 7. Risk policy

| Risk level | Beta exposure | Stable promotion |
|---|---|---|
| Low (UI tweak) | 100% beta for 3 days | Next stable cycle |
| Medium (new feature) | 100% beta for 1-2 weeks | After feedback triage |
| High (data model change) | 100% beta for 1 month + small stable cohort (1%) | Phased rollout per `../07-features/15-feature-flags-and-rollouts.md` |
| Critical (auth, billing) | Beta + internal-only flag for 2 weeks | Manual approval from 2 engineers |

## 8. Channel-specific telemetry

- All events carry `channel: stable | beta` dimension.
- Beta events sampled at 100%.
- Stable events sampled per `18-analytics-telemetry/`.
- Crash rate per channel monitored; if beta crash rate > 3× stable, auto-pause beta releases.

## 9. UI surfacing of channel

- Settings → About displays current channel + version + last update.
- Beta extension icon has small orange dot.
- Beta web app shows "BETA" chip in shell header.
- Release notes filter chip "Beta only" when on beta channel.

## 10. Switching channel

- Stable → Beta: install/upgrade to beta build; data preserved.
- Beta → Stable: uninstall beta extension, install stable. Web: just toggle. Data preserved (server-side).
- A user can be on different channels per surface (web=stable, extension=beta) — supported but warned ("Mixed channels can show inconsistent features").

## 11. Telemetry

- `channel.opted_in` `{ surface }`
- `channel.opted_out` `{ surface }`
- `channel.feedback_sent` `{ has_screenshot, has_logs }`
- `channel.crash_rate_alert` (server-side only)
- `channel.mixed_channels_detected` `{ web, extension }`

## 12. Edge cases

| Case | Behavior |
|---|---|
| User on beta when their plan downgrades | Stays on beta; channel != entitlement |
| Beta build pulled mid-day for critical bug | Auto-rollback all beta clients to last good build |
| User opens beta extension while logged out | Channel preference loaded from local storage; preserved on login |
| Org admin wants to enforce stable for whole team | Org-level setting in `17-admin-org/`: "Restrict members to stable channel" |
| Region with restricted Chrome Web Store access | Self-hosted CRX for both channels; same opt-in UX |

## 13. Tests

- Channel toggle round-trip.
- Beta build never breaks stable schema (CI contract test).
- Crash-rate auto-pause trigger.
- Feedback submission with screenshot + log capture.
- Migration safety from beta back to stable.
- Org-enforced stable channel honored on member sessions.
