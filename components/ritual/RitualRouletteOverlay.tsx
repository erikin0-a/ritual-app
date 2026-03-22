import { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { Colors, Fonts } from '@/constants/theme'
import type { RitualParticipants } from '@/types'

type RouletteState = 'spinning' | 'revealing' | 'done'

interface RitualRouletteOverlayProps {
  participants: RitualParticipants
  onComplete: (winner: 'p1' | 'p2') => void
}

export function RitualRouletteOverlay({ participants, onComplete }: RitualRouletteOverlayProps) {
  const [state, setState] = useState<RouletteState>('spinning')
  const [displayName, setDisplayName] = useState(participants.p1.name)
  const winnerRef = useRef<'p1' | 'p2'>(Math.random() > 0.5 ? 'p1' : 'p2')
  const intervalRef = useRef<ReturnType<typeof globalThis.setInterval> | null>(null)
  const completedRef = useRef(false)

  // Glow animation for the winner
  const glowOpacity = useSharedValue(0)

  useEffect(() => {
    const names = [participants.p1.name, participants.p2.name]
    let tick = 0

    // Phase 1: spinning (0–2.5s) — fast name toggle every 120ms
    intervalRef.current = globalThis.setInterval(() => {
      tick++
      setDisplayName(names[tick % 2])
    }, 120)

    // Phase 2: revealing (2.5s) — slow down
    const revealTimer = globalThis.setTimeout(() => {
      setState('revealing')
      if (intervalRef.current) {
        globalThis.clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      // Slower toggles: 250ms, 400ms, 600ms then stop
      let slowTick = 0
      const slowDelays = [250, 400, 600]

      const doSlowTick = () => {
        if (slowTick < slowDelays.length) {
          setDisplayName(names[(tick + slowTick + 1) % 2])
          slowTick++
          globalThis.setTimeout(doSlowTick, slowDelays[slowTick - 1])
        } else {
          // Final: show winner
          setDisplayName(participants[winnerRef.current].name)
          globalThis.setTimeout(() => {
            setState('done')
          }, 200)
        }
      }
      doSlowTick()
    }, 2500)

    return () => {
      if (intervalRef.current) globalThis.clearInterval(intervalRef.current)
      globalThis.clearTimeout(revealTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Done state: haptic + glow + complete callback after 1.5s
  useEffect(() => {
    if (state !== 'done') return
    if (completedRef.current) return
    completedRef.current = true

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null)

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.2, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )

    const timer = globalThis.setTimeout(() => {
      onComplete(winnerRef.current)
    }, 1500)

    return () => globalThis.clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={styles.overlay}>
      {/* Kicker */}
      <Text style={styles.kicker}>
        {state === 'done' ? 'Выбрано' : 'Рулетка выбирает...'}
      </Text>

      {/* Winner name with glow */}
      <View style={styles.nameWrap}>
        {state === 'done' && <Animated.View style={[styles.nameGlow, glowStyle]} />}
        <Text style={[styles.winnerName, state === 'done' && styles.winnerNameDone]}>
          {displayName}
        </Text>
      </View>

      {/* Subtitle */}
      {state === 'done' && (
        <Animated.Text entering={FadeIn.duration(600).delay(200)} style={styles.subtitle}>
          ведёт этот раунд
        </Animated.Text>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.40)',
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: 16,
  },
  nameWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.accent,
  },
  winnerName: {
    fontFamily: Fonts.display,
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  winnerNameDone: {
    textShadowColor: 'rgba(194,24,91,0.5)',
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 0 },
  },
  subtitle: {
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    fontWeight: '400',
    marginTop: 12,
  },
})
