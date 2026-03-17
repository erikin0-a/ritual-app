/* eslint-disable no-console */
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
import { AudioService } from '@/lib/audio-service'
import {
  getAudioTrack,
  getCueVariant,
  getPreloadItemsForRound,
  getAllGuidedPreloadItems,
  type AudioCue,
} from '@/constants/audio-timeline'
import { DEFAULT_RITUAL_PARTICIPANTS, renderParticipantTemplate } from '@/lib/ritual-participants'
import type { GuidedBranch, ParticipantId, RitualParticipants, RoundId } from '@/types'

let guidedLibraryPreloadPromise: Promise<void> | null = null
const roundPreloadPromises = new Map<RoundId, Promise<void>>()
let isTickInFlight = false

interface AudioStore {
  // State
  isPlaying: boolean
  isPaused: boolean
  currentRoundId: RoundId | null
  currentCue: AudioCue | null
  /** Progress of the full guided manifest/library preload */
  guidedLibraryProgress: number
  /** True once the full guided library has been preloaded */
  isGuidedLibraryReady: boolean
  /** Preload progress: 0–1 per round */
  preloadProgress: Record<number, number>
  /** Set of round IDs that have been fully preloaded */
  preloadedRounds: Set<RoundId>
  /** Seconds elapsed in the current round (used to fire cues) */
  elapsedSeconds: number
  /** Index of next cue to fire in current round's timeline */
  nextCueIndex: number
  /** Participants used for guided subtitles and audio manifests */
  voiceParticipants: RitualParticipants
  /** Branch-aware rounds (A/B) */
  roundBranches: Partial<Record<RoundId, GuidedBranch>>

  // Actions
  /** Configure audio session — call once at app launch */
  configure: () => Promise<void>
  /** Set participants used for guided voice resolution */
  setVoiceParticipants: (participants: RitualParticipants) => void
  /** Set current branch for a round (used by branch-aware cues) */
  setRoundBranch: (roundId: RoundId, branch: GuidedBranch) => void
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
  /** Play a standalone cue outside the round timer */
  playCue: (cue: {
    voiceKey: string
    subtitle?: string
    highlightedParticipants?: ParticipantId[]
    fallbackUri?: string
  }) => Promise<void>
  /** Clear current subtitle */
  clearSubtitle: () => void
}

function getCueClearDelayMs(subtitle?: string): number {
  if (!subtitle) return 5000
  const estimated = Math.max(4200, Math.min(12000, subtitle.length * 72))
  return estimated
}

function buildParticipantsFingerprint(participants: RitualParticipants): string {
  return [
    participants.p1.name.trim().toLowerCase(),
    participants.p1.gender,
    participants.p2.name.trim().toLowerCase(),
    participants.p2.gender,
  ].join('|')
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  isPlaying: false,
  isPaused: false,
  currentRoundId: null,
  currentCue: null,
  guidedLibraryProgress: 0,
  isGuidedLibraryReady: false,
  preloadProgress: {},
  preloadedRounds: new Set(),
  elapsedSeconds: 0,
  nextCueIndex: 0,
  voiceParticipants: DEFAULT_RITUAL_PARTICIPANTS,
  roundBranches: {},

  configure: async () => {
    await AudioService.configure()
  },

  setVoiceParticipants: (participants) => {
    const current = get().voiceParticipants
    const hasChanged =
      buildParticipantsFingerprint(current) !== buildParticipantsFingerprint(participants)

    if (hasChanged) {
      guidedLibraryPreloadPromise = null
      roundPreloadPromises.clear()
      AudioService.releaseAll().catch(() => null)
      set({
        voiceParticipants: participants,
        guidedLibraryProgress: 0,
        isGuidedLibraryReady: false,
        preloadProgress: {},
        preloadedRounds: new Set(),
      })
      return
    }

    set({
      voiceParticipants: participants,
    })
  },

  setRoundBranch: (roundId, branch) => {
    set((state) => ({
      roundBranches: {
        ...state.roundBranches,
        [roundId]: branch,
      },
    }))
  },

  preloadRound: async (roundId) => {
    const { preloadedRounds, voiceParticipants } = get()
    if (preloadedRounds.has(roundId)) return
    const existingPromise = roundPreloadPromises.get(roundId)
    if (existingPromise) {
      try {
        await existingPromise
      } catch {
        // In-flight call failed; swallow — session continues without preloaded round audio.
      }
      return
    }

    const preloadPromise = (async () => {
      const items = getPreloadItemsForRound(roundId)
      if (__DEV__) {
        console.log(`[GuidedAudio] Preloading round ${roundId}`, {
          participantNames: [voiceParticipants.p1.name, voiceParticipants.p2.name],
          cueCount: items.length,
        })
      }
      await AudioService.preload(items, (progress) => {
        set((s) => ({
          preloadProgress: { ...s.preloadProgress, [roundId]: progress },
        }))
      }, voiceParticipants)

      set((s) => ({
        preloadedRounds: new Set([...s.preloadedRounds, roundId]),
        preloadProgress: { ...s.preloadProgress, [roundId]: 1 },
      }))
    })()

    roundPreloadPromises.set(roundId, preloadPromise)
    try {
      await preloadPromise
    } finally {
      roundPreloadPromises.delete(roundId)
    }
  },

  preloadAllGuided: async () => {
    const { voiceParticipants, isGuidedLibraryReady } = get()
    if (isGuidedLibraryReady) return
    if (guidedLibraryPreloadPromise) {
      try {
        await guidedLibraryPreloadPromise
      } catch {
        // In-flight call failed; swallow — session continues without preloaded audio.
      }
      return
    }

    guidedLibraryPreloadPromise = (async () => {
      const items = getAllGuidedPreloadItems()
      if (__DEV__) {
        console.log('[GuidedAudio] Preloading full guided library', {
          participantNames: [voiceParticipants.p1.name, voiceParticipants.p2.name],
          cueCount: items.length,
        })
      }
      set({ guidedLibraryProgress: 0 })
      await AudioService.preload(items, (progress) => {
        set({ guidedLibraryProgress: progress })
      }, voiceParticipants)
      set({
        guidedLibraryProgress: 1,
        isGuidedLibraryReady: true,
      })
      if (__DEV__) {
        console.log('[GuidedAudio] Full guided library preloaded')
      }
    })()

    try {
      await guidedLibraryPreloadPromise
    } finally {
      guidedLibraryPreloadPromise = null
    }
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
    // Always update elapsed so the UI stays in sync even if we skip processing.
    set({ elapsedSeconds: elapsed })

    const { currentRoundId, isPaused } = get()
    if (!currentRoundId || isPaused) return

    // Guard against concurrent tick calls — only one may fire cues at a time.
    if (isTickInFlight) return

    const track = getAudioTrack(currentRoundId)
    if (!track) return

    isTickInFlight = true
    try {
      // Re-read nextCueIndex after acquiring the guard so we see any updates
      // from a previous tick that completed just before us.
      let idx = get().nextCueIndex
      const { voiceParticipants, roundBranches } = get()

      while (idx < track.cues.length && track.cues[idx].offsetSeconds <= elapsed) {
        const cue = track.cues[idx]
        const branch = roundBranches[currentRoundId]
        const variant = getCueVariant(cue, branch)
        const resolvedVoiceKey = variant?.voiceKey ?? cue.voiceKey
        const resolvedSubtitle = variant?.subtitle ?? cue.subtitle
        const resolvedParticipants = variant?.highlightedParticipants ?? cue.highlightedParticipants
        idx += 1
        set({ nextCueIndex: idx })

        if (cue.type === 'voice' && resolvedVoiceKey) {
          const fallbackSubtitle = resolvedSubtitle
            ? renderParticipantTemplate(resolvedSubtitle, voiceParticipants)
            : undefined

          set({
            currentCue: {
              ...cue,
              voiceKey: resolvedVoiceKey,
              subtitle: fallbackSubtitle,
              highlightedParticipants: resolvedParticipants,
            },
          })

          const manifest = await AudioService.playVoice(resolvedVoiceKey ?? cue.fallbackUri ?? '', {
            participants: voiceParticipants,
            fallbackUri: cue.fallbackUri,
            subtitleTemplate: resolvedSubtitle,
            highlightedParticipants: resolvedParticipants,
          })

          if (manifest) {
            set({
              currentCue: {
                ...cue,
                voiceKey: resolvedVoiceKey,
                subtitle: manifest.subtitleText,
                highlightedParticipants: manifest.highlightedParticipants,
              },
            })
          }

          globalThis.setTimeout(() => {
            if (get().currentCue?.voiceKey === resolvedVoiceKey) {
              get().clearSubtitle()
            }
          }, getCueClearDelayMs(fallbackSubtitle))
        }
      }
    } finally {
      isTickInFlight = false
    }
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
      roundBranches: {},
    })
    await AudioService.stopAll()
  },

  playCue: async ({ voiceKey, subtitle, highlightedParticipants, fallbackUri }) => {
    const { voiceParticipants } = get()
    const renderedSubtitle = subtitle ? renderParticipantTemplate(subtitle, voiceParticipants) : undefined

    set({
      currentCue: {
        offsetSeconds: 0,
        type: 'voice',
        voiceKey,
        fallbackUri,
        subtitle: renderedSubtitle,
        highlightedParticipants,
      },
    })

    const manifest = await AudioService.playVoice(voiceKey, {
      participants: voiceParticipants,
      fallbackUri,
      subtitleTemplate: subtitle,
      highlightedParticipants,
    })

    if (manifest) {
      set({
        currentCue: {
          offsetSeconds: 0,
          type: 'voice',
          voiceKey,
          fallbackUri,
          subtitle: manifest.subtitleText,
          highlightedParticipants: manifest.highlightedParticipants,
        },
      })
    }

    globalThis.setTimeout(() => {
      if (get().currentCue?.voiceKey === voiceKey) {
        get().clearSubtitle()
      }
    }, getCueClearDelayMs(renderedSubtitle))
  },

  clearSubtitle: () => {
    set({ currentCue: null })
  },
}))
