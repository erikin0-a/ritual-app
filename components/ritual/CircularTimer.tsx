import { useEffect, useRef } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated'
import { Pause, Play, SkipForward } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { BorderRadius, Colors, SemanticColors, Spacing, Typography } from '@/constants/theme'
import type { RoundId } from '@/types'

// Ring color evolves across rounds: white (R1) → accent (R2-3) → deep rose (R4-5)
const ROUND_STROKE_COLORS = [
  'rgba(255,255,255,0.88)',
  Colors.accent,
  Colors.accent,
  '#8B1A4A',
  '#8B1A4A',
] as const

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface CircularTimerProps {
  totalSeconds: number
  remainingSeconds: number
  isPaused: boolean
  roundIndex?: RoundId
  onPauseToggle: () => void
  onSkip?: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function CircularTimer({
  totalSeconds,
  remainingSeconds,
  isPaused,
  roundIndex = 1,
  onPauseToggle,
  onSkip,
}: CircularTimerProps) {
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0
  const strokeWidth = 9
  const radius = (TIMER_SIZE - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // Smooth arc animation: animate strokeDashoffset toward the target each second.
  // On round change (totalSeconds changes) reset immediately without animation.
  const dashOffset = useSharedValue(circumference * (1 - progress))
  const prevTotalRef = useRef(totalSeconds)

  useEffect(() => {
    const target = circumference * (1 - progress)
    if (prevTotalRef.current !== totalSeconds) {
      // New round — snap immediately
      prevTotalRef.current = totalSeconds
      dashOffset.value = target
    } else {
      // Same round — smooth 950ms tween so the ring glides rather than jumps
      dashOffset.value = withTiming(target, { duration: 950, easing: Easing.out(Easing.quad) })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, totalSeconds])

  // Ring color shifts per round: white (R1) → accent (R2-3) → accentDark (R4-5)
  const colorProgress = useSharedValue(roundIndex - 1)

  useEffect(() => {
    colorProgress.value = withTiming(roundIndex - 1, { duration: 1200, easing: Easing.out(Easing.cubic) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex])

  const arcAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
    stroke: interpolateColor(colorProgress.value, [0, 1, 2, 3, 4], [...ROUND_STROKE_COLORS]),
  }))

  // Ring dims when paused
  const ringOpacity = useSharedValue(1)

  useEffect(() => {
    if (isPaused) {
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.35, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.75, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      )
    } else {
      ringOpacity.value = withTiming(1, { duration: 400 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused])

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
  }))

  function handlePause() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null)
    onPauseToggle()
  }

  function handleSkip() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null)
    onSkip?.()
  }

  return (
    <View style={styles.container}>
      {/* ── Ring + time display ── */}
      <View style={styles.timerShell}>
        {/* Static track */}
        <Svg width={TIMER_SIZE} height={TIMER_SIZE} style={StyleSheet.absoluteFill}>
          <Circle
            cx={TIMER_SIZE / 2}
            cy={TIMER_SIZE / 2}
            r={radius}
            stroke={SemanticColors.timerTrack}
            strokeWidth={strokeWidth}
            fill="none"
          />
        </Svg>

        {/* Progress arc (dims on pause, animates smoothly each second) */}
        <Animated.View style={[StyleSheet.absoluteFill, ringStyle]}>
          <Svg width={TIMER_SIZE} height={TIMER_SIZE}>
            <AnimatedCircle
              cx={TIMER_SIZE / 2}
              cy={TIMER_SIZE / 2}
              r={radius}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              animatedProps={arcAnimatedProps}
              rotation={-90}
              origin={`${TIMER_SIZE / 2}, ${TIMER_SIZE / 2}`}
            />
          </Svg>
        </Animated.View>

        {/* Inner face */}
        <View style={styles.innerFace}>
          <Text style={styles.timeText}>{formatTime(remainingSeconds)}</Text>
          {isPaused ? (
            <Text style={styles.pausedLabel}>ПАУЗА</Text>
          ) : (
            <Text style={styles.metaLabel}>до смены фазы</Text>
          )}
        </View>
      </View>

      {/* ── Icon controls ── */}
      <View style={styles.controls}>
        {/* Primary: pause / resume */}
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          onPress={handlePause}
          accessibilityLabel={isPaused ? 'Продолжить' : 'Пауза'}
        >
          {isPaused ? (
            <Play size={22} color={Colors.text} fill={Colors.text} />
          ) : (
            <Pause size={22} color={Colors.text} />
          )}
        </Pressable>

        {/* Secondary: skip round */}
        {onSkip && (
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
            onPress={handleSkip}
            accessibilityLabel="Пропустить раунд"
          >
            <SkipForward size={18} color={Colors.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  )
}

const TIMER_SIZE = 232

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  timerShell: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerFace: {
    width: 168,
    height: 168,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(13,10,15,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 50,
    fontWeight: '200' as const,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  metaLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  pausedLabel: {
    fontSize: 9,
    letterSpacing: 3.5,
    color: Colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  primaryBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  secondaryBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.95 }],
  },
})

