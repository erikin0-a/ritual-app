export type RitualMode = 'free' | 'guided'
export type RoundId = 1 | 2 | 3 | 4 | 5
export type SubscriptionStatus = 'free' | 'premium' | 'loading'
export type IntimacyLevel = 'light' | 'moderate' | 'spicy'
export type DurationPreference = 'short' | 'standard' | 'extended'

export interface UserProfile {
  id: string
  intimacyLevel: IntimacyLevel
  durationPreference: DurationPreference
  partnerId?: string
  isPremium: boolean
  createdAt: string
}

export interface RitualSession {
  id: string
  mode: RitualMode
  startedAt: string
  completedAt?: string
  roundsCompleted: number
}

export interface DiceResult {
  action: string
  bodyPart: string
  style: string
}

export type TruthOrDareCategory = 'light' | 'spicy' | 'wild'
export type TruthOrDareType = 'truth' | 'dare'

export interface TruthOrDareCard {
  id: string
  type: TruthOrDareType
  category: TruthOrDareCategory
  content: string
}
