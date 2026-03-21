import { useCallback, useEffect, useRef, useState } from 'react'
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  interpolate,
  runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, Fonts } from '@/constants/theme'
import type { RitualParticipants } from '@/types'

const { height: SCREEN_H } = Dimensions.get('window')

const HOLD_MS = 1500
const TICK_MS = 50
const TRACK_W = Math.min(180, SCREEN_H * 0.22)
const PANEL_H = Math.min(260, SCREEN_H * 0.34)

export interface RitualConsentGateProps {
  participants: RitualParticipants
  onComplete: () => void
}

// ─── Hold Panel ───────────────────────────────────────────────────────────────
function HoldPanel({
  name,
  isActive,
}: {
  name: string
  isActive: boolean
}) {
  const glowOpacity = useSharedValue(0)
  const panelScale = useSharedValue(1)
  const dotScale = useSharedValue(1)

  useEffect(() => {
    if (isActive) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 650, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.3, { duration: 650, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      )
      panelScale.value = withTiming(0.97, { duration: 180 })
      dotScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      )
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 })
      panelScale.value = withTiming(1, { duration: 250 })
      dotScale.value = withTiming(1, { duration: 250 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }))
  const panelStyle = useAnimatedStyle(() => ({ transform: [{ scale: panelScale.value }] }))
  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: dotScale.value }] }))

  return (
    <Animated.View style={[styles.panel, { height: PANEL_H }, panelStyle]}>
      <LinearGradient
        colors={
          isActive
            ? ['rgba(194,24,91,0.20)', 'rgba(139,26,74,0.08)']
            : ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[styles.panelBorder, isActive && styles.panelBorderActive]}
      />
      <Animated.View pointerEvents="none" style={[styles.panelGlow, glowStyle]} />
      <Text style={styles.panelWatermark} numberOfLines={1} adjustsFontSizeToFit>
        {name}
      </Text>
      <View style={styles.panelContent}>
        <Text style={[styles.panelName, isActive && styles.panelNameActive]} numberOfLines={1}>
          {name}
        </Text>
        <Animated.View style={[styles.fingerDot, isActive && styles.fingerDotActive, dotStyle]}>
          <View style={[styles.fingerDotInner, isActive && styles.fingerDotInnerActive]} />
        </Animated.View>
        <Text style={[styles.holdHint, isActive && styles.holdHintActive]}>
          {isActive ? 'удерживайте' : 'нажмите\nи держите'}
        </Text>
      </View>
    </Animated.View>
  )
}

// ─── Consent Gate ─────────────────────────────────────────────────────────────
export function RitualConsentGate({ participants, onComplete }: RitualConsentGateProps) {
  const [p1Active, setP1Active] = useState(false)
  const [p2Active, setP2Active] = useState(false)

  const p1Ref = useRef(false)
  const p2Ref = useRef(false)
  const progressRef = useRef(0)
  const progressShared = useSharedValue(0)
  const completedRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof globalThis.setInterval> | null>(null)

  const fillStyle = useAnimatedStyle(() => ({
    width: interpolate(progressShared.value, [0, 1], [0, TRACK_W]),
  }))

  const instrStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progressShared.value, [0, 0.1], [1, 0.5]),
  }))

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    if (intervalRef.current) {
      globalThis.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    progressShared.value = withTiming(1, { duration: 120 })
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null)
    }
    globalThis.setTimeout(onComplete, 380)
  }, [onComplete, progressShared])

  useEffect(() => {
    intervalRef.current = globalThis.setInterval(() => {
      if (completedRef.current) return
      if (!p1Ref.current || !p2Ref.current) return
      progressRef.current = Math.min(1, progressRef.current + TICK_MS / HOLD_MS)
      progressShared.value = progressRef.current
      if (progressRef.current >= 1) {
        handleComplete()
      }
    }, TICK_MS)

    return () => {
      if (intervalRef.current) globalThis.clearInterval(intervalRef.current)
    }
  }, [handleComplete, progressShared])

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
    if (key === 'p1') { p1Ref.current = false; setP1Active(false) }
    else { p2Ref.current = false; setP2Active(false) }
    progressRef.current = 0
    progressShared.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) })
  }, [progressShared])

  // GestureHandler позволяет двум касаниям работать одновременно.
  // Pressable использует iOS responder system — один responder = одно касание.
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

  const bothActive = p1Active && p2Active

  return (
    <Animated.View entering={FadeIn.duration(900)} style={styles.container}>
      {/* P2 panel — top, rotated 180° so they face the device from the other side */}
      <View style={styles.rotatedWrap}>
        <GestureDetector gesture={p2Gesture}>
          <View style={styles.panelPressable}>
            <HoldPanel name={participants.p2.name} isActive={p2Active} />
          </View>
        </GestureDetector>
      </View>

      {/* Center progress indicator + instruction */}
      <View style={styles.centerRow}>
        <View style={[styles.progressTrack, { width: TRACK_W }]}>
          <Animated.View style={[styles.progressFill, fillStyle]} />
        </View>
        <Animated.Text style={[styles.instruction, bothActive && styles.instructionBoth, instrStyle]}>
          {bothActive ? 'держите оба...' : 'оба партнёра\nудерживают'}
        </Animated.Text>
      </View>

      {/* P1 panel — bottom */}
      <GestureDetector gesture={p1Gesture}>
        <View style={styles.panelPressable}>
          <HoldPanel name={participants.p1.name} isActive={p1Active} />
        </View>
      </GestureDetector>
    </Animated.View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  rotatedWrap: {
    width: '100%',
    transform: [{ rotate: '180deg' }],
  },
  centerRow: {
    alignItems: 'center',
    gap: 12,
  },
  instruction: {
    fontSize: 10,
    letterSpacing: 2.5,
    color: 'rgba(245,240,242,0.28)',
    textTransform: 'uppercase',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  instructionBoth: {
    color: Colors.accent,
    letterSpacing: 3,
  },
  panelPressable: {
    width: '100%',
  },
  panel: {
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  panelBorderActive: {
    borderColor: 'rgba(194,24,91,0.45)',
  },
  panelGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: Colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  panelWatermark: {
    position: 'absolute',
    fontFamily: Fonts.display,
    fontSize: 68,
    color: '#FFFFFF',
    opacity: 0.04,
    textAlign: 'center',
    letterSpacing: -1,
    paddingHorizontal: 8,
  },
  panelContent: {
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 12,
  },
  panelName: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: 'rgba(245,240,242,0.38)',
    fontWeight: '300',
    letterSpacing: 0.2,
  },
  panelNameActive: {
    color: 'rgba(245,240,242,0.90)',
  },
  fingerDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.glassBorder,
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
  holdHint: {
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(245,240,242,0.22)',
    textTransform: 'uppercase',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 15,
  },
  holdHintActive: {
    color: 'rgba(245,240,242,0.55)',
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: 2,
    backgroundColor: Colors.accent,
    borderRadius: 1,
    shadowColor: Colors.accent,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
})
