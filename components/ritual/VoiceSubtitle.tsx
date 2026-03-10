/**
 * VoiceSubtitle — animated subtitle bar shown during Premium Guided Ritual.
 *
 * Sits at the bottom of the screen and fades in/out when a voice cue is active.
 * It also renders participant chips for the people referenced in the current cue.
 */
import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BorderRadius, Colors, SemanticColors, Shadows, Spacing, Typography } from '@/constants/theme'
import type { AudioCue } from '@/constants/audio-timeline'
import type { RitualParticipants } from '@/types'

interface VoiceSubtitleProps {
  cue: AudioCue | null
  participants: RitualParticipants
}

const USE_NATIVE_DRIVER = Platform.OS !== 'web'

export function VoiceSubtitle({ cue, participants }: VoiceSubtitleProps) {
  const insets = useSafeAreaInsets()
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(24)).current

  useEffect(() => {
    if (cue) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 18,
          stiffness: 170,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 240,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(translateY, {
          toValue: 24,
          duration: 240,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start()
    }
  }, [cue, opacity, translateY])

  const highlightedParticipants = cue?.highlightedParticipants?.map((participantId) => participants[participantId]) ?? []

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          paddingBottom: insets.bottom + Spacing.lg,
        },
      ]}
      pointerEvents="none"
    >
      {highlightedParticipants.length > 0 ? (
        <View style={styles.chipRow}>
          {highlightedParticipants.map((participant) => (
            <View key={participant.id} style={styles.participantChip}>
              <Text style={styles.participantChipText}>{participant.name}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {cue?.subtitle ? (
        <View style={styles.bubble}>
          <Text style={styles.subtitleText}>{cue.subtitle}</Text>
        </View>
      ) : null}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  participantChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: SemanticColors.chipAccent,
    borderWidth: 1,
    borderColor: 'rgba(240, 106, 166, 0.28)',
  },
  participantChipText: {
    ...Typography.caption,
    color: Colors.accent,
    letterSpacing: 0.4,
  },
  bubble: {
    backgroundColor: SemanticColors.subtitleSurface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: SemanticColors.hairlineStrong,
    maxWidth: '100%',
    ...Shadows.soft,
  },
  subtitleText: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.text,
  },
})
