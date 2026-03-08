import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Typography } from '@/constants/theme'
import { Analytics } from '@/lib/analytics'
import { useEffect } from 'react'

export default function PaywallScreen() {
  const router = useRouter()

  useEffect(() => {
    Analytics.paywallViewed({ source: 'guided_ritual' })
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Guided Ritual</Text>
      <Text style={styles.subtitle}>Голос. Музыка. Атмосфера.</Text>

      <View style={styles.featureList}>
        {['Голосовые подсказки', 'Атмосферная музыка', 'Задания в каждом раунде', 'Неограниченный доступ'].map(
          (feature) => (
            <Text key={feature} style={styles.feature}>
              ✦ {feature}
            </Text>
          ),
        )}
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={() => {
          // TODO: integrate RevenueCat purchase flow
          Analytics.subscriptionConverted({ plan: 'monthly' })
        }}
      >
        <Text style={styles.primaryButtonText}>Попробовать бесплатно 3 дня</Text>
      </Pressable>

      <Text style={styles.price}>Затем $5.99 / месяц · Отмена в любое время</Text>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.skip}>Не сейчас</Text>
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
    alignItems: 'center',
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
  featureList: {
    alignSelf: 'stretch',
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  feature: {
    ...Typography.body,
    color: Colors.text,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 32,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  primaryButtonText: {
    ...Typography.h3,
    color: Colors.text,
  },
  price: {
    ...Typography.caption,
    marginBottom: Spacing.lg,
  },
  skip: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
})
