import { View, Text, StyleSheet } from 'react-native'
import { BorderRadius, Colors, SemanticColors, Spacing, Typography } from '@/constants/theme'
import type { ParticipantId, RitualParticipants } from '@/types'

interface RitualParticipantChipsProps {
  participants: RitualParticipants
  highlighted?: ParticipantId[]
}

export function RitualParticipantChips({ participants, highlighted = [] }: RitualParticipantChipsProps) {
  return (
    <View style={styles.row}>
      {(['p1', 'p2'] as ParticipantId[]).map((id) => {
        const active = highlighted.includes(id)
        return (
          <View key={id} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.label, active && styles.labelActive]}>{participants[id].name}</Text>
          </View>
        )
      })}
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
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: SemanticColors.chip,
    borderWidth: 1,
    borderColor: SemanticColors.hairline,
  },
  chipActive: {
    backgroundColor: SemanticColors.chipAccent,
    borderColor: 'rgba(240, 106, 166, 0.28)',
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.accent,
  },
})
