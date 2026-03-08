import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Typography } from '@/constants/theme'
import { useSubscriptionStore } from '@/stores/subscription.store'
import type { RitualMode } from '@/types'

export default function RitualScreen() {
  const router = useRouter()
  const isPremium = useSubscriptionStore((s) => s.isPremium())

  const handleStart = (mode: RitualMode) => {
    if (mode === 'guided' && !isPremium) {
      router.push('/paywall')
      return
    }
    router.push({ pathname: '/(main)/ritual/session', params: { mode } })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ritual</Text>
      <Text style={styles.subtitle}>5 раундов · 20–30 минут</Text>

      <Pressable style={styles.option} onPress={() => handleStart('free')}>
        <Text style={styles.optionTitle}>Свободный режим</Text>
        <Text style={styles.optionDesc}>Таймеры и правила. Без голоса.</Text>
      </Pressable>

      <Pressable style={[styles.option, styles.optionPremium]} onPress={() => handleStart('guided')}>
        <Text style={styles.optionTitle}>Guided Ritual ✦</Text>
        <Text style={styles.optionDesc}>Голос + музыка + задания. Premium.</Text>
        {!isPremium && <Text style={styles.premiumBadge}>PREMIUM</Text>}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.xl,
    paddingTop: Spacing.xxl * 2,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  option: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionPremium: {
    borderColor: Colors.accent,
  },
  optionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  optionDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  premiumBadge: {
    ...Typography.caption,
    color: Colors.accent,
    marginTop: Spacing.sm,
    fontWeight: '700',
  },
})
