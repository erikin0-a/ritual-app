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

## Как тестировать премиум в тестовом запуске

### Вариант A: Sandbox Apple ID (покупки и «Восстановить покупки»)

**Нужна платная программа Apple Developer** ($99/год) — Sandbox-тестеры и подписки в App Store Connect доступны только с ней.

1. **Создать Sandbox-тестера**  
   [App Store Connect](https://appstoreconnect.apple.com) → Users and Access → Sandbox → Testers → добавить тестовый Apple ID (отдельный email, не ваш основной Apple ID).

2. **Войти Sandbox на устройстве**  
   На iPhone/iPad: **Настройки → App Store → внизу «Sandbox Account»** — войти под тестовым аккаунтом.  
   (В iOS 15+ раздел может называться «Медиа и покупки» или находиться в настройках приложения App Store.)

3. **Сборка и запуск**  
   Запускать приложение в **development build** (не Expo Go), на симуляторе или устройстве.

4. **Проверка покупки**  
   В приложении открыть Premium (Ritual → Guided) → оформить подписку. Оплата идёт через Sandbox (деньги не списываются). Подписка в Sandbox может быть укорочена (например, 5 минут вместо месяца).

5. **Проверка «Восстановить покупки»**  
   Ошибка «Не удалось восстановить покупки. Проверьте Apple ID Sandbox» обычно значит:
   - в App Store на устройстве **не выполнен вход** под Sandbox-аккаунтом (см. п. 2), или  
   - у этого Sandbox-аккаунта **ещё не было покупки** в этом приложении — сначала сделайте тестовую покупку (п. 4), затем «Восстановить покупки».  
   После успешной тестовой покупки восстановление должно проходить без ошибки.

### Вариант B: Локальный тест без Sandbox (только UI/флоу)

Если нужно просто проверить экраны и флоу премиума без реальных покупок:

- В **dev-сборке** (например `npx expo run:ios`), если в `.env` **не заданы** ключи RevenueCat (`EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` пустой или закомментирован), приложение по умолчанию считает пользователя премиум (дефолт из store). Никаких доп. переменных не нужно.
- В production-сборке при отсутствии ключа статус будет `free`.

## Security note

Only public SDK keys are used in app env (`EXPO_PUBLIC_*`). Do not put RevenueCat secret API keys in the mobile app.
