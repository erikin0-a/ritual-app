/**
 * CircularTimer — countdown display with pause/resume
 *
 * Visual: large time text centered in a thin-bordered circle.
 * Progress: opacity-based dimming of the ring as time runs down.
 * TODO: upgrade to SVG arc progress when react-native-svg is added.
 */
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Colors, BorderRadius, Typography } from '@/constants/theme'

interface CircularTimerProps {
  totalSeconds: number
  remainingSeconds: number
  isPaused: boolean
  onPauseToggle: () => void
  onSkip?: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function CircularTimer({ totalSeconds, remainingSeconds, isPaused, onPauseToggle, onSkip }: CircularTimerProps) {
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0
  // Ring opacity: full when time is plentiful, dimmer near the end
  const ringOpacity = 0.3 + progress * 0.7

  return (
    <View style={styles.container}>
      {/* Outer ring */}
      <View style={[styles.ring, { opacity: ringOpacity }]}>
        {/* Timer text */}
        <Text style={styles.timeText}>{formatTime(remainingSeconds)}</Text>
        {/* Paused indicator */}
        {isPaused && <Text style={styles.pausedLabel}>пауза</Text>}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={onPauseToggle}>
          <Text style={styles.controlLabel}>{isPaused ? 'Продолжить' : 'Пауза'}</Text>
        </Pressable>
        {onSkip && (
          <Pressable style={[styles.controlButton, styles.skipButton]} onPress={onSkip}>
            <Text style={[styles.controlLabel, styles.skipLabel]}>Пропустить раунд</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 32,
  },
  ring: {
    width: 220,
    height: 220,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 56,
    fontWeight: '200' as const,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  pausedLabel: {
    ...Typography.caption,
    color: Colors.accent,
    marginTop: 4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  controls: {
    alignItems: 'center',
    gap: 12,
  },
  controlButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  controlLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  skipButton: {
    borderColor: 'transparent',
  },
  skipLabel: {
    color: Colors.textSecondary,
    opacity: 0.5,
    fontSize: 13,
  },
})
