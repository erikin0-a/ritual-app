/**
 * VoiceSubtitle — animated subtitle bar shown during Premium Guided Ritual.
 *
 * Sits at the bottom of the screen and fades in/out when a voice cue is active.
 * When `isPartnerNamePrompt` is true, it also renders the partner name above the text.
 *
 * MVP: partner name is shown as a styled text overlay (no ElevenLabs name synthesis).
 */
import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme'
import type { AudioCue } from '@/constants/audio-timeline'

interface VoiceSubtitleProps {
  cue: AudioCue | null
  partnerName?: string
}

export function VoiceSubtitle({ cue, partnerName }: VoiceSubtitleProps) {
  const insets = useSafeAreaInsets()
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (cue) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start()
    }
  }, [cue])

  // Keep rendering so the fade-out animation can run
  return (
    <Animated.View
      style={[styles.container, { opacity, paddingBottom: insets.bottom + Spacing.lg }]}
      pointerEvents="none"
    >
      {cue?.isPartnerNamePrompt && partnerName ? (
        <Text style={styles.partnerName}>{partnerName}</Text>
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
    gap: Spacing.sm,
  },
  partnerName: {
    ...Typography.caption,
    color: Colors.accent,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxWidth: '100%',
  },
  subtitleText: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
    color: '#fff',
  },
})
