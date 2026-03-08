# Ritual Content System

Русскоязычный контент для режима Free Ritual (5 раундов, 20–30 минут).

**Тон:** интимный, игривый, атмосферный
**Принципы:** минимализм, поддержка tension curve, создание погружения

---

## Структура файлов

### 1. `ritual-config.ts`
Базовая конфигурация раундов (таймеры, правила).

```typescript
import { ROUNDS, TOTAL_RITUAL_DURATION } from './ritual-config'

// Пример: получить длительность раунда 3
const round3Duration = ROUNDS[2].duration // 300 секунд
```

### 2. `ritual-content.ts`
Расширенный контент: описания, переходы, финальное сообщение.

**Содержит:**
- `ROUND_CONTENT` — детальные описания, mood-setter фразы, hints
- `TRANSITIONS` — фразы для переходов между раундами
- `FINAL_MESSAGE` — сообщение после завершения ritual

**Примеры использования:**

```typescript
import { getRoundContent, getTransition, FINAL_MESSAGE } from './ritual-content'

// Получить контент для раунда 1
const round1Content = getRoundContent(1)
console.log(round1Content.moodSetter) // "Пять минут только для ваших глаз."

// Получить переход от раунда 2 к раунду 3
const transition = getTransition(2, 3)
console.log(transition.text) // "Время соблазнения"

// Финальное сообщение
console.log(FINAL_MESSAGE.title) // "Правил больше нет"
```

### 3. `ritual-microcopy.ts`
Микрокопи для UI элементов (кнопки, уведомления, ошибки).

**Примеры:**

```typescript
import { MICROCOPY, getRandomAtmosphericPhrase } from './ritual-microcopy'

// Кнопка старта
<Button>{MICROCOPY.preRitual.startButton}</Button>

// Уведомление о начале раунда
showNotification(MICROCOPY.notifications.roundStarted('Зрительный контакт'))

// Случайная атмосферная фраза
const phrase = getRandomAtmosphericPhrase() // "Наслаждайтесь моментом."
```

---

## Использование в компонентах

### Экран раунда

```tsx
import { ROUNDS } from './constants/ritual-config'
import { getRoundContent } from './constants/ritual-content'
import { MICROCOPY } from './constants/ritual-microcopy'

function RoundScreen({ roundId }: { roundId: 1 | 2 | 3 | 4 | 5 }) {
  const round = ROUNDS[roundId - 1]
  const content = getRoundContent(roundId)

  return (
    <View>
      <Text style={styles.roundName}>{round.name}</Text>
      <Text style={styles.moodSetter}>{content.moodSetter}</Text>
      <Text style={styles.description}>{content.extendedDescription}</Text>

      {/* Правила */}
      <View>
        <Text>{MICROCOPY.roundInfo.allowed}:</Text>
        {round.allowed.map(item => <Text key={item}>✓ {item}</Text>)}

        <Text>{MICROCOPY.roundInfo.forbidden}:</Text>
        {round.forbidden.map(item => <Text key={item}>✗ {item}</Text>)}
      </View>

      {/* Таймер */}
      <Timer duration={round.duration} />
    </View>
  )
}
```

### Экран перехода между раундами

```tsx
import { getTransition } from './constants/ritual-content'

function TransitionScreen({ from, to }: { from: number, to: number }) {
  const transition = getTransition(from, to)

  return (
    <View style={styles.transitionScreen}>
      <Text style={styles.transitionText}>{transition.text}</Text>
      {transition.subtext && (
        <Text style={styles.transitionSubtext}>{transition.subtext}</Text>
      )}
      <Button onPress={handleContinue}>Продолжить</Button>
    </View>
  )
}
```

### Финальный экран

```tsx
import { FINAL_MESSAGE } from './constants/ritual-content'

function FinalScreen() {
  return (
    <View style={styles.finalScreen}>
      <Text style={styles.finalTitle}>{FINAL_MESSAGE.title}</Text>
      <Text style={styles.finalBody}>{FINAL_MESSAGE.body}</Text>
      {FINAL_MESSAGE.cta && <Button>{FINAL_MESSAGE.cta}</Button>}
    </View>
  )
}
```

---

## Tension Curve

Контент спроектирован для поддержки кривой напряжения:

**Раунд 1:** Лёгкость, флирт, взгляды
**Раунд 2:** Первые прикосновения, игривость
**Раунд 3:** Соблазнение, температура растёт
**Раунд 4:** Пик напряжения, почти без границ
**Раунд 5:** Финальный момент перед развязкой
**→ Финал:** "Правил больше нет" — кульминация

---

## Дизайн-система

Рекомендации по типографике и тону:

- **Round names:** крупный шрифт, акцентный цвет (#FF4F8B)
- **Mood setters:** средний размер, курсив, мягкий белый (#FFFFFF 80%)
- **Descriptions:** обычный текст, белый (#FFFFFF)
- **Transitions:** крупный текст с breathing/pulse анимацией
- **Microcopy:** мелкий текст, secondary цвет (#FF8A3D)

---

## Safety & Consent

Весь контент учитывает принципы consent-first:
- Возможность паузы в любой момент (`MICROCOPY.pause`)
- Мягкие формулировки ("разрешено", "запрещено")
- Напоминание о возможности остановиться
- Никаких давящих или агрессивных фраз

---

## Расширение контента

Для добавления нового контента:

1. **Новый раунд:** Добавить в `ritual-config.ts` + `ritual-content.ts`
2. **Новая transition фраза:** Добавить в `TRANSITIONS` массив
3. **Новый UI элемент:** Добавить в `MICROCOPY`
4. **Atmospheric фразы:** Расширить `MICROCOPY.atmospheric`

---

## Checklist интеграции

- [ ] Импортировать конфиги в нужные компоненты
- [ ] Реализовать экраны раундов с контентом
- [ ] Реализовать transition screens
- [ ] Добавить финальный экран
- [ ] Подключить таймеры
- [ ] Реализовать паузу/выход
- [ ] Добавить рулетку (раунд 2)
- [ ] Добавить выбор партнёра (раунд 3)
- [ ] Протестировать весь flow end-to-end

---

**Status:** ✅ Весь контент готов для интеграции

**Next steps:** Передать iOS developer для имплементации UI + таймеров + логики переходов.
