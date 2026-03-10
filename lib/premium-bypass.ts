const PREMIUM_BYPASS_FLAGS = [
  process.env.EXPO_PUBLIC_BYPASS_PREMIUM,
  process.env.EXPO_PUBLIC_DEV_PREMIUM_BYPASS,
  process.env.EXPO_PUBLIC_DEV_FORCE_PREMIUM,
]

export const isPremiumBypassEnabled = __DEV__ && PREMIUM_BYPASS_FLAGS.some((value) => value === 'true')
