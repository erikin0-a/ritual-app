import type { DurationPreference } from '@/types'

export interface Round {
  id: 1 | 2 | 3 | 4 | 5
  name: string
  duration: number // seconds
  description: string
  allowed: string[]
  forbidden: string[]
  hasRoulette?: boolean
}

const DURATION_SECONDS: Record<DurationPreference, { round: number; final: number }> = {
  short:    { round: 3 * 60, final: 2 * 60 },  // ~14 min total
  standard: { round: 5 * 60, final: 2 * 60 },  // ~22 min total
  extended: { round: 12 * 60, final: 5 * 60 }, // ~53 min total
}

export function getRitualRounds(duration: DurationPreference = 'standard'): Round[] {
  const { round: roundDuration, final: finalDuration } = DURATION_SECONDS[duration]
  return ROUNDS.map((r) => ({
    ...r,
    duration: r.id === 5 ? finalDuration : roundDuration,
  }))
}

export const ROUNDS: Round[] = [
  {
    id: 1,
    name: 'Зрительный контакт',
    duration: 5 * 60,
    description: 'Смотрите друг другу в глаза. Говорите, флиртуйте.',
    allowed: ['зрительный контакт', 'разговор', 'флирт'],
    forbidden: ['прикосновения', 'поцелуи', 'снятие одежды'],
  },
  {
    id: 2,
    name: 'Первое прикосновение',
    duration: 5 * 60,
    description: 'Рулетка выбирает, кто начинает. Прикосновения и короткие поцелуи.',
    allowed: ['прикосновения', 'короткие поцелуи'],
    forbidden: ['снятие одежды'],
    hasRoulette: true,
  },
  {
    id: 3,
    name: 'Соблазнение',
    duration: 5 * 60,
    description: 'Выберите партнёра для начала раздевания.',
    allowed: ['раздевание', 'прикосновения'],
    forbidden: ['секс'],
  },
  {
    id: 4,
    name: 'Ближе',
    duration: 5 * 60,
    description: 'Поцелуи, объятия, близкое взаимодействие.',
    allowed: ['поцелуи', 'объятия', 'близкое взаимодействие'],
    forbidden: ['кульминация'],
  },
  {
    id: 5,
    name: 'Развязка',
    duration: 2 * 60,
    description: 'Обнимитесь. Смотрите друг другу в глаза. Когда таймер закончится — правил больше нет.',
    allowed: ['всё'],
    forbidden: [],
  },
]

export const TOTAL_RITUAL_DURATION = ROUNDS.reduce((acc, r) => acc + r.duration, 0)
