import { useEffect, useRef, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
} from 'react-native-reanimated'
import { Svg, Circle } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, Fonts, Spacing, Typography } from '@/constants/theme'
import type { RitualParticipants } from '@/types'

interface RitualConsentGateProps {
  participants: RitualParticipants
  onComplete: () => void
}

const HOLD_MS = 1500
const CIRCLE_SIZE = 130

function FingerprintIcon({ size = 42, opacity = 0.5 }: { size?: number; opacity?: number }) {
  const c = size / 2
  const r1 = size * 0.1
  const r2 = size * 0.2
  const r3 = size * 0.32
  const r4 = size * 0.44
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={c} cy={c} r={r1} fill={Colors.text} opacity={opacity} />
      <Circle cx={c} cy={c} r={r2} fill="none" stroke={Colors.text} strokeWidth={1.4} opacity={opacity} />
      <Circle cx={c} cy={c} r={r3} fill="none" stroke={Colors.text} strokeWidth={1.4} opacity={opacity} />
      <Circle cx={c} cy={c} r={r4} fill="none" stroke={Colors.text} strokeWidth={1.4} opacity={opacity} />
    </Svg>
  )
}

function HoldCircle({
  name,
  isConfirmed,
  onPressIn,
  onPressOut,
  flipped,
}: {
  name: string
  isConfirmed: boolean
  onPressIn: () => void
  onPressOut: () => void
  flipped?: boolean
}) {
  const ringScale = useSharedValue(1)
  const ringOpacity = useSharedValue(0)
  const pressScale = useSharedValue(1)

  useEffect(() => {
    if (isConfirmed) {
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      )
      ringScale.value = withTiming(1.08, { duration: 500 })
    } else {
      ringOpacity.value = withTiming(0, { duration: 300 })
      ringScale.value = withTiming(1, { duration: 300 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed])

  const handlePressIn = () => {
    if (isConfirmed) return
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.2, { duration: 500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
    pressScale.value = withTiming(0.94, { duration: 200 })
    onPressIn()
  }

  const handlePressOut = () => {
    if (isConfirmed) return
    ringOpacity.value = withTiming(0, { duration: 250 })
    pressScale.value = withTiming(1, { duration: 200 })
    onPressOut()
  }

  const glowStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }))

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }))

  const label = (
    <Text style={[styles.holdLabel, isConfirmed && styles.holdLabelReady]}>
      {isConfirmed ? 'READY' : name.toUpperCase()}
    </Text>
  )

  return (
    <Animated.View
      entering={FadeIn.duration(700)}
      style={flipped ? styles.circleContainerFlipped : styles.circleContainer}
    >
      {!flipped && label}

      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.pressTarget}>
        {/* Glow ring */}
        <Animated.View style={[styles.glowRing, glowStyle]} />

        {/* Static track ring via SVG */}
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={StyleSheet.absoluteFill}>
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={CIRCLE_SIZE / 2 - 2}
            fill="none"
            stroke={isConfirmed ? Colors.accent : 'rgba(255,255,255,0.1)'}
            strokeWidth={isConfirmed ? 1.5 : 1}
          />
        </Svg>

        {/* Inner circle */}
        <Animated.View style={[styles.innerCircle, isConfirmed && styles.innerCircleConfirmed, pressStyle]}>
          <FingerprintIcon size={42} opacity={isConfirmed ? 0.88 : 0.4} />
        </Animated.View>
      </Pressable>

      {flipped && label}
    </Animated.View>
  )
}

export function RitualConsentGate({ participants, onComplete }: RitualConsentGateProps) {
  const [confirmed, setConfirmed] = useState<{ p1: boolean; p2: boolean }>({ p1: false, p2: false })
  const holdTimers = useRef<Partial<Record<'p1' | 'p2', ReturnType<typeof globalThis.setTimeout>>>>({})
  const completedRef = useRef(false)

  useEffect(() => {
    const activeTimers = holdTimers.current
    return () => {
      Object.values(activeTimers).forEach((timer) => timer && globalThis.clearTimeout(timer))
    }
  }, [])

  useEffect(() => {
    if (completedRef.current) return
    if (confirmed.p1 && confirmed.p2) {
      completedRef.current = true
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null)
      }
      onComplete()
    }
  }, [confirmed, onComplete])

  const startHold = (key: 'p1' | 'p2') => {
    if (confirmed[key]) return
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null)
    }
    holdTimers.current[key] = globalThis.setTimeout(() => {
      setConfirmed((state) => ({ ...state, [key]: true }))
    }, HOLD_MS)
  }

  const cancelHold = (key: 'p1' | 'p2') => {
    if (holdTimers.current[key]) {
      globalThis.clearTimeout(holdTimers.current[key])
      holdTimers.current[key] = undefined
    }
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#5C1230', '#3A0C1C', '#1E0810', '#0A0408']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <HoldCircle
        name={participants.p1.name}
        isConfirmed={confirmed.p1}
        onPressIn={() => startHold('p1')}
        onPressOut={() => cancelHold('p1')}
        flipped
      />

      <Animated.View entering={FadeIn.duration(800).delay(500)} style={styles.center}>
        <Text style={styles.centerText}>HOLD TO BEGIN</Text>
      </Animated.View>

      <HoldCircle
        name={participants.p2.name}
        isConfirmed={confirmed.p2}
        onPressIn={() => startHold('p2')}
        onPressOut={() => cancelHold('p2')}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 60,
  },
  circleContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  circleContainerFlipped: {
    alignItems: 'center',
    gap: Spacing.md,
    flexDirection: 'column-reverse',
  },
  holdLabel: {
    fontFamily: Fonts.display,
    fontSize: 11,
    fontWeight: '300' as const,
    color: 'rgba(245, 240, 242, 0.45)',
    letterSpacing: 3.2,
    textTransform: 'uppercase' as const,
  },
  holdLabelReady: {
    color: Colors.accent,
  },
  pressTarget: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: CIRCLE_SIZE + 18,
    height: CIRCLE_SIZE + 18,
    borderRadius: (CIRCLE_SIZE + 18) / 2,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 10,
  },
  innerCircle: {
    width: CIRCLE_SIZE - 22,
    height: CIRCLE_SIZE - 22,
    borderRadius: (CIRCLE_SIZE - 22) / 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircleConfirmed: {
    backgroundColor: 'rgba(194, 71, 109, 0.16)',
  },
  center: {
    alignItems: 'center',
  },
  centerText: {
    ...Typography.label,
    color: 'rgba(245, 240, 242, 0.24)',
    letterSpacing: 2.5,
  },
})
