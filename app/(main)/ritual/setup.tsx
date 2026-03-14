import { useState } from 'react'
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
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated'
import { Fonts } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth.store'
import { createRitualParticipants } from '@/lib/ritual-participants'
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
        selectionColor="#f5f2ed" // Cream color
        autoCorrect={false}
      />
      <View style={styles.inputUnderline} />

      <GenderSelector value={gender} onChange={onGenderChange} />
    </View>
  )
}

export default function RitualSetupScreen() {
  const router = useRouter()
  const { mode } = useLocalSearchParams<{ mode: RitualMode }>()

  const setRitualParticipants = useAuthStore((s) => s.setRitualParticipants)

  const [partner1Name, setPartner1Name] = useState('')
  const [partner2Name, setPartner2Name] = useState('')
  const [partner1Gender, setPartner1Gender] = useState<ParticipantGender>('m')
  const [partner2Gender, setPartner2Gender] = useState<ParticipantGender>('f')

  const handleStart = () => {
    setRitualParticipants(
      createRitualParticipants({
        p1: { id: 'p1', name: partner1Name, gender: partner1Gender },
        p2: { id: 'p2', name: partner2Name, gender: partner2Gender },
      }),
    )
    router.push({ pathname: '/(main)/ritual/session', params: { mode } })
  }

  const isValid = partner1Name.trim().length > 0 && partner2Name.trim().length > 0

  const btnPressed = useSharedValue(0)
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(btnPressed.value, [0, 1], [1, 0.98]) }]
  }))

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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

              {/* Action Button */}
              <Animated.View 
                entering={FadeIn.duration(600).delay(300)}
                style={styles.footer}
              >
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
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0D0A0F',
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
