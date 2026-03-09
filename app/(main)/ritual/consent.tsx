/**
 * ConsentScreen — Premium Ritual
 *
 * Shows ritual rules, then animates two large buttons that both partners
 * must press simultaneously (within 500ms of each other) to begin.
 */
import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme'

const RULES = [
  'Уберите телефоны в сторону — вы здесь для друг друга',
  'Следуйте сценарию, доверяйте процессу',
  'Уважайте границы партнёра в любой момент',
  'Будьте полностью присутствующими',
]

const CONSENT_WINDOW_MS = 500

export default function ConsentScreen() {
  const router = useRouter()

  // Phase: 'rules' → 'consent'
  const [phase, setPhase] = useState<'rules' | 'consent'>('rules')

  // Track which buttons are currently held
  const leftPressedAt = useRef<number | null>(null)
  const rightPressedAt = useRef<number | null>(null)
  const consentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Animation values for the two consent buttons sliding in
  const leftSlide = useRef(new Animated.Value(0)).current
  const rightSlide = useRef(new Animated.Value(0)).current
  const buttonsOpacity = useRef(new Animated.Value(0)).current

  // Pulsing scale for pressed state
  const [leftActive, setLeftActive] = useState(false)
  const [rightActive, setRightActive] = useState(false)

  useEffect(() => {
    if (phase !== 'consent') return

    // Animate buttons sliding in from sides
    Animated.parallel([
      Animated.spring(leftSlide, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
      Animated.spring(rightSlide, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
      Animated.timing(buttonsOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start()
  }, [phase])

  function clearConsentTimer() {
    if (consentTimerRef.current) {
      clearTimeout(consentTimerRef.current)
      consentTimerRef.current = null
    }
  }

  function checkSimultaneous() {
    if (leftPressedAt.current === null || rightPressedAt.current === null) return

    const diff = Math.abs(leftPressedAt.current - rightPressedAt.current)
    if (diff <= CONSENT_WINDOW_MS) {
      clearConsentTimer()
      handleConsented()
    }
  }

  async function handleConsented() {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      await new Promise((r) => setTimeout(r, 300))
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    } catch { /* ignore */ }

    router.replace({ pathname: '/(main)/ritual/session', params: { mode: 'guided' } })
  }

  function onPressIn(side: 'left' | 'right') {
    const now = Date.now()
    if (side === 'left') {
      leftPressedAt.current = now
      setLeftActive(true)
    } else {
      rightPressedAt.current = now
      setRightActive(true)
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})

    // Auto-expire single press after window
    clearConsentTimer()
    consentTimerRef.current = setTimeout(() => {
      leftPressedAt.current = null
      rightPressedAt.current = null
      setLeftActive(false)
      setRightActive(false)
    }, CONSENT_WINDOW_MS + 100)

    checkSimultaneous()
  }

  function onPressOut(side: 'left' | 'right') {
    if (side === 'left') setLeftActive(false)
    else setRightActive(false)
  }

  const leftTranslate = leftSlide.interpolate({ inputRange: [0, 1], outputRange: [-120, 0] })
  const rightTranslate = rightSlide.interpolate({ inputRange: [0, 1], outputRange: [120, 0] })

  return (
    <SafeAreaView style={styles.screen}>
      {phase === 'rules' ? (
        <View style={styles.rulesContainer}>
          <Text style={styles.rulesTitle}>Правила ритуала</Text>
          <Text style={styles.rulesIntro}>
            Прежде чем начать, примите их оба — сердцем, не только словами.
          </Text>

          <View style={styles.rulesList}>
            {RULES.map((rule, i) => (
              <View key={i} style={styles.ruleRow}>
                <View style={styles.ruleDot} />
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.continueButton, pressed && { opacity: 0.85 }]}
            onPress={() => setPhase('consent')}
          >
            <Text style={styles.continueText}>Мы готовы →</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.consentContainer}>
          <Text style={styles.consentTitle}>Нажмите вместе</Text>
          <Text style={styles.consentSubtitle}>
            Оба партнёра подтверждают готовность — одновременно
          </Text>

          <Animated.View style={[styles.buttonsRow, { opacity: buttonsOpacity }]}>
            {/* Left button */}
            <Animated.View style={{ transform: [{ translateX: leftTranslate }] }}>
              <Pressable
                style={[styles.consentButton, leftActive && styles.consentButtonActive]}
                onPressIn={() => onPressIn('left')}
                onPressOut={() => onPressOut('left')}
              >
                <Text style={styles.consentButtonEmoji}>🫴</Text>
                <Text style={styles.consentButtonLabel}>Я готов(а)</Text>
              </Pressable>
            </Animated.View>

            {/* Right button */}
            <Animated.View style={{ transform: [{ translateX: rightTranslate }] }}>
              <Pressable
                style={[styles.consentButton, rightActive && styles.consentButtonActive]}
                onPressIn={() => onPressIn('right')}
                onPressOut={() => onPressOut('right')}
              >
                <Text style={styles.consentButtonEmoji}>🫴</Text>
                <Text style={styles.consentButtonLabel}>Я готов(а)</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>

          <Text style={styles.hint}>Держите оба пальца одновременно</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Rules phase
  rulesContainer: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    gap: Spacing.xl,
    justifyContent: 'center',
  },
  rulesTitle: {
    ...Typography.h1,
    textAlign: 'center',
  },
  rulesIntro: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  rulesList: {
    gap: Spacing.md,
  },
  ruleRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  ruleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 8,
    flexShrink: 0,
  },
  ruleText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 24,
  },
  continueButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  continueText: {
    ...Typography.h3,
    color: Colors.text,
  },

  // Consent phase
  consentContainer: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  consentTitle: {
    ...Typography.h1,
    textAlign: 'center',
  },
  consentSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.lg,
  },
  consentButton: {
    width: 130,
    height: 130,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  consentButtonActive: {
    backgroundColor: 'rgba(255, 79, 139, 0.15)',
    borderColor: Colors.accent,
  },
  consentButtonEmoji: {
    fontSize: 32,
  },
  consentButtonLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xs,
  },
  hint: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
  },
})
