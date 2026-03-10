import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Svg, Defs, RadialGradient, Stop, Rect } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { Colors, Fonts, Spacing, Typography } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth.store'
import { createRitualParticipants } from '@/lib/ritual-participants'
import type { ParticipantGender, RitualMode } from '@/types'

function BackgroundGradients() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="grad1" cx="0%" cy="25%" r="60%" fx="0%" fy="25%">
            <Stop offset="0%" stopColor="#D22E88" stopOpacity="0.04" />
            <Stop offset="100%" stopColor="#D22E88" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="grad2" cx="100%" cy="75%" r="60%" fx="100%" fy="75%">
            <Stop offset="0%" stopColor="#D22E88" stopOpacity="0.04" />
            <Stop offset="100%" stopColor="#D22E88" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad1)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad2)" />
      </Svg>
    </View>
  )
}

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
        {value === 'm' && <Animated.View entering={FadeIn.duration(300)} style={styles.activeLine} />}
      </Pressable>
      <Pressable onPress={() => onChange('f')} style={styles.genderBtn}>
        <Text style={[styles.genderText, value === 'f' ? styles.genderTextActive : styles.genderTextInactive]}>
          ЖЕНЩИНА
        </Text>
        {value === 'f' && <Animated.View entering={FadeIn.duration(300)} style={styles.activeLine} />}
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
  isLast,
}: {
  number: string
  name: string
  gender: ParticipantGender
  onNameChange: (text: string) => void
  onGenderChange: (g: ParticipantGender) => void
  isLast?: boolean
}) {
  return (
    <View style={styles.paneContainer}>
      {/* Watermark */}
      <Text style={[styles.watermark, number === '01' ? styles.watermarkLeft : styles.watermarkRight]}>
        {number}
      </Text>

      <View style={styles.paneContent}>
        {/* Label */}
        <View style={styles.labelRow}>
          <View style={styles.labelLine} />
          <Text style={styles.labelText}>УЧАСТНИК {parseInt(number)}</Text>
        </View>

        {/* Input */}
        <TextInput
          style={styles.nameInput}
          placeholder="Имя"
          placeholderTextColor="rgba(255,255,255,0.1)"
          value={name}
          onChangeText={onNameChange}
          selectionColor={Colors.accent}
          autoCorrect={false}
        />

        {/* Gender */}
        <GenderSelector value={gender} onChange={onGenderChange} />
      </View>

      {!isLast && (
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.divider}
        />
      )}
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

  return (
    <View style={styles.screen}>
      <BackgroundGradients />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeInDown.duration(800)}>
              <PartnerPane
                number="01"
                name={partner1Name}
                gender={partner1Gender}
                onNameChange={setPartner1Name}
                onGenderChange={setPartner1Gender}
              />
              <PartnerPane
                number="02"
                name={partner2Name}
                gender={partner2Gender}
                onNameChange={setPartner2Name}
                onGenderChange={setPartner2Gender}
                isLast
              />
            </Animated.View>
          </ScrollView>

          {/* Floating Action Button */}
          <Animated.View 
            entering={FadeIn.duration(600).delay(200)}
            style={styles.fabContainer}
          >
            <Pressable
              style={({ pressed }) => [
                styles.fab,
                isValid ? styles.fabActive : styles.fabDisabled,
                pressed && isValid && styles.fabPressed,
              ]}
              onPress={handleStart}
              disabled={!isValid}
            >
              <Text style={[styles.fabText, !isValid && styles.fabTextDisabled]}>
                ИНИЦИАЛИЗАЦИЯ
              </Text>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  scroll: {
    paddingBottom: 140,
  },
  paneContainer: {
    flex: 1,
    minHeight: Dimensions.get('window').height * 0.42,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    top: 60,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : Fonts.display,
    fontSize: 200,
    color: 'rgba(255,255,255,0.02)',
    fontWeight: '900',
  },
  watermarkLeft: {
    left: -40,
  },
  watermarkRight: {
    right: -40,
    textAlign: 'right',
  },
  paneContent: {
    zIndex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  labelLine: {
    width: 32,
    height: 1,
    backgroundColor: 'rgba(210,46,136,0.5)',
  },
  labelText: {
    ...Typography.label,
    color: Colors.accent,
    fontSize: 10,
    letterSpacing: 3,
  },
  nameInput: {
    fontFamily: Platform.OS === 'ios' ? 'Didot' : Fonts.display,
    fontSize: 48,
    color: '#ffffff',
    fontWeight: '300' as const,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xl,
    lineHeight: 60,
  },
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  genderBtn: {
    paddingVertical: Spacing.sm,
  },
  genderText: {
    ...Typography.label,
    fontSize: 11,
    letterSpacing: 2,
  },
  genderTextActive: {
    color: '#ffffff',
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  genderTextInactive: {
    color: 'rgba(255,255,255,0.3)',
  },
  activeLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: Spacing.lg,
    right: Spacing.lg,
    height: 1,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  fab: {
    width: '100%',
    maxWidth: 400,
    height: 64,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fabActive: {
    backgroundColor: 'rgba(210,46,136,0.9)',
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 10,
  },
  fabDisabled: {
    backgroundColor: 'rgba(10,10,10,0.8)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  fabPressed: {
    transform: [{ scale: 0.98 }],
  },
  fabText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  fabTextDisabled: {
    color: 'rgba(255,255,255,0.2)',
  },
})
