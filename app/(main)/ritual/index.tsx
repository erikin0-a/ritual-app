import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme'
import { useSubscriptionStore } from '@/stores/subscription.store'
import { AppBackground } from '@/components/ui/AmbientBackground'
import { Analytics } from '@/lib/analytics'
import type { RitualMode } from '@/types'

export default function RitualModeSelectionScreen() {
  const router = useRouter()
  const isPremium = useSubscriptionStore((s) => s.isPremium())

  const handleSelect = (mode: RitualMode) => {
    if (mode === 'guided') {
      Analytics.premiumToggleClicked({
        paywall_source: 'ritual_mode_select',
        has_premium_access: isPremium,
      })
    }

    if (mode === 'guided' && !isPremium) {
      router.push({ pathname: '/paywall', params: { source: 'ritual_mode_select' } })
      return
    }
    // Navigate to setup instead of directly to session
    router.push({ pathname: '/(main)/ritual/setup', params: { mode } })
  }

  return (
    <View style={styles.container}>
      <AppBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Назад</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Выберите формат</Text>
          <Text style={styles.subtitle}>Как вы хотите провести этот вечер?</Text>

          <View style={styles.options}>
            {/* Guided / Premium Option */}
            <Pressable 
              style={({ pressed }) => [styles.card, styles.cardPremium, pressed && styles.cardPressed]}
              onPress={() => handleSelect('guided')}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>Guided Ritual</Text>
                  {!isPremium && <View style={styles.badge}><Text style={styles.badgeText}>PREMIUM</Text></View>}
                </View>
                <Text style={styles.cardDesc}>
                  Полное погружение. Голосовое сопровождение, музыка, специальные задания.
                </Text>
              </View>
              <View style={styles.cardIcon}>
                <Text style={{ fontSize: 24 }}>✦</Text>
              </View>
            </Pressable>

            {/* Free Option */}
            <Pressable 
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => handleSelect('free')}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Свободный режим</Text>
                <Text style={styles.cardDesc}>
                  Классический таймер и карточки с правилами. Без аудио.
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  backButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
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
  options: {
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPremium: {
    backgroundColor: 'rgba(210, 46, 136, 0.1)',
    borderColor: Colors.accent,
    paddingVertical: Spacing.xl,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  cardContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardTitle: {
    ...Typography.h3,
  },
  cardDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
  cardIcon: {
    marginLeft: Spacing.md,
  },
  badge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
})
