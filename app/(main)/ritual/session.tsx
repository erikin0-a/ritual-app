import { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  AppState,
  type AppStateStatus,
} from 'react-native'
import { Audio } from 'expo-av'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme'
import { useRitualStore } from '@/stores/ritual.store'
import { useAuthStore } from '@/stores/auth.store'
import { ROUND_CONTENT, FINAL_MESSAGE } from '@/constants/ritual-content'
import { CircularTimer } from '@/components/ritual/CircularTimer'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { RitualIntro } from '@/components/ritual/RitualIntro'
import { Analytics } from '@/lib/analytics'
import type { RitualMode, RoundId } from '@/types'

// ─── Round 2: Roulette ───────────────────────────────────────────────────────

function RouletteView({ onReady }: { onReady: () => void }) {
  const [spinning, setSpinning] = useState(true)
  const [result, setResult] = useState<string | null>(null)
  const spinAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      { iterations: 10 },
    ).start(() => {
      const choice = Math.random() < 0.5 ? 'Вы начинаете' : 'Партнёр начинает'
      setResult(choice)
      setSpinning(false)
    })
  }, [])

  const options = ['Вы', 'Партнёр', 'Вы', 'Партнёр', 'Вы']

  return (
    <View style={styles.specialContainer}>
      <Text style={styles.specialTitle}>Кто начинает?</Text>
      <Text style={styles.specialSubtitle}>Рулетка решает</Text>
      <View style={styles.rouletteBox}>
        {spinning ? (
          <Text style={styles.rouletteSpinning}>{options[Math.floor(Math.random() * options.length)]}</Text>
        ) : (
          <Text style={styles.rouletteResult}>{result}</Text>
        )}
      </View>
      {!spinning && (
        <Pressable style={styles.specialButton} onPress={onReady}>
          <Text style={styles.specialButtonText}>Начать раунд</Text>
        </Pressable>
      )}
    </View>
  )
}

// ─── Round 3: Partner choice ─────────────────────────────────────────────────

function PartnerChoiceView({ onReady }: { onReady: () => void }) {
  const [chosen, setChosen] = useState<'me' | 'partner' | null>(null)

  return (
    <View style={styles.specialContainer}>
      <Text style={styles.specialTitle}>Кто раздевает?</Text>
      <Text style={styles.specialSubtitle}>Выберите, кто начнёт соблазнение</Text>
      <View style={styles.choiceRow}>
        <Pressable
          style={[styles.choiceCard, chosen === 'me' && styles.choiceCardSelected]}
          onPress={() => setChosen('me')}
        >
          <Text style={styles.choiceEmoji}>🫵</Text>
          <Text style={[styles.choiceLabel, chosen === 'me' && styles.choiceLabelSelected]}>Я</Text>
        </Pressable>
        <Pressable
          style={[styles.choiceCard, chosen === 'partner' && styles.choiceCardSelected]}
          onPress={() => setChosen('partner')}
        >
          <Text style={styles.choiceEmoji}>🫶</Text>
          <Text style={[styles.choiceLabel, chosen === 'partner' && styles.choiceLabelSelected]}>Партнёр</Text>
        </Pressable>
      </View>
      <Pressable
        style={[styles.specialButton, !chosen && styles.specialButtonDisabled]}
        disabled={!chosen}
        onPress={onReady}
      >
        <Text style={styles.specialButtonText}>Начать раунд</Text>
      </Pressable>
    </View>
  )
}

// ─── Round progress dots ──────────────────────────────────────────────────────

function RoundProgressDots({ currentRound, completedRounds }: { currentRound: RoundId | null; completedRounds: RoundId[] }) {
  return (
    <View style={styles.progressRow}>
      {([1, 2, 3, 4, 5] as RoundId[]).map((id) => (
        <View
          key={id}
          style={[
            styles.progressDot,
            completedRounds.includes(id) && styles.progressDotDone,
            currentRound === id && styles.progressDotCurrent,
          ]}
        />
      ))}
    </View>
  )
}

// ─── Rules chips ──────────────────────────────────────────────────────────────

function RulesSection({ allowed, forbidden }: { allowed: string[]; forbidden: string[] }) {
  return (
    <View style={styles.rulesContainer}>
      {allowed.length > 0 && (
        <View style={styles.rulesGroup}>
          <Text style={styles.rulesGroupLabel}>✓ Разрешено</Text>
          <View style={styles.chipsRow}>
            {allowed.map((item) => (
              <View key={item} style={[styles.chip, styles.chipAllowed]}>
                <Text style={styles.chipTextAllowed}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {forbidden.length > 0 && (
        <View style={styles.rulesGroup}>
          <Text style={styles.rulesGroupLabel}>✗ Запрещено</Text>
          <View style={styles.chipsRow}>
            {forbidden.map((item) => (
              <View key={item} style={[styles.chip, styles.chipForbidden]}>
                <Text style={styles.chipTextForbidden}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

// ─── Completion screen ────────────────────────────────────────────────────────

function CompletionScreen({ mode, onRestart, onClose }: { mode: RitualMode; onRestart: () => void; onClose: () => void }) {
  return (
    <View style={styles.completionContainer}>
      <Text style={styles.completionEmoji}>✨</Text>
      <Text style={styles.completionTitle}>{FINAL_MESSAGE.title}</Text>
      <Text style={styles.completionBody}>{FINAL_MESSAGE.body}</Text>
      <View style={styles.completionActions}>
        <Pressable style={styles.restartButton} onPress={onRestart}>
          <Text style={styles.restartButtonText}>Начать заново</Text>
        </Pressable>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>{FINAL_MESSAGE.cta ?? 'Закрыть'}</Text>
        </Pressable>
      </View>
    </View>
  )
}

// ─── Session phases ──────────────────────────────────────────────────────────
type SessionPhase = 'intro' | 'playing' | 'completed'

export default function RitualSessionScreen() {
  const router = useRouter()
  const { mode } = useLocalSearchParams<{ mode: RitualMode }>()
  const resolvedMode: RitualMode = mode ?? 'free'

  const {
    status,
    currentRound,
    roundTimeRemaining,
    isPaused,
    completedRounds,
    rounds,
    startRitual,
    pauseToggle,
    tickTimer,
    advanceRound,
    resetRitual,
  } = useRitualStore()

  const durationPreference = useAuthStore((s) => s.durationPreference)

  // Session phase: guided starts with 'intro', free starts with 'playing'
  const [phase, setPhase] = useState<SessionPhase>(
    resolvedMode === 'guided' ? 'intro' : 'playing'
  )
  const [voiceStartTime, setVoiceStartTime] = useState<number | null>(null)

  const [roundReady, setRoundReady] = useState(false)

  const prevRoundRef = useRef<RoundId | null>(null)
  const isPausedRef = useRef(isPaused)
  const statusRef = useRef(status)
  const roundReadyRef = useRef(roundReady)
  const wasAutoPausedRef = useRef(false)

  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])
  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { roundReadyRef.current = roundReady }, [roundReady])

  // Audio refs for cleanup
  const musicRef = useRef<Audio.Sound | null>(null)
  const introRef = useRef<Audio.Sound | null>(null)

  // Start ritual only when phase is 'playing'
  useEffect(() => {
    if (phase !== 'playing') return
    startRitual(resolvedMode, durationPreference ?? 'standard')
    Analytics.ritualStarted({ mode: resolvedMode })
    return () => resetRitual()
  }, [phase])

  // Audio: start immediately when screen mounts (for guided)
  useEffect(() => {
    if (resolvedMode !== 'guided') return

    let isMounted = true
    let introTimeout: ReturnType<typeof setTimeout> | null = null
    setVoiceStartTime(null)

    const loadAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        })

        // Music first (loops, quiet)
        const { sound: music } = await Audio.Sound.createAsync(
          require('@/assets/audio/ritual_music.mp3'),
          { isLooping: true, volume: 0 } // Start silent, fade in
        )
        musicRef.current = music
        if (isMounted) {
          await music.playAsync()
          introTimeout = setTimeout(async () => {
            if (!isMounted) return
            const { sound: intro } = await Audio.Sound.createAsync(
              require('@/assets/audio/ritual_intro.mp3'),
              { volume: 1.0 }
            )
            introRef.current = intro
            if (isMounted) {
              await intro.playAsync()
              setVoiceStartTime(Date.now())
            }
          }, 1000)

          // Fade music in over 3 seconds
          for (let v = 0; v <= 0.4; v += 0.02) {
            await new Promise(r => setTimeout(r, 150))
            if (!isMounted) return
            await music.setVolumeAsync(v)
          }
        }
      } catch (error) {
        console.log('Error loading audio:', error)
      }
    }

    loadAudio()

    return () => {
      isMounted = false
      if (introTimeout) {
        clearTimeout(introTimeout)
      }
      musicRef.current?.unloadAsync()
      introRef.current?.unloadAsync()
    }
  }, [resolvedMode])

  // Consent done → transition to playing
  const handleConsentComplete = () => {
    setPhase('playing')
  }

  // Auto-pause on background
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (statusRef.current !== 'in_round' || !roundReadyRef.current) return
      if (nextState === 'background' || nextState === 'inactive') {
        if (!isPausedRef.current) {
          pauseToggle()
          wasAutoPausedRef.current = true
        }
      } else if (nextState === 'active' && wasAutoPausedRef.current) {
        pauseToggle()
        wasAutoPausedRef.current = false
      }
    }
    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription.remove()
  }, [])

  // Auto-tick timer
  useEffect(() => {
    if (status !== 'in_round' || !roundReady) return
    const interval = setInterval(tickTimer, 1000)
    return () => clearInterval(interval)
  }, [status, roundReady, tickTimer])

  // Round changes
  useEffect(() => {
    if (currentRound === null) return
    if (currentRound !== prevRoundRef.current) {
      const needsSetup = currentRound === 2 || currentRound === 3
      setRoundReady(!needsSetup)
      if (prevRoundRef.current !== null) {
        Analytics.ritualRoundCompleted({ round: prevRoundRef.current, mode: resolvedMode })
      }
      prevRoundRef.current = currentRound
    }
  }, [currentRound])

  // Completion
  useEffect(() => {
    if (status === 'completed') {
      Analytics.ritualCompleted({ mode: resolvedMode })
    }
  }, [status])

  const round = rounds.find((r) => r.id === currentRound)
  const roundContent = currentRound ? ROUND_CONTENT.find((c) => c.roundId === currentRound) : null

  // ── INTRO PHASE (guided only): just background + audio + consent
  if (phase === 'intro') {
    return (
      <View style={styles.screen}>
        <AmbientBackground />
        <RitualIntro onConsentComplete={handleConsentComplete} voiceStartTime={voiceStartTime} />
      </View>
    )
  }

  // ── COMPLETED
  if (status === 'completed') {
    return (
      <SafeAreaView style={styles.screen}>
        <AmbientBackground />
        <CompletionScreen
          mode={resolvedMode}
          onRestart={() => {
            resetRitual()
            startRitual(resolvedMode, durationPreference ?? 'standard')
            Analytics.ritualStarted({ mode: resolvedMode })
            prevRoundRef.current = null
            setRoundReady(false)
          }}
          onClose={() => router.replace('/(main)')}
        />
      </SafeAreaView>
    )
  }

  // ── LOADING
  if (!round || status !== 'in_round') {
    return (
      <SafeAreaView style={styles.screen}>
        <AmbientBackground />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // ── SPECIAL PRE-TIMER (rounds 2, 3)
  if (!roundReady) {
    return (
      <SafeAreaView style={styles.screen}>
        <AmbientBackground />
        <View style={styles.header}>
          <RoundProgressDots currentRound={currentRound} completedRounds={completedRounds} />
          <Text style={styles.roundBadge}>Раунд {round.id} · {round.name}</Text>
        </View>
        {currentRound === 2 ? (
          <RouletteView onReady={() => setRoundReady(true)} />
        ) : (
          <PartnerChoiceView onReady={() => setRoundReady(true)} />
        )}
      </SafeAreaView>
    )
  }

  // ── ACTIVE ROUND
  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <RoundProgressDots currentRound={currentRound} completedRounds={completedRounds} />
          <Text style={styles.roundBadge}>Раунд {round.id} из 5</Text>
        </View>
        <View style={styles.roundInfo}>
          <Text style={styles.roundName}>{round.name}</Text>
          {roundContent && <Text style={styles.moodSetter}>{roundContent.moodSetter}</Text>}
        </View>
        <View style={styles.timerSection}>
          <CircularTimer
            totalSeconds={round.duration}
            remainingSeconds={roundTimeRemaining}
            isPaused={isPaused}
            onPauseToggle={pauseToggle}
            onSkip={advanceRound}
          />
        </View>
        <RulesSection allowed={round.allowed} forbidden={round.forbidden} />
        <Text style={styles.roundDescription}>{round.description}</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.xl,
    gap: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressDotDone: {
    backgroundColor: Colors.textSecondary,
    borderColor: Colors.textSecondary,
  },
  progressDotCurrent: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    width: 24,
  },
  roundBadge: {
    ...Typography.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  roundInfo: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  roundName: {
    ...Typography.h2,
    textAlign: 'center',
  },
  moodSetter: {
    ...Typography.body,
    color: Colors.accent,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  timerSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  rulesContainer: { gap: Spacing.md },
  rulesGroup: { gap: Spacing.sm },
  rulesGroupLabel: { ...Typography.caption, letterSpacing: 0.5 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipAllowed: { borderColor: 'rgba(100, 220, 120, 0.4)', backgroundColor: 'rgba(100, 220, 120, 0.08)' },
  chipForbidden: { borderColor: 'rgba(210, 46, 136, 0.3)', backgroundColor: 'rgba(210, 46, 136, 0.06)' },
  chipTextAllowed: { ...Typography.caption, color: 'rgba(100, 220, 120, 0.9)' },
  chipTextForbidden: { ...Typography.caption, color: 'rgba(210, 46, 136, 0.8)' },
  roundDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  specialContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  specialTitle: { ...Typography.h1, textAlign: 'center' },
  specialSubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  rouletteBox: {
    width: 220,
    height: 220,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rouletteSpinning: { ...Typography.h2, color: Colors.textSecondary },
  rouletteResult: { ...Typography.h2, color: Colors.accent, textAlign: 'center', paddingHorizontal: Spacing.lg },
  choiceRow: { flexDirection: 'row', gap: Spacing.lg },
  choiceCard: {
    width: 130,
    height: 130,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  choiceCardSelected: { borderColor: Colors.accent, backgroundColor: 'rgba(210, 46, 136, 0.08)' },
  choiceEmoji: { fontSize: 36 },
  choiceLabel: { ...Typography.h3, color: Colors.textSecondary },
  choiceLabelSelected: { color: Colors.accent },
  specialButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    minWidth: 180,
    alignItems: 'center',
  },
  specialButtonDisabled: { opacity: 0.4 },
  specialButtonText: { ...Typography.h3, color: Colors.text },
  completionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  completionEmoji: { fontSize: 64, marginBottom: Spacing.md },
  completionTitle: { ...Typography.h1, textAlign: 'center' },
  completionBody: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  completionActions: { gap: Spacing.md, width: '100%', marginTop: Spacing.md },
  restartButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  restartButtonText: { ...Typography.h3, color: Colors.text },
  closeButton: { paddingVertical: Spacing.md, alignItems: 'center' },
  closeButtonText: { ...Typography.body, color: Colors.textSecondary },
})
