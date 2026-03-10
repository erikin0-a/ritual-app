export type RitualMode = 'free' | 'guided'
export type RoundId = 1 | 2 | 3 | 4 | 5
export type GuidedBranch = 'a' | 'b'
export type SubscriptionStatus = 'free' | 'premium' | 'loading'
export type IntimacyLevel = 'light' | 'moderate' | 'spicy'
export type DurationPreference = 'short' | 'standard' | 'extended'
export type ParticipantId = 'p1' | 'p2'
export type ParticipantGender = 'm' | 'f'

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

export interface RitualParticipant {
  id: ParticipantId
  name: string
  gender: ParticipantGender
}

export interface RitualParticipants {
  p1: RitualParticipant
  p2: RitualParticipant
}

export interface ParticipantGrammarForms {
  subjectPronoun: string
  objectPronoun: string
  possessivePronoun: string
  dativePronoun: string
  journeyVerb: string
}

export type GuidedAudioSegmentKind = 'phrase' | 'name'

export interface GuidedAudioSegment {
  id: string
  cacheKey: string
  kind: GuidedAudioSegmentKind
  text: string
  storagePath?: string
  uri?: string
  participantId?: ParticipantId
}

export interface GuidedCueManifest {
  cueKey: string
  renderedText: string
  subtitleText: string
  highlightedParticipants: ParticipantId[]
  audioSegments: GuidedAudioSegment[]
  remoteManifestUri?: string
  generatedNamePaths?: string[]
}

export interface GuidedPreloadItem {
  cueKey: string
  fallbackUri?: string
}

export type TruthOrDareCategory = 'light' | 'spicy' | 'wild'
export type TruthOrDareType = 'truth' | 'dare'

export interface TruthOrDareCard {
  id: string
  type: TruthOrDareType
  category: TruthOrDareCategory
  content: string
}
