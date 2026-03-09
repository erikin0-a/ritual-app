/**
 * Audio Zustand store for the Premium Guided Ritual.
 *
 * Manages:
 * - Playback state (playing/paused)
 * - Current subtitle displayed
 * - Preload progress per round
 * - Triggering cues based on elapsed time
 */
import { create } from 'zustand'
import { AudioService, type VoiceVariables } from '@/lib/audio-service'
import {
  getAudioTrack,
  getPreloadItemsForRound,
  getAllGuidedPreloadItems,
  type AudioCue,
} from '@/constants/audio-timeline'
import type { RoundId } from '@/types'

interface AudioStore {
  // State
  isPlaying: boolean
  isPaused: boolean
  currentRoundId: RoundId | null
  currentCue: AudioCue | null
  /** Preload progress: 0–1 per round */
  preloadProgress: Record<number, number>
  /** Set of round IDs that have been fully preloaded */
  preloadedRounds: Set<RoundId>
  /** Seconds elapsed in the current round (used to fire cues) */
  elapsedSeconds: number
  /** Index of next cue to fire in current round's timeline */
  nextCueIndex: number
  /** Voice variables for ElevenLabs placeholders ({NAME1}, {NAME2}) */
  voiceVariables: VoiceVariables

  // Actions
  /** Configure audio session — call once at app launch */
  configure: () => Promise<void>
  /** Set NAME placeholders used for voice synthesis */
  setVoiceVariables: (variables: VoiceVariables) => void
  /** Preload all audio for a round. Safe to call multiple times. */
  preloadRound: (roundId: RoundId) => Promise<void>
  /** Preload full guided library (music + all script lines). */
  preloadAllGuided: () => Promise<void>
  /** Start guided audio for a round (plays music, resets cue index) */
  startRound: (roundId: RoundId) => Promise<void>
  /** Called every second to advance cue index */
  tick: (elapsed: number) => Promise<void>
  /** Pause all audio */
  pause: () => Promise<void>
  /** Resume all audio */
  resume: () => Promise<void>
  /** Stop and release everything */
  stop: () => Promise<void>
  /** Clear current subtitle */
  clearSubtitle: () => void
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  isPlaying: false,
  isPaused: false,
  currentRoundId: null,
  currentCue: null,
  preloadProgress: {},
  preloadedRounds: new Set(),
  elapsedSeconds: 0,
  nextCueIndex: 0,
  voiceVariables: { NAME1: 'Вы', NAME2: 'Партнёр' },

  configure: async () => {
    await AudioService.configure()
  },

  setVoiceVariables: (variables) => {
    set({
      voiceVariables: {
        NAME1: variables.NAME1?.trim() || 'Вы',
        NAME2: variables.NAME2?.trim() || 'Партнёр',
      },
    })
  },

  preloadRound: async (roundId) => {
    const { preloadedRounds, voiceVariables } = get()
    if (preloadedRounds.has(roundId)) return

    const items = getPreloadItemsForRound(roundId)
    await AudioService.preload(items, (progress) => {
      set((s) => ({
        preloadProgress: { ...s.preloadProgress, [roundId]: progress },
      }))
    }, voiceVariables)

    set((s) => ({
      preloadedRounds: new Set([...s.preloadedRounds, roundId]),
      preloadProgress: { ...s.preloadProgress, [roundId]: 1 },
    }))
  },

  preloadAllGuided: async () => {
    const { voiceVariables } = get()
    const items = getAllGuidedPreloadItems()
    await AudioService.preload(items, undefined, voiceVariables)
  },

  startRound: async (roundId) => {
    const track = getAudioTrack(roundId)
    if (!track) return

    set({
      currentRoundId: roundId,
      elapsedSeconds: 0,
      nextCueIndex: 0,
      currentCue: null,
      isPlaying: true,
      isPaused: false,
    })

    await AudioService.playMusic(track.musicUri)
  },

  tick: async (elapsed) => {
    const { currentRoundId, nextCueIndex, isPaused, voiceVariables } = get()
    if (!currentRoundId || isPaused) return

    const track = getAudioTrack(currentRoundId)
    if (!track) return

    set({ elapsedSeconds: elapsed })

    // Fire any cues whose offset <= elapsed and haven't been fired yet
    let idx = nextCueIndex
    while (idx < track.cues.length && track.cues[idx].offsetSeconds <= elapsed) {
      const cue = track.cues[idx]
      if (cue.type === 'voice') {
        set({ currentCue: cue })
        await AudioService.playVoice(cue.voiceKey ?? cue.uri, {
          variables: voiceVariables,
          fallbackUri: cue.uri,
        })
        // Clear subtitle after a reasonable display duration (10 s)
        globalThis.setTimeout(() => {
          if (get().currentCue?.uri === cue.uri) {
            get().clearSubtitle()
          }
        }, 10_000)
      }
      idx++
    }
    set({ nextCueIndex: idx })
  },

  pause: async () => {
    set({ isPaused: true })
    await AudioService.pauseAll()
  },

  resume: async () => {
    set({ isPaused: false })
    await AudioService.resumeAll()
  },

  stop: async () => {
    set({
      isPlaying: false,
      isPaused: false,
      currentRoundId: null,
      currentCue: null,
      elapsedSeconds: 0,
      nextCueIndex: 0,
      voiceVariables: { NAME1: 'Вы', NAME2: 'Партнёр' },
    })
    await AudioService.releaseAll()
  },

  clearSubtitle: () => {
    set({ currentCue: null })
  },
}))
