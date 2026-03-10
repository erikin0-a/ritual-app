import { View, Text, Pressable, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { BorderRadius, Colors, SemanticColors, Shadows, Spacing, Typography } from '@/constants/theme'

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
  const size = 232
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <View style={styles.container}>
      <View style={styles.timerShell}>
        <Svg width={size} height={size} style={styles.svg}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={SemanticColors.timerTrack}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={SemanticColors.timerFill}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.innerContent}>
          <Text style={styles.timeText}>{formatTime(remainingSeconds)}</Text>
          <Text style={styles.metaLabel}>До смены фазы</Text>
        </View>
        {isPaused && <Text style={styles.pausedLabel}>пауза</Text>}
      </View>

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
    gap: Spacing.lg,
  },
  timerShell: {
    width: 252,
    height: 252,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(17, 13, 22, 0.7)',
    borderWidth: 1,
    borderColor: SemanticColors.hairline,
    ...Shadows.soft,
  },
  svg: {
    position: 'absolute',
  },
  innerContent: {
    width: 176,
    height: 176,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 54,
    fontWeight: '300' as const,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1.2,
  },
  metaLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  pausedLabel: {
    position: 'absolute',
    bottom: 22,
    ...Typography.caption,
    color: Colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  controlButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: SemanticColors.hairlineStrong,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  controlLabel: {
    ...Typography.caption,
    color: Colors.text,
  },
  skipButton: {
    borderColor: SemanticColors.hairline,
  },
  skipLabel: {
    color: Colors.textSecondary,
  },
})
