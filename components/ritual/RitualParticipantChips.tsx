import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { BorderRadius, Colors, SemanticColors, Spacing, Typography } from '@/constants/theme'
import type { ParticipantId, RitualParticipants } from '@/types'

interface RitualParticipantChipsProps {
  participants: RitualParticipants
  highlighted?: ParticipantId[]
}

function Chip({
  name,
  active,
}: {
  name: string
  active: boolean
}) {
  const glowOpacity = useSharedValue(0)
  const scale = useSharedValue(1)

  useEffect(() => {
    if (active) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      )
      scale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      )
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 })
      scale.value = withTiming(1, { duration: 300 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const chipStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  return (
    <Animated.View style={[styles.chipWrap, chipStyle]}>
      {/* Accent glow for active */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.glowRing, glowStyle]} />
      <View style={[styles.chip, active && styles.chipActive]}>
        <Text style={[styles.label, active && styles.labelActive]}>{name}</Text>
      </View>
    </Animated.View>
  )
}

export function RitualParticipantChips({ participants, highlighted = [] }: RitualParticipantChipsProps) {
  return (
    <View style={styles.row}>
      {(['p1', 'p2'] as ParticipantId[]).map((id) => (
        <Chip key={id} name={participants[id].name} active={highlighted.includes(id)} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  chipWrap: {
    position: 'relative',
  },
  glowRing: {
    borderRadius: BorderRadius.full,
    shadowColor: Colors.accent,
    shadowOpacity: 0.7,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    backgroundColor: 'transparent',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: SemanticColors.chip,
    borderWidth: 1,
    borderColor: SemanticColors.hairline,
  },
  chipActive: {
    backgroundColor: 'rgba(194,24,91,0.18)',
    borderColor: 'rgba(194,24,91,0.35)',
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.accent,
    fontWeight: '600',
  },
})
