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
      'Первый раунд сбрасывает рутину: только взгляд, дыхание и короткие реплики. Цель — снова увидеть партнёра, не касаясь.',
    moodSetter: 'Только взгляд. Без прикосновений.',
    duringRoundHints: [
      'Держите взгляд дольше обычного.',
      'Синхронизируйте вдох и выдох.',
      'Фраз меньше. Внимания больше.',
    ],
  },
  {
    roundId: 2,
    extendedDescription:
      'Рулетка выбирает ведущего. В этом раунде действует один партнёр, второй принимает, чтобы напряжение росло точнее.',
    moodSetter: 'Один ведёт. Второй принимает.',
    duringRoundHints: [
      'Остановитесь в сантиметре перед касанием.',
      'После каждого действия делайте паузу.',
      'Ответ руками пока не нужен.',
    ],
  },
  {
    roundId: 3,
    extendedDescription:
      'Соблазнение идёт волнами: один действует, затем происходит мягкая смена. Ласки только по открытым местам, без снятия одежды.',
    moodSetter: 'Глубже, но всё ещё сдержанно.',
    duringRoundHints: [
      'Кончики пальцев, затем пауза.',
      'Один вдох ближе, один вдох назад.',
      'Слова усиливают действие, но не заменяют его.',
    ],
  },
  {
    roundId: 4,
    extendedDescription:
      'Это раунд молчаливого согласия: касание вещи, взгляд, кивок, медленное снятие. Всё только по очереди и без спешки.',
    moodSetter: 'Почти. Но ещё не сейчас.',
    duringRoundHints: [
      'Кивок важнее скорости.',
      'Если согласия нет, остановитесь и обнимите.',
      'После снятия вещи вернитесь к дыханию.',
    ],
  },
  {
    roundId: 5,
    extendedDescription:
      'Финал держит пик, а не разрешает его. Меньше слов, больше очередности, направленных прикосновений и намеренного контроля.',
    moodSetter: 'Удержите пик до конца таймера.',
    duringRoundHints: [
      'Ведёт один партнёр, затем смена.',
      'Если комфортно, снимайте ещё одну вещь по очереди.',
      'Последняя минута остаётся только вам двоим.',
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
    text: 'Раунд 1. Зрительный контакт',
    subtext: 'Только взгляд, дыхание и точные слова.',
  },
  {
    from: 1,
    to: 2,
    text: 'Раунд 2. Первое прикосновение',
    subtext: 'Рулетка выберет, кто ведёт.',
  },
  {
    from: 2,
    to: 3,
    text: 'Раунд 3. Соблазнение',
    subtext: 'Один действует, потом мягкая смена.',
  },
  {
    from: 3,
    to: 4,
    text: 'Раунд 4. Ближе',
    subtext: 'Согласие взглядом. Медленное снятие вещей.',
  },
  {
    from: 4,
    to: 5,
    text: 'Раунд 5. Пик',
    subtext: 'Меньше слов. Больше напряжения.',
  },
]

// ============================================================================
// FINAL MESSAGE
// ============================================================================

export const FINAL_MESSAGE: FinalMessage = {
  title: 'Ритуал завершён',
  body: 'Я оставляю вас вдвоём. Дальше вы ведёте сами.',
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
