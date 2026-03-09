# Analytics Events v1

## Base properties

All events include:

- `platform`: `ios` | `android` | `web`
- `app_version`: app version from Expo config/native bundle
- `session_id`: random app session identifier (non-PII)

## Premium funnel events

- `premium_toggle_clicked`
  - `paywall_source`: string
  - `has_premium_access`: boolean
- `paywall_opened`
  - `paywall_source`: string
- `paywall_cta_clicked`
  - `paywall_source`: string
  - `cta`: `start_trial_annual` | `subscribe_monthly` | `restore_purchases`
- `trial_started`
  - `paywall_source`: string
  - `plan`: `annual`
- `subscription_started`
  - `paywall_source`: string
  - `plan`: `monthly` | `annual`
- `premium_session_started`
  - `mode`: `guided`
- `premium_session_completed`
  - `mode`: `guided`

## Privacy

- No user names, free-text input, or other PII are sent in event payloads.
