/**
 * Ritual Content — Russian text content for Free Ritual mode
 *
 * Tone: intimate, playful, atmospheric
 * Purpose: support tension curve, create immersive experience
 */

export interface RoundContent {
  roundId: 1 | 2 | 3 | 4 | 5
  extendedDescription: string
  moodSetter: string // atmospheric phrase at round start
  duringRoundHints: string[] // optional hints/reminders during round
}

export interface TransitionPhrase {
  from: number | 'intro' // 'intro' for pre-round-1, or round number
  to: number // next round number
  text: string
  subtext?: string // optional smaller text
}

export interface FinalMessage {
  title: string
  body: string
  cta?: string // optional call-to-action
}

// ============================================================================
// EXTENDED ROUND CONTENT
// ============================================================================

export const ROUND_CONTENT: RoundContent[] = [
  {
    roundId: 1,
    extendedDescription:
      'Первый раунд — это про взгляды, про то, чтобы замедлиться и увидеть друг друга заново. Говорите, смейтесь, позвольте напряжению медленно расти.',
    moodSetter: 'Пять минут только для ваших глаз.',
    duringRoundHints: [
      'Не спешите. Просто смотрите.',
      'Расскажите, что вам нравится в партнёре.',
      'Улыбайтесь. Флиртуйте.',
    ],
  },
  {
    roundId: 2,
    extendedDescription:
      'Рулетка решит, кто начинает. Первые прикосновения — лёгкие, игривые. Короткие поцелуи разрешены, но одежда пока остаётся на месте.',
    moodSetter: 'Прикосновения меняют всё.',
    duringRoundHints: [
      'Начните медленно.',
      'Обратите внимание на реакцию партнёра.',
      'Короткие поцелуи разрешены, но не увлекайтесь.',
    ],
  },
  {
    roundId: 3,
    extendedDescription:
      'Выберите, кто начнёт раздевать партнёра. Это раунд соблазнения: прикосновения становятся смелее, температура растёт. Но секс пока под запретом.',
    moodSetter: 'Соблазняйте. Дразните. Наслаждайтесь процессом.',
    duringRoundHints: [
      'Не торопитесь к финалу.',
      'Дразните друг друга.',
      'Наслаждайтесь каждым моментом.',
    ],
  },
  {
    roundId: 4,
    extendedDescription:
      'Теперь можно всё — кроме кульминации. Поцелуи, объятия, близкое взаимодействие. Напряжение на пике. Ещё немного, и правила исчезнут.',
    moodSetter: 'Почти без границ.',
    duringRoundHints: [
      'Вы почти у цели.',
      'Удерживайте напряжение.',
      'Ещё чуть-чуть...',
    ],
  },
  {
    roundId: 5,
    extendedDescription:
      'Последний раунд перед развязкой. Обнимитесь, посмотрите друг другу в глаза. Когда таймер закончится — все правила исчезают.',
    moodSetter: 'Две минуты тишины перед бурей.',
    duringRoundHints: [
      'Обнимитесь крепче.',
      'Почувствуйте этот момент.',
      'Правила скоро исчезнут.',
    ],
  },
]

// ============================================================================
// TRANSITION PHRASES
// ============================================================================

export const TRANSITIONS: TransitionPhrase[] = [
  {
    from: 'intro',
    to: 1,
    text: 'Начинаем Ritual',
    subtext: 'Отложите телефон. Настройтесь друг на друга.',
  },
  {
    from: 1,
    to: 2,
    text: 'Переходим к прикосновениям',
    subtext: 'Рулетка решит, кто начинает.',
  },
  {
    from: 2,
    to: 3,
    text: 'Время соблазнения',
    subtext: 'Становится жарче.',
  },
  {
    from: 3,
    to: 4,
    text: 'Границы почти стёрты',
    subtext: 'Всё, кроме финала.',
  },
  {
    from: 4,
    to: 5,
    text: 'Последний раунд',
    subtext: 'Скоро все правила исчезнут.',
  },
]

// ============================================================================
// FINAL MESSAGE
// ============================================================================

export const FINAL_MESSAGE: FinalMessage = {
  title: 'Правил больше нет',
  body: 'Ritual завершён. Дальше — только вы.',
  cta: 'Закрыть',
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get extended content for a specific round
 */
export function getRoundContent(roundId: 1 | 2 | 3 | 4 | 5): RoundContent | undefined {
  return ROUND_CONTENT.find(rc => rc.roundId === roundId)
}

/**
 * Get transition phrase between rounds
 */
export function getTransition(from: number | 'intro', to: number): TransitionPhrase | undefined {
  return TRANSITIONS.find(t => t.from === from && t.to === to)
}

/**
 * Get a random hint for a round (useful for showing variety during round)
 */
export function getRandomHint(roundId: 1 | 2 | 3 | 4 | 5): string | undefined {
  const content = getRoundContent(roundId)
  if (!content || content.duringRoundHints.length === 0) return undefined

  const randomIndex = Math.floor(Math.random() * content.duringRoundHints.length)
  return content.duringRoundHints[randomIndex]
}
