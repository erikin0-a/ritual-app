# Ritual — iOS App

Мобильное приложение для пар. iOS первым делом. Тёмный дизайн, русский интерфейс.

## Что реализовано (MVP v1)

| Экран | Статус |
|---|---|
| Онбординг (3 шага: уровень близости, длительность, имя партнёра) | ✅ |
| Главный экран → кнопка «Начать Ritual» | ✅ |
| Ритуал: 5 раундов с таймером (круговой прогресс) | ✅ |
| Раунд 2: рулетка «кто начинает» | ✅ |
| Раунд 3: выбор «кто раздевает» | ✅ |
| Экран завершения ритуала | ✅ |
| Автопауза при сворачивании приложения (iOS background) | ✅ |
| Аналитика ключевых событий (Amplitude) | ✅ |
| Режим Dice (базовый) | ✅ |

## Tech Stack

| Слой | Инструмент |
|---|---|
| Mobile framework | React Native + Expo (managed workflow) |
| Язык | TypeScript (strict) |
| Навигация | Expo Router (file-based) |
| State | Zustand |
| Server state | TanStack Query v5 |
| Backend | Supabase |
| Платежи | RevenueCat |
| Аналитика | Amplitude |
| Анимации | Reanimated 3 + Moti |
| Аудио | expo-av |

---

## Как запустить на iPhone

### ⚠️ Нужен ли MacBook?

**Да, MacBook нужен** для запуска на iPhone. Причина:

Приложение использует нативные библиотеки (`react-native-purchases` / RevenueCat, `expo-av`), которые **не поддерживаются** в стандартном Expo Go. Поэтому нужен либо:

**Вариант A — MacBook + Xcode (рекомендуется для разработки):**
- Установить Xcode из App Store
- Подключить iPhone по USB или использовать симулятор
- Запустить `npx expo run:ios`

**Вариант B — EAS Build (облачная сборка, без MacBook):**
- Нужен Apple Developer аккаунт ($99/год)
- Команды ниже в разделе «EAS Build»

---

### Вариант A: MacBook + локальный запуск

#### Требования
- macOS (любой современный)
- Xcode 15+ (из App Store)
- Node.js 22+
- iPhone с iOS 16+ (или симулятор)

#### Установка

```bash
# 1. Клонировать репозиторий
git clone https://github.com/YOUR_USERNAME/ritual-app.git
cd ritual-app

# 2. Установить зависимости
npm install

# 3. Создать .env файл (скопировать пример)
cp .env.example .env
# Заполнить переменные (см. раздел ниже)

# 4. Запустить на симуляторе iOS
npx expo run:ios

# 5. Или запустить на физическом iPhone (подключить по USB)
npx expo run:ios --device
```

#### Переменные окружения

Создать `.env` (этот файл **никогда не коммитить**):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_AMPLITUDE_API_KEY=your-amplitude-key
```

> Без Supabase и Amplitude приложение запустится, но аналитика и аутентификация работать не будут. Для тестирования UI это нормально.

---

### Вариант B: EAS Build (облачная сборка)

Требует Apple Developer аккаунт и EAS CLI.

```bash
# Установить EAS CLI
npm install -g eas-cli

# Войти в Expo аккаунт
eas login

# Сборка для симулятора (бесплатно, без Apple Developer)
eas build --profile development --platform ios

# Сборка для TestFlight / App Store (нужен Apple Developer $99/год)
eas build --profile production --platform ios

# Отправить в App Store
eas submit --profile production --platform ios
```

---

## Структура проекта

```
app/
  (auth)/
    onboarding.tsx     # 3-шаговый онбординг
  (main)/
    index.tsx          # Главный экран
    ritual/
      index.tsx        # Экран выбора режима
      session.tsx      # Активный сеанс (5 раундов + таймер)
    dice.tsx           # Режим Dice
  paywall.tsx          # Paywall (заглушка)
  _layout.tsx          # Root layout с навигацией

components/
  ritual/
    CircularTimer.tsx  # Круговой таймер
  ui/
    Button.tsx
  common/
    ScreenContainer.tsx

stores/
  ritual.store.ts      # State machine сеанса (idle → in_round×5 → completed)
  auth.store.ts        # Профиль + онбординг preferences
  subscription.store.ts

constants/
  theme.ts             # Дизайн-система (цвета, отступы, типографика)
  ritual-config.ts     # Конфиг раундов (SSOT)
  ritual-content.ts    # Контент раундов (правила, фразы)

lib/
  analytics.ts         # Amplitude events
  supabase.ts          # Supabase client
```

## Запуск тестов

```bash
npm test          # Jest тесты
npm run typecheck # TypeScript проверка
npm run lint      # ESLint
```

## ADRs

- [ADR-001: Tech Stack](../shared/adr/ADR-001-tech-stack.md)
- [ADR-002: Architecture](../shared/adr/ADR-002-architecture.md)
- [ADR-003: CI/CD](../shared/adr/ADR-003-cicd.md)
