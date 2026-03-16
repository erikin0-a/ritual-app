import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display'
import { initAnalytics } from '@/lib/analytics'
import { initRevenueCat } from '@/lib/revenuecat'
import { Colors, Fonts } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth.store'

const queryClient = new QueryClient()
const { width } = Dimensions.get('window')

const TRACK_W = 192
const SHIMMER_W = 80

const PHASE_TEXTS = [
  'Приглашаем вас...',
  'Синхронизируем...',
  'Готовимся к ритуалу...',
]

// ─── Splash Screen ─────────────────────────────────────────────────────────────
function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phaseIndex, setPhaseIndex] = useState(0)

  // Logo elements
  const logoOpacity = useSharedValue(0)
  const logoY = useSharedValue(24)

  // Blob behind logo
  const blobScale = useSharedValue(0.5)
  const blobOpacity = useSharedValue(0)

  // Shimmer progress bar
  const shimmerX = useSharedValue(-SHIMMER_W)

  // Phase text fade
  const phaseOpacity = useSharedValue(1)

  // Screen fade-out
  const screenOpacity = useSharedValue(1)

  useEffect(() => {
    // Logo entrance
    logoOpacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) })
    logoY.value = withTiming(0, { duration: 900, easing: Easing.out(Easing.cubic) })

    // Blob pulse loop: scale 0.5 → 1.5, opacity 0 → 0.2
    blobScale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
    blobOpacity.value = withRepeat(
      withSequence(
        withTiming(0.22, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.05, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )

    // Shimmer: translateX -SHIMMER_W → TRACK_W + SHIMMER_W, 1.8s loop
    shimmerX.value = withRepeat(
      withTiming(TRACK_W + SHIMMER_W, { duration: 1800, easing: Easing.linear }),
      -1,
      false,
    )

    // Phase text transitions
    const t1 = setTimeout(() => {
      phaseOpacity.value = withTiming(0, { duration: 220 }, (done) => {
        if (!done) return
        runOnJS(setPhaseIndex)(1)
        phaseOpacity.value = withTiming(1, { duration: 220 })
      })
    }, 1200)

    const t2 = setTimeout(() => {
      phaseOpacity.value = withTiming(0, { duration: 220 }, (done) => {
        if (!done) return
        runOnJS(setPhaseIndex)(2)
        phaseOpacity.value = withTiming(1, { duration: 220 })
      })
    }, 2400)

    // Exit: haptic + 400ms fade-out
    const exitTimer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
      screenOpacity.value = withTiming(0, { duration: 400 }, (done) => {
        if (done) runOnJS(onFinish)()
      })
    }, 3600)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(exitTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }))
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoY.value }],
  }))
  const blobStyle = useAnimatedStyle(() => ({
    opacity: blobOpacity.value,
    transform: [{ scale: blobScale.value }],
  }))
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }))
  const phaseStyle = useAnimatedStyle(() => ({ opacity: phaseOpacity.value }))

  return (
    <Animated.View style={[styles.splash, screenStyle]}>
      {/* Animated glow blob behind logo */}
      <Animated.View style={[styles.blob, blobStyle]} />

      {/* Logo text: "Ритуал aura" */}
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Text style={styles.logoText}>
          {'Ритуал '}
          <Text style={styles.logoItalic}>aura</Text>
        </Text>
      </Animated.View>

      {/* Progress bar + phase text */}
      <Animated.View style={[styles.progressSection, logoStyle]}>
        <View style={styles.track}>
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </View>
        <Animated.Text style={[styles.phaseText, phaseStyle]}>
          {PHASE_TEXTS[phaseIndex]}
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  )
}

// ─── Root Navigator ────────────────────────────────────────────────────────────
function RootNavigator() {
  const { isLoading, isOnboarded, hydrate } = useAuthStore()
  const [splashDone, setSplashDone] = useState(false)
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold,
  })

  useEffect(() => {
    initAnalytics()
    initRevenueCat().catch(() => {})
    hydrate()
  }, [])

  useEffect(() => {
    if (!splashDone || isLoading || !fontsLoaded) return

    if (isOnboarded) {
      router.replace('/(main)')
    } else {
      router.replace('/(auth)/' as never)
    }
  }, [splashDone, isLoading, isOnboarded, fontsLoaded])

  if (!splashDone || !fontsLoaded) {
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
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width * 0.425,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 80,
    elevation: 40,
  },
  logoWrap: {
    alignItems: 'center',
  },
  logoText: {
    fontFamily: Fonts.display,
    fontSize: 56,
    color: '#FFFFFF',
    letterSpacing: -1,
    textAlign: 'center',
  },
  logoItalic: {
    fontFamily: Fonts.displayItalic,
    fontStyle: 'italic',
    fontWeight: '300',
    color: 'rgba(255,255,255,0.60)',
  },
  progressSection: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    gap: 12,
  },
  track: {
    width: TRACK_W,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  shimmer: {
    width: SHIMMER_W,
    height: '100%',
    backgroundColor: 'rgba(245,242,237,0.35)',
    borderRadius: 1,
  },
  phaseText: {
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.28)',
    fontWeight: '500',
    textAlign: 'center',
  },
})
