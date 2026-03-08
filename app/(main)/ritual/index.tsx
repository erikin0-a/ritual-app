import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme'
import { useSubscriptionStore } from '@/stores/subscription.store'

export default function RitualModeSelectScreen() {
  const router = useRouter()
  const isPremium = useSubscriptionStore((s) => s.isPremium())

  const handleFree = () => {
    router.push({ pathname: '/(main)/ritual/session', params: { mode: 'free' } })
  }

  const handlePremium = () => {
    if (!isPremium) {
      router.push('/paywall')
      return
    }
    router.push('/(main)/ritual/consent')
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Назад</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Ритуал</Text>
          <Text style={styles.subtitle}>Выберите режим</Text>
        </View>

        {/* Free mode card */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={handleFree}
        >
          <View style={styles.cardTop}>
            <Text style={styles.cardEmoji}>🕯️</Text>
            <Text style={styles.cardTitle}>Ритуал Free</Text>
          </View>
          <Text style={styles.cardDesc}>
            Пять раундов с таймерами, заданиями и правилами. Без голоса — только вы двое.
          </Text>
          <View style={styles.cardFeatures}>
            <Text style={styles.feature}>✓ 5 раундов · 20–30 мин</Text>
            <Text style={styles.feature}>✓ Таймер и правила</Text>
            <Text style={styles.feature}>✓ Рулетка и выбор партнёра</Text>
          </View>
          <View style={styles.startRow}>
            <Text style={styles.startText}>Начать →</Text>
          </View>
        </Pressable>

        {/* Premium mode card */}
        <Pressable
          style={({ pressed }) => [styles.card, styles.cardPremium, pressed && styles.cardPressed]}
          onPress={handlePremium}
        >
          <View style={styles.cardTop}>
            <Text style={styles.cardEmoji}>✨</Text>
            <View style={styles.titleRow}>
              <Text style={[styles.cardTitle, styles.cardTitlePremium]}>Ритуал Premium</Text>
              {!isPremium && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>PREMIUM</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Управляемый сценарий с голосовым сопровождением и музыкой. Каждая сцена продумана до деталей.
          </Text>
          <View style={styles.cardFeatures}>
            <Text style={[styles.feature, styles.featurePremium]}>✦ Голосовые реплики</Text>
            <Text style={[styles.feature, styles.featurePremium]}>✦ Живая фоновая атмосфера</Text>
            <Text style={[styles.feature, styles.featurePremium]}>✦ Согласие обоих партнёров</Text>
          </View>
          <View style={styles.startRow}>
            <Text style={[styles.startText, styles.startTextPremium]}>
              {isPremium ? 'Начать →' : 'Оформить подписку →'}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  backText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  header: {
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardPremium: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(255, 79, 139, 0.05)',
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardEmoji: {
    fontSize: 28,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  cardTitle: {
    ...Typography.h3,
  },
  cardTitlePremium: {
    color: Colors.accent,
  },
  badge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: 0.8,
  },
  cardDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  cardFeatures: {
    gap: Spacing.xs,
  },
  feature: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  featurePremium: {
    color: Colors.accent,
  },
  startRow: {
    paddingTop: Spacing.xs,
    alignItems: 'flex-end',
  },
  startText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  startTextPremium: {
    color: Colors.accent,
  },
})
