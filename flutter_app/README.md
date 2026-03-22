# Ritual Flutter Client

Новый основной клиент приложения на `Flutter/Dart`.

## Архитектура

- `lib/app/` — bootstrap и роутинг
- `lib/core/` — env, Supabase, RevenueCat, analytics, guided audio
- `lib/domain/` — модели, constants и чистая логика
- `lib/features/` — экраны и state по фичам
- `lib/shared/` — дизайн-система и фон `liquid silk`

## Запуск

После установки Flutter SDK и пакетов:

```bash
flutter pub get
flutter run
```

Для прокидывания backend-конфигурации используйте `--dart-define`:

```bash
flutter run \
  --dart-define=SUPABASE_URL=... \
  --dart-define=SUPABASE_ANON_KEY=... \
  --dart-define=AMPLITUDE_API_KEY=... \
  --dart-define=REVENUECAT_IOS_API_KEY=...ы
```
