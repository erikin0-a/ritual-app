import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, Fonts, BorderRadius, Spacing } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth.store'
import { Analytics } from '@/lib/analytics'
import { LiquidBackground } from '@/components/ui/LiquidBackground'
import type { ParticipantGender } from '@/types'
import { createRitualParticipants } from '@/lib/ritual-participants'

const { height, width } = Dimensions.get('window')

const ONBOARDING_PHRASES = [
  'Пространство для двоих',
  'Глубина без слов',
  'Ваш личный ритуал',
  'Здесь начинается близость',
]

// ─── Cycling Phrase ───────────────────────────────────────────────────────────
function CyclingPhrase() {
  const [index, setIndex] = useState(0)
  const opacity = useSharedValue(1)
  const translateY = useSharedValue(0)

  const advance = useCallback(() => {
    opacity.value = withTiming(0, { duration: 600, easing: Easing.in(Easing.ease) }, (done) => {
      if (!done) return
      translateY.value = 10
      runOnJS(setIndex)((prev) => (prev + 1) % ONBOARDING_PHRASES.length)
      opacity.value = withTiming(1, { duration: 750, easing: Easing.out(Easing.ease) })
      translateY.value = withTiming(0, { duration: 750, easing: Easing.out(Easing.cubic) })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setInterval(advance, 4000)
    return () => clearInterval(timer)
  }, [advance])

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.Text style={[styles.cyclingPhrase, animStyle]}>
      {ONBOARDING_PHRASES[index]}
    </Animated.Text>
  )
}

type Step = 'age' | 'names'

interface PartnerInput {
  name: string
  gender: ParticipantGender
}

// ─── Gender Pill ─────────────────────────────────────────────────────────────
function GenderPill({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  const scale = useSharedValue(1)
  const pillStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Pressable
      onPressIn={() => { scale.value = withTiming(0.94, { duration: 100 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }) }}
      onPress={onPress}
      hitSlop={8}
    >
      <Animated.View style={[styles.genderPill, selected && styles.genderPillActive, pillStyle]}>
        <Text style={[styles.genderPillText, selected && styles.genderPillTextActive]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

// ─── Partner Input Card ───────────────────────────────────────────────────────
function PartnerCard({
  label,
  value,
  gender,
  onNameChange,
  onGenderChange,
  placeholder,
  index,
}: {
  label: string
  value: string
  gender: ParticipantGender
  onNameChange: (text: string) => void
  onGenderChange: (gender: ParticipantGender) => void
  placeholder: string
  index: number
}) {
  const borderOpacity = useSharedValue(0)

  const focusBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(194, 24, 91, ${borderOpacity.value})`,
  }))

  function handleFocus() {
    borderOpacity.value = withTiming(0.7, { duration: 220 })
  }

  function handleBlur() {
    borderOpacity.value = withTiming(0, { duration: 300 })
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 120).duration(600).springify()}
      style={styles.partnerCard}
    >
      {/* Plain View — no Animated wrapper around TextInput to prevent iOS touch interception */}
      <View style={styles.cardInner}>
        {/* Animated focus border overlay — pointerEvents none so it never intercepts touches */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.focusBorderOverlay, focusBorderStyle]}
        />
        <Text style={styles.cardLabel}>{label}</Text>
        <TextInput
          style={styles.nameInput}
          value={value}
          onChangeText={onNameChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="next"
          maxLength={24}
        />
        <View style={styles.genderRow}>
          <Text style={styles.genderLabel}>пол:</Text>
          <GenderPill label="Он" selected={gender === 'm'} onPress={() => onGenderChange('m')} />
          <GenderPill label="Она" selected={gender === 'f'} onPress={() => onGenderChange('f')} />
        </View>
      </View>
    </Animated.View>
  )
}

// ─── Age Gate Screen ──────────────────────────────────────────────────────────
function AgeGateScreen({ onConfirm, onReject }: { onConfirm: () => void; onReject: () => void }) {
  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      exiting={SlideOutLeft.duration(350)}
      style={styles.stepContainer}
    >
      <Animated.View entering={FadeInUp.duration(1000).delay(200)} style={styles.brandContainer}>
        <Text style={styles.brandTitle}>
          Ritual <Text style={styles.brandItalic}>depth</Text>
        </Text>
        <Animated.View entering={FadeIn.duration(1200).delay(800)} style={styles.phraseContainer}>
          <CyclingPhrase />
        </Animated.View>
      </Animated.View>

      <Animated.View entering={FadeIn.duration(1000).delay(600)} style={styles.messageBox}>
        <Text style={styles.warningTitle}>ВНИМАНИЕ</Text>
        <Text style={styles.description}>
          Данное приложение предназначено исключительно для совершеннолетних.{'\n'}
          Пожалуйста, подтвердите ваш возраст.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(1000).delay(1000)} style={styles.actionContainer}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          onPress={onConfirm}
        >
          <Text style={styles.primaryBtnText}>МНЕ ЕСТЬ 18 ЛЕТ</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
          onPress={onReject}
        >
          <Text style={styles.secondaryBtnText}>МНЕ НЕТ 18 ЛЕТ</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  )
}

// ─── Names Screen ─────────────────────────────────────────────────────────────
function NamesScreen({
  p1,
  p2,
  onP1Change,
  onP2Change,
  onConfirm,
}: {
  p1: PartnerInput
  p2: PartnerInput
  onP1Change: (val: Partial<PartnerInput>) => void
  onP2Change: (val: Partial<PartnerInput>) => void
  onConfirm: () => void
}) {
  const [error, setError] = useState<string | null>(null)

  const btnScale = useSharedValue(1)
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }))

  function validate() {
    if (p1.name.trim().length < 2) {
      setError('Имя первого партнёра должно быть не менее 2 символов')
      return false
    }
    if (p2.name.trim().length < 2) {
      setError('Имя второго партнёра должно быть не менее 2 символов')
      return false
    }
    setError(null)
    return true
  }

  function handleConfirm() {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    onConfirm()
  }

  const canProceed = p1.name.trim().length >= 2 && p2.name.trim().length >= 2

  return (
    <Animated.View
      entering={SlideInRight.duration(400)}
      style={styles.stepContainer}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={40}
      >
        <ScrollView
          contentContainerStyle={styles.namesScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.namesHeader}>
            <Text style={styles.namesTitle}>
              Кто <Text style={styles.namesTitleItalic}>сегодня</Text>
            </Text>
            <Text style={styles.namesSubtitle}>
              Введите имена, чтобы ритуал обращался к вам лично
            </Text>
          </Animated.View>

          <View style={styles.cardsContainer}>
            <PartnerCard
              label="ПАРТНЁР 1"
              value={p1.name}
              gender={p1.gender}
              onNameChange={(text) => onP1Change({ name: text })}
              onGenderChange={(gender) => onP1Change({ gender })}
              placeholder="Имя"
              index={0}
            />
            <PartnerCard
              label="ПАРТНЁР 2"
              value={p2.name}
              gender={p2.gender}
              onNameChange={(text) => onP2Change({ name: text })}
              onGenderChange={(gender) => onP2Change({ gender })}
              placeholder="Имя"
              index={1}
            />
          </View>

          {error && (
            <Animated.Text entering={FadeIn.duration(300)} style={styles.errorText}>
              {error}
            </Animated.Text>
          )}

          <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.confirmBtnWrapper}>
            <Pressable
              onPressIn={() => { btnScale.value = withTiming(0.97, { duration: 100 }) }}
              onPressOut={() => { btnScale.value = withSpring(1, { damping: 12 }) }}
              onPress={handleConfirm}
            >
              <Animated.View style={[styles.confirmBtn, !canProceed && styles.confirmBtnDisabled, btnStyle]}>
                <Text style={[styles.confirmBtnText, !canProceed && styles.confirmBtnTextDisabled]}>
                  НАЧАТЬ РИТУАЛ
                </Text>
              </Animated.View>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { setOnboardingPrefs, setRitualParticipants, completeOnboarding } = useAuthStore()
  const [step, setStep] = useState<Step>('age')
  const [p1, setP1] = useState<PartnerInput>({ name: '', gender: 'm' })
  const [p2, setP2] = useState<PartnerInput>({ name: '', gender: 'f' })

  function handleConfirmAge() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setStep('names')
  }

  function handleRejectAge() {
    alert('Приложение доступно только для совершеннолетних.')
  }

  function handleConfirmNames() {
    // setOnboardingPrefs first (it resets participants to p2-only defaults)
    setOnboardingPrefs({
      intimacyLevel: 'moderate',
      durationPreference: 'standard',
      partnerName: p2.name.trim(),
    })
    // Override with full participants (both names + genders)
    const participants = createRitualParticipants({
      p1: { id: 'p1', name: p1.name.trim(), gender: p1.gender },
      p2: { id: 'p2', name: p2.name.trim(), gender: p2.gender },
    })
    setRitualParticipants(participants)
    completeOnboarding()
    Analytics.onboardingCompleted()
    router.replace('/(main)')
  }

  return (
    <View style={styles.container}>
      <LiquidBackground />
      <View style={styles.content}>
        {step === 'age' ? (
          <AgeGateScreen onConfirm={handleConfirmAge} onReject={handleRejectAge} />
        ) : (
          <NamesScreen
            p1={p1}
            p2={p2}
            onP1Change={(val) => setP1((prev) => ({ ...prev, ...val }))}
            onP2Change={(val) => setP2((prev) => ({ ...prev, ...val }))}
            onConfirm={handleConfirmNames}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0A0F',
  },
  content: {
    flex: 1,
    zIndex: 10,
  },

  // ─── Step container ───────────────────────────────────────────────────────
  stepContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: height * 0.14,
    paddingBottom: height * 0.07,
    justifyContent: 'space-between',
  },

  // ─── Age Gate ─────────────────────────────────────────────────────────────
  brandContainer: {
    alignItems: 'center',
  },
  brandTitle: {
    fontFamily: Fonts.display,
    fontSize: 48,
    color: '#fff',
    letterSpacing: -1,
  },
  brandItalic: {
    fontStyle: 'italic',
    fontWeight: '300',
    color: 'rgba(255,255,255,0.5)',
  },
  phraseContainer: {
    marginTop: 16,
    alignItems: 'center',
    minHeight: 20,
  },
  cyclingPhrase: {
    fontSize: 11,
    letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.28)',
    textTransform: 'uppercase',
    fontWeight: '500',
    textAlign: 'center',
  },
  messageBox: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  warningTitle: {
    fontSize: 9,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 23,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  actionContainer: {
    gap: 14,
  },
  primaryBtn: {
    backgroundColor: '#f5f2ed',
    paddingVertical: 18,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#0D0A0F',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  secondaryBtn: {
    paddingVertical: 18,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass,
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
  },
  btnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  // ─── Names Screen ─────────────────────────────────────────────────────────
  namesScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingBottom: Spacing.xl,
  },
  namesHeader: {
    marginBottom: 32,
  },
  namesTitle: {
    fontFamily: Fonts.display,
    fontSize: 44,
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  namesTitleItalic: {
    fontStyle: 'italic',
    fontWeight: '300',
    color: 'rgba(255,255,255,0.5)',
  },
  namesSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '300',
    lineHeight: 20,
  },

  // ─── Partner Cards ────────────────────────────────────────────────────────
  cardsContainer: {
    gap: 16,
    marginBottom: 16,
  },
  partnerCard: {
    width: '100%',
  },
  cardInner: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    gap: 12,
    overflow: 'hidden',
  },
  focusBorderOverlay: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  nameInput: {
    fontSize: 26,
    fontFamily: Fonts.display,
    color: '#fff',
    fontWeight: '300',
    letterSpacing: -0.3,
    paddingVertical: 4,
    minHeight: 36,
  },
  genderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  genderLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '400',
    marginRight: 2,
  },
  genderPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  genderPillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  genderPillText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  genderPillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // ─── Error ────────────────────────────────────────────────────────────────
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '400',
  },

  // ─── Confirm Button ───────────────────────────────────────────────────────
  confirmBtnWrapper: {
    marginTop: 8,
  },
  confirmBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 18,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: 'rgba(194,24,91,0.25)',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  confirmBtnTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
})
