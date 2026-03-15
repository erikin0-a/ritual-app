import { useCallback, useEffect, useRef, useState } from 'react'
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
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
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, Fonts } from '@/constants/theme'
import type { RitualParticipants } from '@/types'

const { height: SCREEN_H } = Dimensions.get('window')

const HOLD_MS = 1500
const TICK_MS = 50
const TRACK_H = Math.min(180, SCREEN_H * 0.22)
const PANEL_H = Math.min(320, SCREEN_H * 0.40)

export interface RitualConsentGateProps {
  participants: RitualParticipants
  onComplete: () => void
}

// ─── Hold Panel ───────────────────────────────────────────────────────────────
function HoldPanel({
  name,
  side,
  isActive,
  onPressIn,
  onPressOut,
}: {
  name: string
  side: 'left' | 'right'
  isActive: boolean
  onPressIn: () => void
  onPressOut: () => void
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
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.panelPressable}
    >
      <Animated.View style={[styles.panel, { height: PANEL_H }, panelStyle]}>
        {/* Glass fill */}
        <LinearGradient
          colors={
            isActive
              ? ['rgba(194,71,109,0.20)', 'rgba(139,26,74,0.08)']
              : ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']
          }
          start={{ x: side === 'left' ? 0 : 1, y: 0 }}
          end={{ x: side === 'left' ? 1 : 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Border overlay */}
        <View
          pointerEvents="none"
          style={[styles.panelBorder, isActive && styles.panelBorderActive]}
        />
        {/* Glow bloom */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.panelGlow,
            glowStyle,
            { [side === 'left' ? 'left' : 'right']: 0 },
          ]}
        />
        {/* Ghost watermark — large faint name behind content */}
        <Text style={styles.panelWatermark} numberOfLines={1} adjustsFontSizeToFit>
          {name}
        </Text>

        {/* Content */}
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
    </Pressable>
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fillStyle = useAnimatedStyle(() => ({
    height: interpolate(progressShared.value, [0, 1], [0, TRACK_H]),
  }))

  const instrStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progressShared.value, [0, 0.1], [1, 0.5]),
  }))

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    progressShared.value = withTiming(1, { duration: 120 })
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null)
    }
    setTimeout(onComplete, 380)
  }, [onComplete, progressShared])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (completedRef.current) return
      if (!p1Ref.current || !p2Ref.current) return
      progressRef.current = Math.min(1, progressRef.current + TICK_MS / HOLD_MS)
      progressShared.value = progressRef.current
      if (progressRef.current >= 1) {
        handleComplete()
      }
    }, TICK_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
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

  const bothActive = p1Active && p2Active

  return (
    <Animated.View entering={FadeIn.duration(900)} style={styles.container}>
      {/* Instruction */}
      <Animated.Text style={[styles.instruction, bothActive && styles.instructionBoth, instrStyle]}>
        {bothActive ? 'держите оба...' : 'оба партнёра удерживают одновременно'}
      </Animated.Text>

      {/* Panels + progress */}
      <View style={styles.panelsRow}>
        <HoldPanel
          name={participants.p1.name}
          side="left"
          isActive={p1Active}
          onPressIn={() => startHold('p1')}
          onPressOut={() => cancelHold('p1')}
        />

        {/* Center progress indicator */}
        <View style={styles.centerColumn}>
          <View style={[styles.progressTrack, { height: TRACK_H }]}>
            <Animated.View style={[styles.progressFill, fillStyle]} />
          </View>
        </View>

        <HoldPanel
          name={participants.p2.name}
          side="right"
          isActive={p2Active}
          onPressIn={() => startHold('p2')}
          onPressOut={() => cancelHold('p2')}
        />
      </View>
    </Animated.View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    paddingHorizontal: 20,
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
  panelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  panelPressable: {
    flex: 1,
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
    borderColor: 'rgba(194,71,109,0.45)',
  },
  panelGlow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
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
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerDotActive: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(194,71,109,0.14)',
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
  centerColumn: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  progressFill: {
    width: 2,
    backgroundColor: Colors.accent,
    borderRadius: 1,
    shadowColor: Colors.accent,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
})
