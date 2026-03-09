import { useEffect, useState } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withSequence,
  withDelay,
  Easing,
  runOnJS
} from 'react-native-reanimated'
import { initAnalytics } from '@/lib/analytics'
import { initRevenueCat } from '@/lib/revenuecat'
import { Colors } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth.store'
import { Logo } from '@/components/ui/Logo'

const queryClient = new QueryClient()
const { width, height } = Dimensions.get('window')

// Synchronized haptic sequence
async function fireSplashHaptics() {
  try {
    // Initial impact
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    // Heartbeat-like pattern
    await new Promise(r => setTimeout(r, 400))
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await new Promise(r => setTimeout(r, 150))
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  } catch {
    // Ignore on unsupported devices
  }
}

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const scale = useSharedValue(0.8)
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)
  const glowOpacity = useSharedValue(0)

  useEffect(() => {
    fireSplashHaptics()

    // Logo entrance
    scale.value = withSpring(1, { damping: 12, stiffness: 90 })
    opacity.value = withTiming(1, { duration: 800 })
    translateY.value = withSpring(0, { damping: 12 })
    
    // Glow effect
    glowOpacity.value = withDelay(400, withTiming(0.6, { duration: 1000 }))

    // Exit animation after delay
    const timeout = setTimeout(() => {
      scale.value = withTiming(1.2, { duration: 400, easing: Easing.in(Easing.cubic) })
      opacity.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(onFinish)()
        }
      })
    }, 2500)

    return () => clearTimeout(timeout)
  }, [])

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: 1.5 }],
  }))

  return (
    <View style={styles.splash}>
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <View style={styles.glow} />
      </Animated.View>
      <Animated.View style={logoStyle}>
        <Logo width={160} height={144} animated />
      </Animated.View>
    </View>
  )
}

function RootNavigator() {
  const { isLoading, isOnboarded, hydrate } = useAuthStore()
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    initAnalytics()
    initRevenueCat().catch(() => {})
    hydrate()
  }, [])

  useEffect(() => {
    if (!splashDone || isLoading) return
    
    // Always go to main hub, skipping global onboarding
    router.replace('/(main)')
  }, [splashDone, isLoading])

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
      <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor={Colors.background} />
        <RootNavigator />
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    width: width,
    height: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.accent,
    opacity: 0.15,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
    elevation: 20,
  },
})
