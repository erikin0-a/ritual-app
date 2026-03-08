import { create } from 'zustand'
import type { SubscriptionStatus } from '@/types'

interface SubscriptionStore {
  status: SubscriptionStatus
  setStatus: (status: SubscriptionStatus) => void
  isPremium: () => boolean
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  status: 'loading',

  setStatus: (status) => set({ status }),

  isPremium: () => get().status === 'premium',
}))
