# RevenueCat Setup v1

## Environment variables

Set these in `.env` (do not commit real values):

- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_PREMIUM_ENTITLEMENT_ID` (default: `premium`)
- `EXPO_PUBLIC_REVENUECAT_OFFERING_ID` (default: `default`)
- `EXPO_PUBLIC_REVENUECAT_ANNUAL_PRODUCT_ID`
- `EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID`

## RevenueCat dashboard configuration

1. Create entitlement: `premium` (or your custom ID).
2. Create products in App Store Connect / Google Play and import them into RevenueCat.
3. Create offering `default` with packages:
   - Annual package mapped to annual product (with 7-day trial configured in store).
   - Monthly package mapped to monthly product (no trial).
4. Attach packages to the `premium` entitlement.

## App integration points

- SDK init and entitlement sync: `lib/revenuecat.ts`, called from `app/_layout.tsx`.
- Paywall actions:
  - Annual trial purchase
  - Monthly subscription purchase
  - Restore purchases
  in `app/paywall.tsx`.
- Premium gating by entitlement status in `stores/subscription.store.ts` and `app/(main)/ritual/index.tsx`.

## Sandbox/dev verification checklist

1. Start app in a development build (not Expo Go).
2. Open Premium from Ritual mode selector.
3. Buy annual plan in Sandbox test account.
4. Confirm user is routed to Premium consent flow and premium mode is unlocked.
5. Reinstall app / log out sandbox account and run `Restore purchases`.
6. Confirm premium entitlement is restored and gating remains unlocked.

## Security note

Only public SDK keys are used in app env (`EXPO_PUBLIC_*`). Do not put RevenueCat secret API keys in the mobile app.
