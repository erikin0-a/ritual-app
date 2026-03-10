import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, ScrollView, StyleSheet, Text, View, type AppStateStatus } from 'react-native'
import { Audio } from 'expo-av'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated'
import { Svg, Defs, RadialGradient, Stop, Circle } from 'react-native-svg'
import { BorderRadius, Colors, Fonts, SemanticColors, Shadows, Spacing, Typography } from '@/constants/theme'
import { FINAL_MESSAGE, ROUND_CONTENT } from '@/constants/ritual-content'
import {
  GUIDED_CONSENT_SUCCESS_CUE,
  GUIDED_ROUND_SCENES,
  GUIDED_TRANSITION_CUES,
} from '@/constants/guided-session'
import { ScreenContainer } from '@/components/common/ScreenContainer'
import { Card } from '@/components/ui/Card'
import { CircularTimer } from '@/components/ritual/CircularTimer'
import { RitualCompletionSurface } from '@/components/ritual/RitualCompletionSurface'
import { RitualConsentGate } from '@/components/ritual/RitualConsentGate'
import { RitualIntro } from '@/components/ritual/RitualIntro'
import { RitualParticipantChips } from '@/components/ritual/RitualParticipantChips'
import { RitualSetupOverlay } from '@/components/ritual/RitualSetupOverlay'
import { RitualTransitionOverlay } from '@/components/ritual/RitualTransitionOverlay'
import { VoiceSubtitle } from '@/components/ritual/VoiceSubtitle'
import { Analytics } from '@/lib/analytics'
import { useAuthStore } from '@/stores/auth.store'
import { useAudioStore } from '@/stores/audio.store'
import { useRitualStore } from '@/stores/ritual.store'
import type { GuidedBranch, RitualMode, RoundId } from '@/types'

type SessionPhase = 'prelude' | 'consent' | 'transition' | 'setup' | 'roundPlayback' | 'completion' | 'loading'

function DimmingOrb({ pct }: { pct: number }) {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(0.72)

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.92, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.72, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <View style={dimmingStyles.screen}>
      <Animated.View entering={FadeIn.duration(800)} style={dimmingStyles.orbWrap}>
        <Animated.View style={[dimmingStyles.orbAnim, animStyle]}>
          <Svg width={240} height={240}>
            <Defs>
              <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#7D1D3F" stopOpacity={1} />
                <Stop offset="55%" stopColor="#4A0E22" stopOpacity={0.8} />
                <Stop offset="100%" stopColor="#070304" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={120} cy={120} r={120} fill="url(#glow)" />
            <Circle
              cx={120}
              cy={120}
              r={92}
              fill="none"
              stroke="rgba(180,50,85,0.22)"
              strokeWidth={1}
            />
          </Svg>
        </Animated.View>
      </Animated.View>

      <Animated.View entering={FadeIn.duration(1200).delay(600)} style={dimmingStyles.textBlock}>
        <Text style={dimmingStyles.statusText}>DIMMING THE LIGHTS...</Text>
        {pct < 100 && (
          <View style={dimmingStyles.progressTrack}>
            <View style={[dimmingStyles.progressFill, { width: `${Math.max(pct, 6)}%` }]} />
          </View>
        )}
      </Animated.View>
    </View>
  )
}

function RoundProgressDots({
  currentRound,
  completedRounds,
}: {
  currentRound: RoundId | null
  completedRounds: RoundId[]
}) {
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
  const ritualParticipants = useAuthStore((s) => s.ritualParticipants)
  const round = rounds.find((item) => item.id === currentRound)
  const roundContent = currentRound ? ROUND_CONTENT.find((item) => item.roundId === currentRound) : null
  const roundScene = currentRound ? GUIDED_ROUND_SCENES[currentRound] : null

  const currentCue = useAudioStore((s) => s.currentCue)
  const isAudioPlaying = useAudioStore((s) => s.isPlaying)
  const preloadProgress = useAudioStore((s) => s.preloadProgress)
  const guidedLibraryProgress = useAudioStore((s) => s.guidedLibraryProgress)
  const configureAudio = useAudioStore((s) => s.configure)
  const setVoiceParticipants = useAudioStore((s) => s.setVoiceParticipants)
  const setRoundBranch = useAudioStore((s) => s.setRoundBranch)
  const preloadRound = useAudioStore((s) => s.preloadRound)
  const preloadAllGuided = useAudioStore((s) => s.preloadAllGuided)
  const startAudioRound = useAudioStore((s) => s.startRound)
  const pauseAudio = useAudioStore((s) => s.pause)
  const resumeAudio = useAudioStore((s) => s.resume)
  const stopAudio = useAudioStore((s) => s.stop)
  const tickAudio = useAudioStore((s) => s.tick)
  const playCue = useAudioStore((s) => s.playCue)
  const clearSubtitle = useAudioStore((s) => s.clearSubtitle)

  const [phase, setPhase] = useState<SessionPhase>('loading')
  const [warmupReady, setWarmupReady] = useState(resolvedMode !== 'guided')
  const [consentCompleted, setConsentCompleted] = useState(false)
  const [branchByRound, setBranchByRound] = useState<Partial<Record<RoundId, GuidedBranch>>>({})
  const [transitionFrom, setTransitionFrom] = useState<number | 'intro'>('intro')
  const [voiceStartTime, setVoiceStartTime] = useState<number | null>(null)

  const didStartSessionRef = useRef(false)
  const previousRoundRef = useRef<RoundId | null>(null)
  const appStatePauseRef = useRef(false)
  const preludeTimersRef = useRef<ReturnType<typeof globalThis.setTimeout>[]>([])
  const transitionTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)
  const preludeStartTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)
  const preludeMusicRef = useRef<Audio.Sound | null>(null)
  const preludeVoiceRef = useRef<Audio.Sound | null>(null)
  const signalRef = useRef<Audio.Sound | null>(null)
  const isPausedRef = useRef(isPaused)

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  const cleanupPreludeTimers = useCallback(() => {
    preludeTimersRef.current.forEach((timer) => globalThis.clearTimeout(timer))
    preludeTimersRef.current = []
  }, [])

  const cleanupTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current) {
      globalThis.clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }
  }, [])

  const cleanupPreludeAudio = useCallback(() => {
    if (preludeStartTimerRef.current) {
      globalThis.clearTimeout(preludeStartTimerRef.current)
      preludeStartTimerRef.current = null
    }
    preludeMusicRef.current?.unloadAsync().catch(() => null)
    preludeMusicRef.current = null
    preludeVoiceRef.current?.unloadAsync().catch(() => null)
    preludeVoiceRef.current = null
  }, [])

  const playSignal = useCallback(async () => {
    if (resolvedMode !== 'guided') return
    try {
      await signalRef.current?.replayAsync()
    } catch {
      // ignore missing asset playback errors
    }
    if (globalThis.navigator?.vibrate) {
      // no-op on unsupported browsers, but helps web parity when available
      globalThis.navigator.vibrate(30)
    }
    if (Haptics.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null)
    }
  }, [resolvedMode])

  const startSessionRuntime = useCallback(() => {
    if (didStartSessionRef.current) return
    didStartSessionRef.current = true
    startRitual(resolvedMode, durationPreference ?? 'standard')
    Analytics.ritualStarted({ mode: resolvedMode })
    if (resolvedMode === 'guided') {
      Analytics.premiumSessionStarted()
    }
  }, [durationPreference, resolvedMode, startRitual])

  const handleRestart = useCallback(() => {
    cleanupPreludeTimers()
    cleanupTransitionTimer()
    cleanupPreludeAudio()
    resetRitual()
    stopAudio().catch(() => null)
    clearSubtitle()
    setBranchByRound({})
    previousRoundRef.current = null
    didStartSessionRef.current = false
    setTransitionFrom('intro')
    setVoiceStartTime(null)
    setConsentCompleted(false)
    setPhase('loading')
  }, [cleanupPreludeAudio, cleanupPreludeTimers, cleanupTransitionTimer, clearSubtitle, resetRitual, resolvedMode, stopAudio])

  useEffect(() => {
    let mounted = true

    const prepareSignal = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(require('@/assets/audio/chime.mp3'), { volume: 0.8 })
        if (!mounted) {
          await sound.unloadAsync()
          return
        }
        signalRef.current = sound
      } catch {
        signalRef.current = null
      }
    }

    prepareSignal().catch(() => null)

    return () => {
      mounted = false
      signalRef.current?.unloadAsync().catch(() => null)
      cleanupPreludeTimers()
      cleanupTransitionTimer()
      cleanupPreludeAudio()
      stopAudio().catch(() => null)
      resetRitual()
    }
  }, [cleanupPreludeAudio, cleanupPreludeTimers, cleanupTransitionTimer, resetRitual, stopAudio])

  useEffect(() => {
    if (resolvedMode !== 'guided') return

    let mounted = true
    setWarmupReady(false)

    const warmup = async () => {
      try {
        await configureAudio()
        setVoiceParticipants(ritualParticipants)
        await Promise.all([preloadAllGuided(), preloadRound(1)])
      } finally {
        if (mounted) {
          setWarmupReady(true)
        }
      }
    }

    warmup().catch(() => {
      if (mounted) {
        setWarmupReady(true)
      }
    })

    return () => {
      mounted = false
    }
  }, [configureAudio, preloadAllGuided, preloadRound, resolvedMode, ritualParticipants, setVoiceParticipants])

  useEffect(() => {
    if (resolvedMode !== 'guided') return
    if (phase !== 'loading' || !warmupReady) return
    setPhase('prelude')
  }, [phase, resolvedMode, warmupReady])

  useEffect(() => {
    if (resolvedMode !== 'guided' || phase !== 'prelude') return

    cleanupPreludeTimers()
    setVoiceStartTime(null)
    cleanupPreludeAudio()
    let cancelled = false

    const startPreludeAudio = async () => {
      try {
        const { sound: music } = await Audio.Sound.createAsync(
          require('@/assets/audio/ritual_music.mp3'),
          { isLooping: true, volume: 0 },
        )

        if (cancelled) {
          await music.unloadAsync().catch(() => null)
          return
        }
        preludeMusicRef.current = music
        await music.playAsync()

        for (let volume = 0; volume <= 0.4; volume += 0.02) {
          if (cancelled) return
          await globalThis.Promise.resolve()
          await new Promise((resolve) => globalThis.setTimeout(resolve, 120))
          await music.setVolumeAsync(volume).catch(() => null)
        }

        preludeStartTimerRef.current = globalThis.setTimeout(async () => {
          if (cancelled) return
          try {
            const { sound: intro } = await Audio.Sound.createAsync(
              require('@/assets/audio/ritual_intro.mp3'),
              { volume: 1.0 },
            )
            if (cancelled) {
              await intro.unloadAsync().catch(() => null)
              return
            }
            preludeVoiceRef.current = intro
            await intro.playAsync()
            setVoiceStartTime(Date.now())
          } catch {
            // keep visual intro even if voice asset fails
          }
        }, 1000)
      } catch {
        // keep visual intro even if music asset fails
      }
    }

    startPreludeAudio().catch(() => null)

    return () => {
      cancelled = true
      cleanupPreludeAudio()
      cleanupPreludeTimers()
    }
  }, [cleanupPreludeAudio, cleanupPreludeTimers, phase, resolvedMode])

  useEffect(() => {
    if (resolvedMode !== 'free' || phase !== 'loading') return
    startSessionRuntime()
  }, [phase, resolvedMode, startSessionRuntime])

  useEffect(() => {
    if (status === 'completed') {
      Analytics.ritualCompleted({ mode: resolvedMode })
      if (resolvedMode === 'guided') {
        Analytics.premiumSessionCompleted()
      }
      setPhase('completion')
    }
  }, [resolvedMode, status])

  useEffect(() => {
    if (status !== 'in_round' || !currentRound || !didStartSessionRef.current) return

    const previousRound = previousRoundRef.current
    if (previousRound !== currentRound) {
      if (previousRound !== null) {
        Analytics.ritualRoundCompleted({ round: previousRound, mode: resolvedMode })
      }
      setTransitionFrom(previousRound ?? 'intro')
      setPhase('transition')
      previousRoundRef.current = currentRound
    }
  }, [currentRound, resolvedMode, status])

  useEffect(() => {
    if (phase !== 'transition' || !currentRound || !roundScene) return

    cleanupTransitionTimer()
    playSignal().catch(() => null)

    const cueKey = transitionFrom === 'intro' ? 'intro-1' : `${transitionFrom}-${currentRound}`
    const cue = GUIDED_TRANSITION_CUES[cueKey]
    if (resolvedMode === 'guided' && cue) {
      playCue({
        voiceKey: cue.voiceKey,
        subtitle: cue.subtitle,
        highlightedParticipants: cue.highlightedParticipants,
      }).catch(() => null)
    }

    transitionTimerRef.current = globalThis.setTimeout(() => {
      if (roundScene.setupKind === 'none') {
        setPhase('roundPlayback')
      } else {
        setPhase('setup')
      }
    }, cue?.delayMs ?? 3200)

    return () => cleanupTransitionTimer()
  }, [cleanupTransitionTimer, currentRound, phase, playCue, playSignal, resolvedMode, roundScene, transitionFrom])

  useEffect(() => {
    if (phase !== 'roundPlayback' || status !== 'in_round' || !currentRound) return

    if (resolvedMode === 'guided') {
      startAudioRound(currentRound).catch(() => null)
      const nextRound = (currentRound + 1) as RoundId
      if (nextRound <= 5) {
        preloadRound(nextRound).catch(() => null)
      }
    }
  }, [currentRound, phase, preloadRound, resolvedMode, startAudioRound, status])

  useEffect(() => {
    if (resolvedMode !== 'guided') return
    if (isPaused) {
      pauseAudio().catch(() => null)
    } else if (isAudioPlaying && phase === 'roundPlayback') {
      resumeAudio().catch(() => null)
    }
  }, [isAudioPlaying, isPaused, pauseAudio, phase, resolvedMode, resumeAudio])

  useEffect(() => {
    if (resolvedMode !== 'guided' || phase !== 'roundPlayback' || !round) return
    const elapsed = round.duration - roundTimeRemaining
    tickAudio(elapsed).catch(() => null)
  }, [phase, resolvedMode, round, roundTimeRemaining, tickAudio])

  useEffect(() => {
    if (phase !== 'roundPlayback' || status !== 'in_round') return
    const interval = globalThis.setInterval(tickTimer, 1000)
    return () => globalThis.clearInterval(interval)
  }, [phase, status, tickTimer])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (phase !== 'roundPlayback' || status !== 'in_round') return

      if ((nextState === 'background' || nextState === 'inactive') && !isPausedRef.current) {
        appStatePauseRef.current = true
        pauseToggle()
      }

      if (nextState === 'active' && appStatePauseRef.current) {
        appStatePauseRef.current = false
        pauseToggle()
      }
    })

    return () => subscription.remove()
  }, [pauseToggle, phase, status])

  const handleConsentComplete = useCallback(() => {
    setConsentCompleted(true)
  }, [])

  useEffect(() => {
    if (!consentCompleted || !warmupReady) return
    cleanupPreludeAudio()

    playCue({
      voiceKey: GUIDED_CONSENT_SUCCESS_CUE.voiceKey,
      subtitle: GUIDED_CONSENT_SUCCESS_CUE.subtitle,
      highlightedParticipants: GUIDED_CONSENT_SUCCESS_CUE.highlightedParticipants,
    }).catch(() => null)

    if (Haptics.notificationAsync) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null)
    }

    const timer = globalThis.setTimeout(() => {
      setConsentCompleted(false)
      startSessionRuntime()
    }, GUIDED_CONSENT_SUCCESS_CUE.delayMs)
    preludeTimersRef.current.push(timer)
  }, [cleanupPreludeAudio, consentCompleted, playCue, startSessionRuntime, warmupReady])

  const handleSetupConfirm = useCallback(
    (branch: GuidedBranch) => {
      if (!currentRound) return
      setBranchByRound((state) => ({ ...state, [currentRound]: branch }))
      setRoundBranch(currentRound, branch)
      playSignal().catch(() => null)
      setPhase('roundPlayback')
    },
    [currentRound, playSignal, setRoundBranch],
  )

  const highlightedParticipants = currentCue?.highlightedParticipants ?? []
  const preloadBlend = Math.round(((guidedLibraryProgress + (preloadProgress[1] ?? 0)) / 2) * 100)
  const activeBranch = currentRound ? branchByRound[currentRound] : undefined
  const activeLeaderName =
    activeBranch === 'a' ? ritualParticipants.p1.name : activeBranch === 'b' ? ritualParticipants.p2.name : null

  const headerContent = (
    <View style={styles.header}>
      <RoundProgressDots currentRound={currentRound} completedRounds={completedRounds} />
      <Text style={styles.headerLabel}>
        {resolvedMode === 'guided' ? 'Guided Ritual' : 'Свободный режим'}
      </Text>
      {currentRound ? <Text style={styles.headerRound}>Раунд {currentRound} из 5</Text> : null}
    </View>
  )

  if (phase === 'prelude') {
    return (
      <View style={styles.darkScreen}>
        <RitualIntro onConsentComplete={handleConsentComplete} voiceStartTime={voiceStartTime} />
      </View>
    )
  }

  if (phase === 'loading' && resolvedMode === 'guided') {
    return (
      <View style={styles.darkScreen}>
        <DimmingOrb pct={preloadBlend} />
      </View>
    )
  }

  if (phase === 'consent') {
    return (
      <View style={styles.darkScreen}>
        <Animated.View entering={FadeIn.duration(700)} exiting={FadeOut.duration(400)} style={styles.consentWrap}>
          <RitualConsentGate participants={ritualParticipants} onComplete={handleConsentComplete} />
        </Animated.View>
        <VoiceSubtitle cue={currentCue} participants={ritualParticipants} />
      </View>
    )
  }

  if (phase === 'completion') {
    return (
      <ScreenContainer background="ritual" safe={false} style={styles.screen}>
        <View style={styles.fullscreenCenter}>
          <RitualCompletionSurface
            title={FINAL_MESSAGE.title}
            body={FINAL_MESSAGE.body}
            onRestart={handleRestart}
            onClose={() => router.replace('/(main)')}
          />
        </View>
      </ScreenContainer>
    )
  }

  if (!round || !roundScene || status === 'idle') {
    return (
      <ScreenContainer background="ritual" safe={false}>
        <View style={styles.fullscreenCenter}>
          <Text style={styles.loadingText}>Подготавливаем session...</Text>
        </View>
      </ScreenContainer>
    )
  }

  if (phase === 'transition') {
    return (
      <ScreenContainer background="ritual" safe={false} style={styles.screen}>
        <View style={styles.screenPad}>
          {headerContent}
          <View style={styles.fullscreenCenter}>
            <RitualTransitionOverlay
              kicker={roundScene.title}
              title={roundScene.transitionTitle}
              body={roundScene.transitionBody}
              allowed={round.allowed}
              forbidden={round.forbidden}
              footnote={roundScene.ruleFootnote}
            />
          </View>
        </View>
        <VoiceSubtitle cue={currentCue} participants={ritualParticipants} />
      </ScreenContainer>
    )
  }

  if (phase === 'setup' && (roundScene.setupKind === 'roulette' || roundScene.setupKind === 'starter-choice')) {
    return (
      <ScreenContainer background="ritual" safe={false} style={styles.screen}>
        <View style={styles.screenPad}>
          {headerContent}
          <View style={styles.fullscreenCenter}>
            <RitualSetupOverlay
              kind={roundScene.setupKind}
              title={roundScene.setupTitle ?? roundScene.transitionTitle}
              body={roundScene.setupBody ?? roundScene.transitionBody}
              participants={ritualParticipants}
              onConfirm={handleSetupConfirm}
            />
          </View>
        </View>
        <VoiceSubtitle cue={currentCue} participants={ritualParticipants} />
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer background="ritual" safe={false} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false}>
        {headerContent}

        <Card variant="raised" style={styles.roundHero}>
          <Text style={styles.roundEyebrow}>{roundScene.title}</Text>
          <Text style={styles.roundTitle}>{roundScene.titleShort}</Text>
          <Text style={styles.roundBody}>{roundContent?.extendedDescription ?? round.description}</Text>
          <Text style={styles.roundMood}>{roundContent?.moodSetter ?? roundScene.atmosphere}</Text>
        </Card>

        <Card variant="subtle" style={styles.chromeCard}>
          <RitualParticipantChips participants={ritualParticipants} highlighted={highlightedParticipants} />
          {activeLeaderName ? <Text style={styles.activeLeader}>Сейчас ведёт: {activeLeaderName}</Text> : null}
        </Card>

        <View style={styles.timerWrap}>
          <CircularTimer
            totalSeconds={round.duration}
            remainingSeconds={roundTimeRemaining}
            isPaused={isPaused}
            onPauseToggle={pauseToggle}
            onSkip={advanceRound}
          />
        </View>

        <Card variant="raised" style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>{roundScene.ruleHeadline}</Text>
          <Text style={styles.rulesBody}>{roundScene.ruleFootnote}</Text>
          <View style={styles.ruleGroup}>
            <Text style={styles.ruleGroupLabel}>Разрешено</Text>
            <View style={styles.pillRow}>
              {round.allowed.map((item) => (
                <View key={item} style={[styles.pill, styles.allowedPill]}>
                  <Text style={[styles.pillText, styles.allowedText]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.ruleGroup}>
            <Text style={styles.ruleGroupLabel}>Запрещено</Text>
            <View style={styles.pillRow}>
              {round.forbidden.map((item) => (
                <View key={item} style={[styles.pill, styles.forbiddenPill]}>
                  <Text style={[styles.pillText, styles.forbiddenText]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        <Card variant="subtle" style={styles.noteCard}>
          <Text style={styles.noteTitle}>Ритм раунда</Text>
          <Text style={styles.noteBody}>{roundScene.timerHint}</Text>
          <Text style={styles.noteBody}>{roundScene.atmosphere}</Text>
        </Card>
      </ScrollView>

      {resolvedMode === 'guided' && <VoiceSubtitle cue={currentCue} participants={ritualParticipants} />}
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenPad: {
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 160,
    gap: Spacing.lg,
  },
  fullscreenCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: SemanticColors.hairline,
  },
  progressDotDone: {
    backgroundColor: Colors.textMuted,
    borderColor: Colors.textMuted,
  },
  progressDotCurrent: {
    width: 28,
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  headerLabel: {
    ...Typography.label,
    color: Colors.accent,
  },
  headerRound: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  heroCard: {
    width: '100%',
    maxWidth: 640,
    gap: Spacing.md,
    ...Shadows.glow,
  },
  eyebrow: {
    ...Typography.label,
    color: Colors.accent,
    textAlign: 'center',
  },
  heroTitle: {
    ...Typography.display,
    fontSize: 34,
    textAlign: 'center',
  },
  heroBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  preloadTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  preloadFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
  },
  preloadMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  roundHero: {
    gap: Spacing.sm,
  },
  roundEyebrow: {
    ...Typography.label,
    color: Colors.accent,
  },
  roundTitle: {
    ...Typography.h1,
  },
  roundBody: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  roundMood: {
    ...Typography.caption,
    color: Colors.secondary,
  },
  chromeCard: {
    gap: Spacing.sm,
  },
  activeLeader: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  timerWrap: {
    alignItems: 'center',
  },
  rulesCard: {
    gap: Spacing.md,
  },
  rulesTitle: {
    ...Typography.h3,
  },
  rulesBody: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  ruleGroup: {
    gap: Spacing.sm,
  },
  ruleGroupLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  allowedPill: {
    backgroundColor: 'rgba(141, 216, 176, 0.14)',
    borderColor: 'rgba(141, 216, 176, 0.22)',
  },
  forbiddenPill: {
    backgroundColor: SemanticColors.surfaceAccent,
    borderColor: 'rgba(240, 106, 166, 0.22)',
  },
  pillText: {
    ...Typography.caption,
  },
  allowedText: {
    color: Colors.success,
  },
  forbiddenText: {
    color: Colors.accent,
  },
  noteCard: {
    gap: Spacing.sm,
    marginBottom: 24,
  },
  noteTitle: {
    ...Typography.bodyStrong,
  },
  noteBody: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  darkScreen: {
    flex: 1,
    backgroundColor: Colors.backgroundCanvas,
  },
  consentWrap: {
    flex: 1,
  },
})

const dimmingStyles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxl,
    paddingBottom: 60,
  },
  orbWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbAnim: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusText: {
    fontFamily: Fonts.display,
    fontSize: 11,
    fontWeight: '300' as const,
    color: 'rgba(245, 240, 242, 0.38)',
    letterSpacing: 3.5,
    textTransform: 'uppercase' as const,
  },
  progressTrack: {
    width: 120,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 999,
  },
})
