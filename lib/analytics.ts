import * as amplitude from '@amplitude/analytics-react-native'

const API_KEY = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY ?? ''

export function initAnalytics() {
  if (!API_KEY) return
  amplitude.init(API_KEY)
}

// Key events — instrument all of these early
export const Analytics = {
  onboardingCompleted: () =>
    amplitude.track('onboarding_completed'),

  ritualStarted: (props: { mode: 'free' | 'guided' }) =>
    amplitude.track('ritual_started', props),

  ritualRoundCompleted: (props: { round: number; mode: 'free' | 'guided' }) =>
    amplitude.track('ritual_round_completed', props),

  ritualCompleted: (props: { mode: 'free' | 'guided' }) =>
    amplitude.track('ritual_completed', props),

  paywallViewed: (props: { source: string }) =>
    amplitude.track('paywall_viewed', props),

  subscriptionConverted: (props: { plan: string }) =>
    amplitude.track('subscription_converted', props),

  diceRolled: () =>
    amplitude.track('dice_rolled'),

  truthOrDareStarted: (props: { category: string }) =>
    amplitude.track('truth_or_dare_started', props),
}
