import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, Spacing, Typography } from '@/constants/theme'
import { Analytics } from '@/lib/analytics'
import { getPaywallPlanPrice, initRevenueCat, purchasePlan, restoreSubscriptions } from '@/lib/revenuecat'
import { useEffect, useState } from 'react'
import { useSubscriptionStore } from '@/stores/subscription.store'

export default function PaywallScreen() {
  const router = useRouter()
  const { source } = useLocalSearchParams<{ source?: string }>()
  const paywallSource = source ?? 'unknown'
  const isPremium = useSubscriptionStore((s) => s.isPremium())
  const [annualPrice, setAnnualPrice] = useState<string | null>(null)
  const [monthlyPrice, setMonthlyPrice] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<'annual' | 'monthly' | 'restore' | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)

  useEffect(() => {
    Analytics.paywallOpened({ paywall_source: paywallSource })
  }, [paywallSource])

  useEffect(() => {
    let cancelled = false

    async function loadPrices() {
      try {
        await initRevenueCat()
        const [annual, monthly] = await Promise.all([
          getPaywallPlanPrice('annual'),
          getPaywallPlanPrice('monthly'),
        ])
        if (cancelled) return
        setAnnualPrice(annual)
        setMonthlyPrice(monthly)
      } catch {
        if (cancelled) return
        setAnnualPrice(null)
        setMonthlyPrice(null)
      }
    }

    loadPrices().catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isPremium) return

    if (paywallSource === 'ritual_mode_select') {
      router.replace('/(main)/ritual/consent')
      return
    }

    router.back()
  }, [isPremium, paywallSource, router])

  async function handlePurchase(plan: 'annual' | 'monthly') {
    setErrorText(null)
    setLoadingAction(plan)

    try {
      await initRevenueCat()
      const result = await purchasePlan(plan)
      if (result.cancelled) return
      if (plan === 'annual') {
        Analytics.trialStarted({ paywall_source: paywallSource, plan: 'annual' })
      } else {
        Analytics.subscriptionStarted({ paywall_source: paywallSource, plan: 'monthly' })
      }
    } catch {
      setErrorText('Не удалось оформить подписку. Проверьте настройки Sandbox и попробуйте снова.')
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleRestore() {
    setErrorText(null)
    setLoadingAction('restore')
    try {
      await initRevenueCat()
      await restoreSubscriptions()
    } catch {
      setErrorText('Не удалось восстановить покупки. Проверьте Apple ID Sandbox и повторите.')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nightly Premium</Text>
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
        style={[styles.primaryButton, loadingAction === 'annual' && styles.buttonDisabled]}
        disabled={loadingAction !== null}
        onPress={() => {
          Analytics.paywallCtaClicked({ paywall_source: paywallSource, cta: 'start_trial_annual' })
          handlePurchase('annual').catch(() => {})
        }}
      >
        {loadingAction === 'annual' ? (
          <ActivityIndicator color={Colors.text} />
        ) : (
          <Text style={styles.primaryButtonText}>Начать trial 7 дней</Text>
        )}
      </Pressable>
      <Text style={styles.price}>
        Затем {annualPrice ?? '$39.99'} / год · Отмена в любое время
      </Text>

      <Pressable
        style={[styles.secondaryButton, loadingAction === 'monthly' && styles.buttonDisabled]}
        disabled={loadingAction !== null}
        onPress={() => {
          Analytics.paywallCtaClicked({ paywall_source: paywallSource, cta: 'subscribe_monthly' })
          handlePurchase('monthly').catch(() => {})
        }}
      >
        {loadingAction === 'monthly' ? (
          <ActivityIndicator color={Colors.accent} />
        ) : (
          <Text style={styles.secondaryButtonText}>Подписка {monthlyPrice ?? '$5.99'} / месяц</Text>
        )}
      </Pressable>

      <Pressable
        disabled={loadingAction !== null}
        onPress={() => {
          Analytics.paywallCtaClicked({ paywall_source: paywallSource, cta: 'restore_purchases' })
          handleRestore().catch(() => {})
        }}
      >
        {loadingAction === 'restore' ? (
          <ActivityIndicator color={Colors.textSecondary} />
        ) : (
          <Text style={styles.restore}>Восстановить покупки</Text>
        )}
      </Pressable>

      {errorText && <Text style={styles.errorText}>{errorText}</Text>}

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
  buttonDisabled: {
    opacity: 0.65,
  },
  price: {
    ...Typography.caption,
    marginBottom: Spacing.lg,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 32,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  secondaryButtonText: {
    ...Typography.body,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  restore: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  skip: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
})
