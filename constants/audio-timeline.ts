/**
 * Audio timeline for the Premium Guided Ritual.
 *
 * Each cue fires at a specific second offset within a round and either:
 * - plays a voice line (voice URI + subtitle text shown on screen), or
 * - plays/changes background music.
 *
 * MVP approach (Variant A):
 *   - Voice lines contain NO partner names — pauses are written in to the script.
 *   - Partner name is displayed as a text overlay (VoiceSubtitle) instead.
 *
 * URIs are placeholders (assets/audio/*). Replace with real ElevenLabs exports
 * or CDN URLs before shipping.
 */

import type { RoundId } from '@/types'
import { VOICE_SCRIPT_KEYS } from '@/constants/voice-script-catalog'
import type { PreloadItem } from '@/lib/audio-service'

export type CueType = 'voice' | 'music'

export interface AudioCue {
  /** Seconds from the start of the round */
  offsetSeconds: number
  type: CueType
  /** Stable voice script key for ElevenLabs synthesis + cache */
  voiceKey?: string
  /** URI to the audio asset (local or remote) */
  uri: string
  /** Subtitle text shown on screen during voice playback */
  subtitle?: string
  /** If true, shown as partner name overlay (styled differently) */
  isPartnerNamePrompt?: boolean
}

export interface RoundAudioTrack {
  roundId: RoundId
  /** Background music URI for this round (looping) */
  musicUri: string
  /** Ordered list of voice cues */
  cues: AudioCue[]
}

/**
 * Placeholder local asset paths — replace with real audio files.
 * In Expo managed workflow, place files under assets/audio/ and use
 * require() for local or a CDN HTTPS URI for remote.
 */
const BASE = 'https://example.com/nightly-audio' // TODO: replace with actual CDN

export const AUDIO_TIMELINE: RoundAudioTrack[] = [
  {
    roundId: 1,
    musicUri: `${BASE}/music/round1-ambient.mp3`,
    cues: [
      {
        offsetSeconds: 0,
        type: 'voice',
        voiceKey: 'round_0_intro_01',
        uri: `${BASE}/voice/r1-intro.mp3`,
        subtitle: 'Добро пожаловать в ритуал. Сядьте удобно и посмотрите друг на друга.',
      },
      {
        offsetSeconds: 40,
        type: 'voice',
        voiceKey: 'round_1_task_01',
        uri: `${BASE}/voice/r1-task1.mp3`,
        subtitle: 'Не говорите ничего. Просто смотрите. Дышите вместе.',
      },
      {
        offsetSeconds: 80,
        type: 'voice',
        voiceKey: 'round_1_task_03',
        uri: `${BASE}/voice/r1-task2.mp3`,
        subtitle: 'Скажите партнёру одно слово, которое описывает ваши чувства прямо сейчас.',
        isPartnerNamePrompt: true,
      },
      {
        offsetSeconds: 120,
        type: 'voice',
        voiceKey: 'round_1_task_06',
        uri: `${BASE}/voice/r1-atmosphere.mp3`,
        subtitle: 'Расслабьтесь. Позвольте себе быть здесь, с ним / с ней.',
      },
      {
        offsetSeconds: 200,
        type: 'voice',
        voiceKey: 'round_1_task_09',
        uri: `${BASE}/voice/r1-task3.mp3`,
        subtitle: 'Улыбнитесь. Флиртуйте взглядом.',
      },
      {
        offsetSeconds: 260,
        type: 'voice',
        voiceKey: 'round_1_task_16',
        uri: `${BASE}/voice/r1-ending.mp3`,
        subtitle: 'Отлично. Вы вместе. Готовьтесь к следующему раунду.',
      },
    ],
  },
  {
    roundId: 2,
    musicUri: `${BASE}/music/round2-tension.mp3`,
    cues: [
      {
        offsetSeconds: 0,
        type: 'voice',
        voiceKey: 'round_2_task_01',
        uri: `${BASE}/voice/r2-intro.mp3`,
        subtitle: 'Время первого прикосновения. Медленно. Осторожно.',
      },
      {
        offsetSeconds: 40,
        type: 'voice',
        voiceKey: 'round_2_task_04',
        uri: `${BASE}/voice/r2-task1.mp3`,
        subtitle: 'Коснитесь руки партнёра. Почувствуйте тепло.',
        isPartnerNamePrompt: true,
      },
      {
        offsetSeconds: 80,
        type: 'voice',
        voiceKey: 'round_2_task_06',
        uri: `${BASE}/voice/r2-task2.mp3`,
        subtitle: 'Проведите пальцами по плечу. Не торопитесь.',
      },
      {
        offsetSeconds: 160,
        type: 'voice',
        voiceKey: 'round_2_task_14',
        uri: `${BASE}/voice/r2-task3.mp3`,
        subtitle: 'Поцелуйте — коротко, нежно. Только один раз.',
      },
      {
        offsetSeconds: 250,
        type: 'voice',
        voiceKey: 'round_2_task_15',
        uri: `${BASE}/voice/r2-ending.mp3`,
        subtitle: 'Вы справляетесь великолепно. Следующий раунд будет горячее.',
      },
    ],
  },
  {
    roundId: 3,
    musicUri: `${BASE}/music/round3-desire.mp3`,
    cues: [
      {
        offsetSeconds: 0,
        type: 'voice',
        voiceKey: 'round_3_task_01',
        uri: `${BASE}/voice/r3-intro.mp3`,
        subtitle: 'Пришло время соблазнения. Кто-то начинает.',
      },
      {
        offsetSeconds: 40,
        type: 'voice',
        voiceKey: 'round_3_task_02',
        uri: `${BASE}/voice/r3-task1.mp3`,
        subtitle: 'Снимите что-нибудь одно — медленно, с улыбкой.',
        isPartnerNamePrompt: true,
      },
      {
        offsetSeconds: 120,
        type: 'voice',
        voiceKey: 'round_3_task_12',
        uri: `${BASE}/voice/r3-task2.mp3`,
        subtitle: 'Теперь очередь второго. Раздевайте друг друга по очереди.',
      },
      {
        offsetSeconds: 200,
        type: 'voice',
        voiceKey: 'round_3_task_13',
        uri: `${BASE}/voice/r3-atmosphere.mp3`,
        subtitle: 'Дышите. Наслаждайтесь каждым моментом.',
      },
      {
        offsetSeconds: 270,
        type: 'voice',
        voiceKey: 'round_3_task_16',
        uri: `${BASE}/voice/r3-ending.mp3`,
        subtitle: 'Красиво. Вы близко. Ещё два раунда.',
      },
    ],
  },
  {
    roundId: 4,
    musicUri: `${BASE}/music/round4-intimate.mp3`,
    cues: [
      {
        offsetSeconds: 0,
        type: 'voice',
        voiceKey: 'round_4_task_01',
        uri: `${BASE}/voice/r4-intro.mp3`,
        subtitle: 'Ближе. Объятия, поцелуи, близость.',
      },
      {
        offsetSeconds: 40,
        type: 'voice',
        voiceKey: 'round_4_task_03',
        uri: `${BASE}/voice/r4-task1.mp3`,
        subtitle: 'Обнимите партнёра крепко. Почувствуйте его дыхание.',
        isPartnerNamePrompt: true,
      },
      {
        offsetSeconds: 150,
        type: 'voice',
        voiceKey: 'round_4_task_09',
        uri: `${BASE}/voice/r4-task2.mp3`,
        subtitle: 'Поцелуй — долгий, глубокий.',
      },
      {
        offsetSeconds: 250,
        type: 'voice',
        voiceKey: 'round_4_task_16',
        uri: `${BASE}/voice/r4-ending.mp3`,
        subtitle: 'Последний раунд. Позвольте всему случиться.',
      },
    ],
  },
  {
    roundId: 5,
    musicUri: `${BASE}/music/round5-finale.mp3`,
    cues: [
      {
        offsetSeconds: 0,
        type: 'voice',
        voiceKey: 'round_5_task_01',
        uri: `${BASE}/voice/r5-intro.mp3`,
        subtitle: 'Финальный раунд. Вы вместе — это главное.',
      },
      {
        offsetSeconds: 60,
        type: 'voice',
        voiceKey: 'round_5_task_04',
        uri: `${BASE}/voice/r5-atmosphere.mp3`,
        subtitle: 'Никаких ограничений. Просто вы двое.',
      },
      {
        offsetSeconds: 180,
        type: 'voice',
        voiceKey: 'round_5_task_08',
        uri: `${BASE}/voice/r5-ending.mp3`,
        subtitle: 'Ритуал завершён. Вы великолепны.',
      },
    ],
  },
]

/** Look up the audio track for a given round. */
export function getAudioTrack(roundId: RoundId): RoundAudioTrack | undefined {
  return AUDIO_TIMELINE.find((t) => t.roundId === roundId)
}

/** All URIs for a given round (music + voice) — used for preloading. */
export function getAllUrisForRound(roundId: RoundId): string[] {
  const track = getAudioTrack(roundId)
  if (!track) return []
  return [track.musicUri, ...track.cues.map((c) => c.uri)]
}

/** Voice + music preload payload for a given round. */
export function getPreloadItemsForRound(roundId: RoundId): PreloadItem[] {
  const track = getAudioTrack(roundId)
  if (!track) return []

  const voiceItems = track.cues
    .filter((cue) => cue.type === 'voice' && cue.voiceKey)
    .map((cue) => ({
      voiceKey: cue.voiceKey!,
      fallbackUri: cue.uri,
    }))

  return [track.musicUri, ...voiceItems]
}

/** Full guided preload payload (~all script lines + all round music tracks). */
export function getAllGuidedPreloadItems(): PreloadItem[] {
  const musicUris = AUDIO_TIMELINE.map((track) => track.musicUri)
  const voiceItems = VOICE_SCRIPT_KEYS.map((voiceKey) => ({ voiceKey }))
  return [...musicUris, ...voiceItems]
}
