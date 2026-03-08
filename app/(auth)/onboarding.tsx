import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme'
import { Button } from '@/components/ui/Button'
import { ScreenContainer } from '@/components/common/ScreenContainer'
import { useAuthStore } from '@/stores/auth.store'
import { Analytics } from '@/lib/analytics'
import type { IntimacyLevel, DurationPreference } from '@/types'

const TOTAL_STEPS = 3

// ─── Step 1 data ────────────────────────────────────────────────────────────

interface IntimacyOption {
  value: IntimacyLevel
  emoji: string
  label: string
  description: string
}

const INTIMACY_OPTIONS: IntimacyOption[] = [
  { value: 'light', emoji: '🤗', label: 'Нежно', description: 'Объятия, поцелуи, нежность' },
  { value: 'moderate', emoji: '🔥', label: 'Умеренно', description: 'Больше страсти и игривости' },
  { value: 'spicy', emoji: '⚡', label: 'Огненно', description: 'Максимальный накал' },
]

// ─── Step 2 data ────────────────────────────────────────────────────────────

interface DurationOption {
  value: DurationPreference
  emoji: string
  label: string
  description: string
}

const DURATION_OPTIONS: DurationOption[] = [
  { value: 'short', emoji: '⚡', label: 'Быстро', description: '~15 минут' },
  { value: 'standard', emoji: '✨', label: 'Стандартно', description: '~30 минут' },
  { value: 'extended', emoji: '🌙', label: 'Долго', description: '~60 минут' },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

interface OptionCardProps {
  emoji: string
  label: string
  description: string
  selected: boolean
  onPress: () => void
}

function OptionCard({ emoji, label, description, selected, onPress }: OptionCardProps) {
  return (
    <Pressable
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={onPress}
    >
      <Text style={styles.optionEmoji}>{emoji}</Text>
      <View style={styles.optionTextContainer}>
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </Pressable>
  )
}

function StepDots({ current }: { current: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === current - 1 && styles.dotActive]}
        />
      ))}
    </View>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const [step, setStep] = useState(1)
  const [intimacyLevel, setIntimacyLevel] = useState<IntimacyLevel | null>(null)
  const [durationPreference, setDurationPreference] = useState<DurationPreference | null>(null)
  const [partnerName, setPartnerName] = useState('')

  const { setOnboardingPrefs, completeOnboarding } = useAuthStore()

  function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1)
    } else {
      finishOnboarding()
    }
  }

  function handleSkipPartner() {
    finishOnboarding()
  }

  function finishOnboarding() {
    setOnboardingPrefs({
      intimacyLevel: intimacyLevel ?? 'moderate',
      durationPreference: durationPreference ?? 'standard',
      partnerName: partnerName.trim() || null,
    })
    completeOnboarding()
    Analytics.onboardingCompleted()
    router.replace('/(main)')
  }

  const isNextDisabled =
    (step === 1 && !intimacyLevel) ||
    (step === 2 && !durationPreference)

  const nextLabel = step === TOTAL_STEPS ? 'Начать' : 'Далее'

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <StepDots current={step} />
            <Text style={styles.stepLabel}>Шаг {step} из {TOTAL_STEPS}</Text>
          </View>

          {/* Step 1 — Intimacy level */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.title}>Какой уровень близости?</Text>
              <Text style={styles.subtitle}>Выберите, что подходит вам обоим</Text>
              <View style={styles.optionsContainer}>
                {INTIMACY_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    {...opt}
                    selected={intimacyLevel === opt.value}
                    onPress={() => setIntimacyLevel(opt.value)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Step 2 — Duration */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.title}>Сколько времени?</Text>
              <Text style={styles.subtitle}>Выберите продолжительность ритуала</Text>
              <View style={styles.optionsContainer}>
                {DURATION_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    {...opt}
                    selected={durationPreference === opt.value}
                    onPress={() => setDurationPreference(opt.value)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Step 3 — Partner name */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.title}>Имя партнёра</Text>
              <Text style={styles.subtitle}>Как вас называть друг другу? (необязательно)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Имя партнёра"
                placeholderTextColor={Colors.textSecondary}
                value={partnerName}
                onChangeText={setPartnerName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleNext}
                maxLength={30}
              />
            </View>
          )}

          {/* Footer actions */}
          <View style={styles.footer}>
            <Button
              title={nextLabel}
              onPress={handleNext}
              disabled={isNextDisabled}
              fullWidth
            />
            {step === TOTAL_STEPS && (
              <Pressable style={styles.skipButton} onPress={handleSkipPartner}>
                <Text style={styles.skipLabel}>Пропустить</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
  },
  dotActive: {
    backgroundColor: Colors.accent,
    width: 24,
  },
  stepLabel: {
    ...Typography.caption,
  },
  stepContent: {
    flex: 1,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  optionCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(255, 79, 139, 0.08)',
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    ...Typography.h3,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: Colors.accent,
  },
  optionDescription: {
    ...Typography.caption,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
  },
  textInput: {
    ...Typography.h3,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    color: Colors.text,
  },
  footer: {
    marginTop: Spacing.xxl,
    gap: Spacing.md,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  skipLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
})
