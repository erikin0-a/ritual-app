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
} from 'react-native-reanimated'
import { Pause, Play } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { Colors, Fonts } from '@/constants/theme'
import type { RoundId } from '@/types'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const SIZE = 240
const RADIUS = 46
const VIEWBOX = 100
const CIRCUMFERENCE = 2 * Math.PI * RADIUS // ~289.03

interface MeditationTimerProps {
  totalSeconds: number
  remainingSeconds: number
  isPaused: boolean
  roundIndex?: RoundId
  onPauseToggle: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function MeditationTimer({
  totalSeconds,
  remainingSeconds,
  isPaused,
  roundIndex = 1,
  onPauseToggle,
}: MeditationTimerProps) {
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0

  // Smooth arc animation
  const dashOffset = useSharedValue(CIRCUMFERENCE * (1 - progress))
  const prevTotalRef = useRef(totalSeconds)

  useEffect(() => {
    const target = CIRCUMFERENCE * (1 - progress)
    if (prevTotalRef.current !== totalSeconds) {
      prevTotalRef.current = totalSeconds
      dashOffset.value = target
    } else {
      dashOffset.value = withTiming(target, { duration: 950, easing: Easing.out(Easing.quad) })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, totalSeconds])

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }))

  // Glow ring pulse: opacity 0.05 <-> 0.18
  const glowOpacity = useSharedValue(0.05)

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.18, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.05, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
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

  return (
    <View style={styles.container}>
      {/* Glow ring behind SVG */}
      <Animated.View style={[styles.glowRing, glowStyle]} />

      {/* SVG ring */}
      <View style={styles.ringWrap}>
        {/* Background track */}
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} style={StyleSheet.absoluteFill}>
          <Circle
            cx={VIEWBOX / 2}
            cy={VIEWBOX / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={0.5}
          />
        </Svg>

        {/* Progress arc */}
        <Animated.View style={[StyleSheet.absoluteFill, ringStyle]}>
          <Svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
            style={{ transform: [{ rotate: '-90deg' }] }}
          >
            <AnimatedCircle
              cx={VIEWBOX / 2}
              cy={VIEWBOX / 2}
              r={RADIUS}
              fill="none"
              stroke={Colors.accent}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              animatedProps={arcProps}
            />
          </Svg>
        </Animated.View>

        {/* Center time display */}
        <View style={styles.centerContent}>
          <Text style={styles.remainingLabel}>ОСТАЛОСЬ</Text>
          <Text style={styles.timeText}>{formatTime(remainingSeconds)}</Text>
          {isPaused && <Text style={styles.pausedLabel}>ПАУЗА</Text>}
        </View>
      </View>

      {/* Pause button */}
      <Pressable
        style={({ pressed }) => [styles.pauseBtn, pressed && styles.pauseBtnPressed]}
        onPress={handlePause}
        accessibilityLabel={isPaused ? 'Продолжить' : 'Пауза'}
      >
        {isPaused ? (
          <Play size={18} color={Colors.text} fill={Colors.text} />
        ) : (
          <Pause size={18} color={Colors.text} />
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 20,
  },
  glowRing: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: Colors.accent,
  },
  ringWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  remainingLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.30)',
    fontWeight: '500',
  },
  timeText: {
    fontFamily: Fonts.display,
    fontSize: 52,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  pausedLabel: {
    fontSize: 9,
    letterSpacing: 3.5,
    color: Colors.accent,
    fontWeight: '600',
    marginTop: 2,
  },
  pauseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBtnPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.95 }],
  },
})
