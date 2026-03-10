import { StyleSheet, Text, View } from 'react-native'
import { BorderRadius, Colors, SemanticColors, Shadows, Spacing, Typography } from '@/constants/theme'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface RitualCompletionSurfaceProps {
  title: string
  body: string
  onRestart: () => void
  onClose: () => void
}

export function RitualCompletionSurface({
  title,
  body,
  onRestart,
  onClose,
}: RitualCompletionSurfaceProps) {
  return (
    <Card variant="highlighted" style={styles.card}>
      <View style={styles.heroMark}>
        <Text style={styles.heroMarkText}>✦</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.actions}>
        <Button title="Пройти ещё раз" variant="secondary" fullWidth onPress={onRestart} />
        <Button title="Закрыть" fullWidth onPress={onClose} />
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.lg,
    ...Shadows.glow,
  },
  heroMark: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SemanticColors.surfaceAccent,
    alignSelf: 'center',
  },
  heroMarkText: {
    fontSize: 28,
    color: Colors.accent,
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  actions: {
    gap: Spacing.md,
  },
})
