/**
 * Dice mode — random intimate action combinations
 * 3 dice: action + body part + style
 * Example: "Поцелуй · Шея · Медленно"
 */
import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme'
import { Analytics } from '@/lib/analytics'
import type { DiceResult } from '@/types'

// ─── Dice content ─────────────────────────────────────────────────────────────

const ACTIONS = [
  'Поцелуй', 'Погладь', 'Обними', 'Шепни на ухо', 'Помассируй',
  'Дотронься до', 'Проведи губами по', 'Нежно укуси', 'Подыши на',
]

const BODY_PARTS = [
  'шея', 'плечо', 'рука', 'запястье', 'спина',
  'висок', 'ключица', 'ухо', 'щека', 'лоб',
]

const STYLES = [
  'медленно', 'нежно', 'страстно', 'игриво', 'дерзко',
  'тихо', 'с улыбкой', '10 секунд', 'не торопясь', 'смотря в глаза',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function rollDice(): DiceResult {
  return {
    action: pick(ACTIONS),
    bodyPart: pick(BODY_PARTS),
    style: pick(STYLES),
  }
}

// ─── Dice face visual ─────────────────────────────────────────────────────────

interface DiceTileProps {
  label: string
  value: string
  isRolling: boolean
}

function DiceTile({ label, value, isRolling }: DiceTileProps) {
  return (
    <View style={styles.diceTile}>
      <Text style={styles.diceTileLabel}>{label}</Text>
      <Text style={[styles.diceTileValue, isRolling && styles.diceTileRolling]}>
        {isRolling ? '...' : value}
      </Text>
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DiceScreen() {
  const [result, setResult] = useState<DiceResult | null>(null)
  const [isRolling, setIsRolling] = useState(false)

  function handleRoll() {
    setIsRolling(true)
    Analytics.diceRolled()

    // Brief animation delay for tactile feel
    globalThis.setTimeout(() => {
      setResult(rollDice())
      setIsRolling(false)
    }, 500)
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎲 Кубики</Text>
          <Text style={styles.subtitle}>Нажмите, чтобы бросить кубики</Text>
        </View>

        {/* Result */}
        <View style={styles.resultSection}>
          {result ? (
            <>
              <View style={styles.diceGrid}>
                <DiceTile label="Действие" value={result.action} isRolling={isRolling} />
                <DiceTile label="Куда" value={result.bodyPart} isRolling={isRolling} />
                <DiceTile label="Как" value={result.style} isRolling={isRolling} />
              </View>

              {!isRolling && (
                <View style={styles.combinationBox}>
                  <Text style={styles.combinationText}>
                    {result.action} · {result.bodyPart} · {result.style}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎲</Text>
              <Text style={styles.emptyText}>Ваша комбинация появится здесь</Text>
            </View>
          )}
        </View>

        {/* Roll button */}
        <Pressable
          style={({ pressed }) => [styles.rollButton, pressed && styles.rollButtonPressed]}
          onPress={handleRoll}
          disabled={isRolling}
        >
          <Text style={styles.rollButtonText}>
            {result ? 'Бросить ещё раз' : 'Бросить кубики'}
          </Text>
        </Pressable>

        {/* Hint */}
        {result && !isRolling && (
          <Text style={styles.hint}>Не нравится комбинация? Бросьте ещё раз!</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    padding: Spacing.xl,
    gap: Spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  resultSection: {
    alignItems: 'center',
    gap: Spacing.lg,
    minHeight: 240,
    justifyContent: 'center',
  },
  diceGrid: {
    width: '100%',
    gap: Spacing.md,
  },
  diceTile: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diceTileLabel: {
    ...Typography.caption,
    letterSpacing: 0.5,
    flex: 1,
  },
  diceTileValue: {
    ...Typography.h3,
    color: Colors.accent,
    textAlign: 'right',
    flex: 2,
  },
  diceTileRolling: {
    color: Colors.textSecondary,
  },
  combinationBox: {
    backgroundColor: 'rgba(255, 79, 139, 0.08)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 79, 139, 0.3)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    width: '100%',
  },
  combinationText: {
    ...Typography.body,
    color: Colors.accent,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    gap: Spacing.md,
    opacity: 0.4,
    paddingVertical: Spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  rollButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  rollButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  rollButtonText: {
    ...Typography.h3,
    color: Colors.text,
  },
  hint: {
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
})
