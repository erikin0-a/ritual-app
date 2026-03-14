import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { BorderRadius, Colors, Fonts, Spacing, Typography } from '@/constants/theme'
import type { GuidedBranch, RitualParticipants } from '@/types'

interface RitualSetupOverlayProps {
  kind: 'roulette' | 'starter-choice'
  title: string
  body: string
  participants: RitualParticipants
  onConfirm: (branch: GuidedBranch) => void
}

// ─── Animated Roulette ────────────────────────────────────────────────────────
function RouletteSpinner({
  participants,
  onResult,
}: {
  participants: RitualParticipants
  onResult: (branch: GuidedBranch) => void
}) {
  const names = [participants.p1.name, participants.p2.name]
  const [displayIndex, setDisplayIndex] = useState(0)
  const [phase, setPhase] = useState<'spinning' | 'settled'>('spinning')
  const [winner, setWinner] = useState<string | null>(null)

  const glowOpacity = useSharedValue(0.4)
  const scaleAnim = useSharedValue(1)
  const textOpacity = useSharedValue(1)

  // Glow pulse during spinning
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const resultBranch: GuidedBranch = Math.random() > 0.5 ? 'a' : 'b'
    const resultName = resultBranch === 'a' ? participants.p1.name : participants.p2.name

    // Schedule for deceleration
    const intervals: ReturnType<typeof globalThis.setTimeout>[] = []

    // Fast flipping phase: 80ms intervals for 1.2s
    let idx = 0
    const fastFlipCount = 15
    for (let i = 0; i < fastFlipCount; i++) {
      const t = globalThis.setTimeout(() => {
        idx = (idx + 1) % names.length
        textOpacity.value = withSequence(
          withTiming(0.1, { duration: 40 }),
          withTiming(1, { duration: 40 }),
        )
        setDisplayIndex(idx)
      }, i * 80)
      intervals.push(t)
    }

    // Slow deceleration phase: increasing intervals
    const decelerationDelays = [120, 180, 260, 360, 480]
    let baseTime = fastFlipCount * 80
    decelerationDelays.forEach((gap, i) => {
      baseTime += gap
      const t = globalThis.setTimeout(() => {
        const isLast = i === decelerationDelays.length - 1
        if (isLast) {
          // settle on winner
          textOpacity.value = withSequence(
            withTiming(0, { duration: 80 }),
            withTiming(1, { duration: 200 }),
          )
          scaleAnim.value = withSequence(
            withTiming(1.12, { duration: 180, easing: Easing.out(Easing.quad) }),
            withTiming(1, { duration: 240, easing: Easing.inOut(Easing.quad) }),
          )
          glowOpacity.value = withTiming(0.8, { duration: 300 })
          setDisplayIndex(resultBranch === 'a' ? 0 : 1)
          setWinner(resultName)
          setPhase('settled')
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null)
          onResult(resultBranch)
        } else {
          idx = (idx + 1) % names.length
          textOpacity.value = withSequence(
            withTiming(0.1, { duration: 60 }),
            withTiming(1, { duration: 60 }),
          )
          setDisplayIndex(idx)
        }
      }, baseTime)
      intervals.push(t)
    })

    return () => intervals.forEach((t) => globalThis.clearTimeout(t))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  const nameStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: scaleAnim.value }],
  }))

  return (
    <View style={rouletteStyles.container}>
      {/* Glow ring */}
      <Animated.View style={[rouletteStyles.glowRing, glowStyle]} />

      {/* Outer ring */}
      <View style={rouletteStyles.outerRing}>
        {/* Inner circle */}
        <View style={rouletteStyles.innerCircle}>
          <Animated.Text style={[rouletteStyles.nameText, nameStyle]}>
            {winner ?? names[displayIndex]}
          </Animated.Text>
          {phase === 'settled' && (
            <Animated.Text entering={FadeIn.duration(400)} style={rouletteStyles.leadsLabel}>
              ВЕДЁТ
            </Animated.Text>
          )}
        </View>
      </View>

      {/* Tick marks */}
      {phase === 'spinning' && (
        <Animated.Text style={rouletteStyles.spinHint}>
          {names[0]} · {names[1]}
        </Animated.Text>
      )}
    </View>
  )
}

// ─── Starter Choice ───────────────────────────────────────────────────────────
function StarterChoice({
  participants,
  selectedBranch,
  onSelect,
}: {
  participants: RitualParticipants
  selectedBranch: GuidedBranch
  onSelect: (branch: GuidedBranch) => void
}) {
  return (
    <View style={choiceStyles.row}>
      {(['a', 'b'] as GuidedBranch[]).map((branch) => {
        const name = branch === 'a' ? participants.p1.name : participants.p2.name
        const active = selectedBranch === branch
        return (
          <Pressable
            key={branch}
            style={[choiceStyles.card, active && choiceStyles.cardActive]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => null)
              onSelect(branch)
            }}
          >
            <Text style={[choiceStyles.name, active && choiceStyles.nameActive]}>{name}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// ─── Main Overlay ─────────────────────────────────────────────────────────────
export function RitualSetupOverlay({
  kind,
  title,
  body,
  participants,
  onConfirm,
}: RitualSetupOverlayProps) {
  const [selectedBranch, setSelectedBranch] = useState<GuidedBranch | null>(
    kind === 'starter-choice' ? 'a' : null,
  )
  const [rouletteSettled, setRouletteSettled] = useState(false)

  function handleRouletteResult(branch: GuidedBranch) {
    setSelectedBranch(branch)
    setRouletteSettled(true)
  }

  const canConfirm = kind === 'roulette' ? rouletteSettled : selectedBranch !== null

  return (
    <Animated.View entering={FadeInDown.duration(500).springify().damping(20)} style={styles.card}>
      {/* Accent top line */}
      <View style={styles.accentLine} />

      <Text style={styles.kicker}>{kind === 'roulette' ? 'Рулетка' : 'Выбор старта'}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      <View style={styles.spinnerArea}>
        {kind === 'roulette' ? (
          <RouletteSpinner participants={participants} onResult={handleRouletteResult} />
        ) : (
          <StarterChoice
            participants={participants}
            selectedBranch={selectedBranch ?? 'a'}
            onSelect={setSelectedBranch}
          />
        )}
      </View>

      {canConfirm && (
        <Animated.View entering={FadeIn.duration(400)}>
          <Pressable
            style={styles.confirmBtn}
            onPress={() => selectedBranch && onConfirm(selectedBranch)}
          >
            <Text style={styles.confirmText}>
              {kind === 'roulette' ? 'НАЧАТЬ РАУНД' : 'ПОДТВЕРДИТЬ'}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const rouletteStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  glowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.accent,
    top: 10,
    shadowColor: Colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  outerRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(194,24,91,0.3)',
    backgroundColor: 'rgba(194,24,91,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  innerCircle: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: 'rgba(13,10,15,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  nameText: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 12,
    letterSpacing: -0.5,
  },
  leadsLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: Colors.accent,
    fontWeight: '600',
  },
  spinHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1,
    fontWeight: '400',
  },
})

const choiceStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  card: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardActive: {
    backgroundColor: 'rgba(194,24,91,0.14)',
    borderColor: 'rgba(194,24,91,0.3)',
  },
  name: {
    ...Typography.bodyStrong,
    color: 'rgba(255,255,255,0.45)',
  },
  nameActive: {
    color: '#fff',
  },
})

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: Spacing.xl,
    gap: Spacing.lg,
    shadowColor: Colors.accent,
    shadowOpacity: 0.10,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    overflow: 'hidden',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: Spacing.xl,
    right: Spacing.xl,
    height: 1,
    backgroundColor: Colors.accent,
    opacity: 0.4,
  },
  kicker: {
    fontSize: 9,
    letterSpacing: 3,
    color: Colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 8,
  },
  title: {
    ...Typography.h1,
  },
  body: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.45)',
  },
  spinnerArea: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  confirmBtn: {
    backgroundColor: '#f5f2ed',
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  confirmText: {
    color: '#0D0A0F',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
})
