import { useCallback, useEffect, useRef, useState } from 'react'
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { Colors, Fonts } from '@/constants/theme'
import type { RitualParticipants } from '@/types'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const { height: SCREEN_H } = Dimensions.get('window')

const HOLD_MS = 1500
const TICK_MS = 50
const RING_SIZE = 120
const RING_RADIUS = 48
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS // ~301.59

export interface RitualConsentGateProps {
  participants: RitualParticipants
  onComplete: () => void
}

// ─── Partner Half ────────────────────────────────────────────────────────────
function PartnerHalf({
  name,
  isActive,
  progress,
  rotated,
}: {
  name: string
  isActive: boolean
  progress: number
  rotated: boolean
}) {
  const ringProgress = useSharedValue(0)
  const watermarkOpacity = useSharedValue(0.025)

  useEffect(() => {
    ringProgress.value = withTiming(progress, { duration: TICK_MS + 10, easing: Easing.linear })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  useEffect(() => {
    watermarkOpacity.value = withTiming(isActive ? 0.07 : 0.025, { duration: 600 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - ringProgress.value),
  }))

  const watermarkStyle = useAnimatedStyle(() => ({
    opacity: watermarkOpacity.value,
  }))

  return (
    <View style={[styles.half, rotated && styles.halfRotated]}>
      {/* Watermark name */}
      <Animated.Text style={[styles.watermarkName, watermarkStyle]} numberOfLines={1} adjustsFontSizeToFit>
        {name.toUpperCase()}
      </Animated.Text>

      {/* SVG progress ring */}
      <View style={styles.ringContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE} viewBox="0 0 100 100">
          {/* Track */}
          <Circle
            cx={50}
            cy={50}
            r={RING_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={1}
          />
          {/* Progress */}
          <AnimatedCircle
            cx={50}
            cy={50}
            r={RING_RADIUS}
            fill="none"
            stroke={isActive ? Colors.accent : 'rgba(255,255,255,0.15)'}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
            animatedProps={arcProps}
            rotation={-90}
            origin="50, 50"
          />
        </Svg>

        {/* Inner content */}
        <View style={styles.ringInner}>
          <View style={[styles.fingerDot, isActive && styles.fingerDotActive]}>
            <View style={[styles.fingerDotInner, isActive && styles.fingerDotInnerActive]} />
          </View>
        </View>
      </View>

      {/* Partner name */}
      <Text style={[styles.partnerName, isActive && styles.partnerNameActive]} numberOfLines={1}>
        {name}
      </Text>

      {/* Hold hint */}
      <Text style={[styles.holdHint, isActive && styles.holdHintActive]}>
        {isActive ? 'удерживайте' : 'нажмите и держите'}
      </Text>
    </View>
  )
}

// ─── Consent Gate ─────────────────────────────────────────────────────────────
export function RitualConsentGate({ participants, onComplete }: RitualConsentGateProps) {
  const [p1Active, setP1Active] = useState(false)
  const [p2Active, setP2Active] = useState(false)
  const [p1Progress, setP1Progress] = useState(0)
  const [p2Progress, setP2Progress] = useState(0)

  const p1Ref = useRef(false)
  const p2Ref = useRef(false)
  const progressRef = useRef(0)
  const completedRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof globalThis.setInterval> | null>(null)

  // Divider glow
  const dividerGlow = useSharedValue(0)

  const dividerStyle = useAnimatedStyle(() => ({
    shadowOpacity: dividerGlow.value,
  }))

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    if (intervalRef.current) {
      globalThis.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null)
    }
    globalThis.setTimeout(onComplete, 380)
  }, [onComplete])

  useEffect(() => {
    intervalRef.current = globalThis.setInterval(() => {
      if (completedRef.current) return
      if (!p1Ref.current || !p2Ref.current) return
      progressRef.current = Math.min(1, progressRef.current + TICK_MS / HOLD_MS)
      const p = progressRef.current
      setP1Progress(p)
      setP2Progress(p)
      if (p >= 1) {
        handleComplete()
      }
    }, TICK_MS)

    return () => {
      if (intervalRef.current) globalThis.clearInterval(intervalRef.current)
    }
  }, [handleComplete])

  // Update divider glow when both are active
  useEffect(() => {
    const bothActive = p1Active && p2Active
    dividerGlow.value = withTiming(bothActive ? 0.6 : 0, { duration: 400 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p1Active, p2Active])

  const startHold = useCallback((key: 'p1' | 'p2') => {
    if (completedRef.current) return
    if (key === 'p1') { p1Ref.current = true; setP1Active(true) }
    else { p2Ref.current = true; setP2Active(true) }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null)
    }
  }, [])

  const cancelHold = useCallback((key: 'p1' | 'p2') => {
    if (completedRef.current) return
    if (key === 'p1') { p1Ref.current = false; setP1Active(false); setP1Progress(0) }
    else { p2Ref.current = false; setP2Active(false); setP2Progress(0) }
    progressRef.current = 0
  }, [])

  const p1Gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin(() => runOnJS(startHold)('p1'))
    .onFinalize(() => runOnJS(cancelHold)('p1'))

  const p2Gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin(() => runOnJS(startHold)('p2'))
    .onFinalize(() => runOnJS(cancelHold)('p2'))

  p1Gesture.simultaneousWithExternalGesture(p2Gesture)
  p2Gesture.simultaneousWithExternalGesture(p1Gesture)

  return (
    <Animated.View entering={FadeIn.duration(900)} style={styles.container}>
      {/* P2 panel — top, rotated 180° */}
      <GestureDetector gesture={p2Gesture}>
        <View style={styles.halfTouchable}>
          <PartnerHalf
            name={participants.p2.name}
            isActive={p2Active}
            progress={p2Progress}
            rotated
          />
        </View>
      </GestureDetector>

      {/* Divider — 1px line, glows when both active */}
      <Animated.View style={[styles.divider, dividerStyle]} />

      {/* P1 panel — bottom */}
      <GestureDetector gesture={p1Gesture}>
        <View style={styles.halfTouchable}>
          <PartnerHalf
            name={participants.p1.name}
            isActive={p1Active}
            progress={p1Progress}
            rotated={false}
          />
        </View>
      </GestureDetector>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  halfTouchable: {
    flex: 1,
  },
  half: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  halfRotated: {
    transform: [{ rotate: '180deg' }],
  },
  watermarkName: {
    position: 'absolute',
    fontFamily: Fonts.display,
    fontSize: 80,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -2,
    paddingHorizontal: 8,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerDotActive: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(194,24,91,0.14)',
  },
  fingerDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  fingerDotInnerActive: {
    backgroundColor: Colors.accent,
  },
  partnerName: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: 'rgba(245,240,242,0.38)',
    letterSpacing: 0.2,
  },
  partnerNameActive: {
    color: 'rgba(245,240,242,0.90)',
  },
  holdHint: {
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(245,240,242,0.22)',
    textTransform: 'uppercase',
    fontWeight: '500',
    textAlign: 'center',
  },
  holdHintActive: {
    color: 'rgba(245,240,242,0.55)',
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#FFFFFF',
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
})
