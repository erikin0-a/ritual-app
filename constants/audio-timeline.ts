import { VOICE_SCRIPT_KEYS } from '@/constants/voice-script-catalog'
import type { GuidedBranch, GuidedPreloadItem, ParticipantId, RoundId } from '@/types'

export type CueType = 'voice' | 'music'

export interface AudioCueVariant {
  voiceKey?: string
  subtitle?: string
  highlightedParticipants?: ParticipantId[]
}

export interface AudioCue {
  offsetSeconds: number
  type: CueType
  voiceKey?: string
  fallbackUri?: string
  subtitle?: string
  highlightedParticipants?: ParticipantId[]
  variants?: Partial<Record<GuidedBranch, AudioCueVariant>>
}

export interface RoundAudioTrack {
  roundId: RoundId
  musicUri: string
  cues: AudioCue[]
}

const GUIDED_AUDIO_PUBLIC_BASE_URL =
  process.env.EXPO_PUBLIC_GUIDED_AUDIO_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? 'https://example.com/nightly-audio'

function buildMusicUri(filename: string): string {
  return `${GUIDED_AUDIO_PUBLIC_BASE_URL}/music/${filename}`
}

function buildVoiceFallbackUri(filename: string): string {
  return `${GUIDED_AUDIO_PUBLIC_BASE_URL}/voice/${filename}`
}

export const AUDIO_TIMELINE: RoundAudioTrack[] = [
  {
    roundId: 1,
    musicUri: buildMusicUri('round1-ambient.mp3'),
    cues: [
      {
        offsetSeconds: 0,
        type: 'voice',
        voiceKey: 'round_0_intro_01',
        fallbackUri: buildVoiceFallbackUri('r1-intro.mp3'),
        subtitle: 'Добро пожаловать, {{p1.name}} и {{p2.name}}. В этом раунде нельзя касаться. Только взгляд.',
        highlightedParticipants: ['p1', 'p2'],
      },
      {
        offsetSeconds: 40,
        type: 'voice',
        voiceKey: 'round_1_task_01',
        fallbackUri: buildVoiceFallbackUri('r1-task1.mp3'),
        subtitle: 'Посмотрите друг другу в глаза. Просто держите взгляд одну минуту.',
        highlightedParticipants: ['p1', 'p2'],
      },
      {
        offsetSeconds: 100,
        type: 'voice',
        voiceKey: 'round_1_task_02',
        fallbackUri: buildVoiceFallbackUri('r1-task2.mp3'),
        subtitle: 'Сделайте вместе вдох и выдох. И снова — взгляд.',
        highlightedParticipants: ['p1', 'p2'],
      },
      {
        offsetSeconds: 140,
        type: 'voice',
        voiceKey: 'round_1_task_03',
        fallbackUri: buildVoiceFallbackUri('r1-task3.mp3'),
        subtitle: '{{p1.name}}, скажи одну фразу, которая заставляет тебя хотеть партнёра сильнее. {{p2.name}} — только взгляд и кивок.',
        highlightedParticipants: ['p1', 'p2'],
      },
      {
        offsetSeconds: 170,
        type: 'voice',
        voiceKey: 'round_1_task_06',
        fallbackUri: buildVoiceFallbackUri('r1-task4.mp3'),
        subtitle: 'Улыбнитесь друг другу. Медленно. Как будто это ваш секрет.',
        highlightedParticipants: ['p1', 'p2'],
      },
      {
        offsetSeconds: 220,
        type: 'voice',
        voiceKey: 'round_1_task_09',
        fallbackUri: buildVoiceFallbackUri('r1-task5.mp3'),
        subtitle: '{{p1.name}} шепчет: «Я здесь». {{p2.name}} отвечает: «Я вижу тебя».',
        highlightedParticipants: ['p1', 'p2'],
      },
      {
        offsetSeconds: 260,
        type: 'voice',
        voiceKey: 'round_1_task_16',
        fallbackUri: buildVoiceFallbackUri('r1-task6.mp3'),
        subtitle: 'Теперь — по очереди. {{p1.name}}, прошепчи имя {{p2.name}}. {{p2.name}}, прошепчи имя {{p1.name}}.',
        highlightedParticipants: ['p1', 'p2'],
      },
    ],
  },
  {
    roundId: 2,
    musicUri: buildMusicUri('round2-tension.mp3'),
    cues: [
      {
        offsetSeconds: 0,
        type: 'voice',
        voiceKey: 'round_2_task_01',
        fallbackUri: buildVoiceFallbackUri('r2-intro.mp3'),
        subtitle: 'Сейчас на экране появится рулетка. Она выберет того, кто будет вести этот раунд.',
      },
      {
        offsetSeconds: 8,
        type: 'voice',
        fallbackUri: buildVoiceFallbackUri('r2-lead.mp3'),
        subtitle: 'Ведущий выбран. Второй партнёр только принимает.',
        variants: {
          a: {
            voiceKey: 'round_2_task_02_a',
            subtitle: '{{p1.name}} ведёт этот раунд. {{p2.name}} — ты принимаешь. Без ответных прикосновений.',
            highlightedParticipants: ['p1', 'p2'],
          },
          b: {
            voiceKey: 'round_2_task_02_b',
            subtitle: '{{p2.name}} ведёт этот раунд. {{p1.name}} — ты принимаешь. Без ответных прикосновений.',
            highlightedParticipants: ['p1', 'p2'],
          },
        },
      },
      {
        offsetSeconds: 20,
        type: 'voice',
        fallbackUri: buildVoiceFallbackUri('r2-task1.mp3'),
        variants: {
          a: {
            voiceKey: 'round_2_task_03_a',
            subtitle: '{{p2.name}}, дай руку. {{p1.name}}, начни с ладони. Медленно проведи пальцем по контуру… и остановись.',
            highlightedParticipants: ['p1', 'p2'],
          },
          b: {
            voiceKey: 'round_2_task_03_b',
            subtitle: '{{p1.name}}, дай руку. {{p2.name}}, начни с ладони. Медленно проведи пальцем по контуру… и остановись.',
            highlightedParticipants: ['p1', 'p2'],
          },
        },
      },
      {
        offsetSeconds: 40,
        type: 'voice',
        fallbackUri: buildVoiceFallbackUri('r2-task2.mp3'),
        variants: {
          a: {
            voiceKey: 'round_2_task_04_a',
            subtitle: '{{p1.name}}, положи ладонь на грудь партнёра, там где слышно дыхание. Десять секунд… и убери руку. {{p2.name}}, просто принимай.',
            highlightedParticipants: ['p1', 'p2'],
          },
          b: {
            voiceKey: 'round_2_task_04_b',
            subtitle: '{{p2.name}}, ладонь — на грудь партнёра, там где слышно дыхание. Десять секунд… и убери руку. {{p1.name}}, просто принимай.',
            highlightedParticipants: ['p1', 'p2'],
          },
        },
      },
      {
        offsetSeconds: 80,
        type: 'voice',
        fallbackUri: buildVoiceFallbackUri('r2-task3.mp3'),
        variants: {
          a: {
            voiceKey: 'round_2_task_06_a',
            subtitle: '{{p1.name}}, шаг ближе. Остановись в сантиметре. {{p2.name}}, почувствуй тепло… без ответа.',
            highlightedParticipants: ['p1', 'p2'],
          },
          b: {
            voiceKey: 'round_2_task_06_b',
            subtitle: '{{p2.name}}, шаг ближе. Остановись в сантиметре. {{p1.name}}, почувствуй тепло… без ответа.',
            highlightedParticipants: ['p1', 'p2'],
          },
        },
      },
      {
        offsetSeconds: 160,
        type: 'voice',
        fallbackUri: buildVoiceFallbackUri('r2-task4.mp3'),
        variants: {
          a: {
            voiceKey: 'round_2_task_14_a',
            subtitle: '{{p1.name}}, один короткий поцелуй в шею. И сразу — пауза. Смотри в глаза.',
            highlightedParticipants: ['p1', 'p2'],
          },
          b: {
            voiceKey: 'round_2_task_14_b',
            subtitle: '{{p2.name}}, один короткий поцелуй в шею. И сразу — пауза. Смотри в глаза.',
            highlightedParticipants: ['p1', 'p2'],
          },
        },
      },
      {
        offsetSeconds: 250,
        type: 'voice',
        fallbackUri: buildVoiceFallbackUri('r2-task5.mp3'),
        variants: {
          a: {
            voiceKey: 'round_2_task_15_a',
            subtitle: '{{p1.name}}, обними партнёра на три вдоха. Затем отпусти… и снова оставь расстояние. {{p2.name}}, не отвечай руками.',
            highlightedParticipants: ['p1', 'p2'],
          },
          b: {
            voiceKey: 'round_2_task_15_b',
            subtitle: '{{p2.name}}, обними партнёра на три вдоха. Затем отпусти… и снова оставь расстояние. {{p1.name}}, не отвечай руками.',
            highlightedParticipants: ['p1', 'p2'],
          },
        },
      },
    ],
  },
  {
    roundId: 3,
    musicUri: buildMusicUri('round3-desire.mp3'),
    cues: [
      {
        offsetSeconds: 0,
        type: 'voice',
        voiceKey: 'round_3_task_01',
        fallbackUri: buildVoiceFallbackUri('r3-intro.mp3'),
        subtitle: 'Сейчас начинается раунд «Соблазнение». Снимать вещи нельзя. Действует один партнёр. Через пару минут вы поменяетесь.',
      },
      {
        offsetSeconds: 10,
        type: 'voice',
        fallbackUri: buildVoiceFallbackUri('r3-lead.mp3'),
        variants: {
          a: {
            voiceKey: 'round_3_task_01_a',
            subtitle: 'Сейчас действует {{p1.name}}. {{p2.name}} — ты принимаешь. Руки при себе. Только дыхание.',
            highlightedParticipants: ['p1', 'p2'],
          },
          b: {
            voiceKey: 'round_3_task_01_b',
            subtitle: 'Сейчас действует {{p2.name}}. {{p1.name}} — ты принимаешь. Руки при себе. Только дыхание.',
            highlightedParticipants: ['p1', 'p2'],
          },
        },
      },
      {
        offsetSeconds: 40,
        type: 'voice',
        fallbackUri: buildVoiceFallbackUri('r3-task1.mp3'),
        variants: {
          a: {
            voiceKey: 'round_3_task_02_a',
            subtitle: '{{p1.name}}, начни прикосновения. Кончики пальцев — медленно по плечу. Потом — по шее. Остановись. Убери руку.',
            highlightedParticipants: ['p1', 'p2'],
          },
          b: {
            voiceKey: 'round_3_task_02_b',
            subtitle: '{{p2.name}}, начни прикосновения. Кончики пальцев — медленно по плечу. Потом — по шее. Остановись. Убери руку.',
            highlightedParticipants: ['p1', 'p2'],
          },
        },
      },
      {
        offsetSeconds: 120,
        type: 'voice',
        fallbackUri: buildVoiceFallbackUri('r3-task2.mp3'),
        variants: {
          a: {
            voiceKey: 'round_3_task_12_a',
            subtitle: '{{p1.name}}, один поцелуй в шею. Затем ладонь на талию. Притяни ближе на один вдох… и отпусти. {{p2.name}} — не отвечай руками.',
            highlightedParticipants: ['p1', 'p2'],
          },
          b: {
            voiceKey: 'round_3_task_12_b',
            subtitle: '{{p2.name}}, один поцелуй в шею. Затем ладонь на талию. Притяни ближе на один вдох… и отпусти. {{p1.name}} — не отвечай руками.',
            highlightedParticipants: ['p1', 'p2'],
          },
        },
      },
      {
        offsetSeconds: 170,
        type: 'voice',
        voiceKey: 'round_3_task_13',
        fallbackUri: buildVoiceFallbackUri('r3-task3.mp3'),
        subtitle: 'Ещё тридцать секунд. Поцелуи по ключице. Медленно, один за другим. Не ускоряйся.',
      },
      {
        offsetSeconds: 210,
        type: 'voice',
        fallbackUri: buildVoiceFallbackUri('r3-shift.mp3'),
        variants: {
          a: {
            voiceKey: 'round_3_task_14_a',
            subtitle: 'Смена. Теперь действует {{p2.name}}. {{p1.name}} — стой спокойно. Руки при себе. Только дыхание.',
            highlightedParticipants: ['p1', 'p2'],
          },
          b: {
            voiceKey: 'round_3_task_14_b',
            subtitle: 'Смена. Теперь действует {{p1.name}}. {{p2.name}} — стой спокойно. Руки при себе. Только дыхание.',
            highlightedParticipants: ['p1', 'p2'],
          },
        },
      },
      {
        offsetSeconds: 240,
        type: 'voice',
        fallbackUri: buildVoiceFallbackUri('r3-task4.mp3'),
        variants: {
          a: {
            voiceKey: 'round_3_task_15_a',
            subtitle: '{{p2.name}}, начни прикосновения. Ладонь — на грудь партнёра через одежду. Один вдох вместе… и убери руку.',
            highlightedParticipants: ['p1', 'p2'],
          },
          b: {
            voiceKey: 'round_3_task_15_b',
            subtitle: '{{p1.name}}, начни прикосновения. Ладонь — на грудь партнёра через одежду. Один вдох вместе… и убери руку.',
            highlightedParticipants: ['p1', 'p2'],
          },
        },
      },
      {
        offsetSeconds: 270,
        type: 'voice',
        fallbackUri: buildVoiceFallbackUri('r3-task5.mp3'),
        variants: {
          a: {
            voiceKey: 'round_3_task_16_a',
            subtitle: 'И последнее в этом раунде. {{p2.name}}, подойди к уху партнёра и скажи: «Я хочу тебя». Потом отстранись на шаг.',
            highlightedParticipants: ['p1', 'p2'],
          },
          b: {
            voiceKey: 'round_3_task_16_b',
            subtitle: 'И последнее в этом раунде. {{p1.name}}, подойди к уху партнёра и скажи: «Я хочу тебя». Потом отстранись на шаг.',
            highlightedParticipants: ['p1', 'p2'],
          },
        },
      },
    ],
  },
  {
    roundId: 4,
    musicUri: buildMusicUri('round4-intimate.mp3'),
    cues: [
      {
        offsetSeconds: 0,
        type: 'voice',
        voiceKey: 'round_4_task_01',
        fallbackUri: buildVoiceFallbackUri('r4-intro.mp3'),
        subtitle: 'Вы почти у цели. Сейчас можно снять одну-две вещи. Но только по очереди — и только если партнёр согласен.',
      },
      {
        offsetSeconds: 40,
        type: 'voice',
        voiceKey: 'round_4_task_03',
        fallbackUri: buildVoiceFallbackUri('r4-task1.mp3'),
        subtitle: '{{p1.name}}, твоя очередь. Коснись рукой одежды партнёра — той вещи, которую ты хочешь снять. Посмотри партнёру в глаза.',
        highlightedParticipants: ['p1', 'p2'],
      },
      {
        offsetSeconds: 150,
        type: 'voice',
        voiceKey: 'round_4_task_09',
        fallbackUri: buildVoiceFallbackUri('r4-task2.mp3'),
        subtitle: 'Теперь {{p2.name}}. Коснись рукой одежды партнёра — той вещи, которую хочешь снять. Посмотри партнёру в глаза.',
        highlightedParticipants: ['p1', 'p2'],
      },
      {
        offsetSeconds: 250,
        type: 'voice',
        voiceKey: 'round_4_task_16',
        fallbackUri: buildVoiceFallbackUri('r4-task3.mp3'),
        subtitle: 'Теперь — поцелуи и руки. 20 секунд действует {{p1.name}}. Потом 20 секунд действует {{p2.name}}. Держите очередность.',
        highlightedParticipants: ['p1', 'p2'],
      },
    ],
  },
  {
    roundId: 5,
    musicUri: buildMusicUri('round5-finale.mp3'),
    cues: [
      {
        offsetSeconds: 0,
        type: 'voice',
        voiceKey: 'round_5_task_01',
        fallbackUri: buildVoiceFallbackUri('r5-intro.mp3'),
        subtitle: 'Финальный раунд. Главное правило остаётся: без проникновения и без кульминации. Сейчас будет меньше слов.',
        highlightedParticipants: ['p1', 'p2'],
      },
      {
        offsetSeconds: 60,
        type: 'voice',
        voiceKey: 'round_5_task_04',
        fallbackUri: buildVoiceFallbackUri('r5-task1.mp3'),
        subtitle: '{{p1.name}} — веди одну минуту: поцелуи и руки. {{p2.name}} — только принимай. Потом смена.',
        highlightedParticipants: ['p1', 'p2'],
      },
      {
        offsetSeconds: 120,
        type: 'voice',
        voiceKey: 'round_5_task_05',
        fallbackUri: buildVoiceFallbackUri('r5-task2.mp3'),
        subtitle: 'Смена. {{p2.name}} — веди одну минуту: поцелуи и руки. {{p1.name}} — только принимай.',
        highlightedParticipants: ['p1', 'p2'],
      },
      {
        offsetSeconds: 180,
        type: 'voice',
        voiceKey: 'round_5_task_06',
        fallbackUri: buildVoiceFallbackUri('r5-task3.mp3'),
        subtitle: 'Если вам обоим комфортно — снимите ещё одну вещь. По очереди. Сначала {{p1.name}}… потом {{p2.name}}.',
        highlightedParticipants: ['p1', 'p2'],
      },
      {
        offsetSeconds: 220,
        type: 'voice',
        voiceKey: 'round_5_task_07',
        fallbackUri: buildVoiceFallbackUri('r5-task4.mp3'),
        subtitle: 'Теперь ближе. {{p1.name}}, поцелуй ниже живота. Рука — по внутренней стороне бедра. Три мягких касания.',
        highlightedParticipants: ['p1', 'p2'],
      },
      {
        offsetSeconds: 270,
        type: 'voice',
        voiceKey: 'round_5_task_08',
        fallbackUri: buildVoiceFallbackUri('r5-task5.mp3'),
        subtitle: 'Я оставляю вас вдвоём. Дальше вы ведёте сами.',
        highlightedParticipants: ['p1', 'p2'],
      },
    ],
  },
]

export function getCueVariant(cue: AudioCue, branch?: GuidedBranch): AudioCueVariant | null {
  if (!branch || !cue.variants?.[branch]) return null
  return cue.variants[branch] ?? null
}

export function getAudioTrack(roundId: RoundId): RoundAudioTrack | undefined {
  return AUDIO_TIMELINE.find((t) => t.roundId === roundId)
}

export function getPreloadItemsForRound(roundId: RoundId): GuidedPreloadItem[] {
  const track = getAudioTrack(roundId)
  if (!track) return []

  return track.cues.flatMap((cue) => {
    const cueKeys = [cue.voiceKey, cue.variants?.a?.voiceKey, cue.variants?.b?.voiceKey].filter(Boolean) as string[]
    return cueKeys.map((cueKey) => ({
      cueKey,
      fallbackUri: cue.fallbackUri,
    }))
  })
}

export function getAllGuidedPreloadItems(): GuidedPreloadItem[] {
  return Array.from(new Set(VOICE_SCRIPT_KEYS)).map((cueKey) => ({
    cueKey,
  }))
}
