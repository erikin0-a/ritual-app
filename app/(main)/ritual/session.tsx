import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, StyleSheet, Text, View, type AppStateStatus } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
import { BorderRadius, Colors, Fonts, SemanticColors, Spacing, Typography } from '@/constants/theme'
import { FINAL_MESSAGE } from '@/constants/ritual-content'
import {
  GUIDED_CONSENT_SUCCESS_CUE,
  GUIDED_ROUND_SCENES,
  GUIDED_TRANSITION_CUES,
} from '@/constants/guided-session'
import { LiquidBackground } from '@/components/ui/LiquidBackground'
import { MeditationTimer } from '@/components/ritual/MeditationTimer'
import { RitualCompletionSurface } from '@/components/ritual/RitualCompletionSurface'
import { RitualIntro } from '@/components/ritual/RitualIntro'
import { RitualParticipantChips } from '@/components/ritual/RitualParticipantChips'
import { RitualSetupOverlay } from '@/components/ritual/RitualSetupOverlay'
import { VoiceSubtitle } from '@/components/ritual/VoiceSubtitle'
import { Analytics } from '@/lib/analytics'
import { useAuthStore } from '@/stores/auth.store'
import { useAudioStore } from '@/stores/audio.store'
import { useRitualStore } from '@/stores/ritual.store'
import type { GuidedBranch, RitualMode, RoundId } from '@/types'

type SessionPhase = 'prelude' | 'transition' | 'setup' | 'roundPlayback' | 'completion' | 'loading'

const DIMMING_PHRASES = [
  'Приглушаем свет...',
  'Настраиваем атмосферу...',
  'Готовим ваш ритуал...',
  'Почти готово...',
]

function DimmingOrb({ pct }: { pct: number }) {
  const [phraseIdx, setPhraseIdx] = useState(0)

  const titleOpacity = useSharedValue(0.6)
  const phraseOpacity = useSharedValue(1)
  const visualPct = useSharedValue(0)

  // Smart progress: race to 60% in 2s, then slow to 90% over 4s, then wait for real pct to hit 100
  useEffect(() => {
    // Phase 1: fast to 60%
    visualPct.value = withTiming(60, { duration: 2000, easing: Easing.out(Easing.quad) })
    const phase2 = globalThis.setTimeout(() => {
      // Phase 2: slow to 90%
      visualPct.value = withTiming(90, { duration: 4000, easing: Easing.out(Easing.cubic) })
    }, 2000)
    return () => globalThis.clearTimeout(phase2)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Phase 3: when real pct reaches 100, animate visual to 100
  useEffect(() => {
    if (pct >= 100) {
      visualPct.value = withTiming(100, { duration: 600, easing: Easing.out(Easing.quad) })
    }
  }, [pct]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Breath pulse on title — spec: 0.6↔1.0, 3s total cycle
    titleOpacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )

    // Phrase cycling — plain JS timer, no runOnJS needed
    const interval = globalThis.setInterval(() => {
      phraseOpacity.value = withTiming(0, { duration: 350 })
      globalThis.setTimeout(() => {
        setPhraseIdx(i => (i + 1) % DIMMING_PHRASES.length)
        phraseOpacity.value = withTiming(1, { duration: 500 })
      }, 350)
    }, 2200)
    return () => globalThis.clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }))
  const phraseStyle = useAnimatedStyle(() => ({ opacity: phraseOpacity.value }))
  const barStyle = useAnimatedStyle(() => ({ width: `${visualPct.value}%` as unknown as number }))

  return (
    <View style={dimmingStyles.screen}>
      <LiquidBackground intensity={0.6} />

      <Animated.View entering={FadeIn.duration(900).delay(200)} style={dimmingStyles.centerBlock}>
        <Animated.Text style={[dimmingStyles.titleText, titleStyle]}>Ритуал</Animated.Text>
        <Animated.Text style={[dimmingStyles.phraseText, phraseStyle]}>
          {DIMMING_PHRASES[phraseIdx]}
        </Animated.Text>
      </Animated.View>

      <Animated.View entering={FadeIn.duration(600).delay(700)} style={dimmingStyles.progressWrap}>
        <View style={dimmingStyles.progressTrack}>
          <Animated.View style={[dimmingStyles.progressFill, barStyle]} />
        </View>
      </Animated.View>
    </View>
  )
}

function RoundEdgeFlash() {
  const opacity = useSharedValue(0)

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(0.4, { duration: 200 }),
      withTiming(0, { duration: 400 }),
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return <Animated.View style={[styles.roundEdgeFlash, animStyle]} pointerEvents="none" />
}

function ActiveDot() {
  const scale = useSharedValue(1)
  const shadowOpacity = useSharedValue(0.55)

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
    shadowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: shadowOpacity.value,
  }))

  return <Animated.View style={[styles.progressDot, styles.progressDotCurrent, animStyle]} />
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
      {([1, 2, 3, 4, 5] as RoundId[]).map((id) => {
        if (currentRound === id) return <ActiveDot key={id} />
        return (
          <View
            key={id}
            style={[
              styles.progressDot,
              completedRounds.includes(id) && styles.progressDotDone,
            ]}
          />
        )
      })}
    </View>
  )
}

export default function RitualSessionScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
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
    resetRitual,
  } = useRitualStore()

  const durationPreference = useAuthStore((s) => s.durationPreference)
  const ritualParticipants = useAuthStore((s) => s.ritualParticipants)
  const round = rounds.find((item) => item.id === currentRound)
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
  const [edgeFlashKey, setEdgeFlashKey] = useState(0)

  const didStartSessionRef = useRef(false)
  const previousRoundRef = useRef<RoundId | null>(null)
  const appStatePauseRef = useRef(false)
  const preludeTimersRef = useRef<ReturnType<typeof globalThis.setTimeout>[]>([])
  const transitionTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)
  const preludeStartTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)
  const preludeMusicRef = useRef<Audio.Sound | null>(null)
  const preludeVoiceRef = useRef<Audio.Sound | null>(null)
  const freeMusicRef = useRef<Audio.Sound | null>(null)
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

  const cleanupFreeMusic = useCallback(() => {
    freeMusicRef.current?.unloadAsync().catch(() => null)
    freeMusicRef.current = null
  }, [])

  const handleRestart = useCallback(() => {
    cleanupPreludeTimers()
    cleanupTransitionTimer()
    cleanupPreludeAudio()
    cleanupFreeMusic()
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
  }, [cleanupFreeMusic, cleanupPreludeAudio, cleanupPreludeTimers, cleanupTransitionTimer, clearSubtitle, resetRitual, stopAudio])

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
      cleanupFreeMusic()
      stopAudio().catch(() => null)
      resetRitual()
    }
  }, [cleanupFreeMusic, cleanupPreludeAudio, cleanupPreludeTimers, cleanupTransitionTimer, resetRitual, stopAudio])

  useEffect(() => {
    if (resolvedMode !== 'guided') return

    let mounted = true
    setWarmupReady(false)

    const warmup = async () => {
      try {
        await configureAudio()
        setVoiceParticipants(ritualParticipants)
        // 12s safety timeout — if any network fetch hangs (e.g. on iOS simulator),
        // we still enter the session rather than freezing forever.
        const timeout = new Promise<void>((resolve) => globalThis.setTimeout(resolve, 12_000))
        await Promise.race([Promise.all([preloadAllGuided(), preloadRound(1)]), timeout])
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
      cleanupFreeMusic()
      setPhase('completion')
    }
  }, [cleanupFreeMusic, resolvedMode, status])

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

    setEdgeFlashKey((k) => k + 1)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null)

    if (resolvedMode === 'guided') {
      startAudioRound(currentRound).catch(() => null)
      const nextRound = (currentRound + 1) as RoundId
      if (nextRound <= 5) {
        preloadRound(nextRound).catch(() => null)
      }
    } else if (!freeMusicRef.current) {
      // Free mode: start looping background music on first round
      Audio.Sound.createAsync(
        require('@/assets/audio/ritual_music.mp3'),
        { shouldPlay: true, isLooping: true, volume: 0.35 },
      )
        .then(({ sound }) => {
          freeMusicRef.current = sound
        })
        .catch(() => null)
    }
  }, [currentRound, phase, preloadRound, resolvedMode, startAudioRound, status])

  useEffect(() => {
    if (resolvedMode === 'guided') {
      if (isPaused) {
        pauseAudio().catch(() => null)
      } else if (isAudioPlaying && phase === 'roundPlayback') {
        resumeAudio().catch(() => null)
      }
    } else {
      // Free mode: pause/resume background music
      if (isPaused) {
        freeMusicRef.current?.pauseAsync().catch(() => null)
      } else if (phase === 'roundPlayback') {
        freeMusicRef.current?.playAsync().catch(() => null)
      }
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

    // Short delay: voiceover has already finished by this point (RitualIntro
    // waits for it), so we only need a brief window for the haptic + consent
    // cue to register before the session transitions forward.
    const timer = globalThis.setTimeout(() => {
      setConsentCompleted(false)
      startSessionRuntime()
    }, 800)
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
  // Background intensity: loading=0.25, round-based=0.18→1.0, default=0.4
  const roundIntensity = phase === 'loading' ? 0.25 : (currentRound ? 0.18 + ((currentRound - 1) / 4) * 0.82 : 0.4)

  // ─── Single render tree — overlay architecture ─────────────────────────────
  return (
    <View style={styles.screen}>
      {/* Persistent background — always visible */}
      <LiquidBackground intensity={roundIntensity} />

      {/* Header — visible in all phases except loading */}
      {phase !== 'loading' && (
        <View style={[styles.headerAbsolute, { paddingTop: insets.top + 12 }]}>
          <View style={styles.header}>
            <RoundProgressDots currentRound={currentRound} completedRounds={completedRounds} />
            {currentRound ? (
              <Text style={styles.headerLabel}>РАУНД {currentRound}</Text>
            ) : null}
            {roundScene ? (
              <Text style={styles.headerRound}>{roundScene.titleShort}</Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Timer — visible during roundPlayback */}
      {phase === 'roundPlayback' && round && (
        <View style={styles.timerAbsolute}>
          <MeditationTimer
            totalSeconds={round.duration}
            remainingSeconds={roundTimeRemaining}
            isPaused={isPaused}
            roundIndex={currentRound ?? 1}
            onPauseToggle={pauseToggle}
          />
          {roundScene?.timerHint ? (
            <Text style={styles.roundHint}>{roundScene.timerHint}</Text>
          ) : null}
        </View>
      )}

      {/* Participant chips — visible during roundPlayback */}
      {phase === 'roundPlayback' && (
        <View style={[styles.chipsAbsolute, { paddingBottom: insets.bottom + 16 }]}>
          <RitualParticipantChips participants={ritualParticipants} highlighted={highlightedParticipants} />
          {activeLeaderName ? (
            <Text style={styles.activeLeader}>
              Сейчас ведёт:{' '}
              <Text style={styles.activeLeaderName}>{activeLeaderName}</Text>
            </Text>
          ) : null}
        </View>
      )}

      {/* Voice subtitle — visible during guided mode */}
      {resolvedMode === 'guided' && <VoiceSubtitle cue={currentCue} participants={ritualParticipants} />}

      {/* ── Overlay: Loading / DimmingOrb ── */}
      {phase === 'loading' && resolvedMode === 'guided' && (
        <Animated.View entering={FadeIn.duration(600)} exiting={FadeOut.duration(600)} style={styles.overlayFill}>
          <DimmingOrb pct={preloadBlend} />
        </Animated.View>
      )}

      {/* ── Overlay: Prelude / RitualIntro ── */}
      {phase === 'prelude' && (
        <Animated.View entering={FadeIn.duration(800)} exiting={FadeOut.duration(800)} style={styles.overlayFill}>
          <RitualIntro participants={ritualParticipants} onConsentComplete={handleConsentComplete} voiceStartTime={voiceStartTime} />
        </Animated.View>
      )}

      {/* ── Overlay: Transition ── */}
      {phase === 'transition' && roundScene && (
        <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(400)} style={styles.transitionOverlay}>
          <Text style={styles.transitionKicker}>РАУНД {currentRound}</Text>
          <Text style={styles.transitionTitle}>{roundScene.transitionTitle}</Text>
          {roundScene.transitionBody ? (
            <Text style={styles.transitionBody}>{roundScene.transitionBody}</Text>
          ) : null}
        </Animated.View>
      )}

      {/* ── Overlay: Setup (roulette / starter-choice) ── */}
      {phase === 'setup' && roundScene && (roundScene.setupKind === 'roulette' || roundScene.setupKind === 'starter-choice') && (
        <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(400)} style={styles.overlayFill}>
          <View style={styles.setupOverlayContent}>
            <RitualSetupOverlay
              kind={roundScene.setupKind}
              title={roundScene.setupTitle ?? roundScene.transitionTitle}
              body={roundScene.setupBody ?? roundScene.transitionBody}
              participants={ritualParticipants}
              onConfirm={handleSetupConfirm}
            />
          </View>
        </Animated.View>
      )}

      {/* ── Overlay: Completion ── */}
      {phase === 'completion' && (
        <Animated.View entering={FadeIn.duration(800)} exiting={FadeOut.duration(600)} style={styles.overlayFill}>
          <RitualCompletionSurface
            title={FINAL_MESSAGE.title}
            body={FINAL_MESSAGE.body}
            onRestart={handleRestart}
            onClose={() => router.replace('/(main)')}
          />
        </Animated.View>
      )}

      {/* Edge flash on round change */}
      {edgeFlashKey > 0 && <RoundEdgeFlash key={edgeFlashKey} />}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  // ─── Absolute-positioned layers ─────────────────────────────────────────────
  headerAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
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
    shadowColor: Colors.accent,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  headerLabel: {
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.30)',
    fontWeight: '600',
  },
  headerRound: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: 'rgba(255,255,255,0.80)',
    letterSpacing: 0.1,
  },
  timerAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  roundHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.28)',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '300',
    marginTop: 12,
    letterSpacing: 0.2,
  },
  chipsAbsolute: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    zIndex: 10,
  },
  activeLeader: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  activeLeaderName: {
    color: Colors.text,
    fontWeight: '600',
  },
  // ─── Overlays ───────────────────────────────────────────────────────────────
  overlayFill: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
  },
  setupOverlayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  // ─── Transition overlay (inline) ────────────────────────────────────────────
  transitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    paddingHorizontal: Spacing.xl,
  },
  transitionKicker: {
    fontSize: 10,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 12,
  },
  transitionTitle: {
    fontFamily: Fonts.display,
    fontSize: 42,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  transitionBody: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 16,
    maxWidth: 280,
  },
  roundEdgeFlash: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: 'rgba(194,24,91,0.5)',
    borderRadius: 0,
    zIndex: 70,
    pointerEvents: 'none' as const,
  },
})

const dimmingStyles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBlock: {
    alignItems: 'center',
    gap: 18,
  },
  titleText: {
    fontFamily: Fonts.displayItalic,
    fontSize: 48,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  phraseText: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center' as const,
  },
  progressWrap: {
    position: 'absolute',
    bottom: 56,
    left: 48,
    right: 48,
  },
  progressTrack: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 999,
    opacity: 0.7,
  },
})
