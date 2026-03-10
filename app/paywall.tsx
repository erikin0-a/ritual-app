import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, SemanticColors, Shadows, Spacing, Typography } from '@/constants/theme'
import { Analytics } from '@/lib/analytics'
import { getPaywallPlanPrice, initRevenueCat, purchasePlan, restoreSubscriptions } from '@/lib/revenuecat'
import { useEffect, useState } from 'react'
import { useSubscriptionStore } from '@/stores/subscription.store'
import { isPremiumBypassEnabled } from '@/lib/premium-bypass'
import { ScreenContainer } from '@/components/common/ScreenContainer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

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
    if (isPremiumBypassEnabled) return

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
      router.replace({ pathname: '/(main)/ritual/setup', params: { mode: 'guided' } })
      return
    }

    router.back()
  }, [isPremium, paywallSource, router])

  async function handlePurchase(plan: 'annual' | 'monthly') {
    if (isPremiumBypassEnabled) {
      useSubscriptionStore.getState().setStatus('premium')
      return
    }

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
    if (isPremiumBypassEnabled) {
      useSubscriptionStore.getState().setStatus('premium')
      return
    }

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
    <ScreenContainer background="app" safe={false}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Button title="Не сейчас" variant="ghost" size="md" onPress={() => router.back()} />
        </View>

        <Card variant="highlighted" style={styles.heroCard}>
          <Text style={styles.eyebrow}>Nightly Premium</Text>
          <Text style={styles.title}>Голос. Музыка. Атмосфера. Полный Guided Ritual.</Text>
          <Text style={styles.subtitle}>
            Премиум открывает режиссируемый session flow: интро, consent, правила, голосовые cues, мягкие transitions и финальный guided runtime.
          </Text>
          <View style={styles.featureList}>
            {['Голосовые подсказки с именами', 'Атмосферная музыка и chip signal', 'Полный сценарий по раундам', 'Доступ ко всем premium обновлениям'].map((feature) => (
              <View key={feature} style={styles.featurePill}>
                <Text style={styles.feature}>{feature}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card variant="raised" style={styles.planCard}>
          <Text style={styles.planTitle}>Годовой план</Text>
          <Text style={styles.planPrice}>{annualPrice ?? '$39.99'} / год</Text>
          <Text style={styles.planMeta}>7 дней trial, затем можно отменить в любой момент</Text>
          <Pressable
            style={[styles.primaryButton, loadingAction === 'annual' && styles.buttonDisabled]}
            disabled={loadingAction !== null}
            onPress={() => {
              Analytics.paywallCtaClicked({ paywall_source: paywallSource, cta: 'start_trial_annual' })
              handlePurchase('annual').catch(() => {})
            }}
          >
            {loadingAction === 'annual' ? <ActivityIndicator color={Colors.text} /> : <Text style={styles.primaryButtonText}>Начать trial 7 дней</Text>}
          </Pressable>
        </Card>

        <Card variant="subtle" style={styles.planCard}>
          <Text style={styles.planTitle}>Месячный план</Text>
          <Text style={styles.planPrice}>{monthlyPrice ?? '$5.99'} / месяц</Text>
          <Text style={styles.planMeta}>Подходит, если хотите попробовать guided mode без длинной подписки</Text>
          <Pressable
            style={[styles.secondaryButton, loadingAction === 'monthly' && styles.buttonDisabled]}
            disabled={loadingAction !== null}
            onPress={() => {
              Analytics.paywallCtaClicked({ paywall_source: paywallSource, cta: 'subscribe_monthly' })
              handlePurchase('monthly').catch(() => {})
            }}
          >
            {loadingAction === 'monthly' ? <ActivityIndicator color={Colors.accent} /> : <Text style={styles.secondaryButtonText}>Оформить месячную подписку</Text>}
          </Pressable>
        </Card>

        <Button
          title={loadingAction === 'restore' ? 'Восстанавливаем...' : 'Восстановить покупки'}
          variant="ghost"
          onPress={() => {
            Analytics.paywallCtaClicked({ paywall_source: paywallSource, cta: 'restore_purchases' })
            handleRestore().catch(() => {})
          }}
          disabled={loadingAction !== null}
          fullWidth
        />

        {errorText && <Text style={styles.errorText}>{errorText}</Text>}
      </ScrollView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  header: {
    alignItems: 'flex-start',
  },
  heroCard: {
    gap: Spacing.md,
    ...Shadows.glow,
  },
  eyebrow: {
    ...Typography.label,
    color: Colors.accent,
  },
  title: {
    ...Typography.display,
    fontSize: 34,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  featureList: {
    gap: Spacing.sm,
  },
  featurePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: SemanticColors.hairline,
  },
  feature: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  planCard: {
    gap: Spacing.sm,
  },
  planTitle: {
    ...Typography.h3,
  },
  planPrice: {
    ...Typography.h2,
  },
  planMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  primaryButtonText: {
    ...Typography.bodyStrong,
    color: Colors.text,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 32,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: SemanticColors.hairlineStrong,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 32,
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginTop: Spacing.sm,
  },
  secondaryButtonText: {
    ...Typography.bodyStrong,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    textAlign: 'center',
  },
})
