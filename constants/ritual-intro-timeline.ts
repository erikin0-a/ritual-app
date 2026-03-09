export type IntroTextStyle = 'default' | 'accent' | 'italic' | 'large'

export interface RitualIntroTimelineItem {
  startSec: number
  endSec: number
  text: string
  style?: IntroTextStyle
}

// Timing is relative to voiceover start (voiceover starts at +1s after music).
export const RITUAL_INTRO_TIMELINE: RitualIntroTimelineItem[] = [
  { startSec: 0, endSec: 3, text: 'Режим соблазнения', style: 'large' },
  { startSec: 4, endSec: 8, text: 'Между вами будет расти напряжение' },
  { startSec: 9, endSec: 15, text: 'Каждый раунд усиливает желание' },
  { startSec: 15, endSec: 19, text: 'Но сначала... ограничения', style: 'accent' },
  { startSec: 19, endSec: 25, text: 'Запреты делают желание сильнее', style: 'italic' },
  { startSec: 26, endSec: 30, text: 'Следуйте моему голосу', style: 'large' },
  { startSec: 30, endSec: 34, text: 'Когда правила изменятся — вы услышите сигнал' },
  { startSec: 35, endSec: 42, text: 'Оба партнера должны дать согласие', style: 'accent' },
  { startSec: 42, endSec: 60, text: 'Приложите пальцы', style: 'large' },
]

export const CHIME_SEC = 34.2
export const CONSENT_APPEAR_SEC = 42
