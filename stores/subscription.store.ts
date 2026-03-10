import { create } from 'zustand'
import type { SubscriptionStatus } from '@/types'
import { isPremiumBypassEnabled } from '@/lib/premium-bypass'

interface SubscriptionStore {
  status: SubscriptionStatus
  setStatus: (status: SubscriptionStatus) => void
  isPremium: () => boolean
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  // Temporary dev default so premium-only flows are testable before RevenueCat is wired.
  status: isPremiumBypassEnabled ? 'premium' : 'free',

  setStatus: (status) => set({ status }),

  isPremium: () => get().status === 'premium',
}))
