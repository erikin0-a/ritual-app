import { useEffect, useRef, useState } from 'react'
import { Animated, View, Text, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { initAnalytics } from '@/lib/analytics'
import { Colors, Spacing, Typography } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth.store'

const queryClient = new QueryClient()

// Passionate haptic sequence — fires on splash entry
async function firePassionateHaptic() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await new Promise((r) => setTimeout(r, 120))
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await new Promise((r) => setTimeout(r, 80))
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    await new Promise((r) => setTimeout(r, 180))
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await new Promise((r) => setTimeout(r, 100))
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  } catch {
    // Haptics not available on simulator — silently ignore
  }
}

function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.88)).current
  const glowOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    firePassionateHaptic()

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 0.35,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <View style={styles.splash}>
      {/* Soft ambient glow */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center', gap: Spacing.md }}>
        <Text style={styles.splashName}>Nightly</Text>
        <Text style={styles.splashTagline}>Ваш ежевечерний ритуал близости</Text>
      </Animated.View>
    </View>
  )
}

function RootNavigator() {
  const { isLoading, isOnboarded, hydrate } = useAuthStore()
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    initAnalytics()
    hydrate()

    // Splash shows for at least 2.2s
    const t = setTimeout(() => setSplashDone(true), 2200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!splashDone || isLoading) return
    if (isOnboarded) {
      router.replace('/(main)')
    } else {
      router.replace('/(auth)/onboarding')
    }
  }, [splashDone, isLoading, isOnboarded])

  // Show custom splash while hydrating / minimum splash duration not met
  if (!splashDone || isLoading) {
    return <SplashScreen />
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
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#FF4F8B',
    // Simulated glow via shadow (iOS) / elevation (Android)
    shadowColor: '#FF4F8B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
    elevation: 30,
  },
  splashName: {
    fontSize: 52,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -1.5,
  },
  splashTagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
})
