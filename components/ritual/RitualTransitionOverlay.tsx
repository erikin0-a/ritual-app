import { View, Text, StyleSheet } from 'react-native'
import { BorderRadius, Colors, SemanticColors, Shadows, Spacing, Typography } from '@/constants/theme'
import { Card } from '@/components/ui/Card'

interface RitualTransitionOverlayProps {
  kicker: string
  title: string
  body: string
  allowed: string[]
  forbidden: string[]
  footnote?: string
}

export function RitualTransitionOverlay({
  kicker,
  title,
  body,
  allowed,
  forbidden,
  footnote,
}: RitualTransitionOverlayProps) {
  return (
    <Card variant="raised" style={styles.card}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Разрешено</Text>
        <View style={styles.pillRow}>
          {allowed.map((item) => (
            <View key={item} style={[styles.pill, styles.allowedPill]}>
              <Text style={[styles.pillText, styles.allowedText]}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Запрещено</Text>
        <View style={styles.pillRow}>
          {forbidden.map((item) => (
            <View key={item} style={[styles.pill, styles.forbiddenPill]}>
              <Text style={[styles.pillText, styles.forbiddenText]}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
    ...Shadows.soft,
  },
  kicker: {
    ...Typography.label,
    color: Colors.accent,
  },
  title: {
    ...Typography.h1,
  },
  body: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  group: {
    gap: Spacing.sm,
  },
  groupTitle: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  allowedPill: {
    backgroundColor: SemanticColors.surfaceSuccess,
    borderColor: 'rgba(141, 216, 176, 0.2)',
  },
  forbiddenPill: {
    backgroundColor: SemanticColors.surfaceAccent,
    borderColor: 'rgba(240, 106, 166, 0.22)',
  },
  pillText: {
    ...Typography.caption,
  },
  allowedText: {
    color: Colors.success,
  },
  forbiddenText: {
    color: Colors.accent,
  },
  footnote: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
})
