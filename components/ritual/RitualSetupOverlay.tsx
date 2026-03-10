import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { BorderRadius, Colors, SemanticColors, Shadows, Spacing, Typography } from '@/constants/theme'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { GuidedBranch, RitualParticipants } from '@/types'

interface RitualSetupOverlayProps {
  kind: 'roulette' | 'starter-choice'
  title: string
  body: string
  participants: RitualParticipants
  onConfirm: (branch: GuidedBranch) => void
}

export function RitualSetupOverlay({
  kind,
  title,
  body,
  participants,
  onConfirm,
}: RitualSetupOverlayProps) {
  const [selectedBranch, setSelectedBranch] = useState<GuidedBranch | null>(kind === 'roulette' ? null : 'a')
  const [rouletteBranch, setRouletteBranch] = useState<GuidedBranch | null>(null)

  useEffect(() => {
    if (kind !== 'roulette') return

    const timer = globalThis.setTimeout(() => {
      const next = Math.random() > 0.5 ? 'a' : 'b'
      setRouletteBranch(next)
      setSelectedBranch(next)
    }, 1800)

    return () => globalThis.clearTimeout(timer)
  }, [kind])

  const currentLabel = useMemo(() => {
    const branch = selectedBranch ?? rouletteBranch
    if (!branch) return 'Рулетка крутится...'
    return branch === 'a' ? participants.p1.name : participants.p2.name
  }, [participants, rouletteBranch, selectedBranch])

  return (
    <Card variant="raised" style={styles.card}>
      <Text style={styles.kicker}>{kind === 'roulette' ? 'Roulette' : 'Выбор старта'}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      {kind === 'roulette' ? (
        <View style={styles.rouletteCircle}>
          <Text style={styles.rouletteText}>{currentLabel}</Text>
        </View>
      ) : (
        <View style={styles.choiceRow}>
          <Pressable
            style={[styles.choiceCard, selectedBranch === 'a' && styles.choiceCardActive]}
            onPress={() => setSelectedBranch('a')}
          >
            <Text style={[styles.choiceLabel, selectedBranch === 'a' && styles.choiceLabelActive]}>{participants.p1.name}</Text>
          </Pressable>
          <Pressable
            style={[styles.choiceCard, selectedBranch === 'b' && styles.choiceCardActive]}
            onPress={() => setSelectedBranch('b')}
          >
            <Text style={[styles.choiceLabel, selectedBranch === 'b' && styles.choiceLabelActive]}>{participants.p2.name}</Text>
          </Pressable>
        </View>
      )}

      <Button
        title={kind === 'roulette' ? 'Начать раунд' : 'Подтвердить старт'}
        onPress={() => selectedBranch && onConfirm(selectedBranch)}
        disabled={!selectedBranch}
        fullWidth
      />
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.lg,
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
  rouletteCircle: {
    width: 220,
    height: 220,
    alignSelf: 'center',
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SemanticColors.surfaceAccent,
    borderWidth: 1,
    borderColor: 'rgba(240, 106, 166, 0.2)',
  },
  rouletteText: {
    ...Typography.h2,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  choiceCard: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: SemanticColors.hairline,
  },
  choiceCardActive: {
    backgroundColor: SemanticColors.surfaceAccent,
    borderColor: 'rgba(240, 106, 166, 0.2)',
  },
  choiceLabel: {
    ...Typography.bodyStrong,
    color: Colors.textSecondary,
  },
  choiceLabelActive: {
    color: Colors.text,
  },
})
