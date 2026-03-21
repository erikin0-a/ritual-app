import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  FadeInUp,
  Easing,
} from 'react-native-reanimated'
import { Colors, Spacing, Typography } from '@/constants/theme'

interface RitualTransitionOverlayProps {
  kicker: string
  title: string
  body: string
  footnote?: string
}

export function RitualTransitionOverlay({
  kicker,
  title,
  body,
  footnote,
}: RitualTransitionOverlayProps) {
  const pulseScale = useSharedValue(1)
  const flashOpacity = useSharedValue(0)

  useEffect(() => {
    // Subtle screen-level pulse on round transition
    pulseScale.value = withSequence(
      withTiming(1.02, { duration: 280, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.cubic) }),
    )
    flashOpacity.value = withSequence(
      withTiming(0.09, { duration: 180 }),
      withTiming(0, { duration: 700, easing: Easing.out(Easing.quad) }),
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }))

  return (
    <Animated.View style={[styles.outer, pulseStyle]}>
      {/* Accent flash bloom */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.flash, flashStyle]}
        pointerEvents="none"
      />

      <Animated.View
        entering={FadeInUp.delay(100).duration(500).springify().damping(18).stiffness(120)}
        style={styles.card}
      >
        {/* Top accent line */}
        <View style={styles.accentLine} />

        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={styles.title}>{title}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}

        {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignItems: 'center',
  },
  flash: {
    backgroundColor: Colors.accent,
    borderRadius: 28,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: Spacing.xl,
    gap: Spacing.md,
    shadowColor: Colors.accent,
    shadowOpacity: 0.12,
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
    color: Colors.textSecondary,
  },
  footnote: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
})
