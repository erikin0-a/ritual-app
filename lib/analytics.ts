import * as amplitude from '@amplitude/analytics-react-native'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

const API_KEY = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY ?? ''
const HAS_VALID_API_KEY = Boolean(API_KEY) && API_KEY !== 'your-amplitude-key-here'
const SESSION_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
const APP_VERSION = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? 'unknown'

export function initAnalytics() {
  if (HAS_VALID_API_KEY) {
    amplitude.init(API_KEY)
  }
}

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>

function track(event: string, props?: AnalyticsProps) {
  const payload = {
    platform: Platform.OS,
    app_version: APP_VERSION,
    session_id: SESSION_ID,
    ...props,
  }

  if (!HAS_VALID_API_KEY) {
    return
  }

  amplitude.track(event, payload)
}

// Key events — instrument all of these early
export const Analytics = {
  onboardingCompleted: () =>
    track('onboarding_completed'),

  ritualStarted: (props: { mode: 'free' | 'guided' }) =>
    track('ritual_started', props),

  ritualRoundCompleted: (props: { round: number; mode: 'free' | 'guided' }) =>
    track('ritual_round_completed', props),

  ritualCompleted: (props: { mode: 'free' | 'guided' }) =>
    track('ritual_completed', props),

  premiumToggleClicked: (props: { paywall_source: string; has_premium_access: boolean }) =>
    track('premium_toggle_clicked', props),

  paywallOpened: (props: { paywall_source: string }) =>
    track('paywall_opened', props),

  paywallCtaClicked: (props: {
    paywall_source: string
    cta: 'start_trial_annual' | 'subscribe_monthly' | 'restore_purchases'
  }) => track('paywall_cta_clicked', props),

  trialStarted: (props: { paywall_source: string; plan: 'annual' }) =>
    track('trial_started', props),

  subscriptionStarted: (props: { paywall_source: string; plan: 'monthly' | 'annual' }) =>
    track('subscription_started', props),

  premiumSessionStarted: () =>
    track('premium_session_started', { mode: 'guided' }),

  premiumSessionCompleted: () =>
    track('premium_session_completed', { mode: 'guided' }),

  // Compatibility wrappers for previously instrumented events.
  paywallViewed: (props: { source: string }) =>
    track('paywall_opened', { paywall_source: props.source }),

  subscriptionConverted: (props: { plan: string }) =>
    track('subscription_started', {
      paywall_source: 'unknown',
      plan: props.plan === 'annual' ? 'annual' : 'monthly',
    }),

  diceRolled: () =>
    track('dice_rolled'),

  truthOrDareStarted: (props: { category: string }) =>
    track('truth_or_dare_started', props),
}
