import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
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
import { Colors, Fonts } from '@/constants/theme'

const { width } = Dimensions.get('window')

const TRACK_W = 192
const SHIMMER_W = 80

const PHASE_TEXTS = [
  'Приглашаем вас...',
  'Синхронизируем...',
  'Готовимся к ритуалу...',
]

interface SplashScreenProps {
  onFinish: () => void
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [phaseIndex, setPhaseIndex] = useState(0)

  const logoOpacity = useSharedValue(0)
  const logoY = useSharedValue(24)
  const blobScale = useSharedValue(0.5)
  const blobOpacity = useSharedValue(0)
  const shimmerX = useSharedValue(-SHIMMER_W)
  const phaseOpacity = useSharedValue(1)
  const screenOpacity = useSharedValue(1)

  useEffect(() => {
    // Logo entrance
    logoOpacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) })
    logoY.value = withTiming(0, { duration: 900, easing: Easing.out(Easing.cubic) })

    // Blob pulse: scale 0.5 → 1.5, opacity 0 → 0.2
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

    // Phase text: cross-fade at 1.2s and 2.4s
    const t1 = globalThis.setTimeout(() => {
      phaseOpacity.value = withTiming(0, { duration: 220 }, (done) => {
        if (!done) return
        runOnJS(setPhaseIndex)(1)
        phaseOpacity.value = withTiming(1, { duration: 220 })
      })
    }, 1200)

    const t2 = globalThis.setTimeout(() => {
      phaseOpacity.value = withTiming(0, { duration: 220 }, (done) => {
        if (!done) return
        runOnJS(setPhaseIndex)(2)
        phaseOpacity.value = withTiming(1, { duration: 220 })
      })
    }, 2400)

    // Exit: haptic + 400ms fade-out at 3.6s
    const exitTimer = globalThis.setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null)
      screenOpacity.value = withTiming(0, { duration: 400 }, (done) => {
        if (done) runOnJS(onFinish)()
      })
    }, 3600)

    return () => {
      globalThis.clearTimeout(t1)
      globalThis.clearTimeout(t2)
      globalThis.clearTimeout(exitTimer)
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

      {/* Logo: "Ритуал aura" */}
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Text style={styles.logoText}>
          {'Ритуал '}
          <Text style={styles.logoItalic}>aura</Text>
        </Text>
      </Animated.View>

      {/* Shimmer progress bar + phase text */}
      <View style={styles.progressSection}>
        <Animated.View style={logoStyle}>
          <View style={styles.track}>
            <Animated.View style={[styles.shimmer, shimmerStyle]} />
          </View>
        </Animated.View>
        <Animated.Text style={[styles.phaseText, phaseStyle]}>
          {PHASE_TEXTS[phaseIndex]}
        </Animated.Text>
      </View>
    </Animated.View>
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
