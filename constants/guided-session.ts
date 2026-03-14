import type { GuidedBranch, ParticipantId, RoundId } from '@/types'

export type GuidedSetupKind = 'none' | 'roulette' | 'starter-choice'

export interface GuidedStandaloneCue {
  id: string
  voiceKey: string
  subtitle: string
  delayMs: number
  highlightedParticipants?: ParticipantId[]
}

export interface GuidedRoundScene {
  roundId: RoundId
  title: string
  titleShort: string
  transitionTitle: string
  transitionBody: string
  timerHint: string
  atmosphere: string
  ruleHeadline: string
  ruleFootnote: string
  setupKind: GuidedSetupKind
  setupTitle?: string
  setupBody?: string
}

export const GUIDED_PRELUDE_CUES: GuidedStandaloneCue[] = [
  {
    id: 'prelude_intro_rules',
    voiceKey: 'prelude_intro_rules',
    subtitle: 'Добро пожаловать в Ритуал. Правила здесь не запрещают — они создают напряжение и помогают удержать желание.',
    delayMs: 37_000,
  },
  {
    id: 'prelude_consent_wait',
    voiceKey: 'prelude_consent_wait',
    subtitle: 'Если вы оба согласны — приложите пальцы к экрану одновременно и удерживайте.',
    delayMs: 18_000,
    highlightedParticipants: ['p1', 'p2'],
  },
]

export const GUIDED_CONSENT_SUCCESS_CUE: GuidedStandaloneCue = {
  id: 'prelude_consent_success',
  voiceKey: 'prelude_consent_success',
  subtitle: 'Это ваш знак: да. Друг другу. И этому ритуалу.',
  delayMs: 4_500,
  highlightedParticipants: ['p1', 'p2'],
}

export const GUIDED_TRANSITION_CUES: Record<string, GuidedStandaloneCue> = {
  'intro-1': {
    id: 'transition_intro_round_1',
    voiceKey: 'transition_intro_round_1',
    subtitle: 'Раунд первый. Только взгляд.',
    delayMs: 4_000,
  },
  '1-2': {
    id: 'transition_round_1_to_2',
    voiceKey: 'transition_round_1_to_2',
    subtitle: 'Правила меняются. Дальше можно прикасаться.',
    delayMs: 4_000,
  },
  '2-3': {
    id: 'transition_round_2_to_3',
    voiceKey: 'transition_round_2_to_3',
    subtitle: 'Следующий этап. Ласки становятся ближе, но вещи пока остаются на месте.',
    delayMs: 4_500,
  },
  '3-4': {
    id: 'transition_round_3_to_4',
    voiceKey: 'transition_round_3_to_4',
    subtitle: 'Теперь можно снять одну-две вещи. Только по очереди и только с согласием.',
    delayMs: 5_000,
  },
  '4-5': {
    id: 'transition_round_4_to_5',
    voiceKey: 'transition_round_4_to_5',
    subtitle: 'Финальный раунд. Удержите пик ещё немного.',
    delayMs: 4_000,
  },
}

export const GUIDED_ROUND_SCENES: Record<RoundId, GuidedRoundScene> = {
  1: {
    roundId: 1,
    title: 'Раунд 1',
    titleShort: 'Зрительный контакт',
    transitionTitle: 'Зрительный контакт',
    transitionBody: 'Без прикосновений. Только взгляд, дыхание и короткие фразы.',
    timerHint: 'Держите взгляд. Не спешите заполнять тишину.',
    atmosphere: 'Первый раунд возвращает ощущение новизны через паузу и внимание.',
    ruleHeadline: 'Только взгляд',
    ruleFootnote: 'Прикосновения, поцелуи и снятие одежды пока под запретом.',
    setupKind: 'none',
  },
  2: {
    roundId: 2,
    title: 'Раунд 2',
    titleShort: 'Первое прикосновение',
    transitionTitle: 'Первое прикосновение',
    transitionBody: 'Рулетка выберет ведущего. В ответ пока можно только принимать.',
    timerHint: 'После каждого прикосновения делайте паузу.',
    atmosphere: 'Один действует, второй принимает. Это усиливает ожидание.',
    ruleHeadline: 'Один ведёт',
    ruleFootnote: 'Ответ руками не нужен. Одежда остаётся на месте.',
    setupKind: 'roulette',
    setupTitle: 'Кто ведёт этот раунд?',
    setupBody: 'Рулетка выберет партнёра, который начнёт первые прикосновения.',
  },
  3: {
    roundId: 3,
    title: 'Раунд 3',
    titleShort: 'Соблазнение',
    transitionTitle: 'Соблазнение',
    transitionBody: 'Ласки только по открытым местам. Через пару минут будет мягкая смена.',
    timerHint: 'Действует один партнёр, затем происходит смена.',
    atmosphere: 'Раунд построен на приближении, паузе и точных, коротких действиях.',
    ruleHeadline: 'Одежда остаётся',
    ruleFootnote: 'Снимать вещи нельзя. Второй партнёр отвечает только дыханием.',
    setupKind: 'starter-choice',
    setupTitle: 'Кто начнёт соблазнение?',
    setupBody: 'Выберите, кто пойдёт первым. В середине раунда сценарий сам поменяет роли.',
  },
  4: {
    roundId: 4,
    title: 'Раунд 4',
    titleShort: 'Ближе',
    transitionTitle: 'Ближе',
    transitionBody: 'Теперь можно снять одну-две вещи. Только по очереди и только через взгляд и кивок.',
    timerHint: 'Сначала согласие, потом действие.',
    atmosphere: 'Это раунд молчаливого согласия, замедления и нарастающего тепла.',
    ruleHeadline: 'Сначала кивок',
    ruleFootnote: 'Если согласия нет, вы останавливаетесь и возвращаетесь к объятию.',
    setupKind: 'none',
  },
  5: {
    roundId: 5,
    title: 'Раунд 5',
    titleShort: 'Пик',
    transitionTitle: 'Пик',
    transitionBody: 'Слов станет меньше. Важнее очередь, ритм и удержание напряжения.',
    timerHint: 'Меньше слов. Больше дыхания и ритма.',
    atmosphere: 'Финальный блок доводит напряжение до края и оставляет вас вдвоём.',
    ruleHeadline: 'Без финальной развязки',
    ruleFootnote: 'Проникновение, секс и кульминация остаются за пределами таймера.',
    setupKind: 'none',
  },
}

export function getOppositeBranch(branch: GuidedBranch): GuidedBranch {
  return branch === 'a' ? 'b' : 'a'
}
