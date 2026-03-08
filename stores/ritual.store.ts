import { create } from 'zustand'
import type { RitualMode, RoundId, DurationPreference } from '@/types'
import { getRitualRounds, type Round } from '@/constants/ritual-config'

type RitualStatus = 'idle' | 'starting' | 'in_round' | 'transitioning' | 'completed'

interface RitualStore {
  // State
  status: RitualStatus
  currentRound: RoundId | null
  roundTimeRemaining: number
  mode: RitualMode
  isPaused: boolean
  completedRounds: RoundId[]
  rounds: Round[]

  // Actions
  startRitual: (mode: RitualMode, durationPreference?: DurationPreference) => void
  advanceRound: () => void
  pauseToggle: () => void
  tickTimer: () => void
  completeRitual: () => void
  resetRitual: () => void
}

const DEFAULT_ROUNDS = getRitualRounds('standard')

export const useRitualStore = create<RitualStore>((set, get) => ({
  status: 'idle',
  currentRound: null,
  roundTimeRemaining: 0,
  mode: 'free',
  isPaused: false,
  completedRounds: [],
  rounds: DEFAULT_ROUNDS,

  startRitual: (mode, durationPreference = 'standard') => {
    const rounds = getRitualRounds(durationPreference)
    const firstRound = rounds[0]
    set({
      status: 'in_round',
      mode,
      currentRound: firstRound.id,
      roundTimeRemaining: firstRound.duration,
      isPaused: false,
      completedRounds: [],
      rounds,
    })
  },

  advanceRound: () => {
    const { currentRound, completedRounds, rounds } = get()
    if (!currentRound) return

    const updatedCompleted = [...completedRounds, currentRound]
    const nextRoundId = (currentRound + 1) as RoundId
    const nextRound = rounds.find((r) => r.id === nextRoundId)

    if (!nextRound) {
      set({ status: 'completed', currentRound: null, completedRounds: updatedCompleted })
      return
    }

    set({
      status: 'in_round',
      currentRound: nextRound.id,
      roundTimeRemaining: nextRound.duration,
      isPaused: false,
      completedRounds: updatedCompleted,
    })
  },

  pauseToggle: () => {
    set((state) => ({ isPaused: !state.isPaused }))
  },

  tickTimer: () => {
    const { isPaused, roundTimeRemaining, status } = get()
    if (isPaused || status !== 'in_round') return

    if (roundTimeRemaining <= 0) {
      get().advanceRound()
    } else {
      set({ roundTimeRemaining: roundTimeRemaining - 1 })
    }
  },

  completeRitual: () => {
    const { currentRound, completedRounds } = get()
    const updatedCompleted = currentRound ? [...completedRounds, currentRound] : completedRounds
    set({ status: 'completed', currentRound: null, completedRounds: updatedCompleted })
  },

  resetRitual: () => {
    set({
      status: 'idle',
      currentRound: null,
      roundTimeRemaining: 0,
      mode: 'free',
      isPaused: false,
      completedRounds: [],
      rounds: DEFAULT_ROUNDS,
    })
  },
}))
