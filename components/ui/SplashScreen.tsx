import { useEffect } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
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
const PROGRESS_H_PAD = 48

interface SplashScreenProps {
  onFinish: () => void
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  // Particles
  const leftX = useSharedValue(-(width / 2 + 24))
  const rightX = useSharedValue(width / 2 + 24)
  const bobLeft = useSharedValue(0)
  const bobRight = useSharedValue(0)
  const particleOpacity = useSharedValue(1)

  // Bloom flash
  const bloomScale = useSharedValue(0.1)
  const bloomOpacity = useSharedValue(0)

  // Logo
  const logoOpacity = useSharedValue(0)
  const logoY = useSharedValue(12)
  const auraOpacity = useSharedValue(0)

  // Progress
  const progressOpacity = useSharedValue(0)
  const progressFillW = useSharedValue(0)

  // Screen
  const screenOpacity = useSharedValue(1)

  useEffect(() => {
    // Particles converge to center
    leftX.value = withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.cubic) })
    rightX.value = withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.cubic) })

    // Gentle vertical bobbing (opposite phases for natural feel)
    bobLeft.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(-8, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    )
    bobRight.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(8, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    )

    // Progress line fades in and fills
    const tProgress = globalThis.setTimeout(() => {
      progressOpacity.value = withTiming(1, { duration: 400 })
      progressFillW.value = withTiming(width - PROGRESS_H_PAD * 2, {
        duration: 3000,
        easing: Easing.inOut(Easing.quad),
      })
    }, 1000)

    // Collision at t=2.0s
    const tCollide = globalThis.setTimeout(() => {
      particleOpacity.value = withTiming(0, { duration: 200 })
      bloomOpacity.value = withSequence(
        withTiming(0.35, { duration: 200 }),
        withTiming(0, { duration: 400 }),
      )
      bloomScale.value = withTiming(2.5, { duration: 600, easing: Easing.out(Easing.cubic) })
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null)
    }, 2000)

    // Logo reveal at t=2.2s
    const tLogo = globalThis.setTimeout(() => {
      logoOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
      logoY.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) })
    }, 2200)

    // "aura" subtitle at t=2.5s
    const tAura = globalThis.setTimeout(() => {
      auraOpacity.value = withTiming(1, { duration: 500 })
    }, 2500)

    // Exit at t=3.8s
    const tExit = globalThis.setTimeout(() => {
      screenOpacity.value = withTiming(0, { duration: 400 }, (done) => {
        if (done) runOnJS(onFinish)()
      })
    }, 3800)

    return () => {
      globalThis.clearTimeout(tProgress)
      globalThis.clearTimeout(tCollide)
      globalThis.clearTimeout(tLogo)
      globalThis.clearTimeout(tAura)
      globalThis.clearTimeout(tExit)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }))

  const leftParticleStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
    transform: [
      { translateX: leftX.value },
      { translateY: bobLeft.value },
    ],
  }))

  const rightParticleStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
    transform: [
      { translateX: rightX.value },
      { translateY: bobRight.value },
    ],
  }))

  const bloomStyle = useAnimatedStyle(() => ({
    opacity: bloomOpacity.value,
    transform: [{ scale: bloomScale.value }],
  }))

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoY.value }],
  }))

  const auraStyle = useAnimatedStyle(() => ({ opacity: auraOpacity.value }))

  const progressWrapStyle = useAnimatedStyle(() => ({ opacity: progressOpacity.value }))

  const progressFillStyle = useAnimatedStyle(() => ({ width: progressFillW.value }))

  return (
    <Animated.View style={[styles.screen, screenStyle]}>

      {/* Bloom — rose-gold flash at particle collision */}
      <Animated.View style={[styles.bloom, bloomStyle]} />

      {/* Left particle */}
      <Animated.View style={[styles.particle, leftParticleStyle]} />

      {/* Right particle */}
      <Animated.View style={[styles.particle, rightParticleStyle]} />

      {/* Logo + tagline */}
      <View style={styles.centerContent}>
        <Animated.Text style={[styles.logoText, logoStyle]}>Ритуал</Animated.Text>
        <Animated.Text style={[styles.auraText, auraStyle]}>aura</Animated.Text>
      </View>

      {/* Progress line — appears at t=1.0s, fills over 3.0s */}
      <Animated.View style={[styles.progressWrap, progressWrapStyle]}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressFillStyle]} />
        </View>
      </Animated.View>

    </Animated.View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Particles: absolutely positioned at screen center; translateX drives them apart/together
  particle: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    top: '50%',
    left: '50%',
    marginTop: -8,
    marginLeft: -8,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    shadowOpacity: 1,
    elevation: 8,
  },
  bloom: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.accent,
    top: '50%',
    left: '50%',
    marginTop: -150,
    marginLeft: -150,
  },
  centerContent: {
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    fontFamily: Fonts.displayItalic,
    fontSize: 52,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  auraText: {
    fontFamily: Fonts.display,
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 6,
  },
  progressWrap: {
    position: 'absolute',
    bottom: 48,
    left: PROGRESS_H_PAD,
    right: PROGRESS_H_PAD,
  },
  progressTrack: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: 1,
    backgroundColor: 'rgba(194,24,91,0.6)',
    borderRadius: 1,
  },
})
