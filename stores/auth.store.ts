import { create } from 'zustand'
import type { UserProfile, IntimacyLevel, DurationPreference, RitualParticipants } from '@/types'
import { createRitualParticipants } from '@/lib/ritual-participants'

interface OnboardingPrefs {
  intimacyLevel: IntimacyLevel
  durationPreference: DurationPreference
  partnerName: string | null
}

interface AuthStore {
  user: UserProfile | null
  isLoading: boolean
  isOnboarded: boolean
  intimacyLevel: IntimacyLevel | null
  durationPreference: DurationPreference | null
  partnerName: string | null
  ritualParticipants: RitualParticipants

  setUser: (user: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setOnboardingPrefs: (prefs: OnboardingPrefs) => void
  setRitualParticipants: (participants: RitualParticipants) => void
  completeOnboarding: () => void
  hydrate: () => void
  signOut: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isOnboarded: false,
  intimacyLevel: null,
  durationPreference: null,
  partnerName: null,
  ritualParticipants: createRitualParticipants(),

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setOnboardingPrefs: ({ intimacyLevel, durationPreference, partnerName }) =>
    set({
      intimacyLevel,
      durationPreference,
      partnerName,
      ritualParticipants: createRitualParticipants({
        p2: { id: 'p2', name: partnerName ?? 'Партнёр', gender: 'f' },
      }),
    }),
  setRitualParticipants: (ritualParticipants) => set({ ritualParticipants, partnerName: ritualParticipants.p2.name }),
  completeOnboarding: () => set({ isOnboarded: true }),
  // TODO: add AsyncStorage persistence when installing @react-native-async-storage/async-storage
  hydrate: () => set({ isLoading: false }),
  signOut: () =>
    set({
      user: null,
      isOnboarded: false,
      intimacyLevel: null,
      durationPreference: null,
      partnerName: null,
      ritualParticipants: createRitualParticipants(),
    }),
}))
