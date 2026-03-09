import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme'
import { AppBackground } from '@/components/ui/AmbientBackground'
import type { RitualMode } from '@/types'

export default function RitualSetupScreen() {
  const router = useRouter()
  const { mode } = useLocalSearchParams<{ mode: RitualMode }>()
  
  const [partner1Name, setPartner1Name] = useState('')
  const [partner2Name, setPartner2Name] = useState('')
  
  // Simple gender toggle for visual customization (could affect content later)
  // For now just UI state
  const [partner1Gender, setPartner1Gender] = useState<'m' | 'f'>('m')
  const [partner2Gender, setPartner2Gender] = useState<'m' | 'f'>('f')

  const handleStart = () => {
    // Pass names to session via params or store
    // For now, we'll just navigate to session
    router.push({ 
      pathname: '/(main)/ritual/session', 
      params: { 
        mode,
        p1: partner1Name || 'Партнёр 1',
        p2: partner2Name || 'Партнёр 2'
      } 
    })
  }

  const isValid = partner1Name.trim().length > 0 && partner2Name.trim().length > 0

  return (
    <View style={styles.container}>
      <AppBackground />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()}>
                <Text style={styles.backText}>← Назад</Text>
              </Pressable>
            </View>

            <Text style={styles.title}>Кто участвует?</Text>
            <Text style={styles.subtitle}>Введите имена для персонализации заданий</Text>

            <View style={styles.form}>
              {/* Partner 1 */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Партнёр 1</Text>
                  <View style={styles.genderSwitch}>
                    <Pressable onPress={() => setPartner1Gender('m')} style={[styles.genderBtn, partner1Gender === 'm' && styles.genderBtnActive]}>
                      <Text style={styles.genderText}>М</Text>
                    </Pressable>
                    <Pressable onPress={() => setPartner1Gender('f')} style={[styles.genderBtn, partner1Gender === 'f' && styles.genderBtnActive]}>
                      <Text style={styles.genderText}>Ж</Text>
                    </Pressable>
                  </View>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Имя"
                  placeholderTextColor={Colors.textSecondary}
                  value={partner1Name}
                  onChangeText={setPartner1Name}
                  autoFocus
                />
              </View>

              {/* Partner 2 */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Партнёр 2</Text>
                  <View style={styles.genderSwitch}>
                    <Pressable onPress={() => setPartner2Gender('m')} style={[styles.genderBtn, partner2Gender === 'm' && styles.genderBtnActive]}>
                      <Text style={styles.genderText}>М</Text>
                    </Pressable>
                    <Pressable onPress={() => setPartner2Gender('f')} style={[styles.genderBtn, partner2Gender === 'f' && styles.genderBtnActive]}>
                      <Text style={styles.genderText}>Ж</Text>
                    </Pressable>
                  </View>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Имя"
                  placeholderTextColor={Colors.textSecondary}
                  value={partner2Name}
                  onChangeText={setPartner2Name}
                />
              </View>
            </View>

            <View style={styles.footer}>
              <Pressable 
                style={[styles.startBtn, !isValid && styles.startBtnDisabled]} 
                onPress={handleStart}
                disabled={!isValid}
              >
                <Text style={styles.startBtnText}>Начать Ritual</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  content: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  backText: {
    ...Typography.body,
    color: Colors.textSecondary,
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
  form: {
    gap: Spacing.xl,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...Typography.h3,
    fontSize: 18,
  },
  genderSwitch: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  genderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  genderBtnActive: {
    backgroundColor: Colors.accent,
  },
  genderText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 18,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: Spacing.xxl,
  },
  startBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  startBtnDisabled: {
    opacity: 0.5,
  },
  startBtnText: {
    ...Typography.h3,
    color: '#FFF',
  },
})
