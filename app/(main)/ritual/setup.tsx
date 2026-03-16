import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { ArrowRight } from 'lucide-react-native'
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, Fonts } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth.store'
import { createRitualParticipants } from '@/lib/ritual-participants'
import { warmNameAudio } from '@/lib/name-audio-service'
import type { ParticipantGender, RitualMode } from '@/types'
import { LiquidBackground } from '@/components/ui/LiquidBackground'

function GenderSelector({
  value,
  onChange,
}: {
  value: ParticipantGender
  onChange: (g: ParticipantGender) => void
}) {
  return (
    <View style={styles.genderRow}>
      <Pressable onPress={() => onChange('m')} style={styles.genderBtn}>
        <Text style={[styles.genderText, value === 'm' ? styles.genderTextActive : styles.genderTextInactive]}>
          МУЖЧИНА
        </Text>
      </Pressable>
      <View style={styles.genderDot} />
      <Pressable onPress={() => onChange('f')} style={styles.genderBtn}>
        <Text style={[styles.genderText, value === 'f' ? styles.genderTextActive : styles.genderTextInactive]}>
          ЖЕНЩИНА
        </Text>
      </Pressable>
    </View>
  )
}

function PartnerPane({
  number,
  name,
  gender,
  onNameChange,
  onGenderChange,
}: {
  number: string
  name: string
  gender: ParticipantGender
  onNameChange: (text: string) => void
  onGenderChange: (g: ParticipantGender) => void
}) {
  return (
    <View style={styles.paneContainer}>
      <View style={styles.labelRow}>
        <Text style={styles.numericLabel}>{number}</Text>
        <Text style={styles.labelText}>УЧАСТНИК</Text>
      </View>
      <TextInput
        style={styles.nameInput}
        placeholder="Имя"
        placeholderTextColor="rgba(255,255,255,0.15)"
        value={name}
        onChangeText={onNameChange}
        selectionColor="#f5f2ed"
        autoCorrect={false}
      />
      <View style={styles.inputUnderline} />
      <GenderSelector value={gender} onChange={onGenderChange} />
    </View>
  )
}

// ─── Loading Phase (name audio warmup) ───────────────────────────────────────
const LOADING_PHASES = [
  'Приглушаем свет...',
  'Синхронизируем ритм...',
  'Подготовка ритуала...',
]

function LoadingPane() {
  const [phaseIndex, setPhaseIndex] = useState(0)

  const pulseScale = useSharedValue(0.92)
  const pulseOpacity = useSharedValue(0.06)
  const ring1Scale = useSharedValue(1)
  const ring2Scale = useSharedValue(1)
  const ring3Scale = useSharedValue(1)
  const ring1Opacity = useSharedValue(0.3)
  const ring2Opacity = useSharedValue(0.2)
  const ring3Opacity = useSharedValue(0.12)
  const textOpacity = useSharedValue(1)

  useEffect(() => {
    pulseScale.value = withRepeat(withSequence(withTiming(1.06, { duration: 2400 }), withTiming(0.92, { duration: 2400 })), -1, false)
    pulseOpacity.value = withRepeat(withSequence(withTiming(0.12, { duration: 2400 }), withTiming(0.04, { duration: 2400 })), -1, false)
    ring1Scale.value = withRepeat(withSequence(withTiming(1.25, { duration: 2000 }), withTiming(1, { duration: 2000 })), -1, false)
    ring2Scale.value = withRepeat(withSequence(withTiming(1.4, { duration: 2800 }), withTiming(1, { duration: 2800 })), -1, false)
    ring3Scale.value = withRepeat(withSequence(withTiming(1.55, { duration: 3600 }), withTiming(1, { duration: 3600 })), -1, false)
    ring1Opacity.value = withRepeat(withSequence(withTiming(0.0, { duration: 2000 }), withTiming(0.3, { duration: 2000 })), -1, false)
    ring2Opacity.value = withRepeat(withSequence(withTiming(0.0, { duration: 2800 }), withTiming(0.2, { duration: 2800 })), -1, false)
    ring3Opacity.value = withRepeat(withSequence(withTiming(0.0, { duration: 3600 }), withTiming(0.12, { duration: 3600 })), -1, false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value + 0.9,
    shadowOpacity: pulseOpacity.value * 4,
  }))
  const ring1Style = useAnimatedStyle(() => ({ transform: [{ scale: ring1Scale.value }], opacity: ring1Opacity.value }))
  const ring2Style = useAnimatedStyle(() => ({ transform: [{ scale: ring2Scale.value }], opacity: ring2Opacity.value }))
  const ring3Style = useAnimatedStyle(() => ({ transform: [{ scale: ring3Scale.value }], opacity: ring3Opacity.value }))

  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }))

  // Cycle loading phase text every 1.5s
  useEffect(() => {
    const interval = globalThis.setInterval(() => {
      textOpacity.value = withTiming(0, { duration: 300 }, () => {
        setPhaseIndex((i) => (i + 1) % LOADING_PHASES.length)
        textOpacity.value = withTiming(1, { duration: 300 })
      })
    }, 1500)
    return () => globalThis.clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Animated.View entering={FadeIn.duration(600)} exiting={FadeOut.duration(400)} style={styles.loadingContainer}>
      <View style={styles.sphereContainer}>
        <Animated.View style={[styles.ring, styles.ring3, ring3Style]} />
        <Animated.View style={[styles.ring, styles.ring2, ring2Style]} />
        <Animated.View style={[styles.ring, styles.ring1, ring1Style]} />
        <Animated.View style={[styles.sphereCore, coreStyle]} />
      </View>
      <Animated.Text style={[styles.loadingPhaseText, textStyle]}>
        {LOADING_PHASES[phaseIndex]}
      </Animated.Text>
    </Animated.View>
  )
}

// ─── Ready Screen (names already in store) ────────────────────────────────────
function ReadyPane({ p1Name, p2Name }: { p1Name: string; p2Name: string }) {
  return (
    <Animated.View entering={FadeInDown.duration(700).delay(100)} style={styles.readyContainer}>
      <View style={styles.readyPair}>
        <Text style={styles.readyName}>{p1Name}</Text>
        <Text style={styles.readyAmpersand}>&</Text>
        <Text style={styles.readyName}>{p2Name}</Text>
      </View>
      <Text style={styles.readyHint}>Ваши имена сохранены из предыдущего сеанса</Text>
    </Animated.View>
  )
}

export default function RitualSetupScreen() {
  const router = useRouter()
  const { mode } = useLocalSearchParams<{ mode: RitualMode }>()

  const storedParticipants = useAuthStore((s) => s.ritualParticipants)
  const setRitualParticipants = useAuthStore((s) => s.setRitualParticipants)

  const hasStoredNames =
    storedParticipants.p1.name.trim().length >= 2 &&
    storedParticipants.p2.name.trim().length >= 2

  // Fallback state for when names are missing
  const [partner1Name, setPartner1Name] = useState(storedParticipants.p1.name)
  const [partner2Name, setPartner2Name] = useState(storedParticipants.p2.name)
  const [partner1Gender, setPartner1Gender] = useState<ParticipantGender>(storedParticipants.p1.gender)
  const [partner2Gender, setPartner2Gender] = useState<ParticipantGender>(storedParticipants.p2.gender)
  const [isLoading, setIsLoading] = useState(false)

  const handleStart = async () => {
    const participants = hasStoredNames
      ? storedParticipants
      : (() => {
          const created = createRitualParticipants({
            p1: { id: 'p1', name: partner1Name.trim(), gender: partner1Gender },
            p2: { id: 'p2', name: partner2Name.trim(), gender: partner2Gender },
          })
          setRitualParticipants(created)
          return created
        })()

    setIsLoading(true)
    // Pre-warm name audio; swallow errors — session works without it
    await warmNameAudio(participants).catch(() => null)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null)
    await new Promise<void>((resolve) => globalThis.setTimeout(resolve, 800))
    router.push({ pathname: '/(main)/ritual/session', params: { mode } })
  }

  const isValid = hasStoredNames
    ? true
    : partner1Name.trim().length > 0 && partner2Name.trim().length > 0

  const btnPressed = useSharedValue(0)
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(btnPressed.value, [0, 1], [1, 0.98]) }],
  }))

  const content = (
    <View style={styles.screen}>
      <LiquidBackground />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <ArrowRight size={16} color="rgba(255,255,255,0.7)" style={{ transform: [{ rotate: '180deg' }] }} />
            </Pressable>
            <Text style={styles.topLabel}>ПОДГОТОВКА</Text>
            <View style={styles.backSpacer} />
          </Animated.View>

          <View style={styles.content}>
            {isLoading ? (
              <LoadingPane />
            ) : hasStoredNames ? (
              <View style={styles.panesWrapper}>
                <ReadyPane p1Name={storedParticipants.p1.name} p2Name={storedParticipants.p2.name} />
              </View>
            ) : (
              <Animated.View entering={FadeInDown.duration(800).delay(100)} style={styles.panesWrapper}>
                <PartnerPane
                  number="01"
                  name={partner1Name}
                  gender={partner1Gender}
                  onNameChange={setPartner1Name}
                  onGenderChange={setPartner1Gender}
                />
                <View style={styles.paneSpacer} />
                <PartnerPane
                  number="02"
                  name={partner2Name}
                  gender={partner2Gender}
                  onNameChange={setPartner2Name}
                  onGenderChange={setPartner2Gender}
                />
              </Animated.View>
            )}

            {/* Action Button — hidden during loading */}
            {!isLoading && (
              <Animated.View entering={FadeIn.duration(600).delay(300)} style={styles.footer}>
                <Pressable
                  style={styles.fabPressableArea}
                  onPressIn={() => { btnPressed.value = withTiming(1, { duration: 150 }) }}
                  onPressOut={() => { btnPressed.value = withTiming(0, { duration: 300 }) }}
                  onPress={handleStart}
                  disabled={!isValid}
                >
                  <Animated.View style={[styles.fab, !isValid && styles.fabDisabled, btnStyle]}>
                    <Text style={[styles.fabText, !isValid && styles.fabTextDisabled]}>
                      НАЧАТЬ ПОГРУЖЕНИЕ
                    </Text>
                  </Animated.View>
                </Pressable>
              </Animated.View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )

  // Dismiss keyboard on tap when fallback input shown
  if (!hasStoredNames) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        {content}
      </TouchableWithoutFeedback>
    )
  }
  return content
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  topLabel: {
    fontSize: 9,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
  },
  backSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  panesWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  paneSpacer: {
    height: 60,
  },

  // ─── Fallback name input ──────────────────────────────────────────────────
  paneContainer: {
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  numericLabel: {
    fontFamily: Fonts.display,
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  labelText: {
    fontSize: 10,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
    lineHeight: 18,
  },
  nameInput: {
    fontFamily: Fonts.display,
    fontSize: 42,
    color: '#ffffff',
    textAlign: 'center',
    width: '100%',
    paddingVertical: 12,
  },
  inputUnderline: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
  },
  genderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  genderBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  genderDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  genderText: {
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '600',
  },
  genderTextActive: {
    color: '#ffffff',
  },
  genderTextInactive: {
    color: 'rgba(255,255,255,0.3)',
  },

  // ─── Ready pane (names from store) ───────────────────────────────────────
  readyContainer: {
    alignItems: 'center',
    gap: 20,
  },
  readyPair: {
    alignItems: 'center',
    gap: 4,
  },
  readyName: {
    fontFamily: Fonts.display,
    fontSize: 48,
    color: '#fff',
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  readyAmpersand: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: 'rgba(194,24,91,0.7)',
    fontStyle: 'italic',
    marginVertical: 4,
  },
  readyHint: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.2)',
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  // ─── Loading phase ────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
  },
  sphereContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sphereCore: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.07)',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 40,
    shadowOpacity: 0.5,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(194,24,91,0.4)',
  },
  ring1: {
    width: 110,
    height: 110,
  },
  ring2: {
    width: 140,
    height: 140,
  },
  ring3: {
    width: 160,
    height: 160,
  },
  loadingPhaseText: {
    fontSize: 12,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  // ─── Footer button ────────────────────────────────────────────────────────
  footer: {
    width: '100%',
    paddingTop: 24,
  },
  fabPressableArea: {
    width: '100%',
  },
  fab: {
    width: '100%',
    height: 56,
    borderRadius: 999,
    backgroundColor: '#f5f2ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  fabText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  fabTextDisabled: {
    color: 'rgba(255,255,255,0.2)',
  },
})
