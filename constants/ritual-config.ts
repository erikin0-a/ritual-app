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
  short: { round: 3 * 60, final: 3 * 60 },
  standard: { round: 5 * 60, final: 5 * 60 },
  extended: { round: 8 * 60, final: 8 * 60 },
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
    description: 'Только взгляд, дыхание и короткие фразы. Без прикосновений.',
    allowed: ['зрительный контакт', 'дыхание вместе', 'шёпот', 'флирт'],
    forbidden: ['прикосновения', 'поцелуи', 'снятие одежды'],
  },
  {
    id: 2,
    name: 'Первое прикосновение',
    duration: 5 * 60,
    description: 'Один партнёр ведёт, второй принимает. Разрешены прикосновения и короткие поцелуи.',
    allowed: ['прикосновения', 'короткие поцелуи', 'объятие на паузе'],
    forbidden: ['ответные прикосновения', 'снятие одежды'],
    hasRoulette: true,
  },
  {
    id: 3,
    name: 'Соблазнение',
    duration: 5 * 60,
    description: 'Один действует, второй принимает. Ласки только по открытым местам, затем смена.',
    allowed: ['ласки открытых мест', 'поцелуи', 'контролируемое сближение'],
    forbidden: ['снятие одежды', 'секс', 'ответ руками'],
  },
  {
    id: 4,
    name: 'Ближе',
    duration: 5 * 60,
    description: 'Можно снять 1–2 вещи, но только по очереди и только с согласия.',
    allowed: ['снять 1–2 вещи', 'поцелуи', 'объятия', 'руки на талии'],
    forbidden: ['проникновение', 'секс', 'кульминация'],
  },
  {
    id: 5,
    name: 'Пик',
    duration: 5 * 60,
    description: 'Меньше слов, больше ритма. Удерживайте напряжение до самого конца без финальной развязки.',
    allowed: ['объятия', 'поцелуи', 'прикосновения', 'ведение по очереди'],
    forbidden: ['проникновение', 'секс', 'кульминация'],
  },
]

export const TOTAL_RITUAL_DURATION = ROUNDS.reduce((acc, r) => acc + r.duration, 0)
