import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { Audio } from 'expo-av'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import {
  CHIME_SEC,
  CONSENT_APPEAR_SEC,
  RITUAL_INTRO_TIMELINE,
  type RitualIntroTimelineItem,
} from '@/constants/ritual-intro-timeline'
import { RitualConsentGate } from '@/components/ritual/RitualConsentGate'
import { Colors } from '@/constants/theme'
import type { RitualParticipants } from '@/types'

const INTRO_FONT_FAMILY = Platform.select({ ios: 'System', default: undefined })
const VOICEOVER_DURATION_SEC = 83

// ─── Intro Text ───────────────────────────────────────────────────────────────
function IntroText({ activeItem }: { activeItem: RitualIntroTimelineItem | null }) {
  const [displayedItem, setDisplayedItem] = useState<RitualIntroTimelineItem | null>(null)
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)
  const scaleBase = useSharedValue(0.97)
  const pulseScale = useSharedValue(1)
  const prevItemRef = useRef<RitualIntroTimelineItem | null>(null)
  const pulseTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)

  useEffect(() => {
    if (pulseTimerRef.current) {
      globalThis.clearTimeout(pulseTimerRef.current)
      pulseTimerRef.current = null
    }
    const prev = prevItemRef.current
    prevItemRef.current = activeItem

    if (activeItem !== null && activeItem !== prev) {
      setDisplayedItem(activeItem)
      opacity.value = 0
      translateY.value = 20
      scaleBase.value = 0.97
      pulseScale.value = 1

      opacity.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) })
      translateY.value = withTiming(0, { duration: 950, easing: Easing.out(Easing.cubic) })
      scaleBase.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) })

      pulseTimerRef.current = globalThis.setTimeout(() => {
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.013, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
            withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          false,
        )
      }, 1050)
    } else if (activeItem === null && prev !== null) {
      pulseScale.value = withTiming(1, { duration: 250 })
      opacity.value = withTiming(0, { duration: 750, easing: Easing.in(Easing.ease) })
      translateY.value = withTiming(-32, { duration: 750, easing: Easing.in(Easing.cubic) })
      scaleBase.value = withTiming(1.016, { duration: 750 })
    }
    return () => { if (pulseTimerRef.current) globalThis.clearTimeout(pulseTimerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem])

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scaleBase.value * pulseScale.value }],
  }))

  if (!displayedItem) return null
  return (
    <View style={styles.textContainer} pointerEvents="none">
      <Animated.Text style={[
        styles.introText,
        displayedItem.style === 'large' && styles.introTextLarge,
        displayedItem.style === 'italic' && styles.introTextItalic,
        displayedItem.style === 'accent' && styles.introTextAccent,
        animStyle,
      ]}>
        {displayedItem.text}
      </Animated.Text>
    </View>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface RitualIntroProps {
  participants: RitualParticipants
  onConsentComplete: () => void
  voiceStartTime: number | null
}

export function RitualIntro({ participants, onConsentComplete, voiceStartTime }: RitualIntroProps) {
  const [voiceSecond, setVoiceSecond] = useState(0)
  const [showCircles, setShowCircles] = useState(false)

  const voiceSecondRef = useRef(0)
  const screenOpacity = useSharedValue(0)
  const completeTriggeredRef = useRef(false)
  const chimePlayedRef = useRef(false)
  const chimeSoundRef = useRef<Audio.Sound | null>(null)
  const waitTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)

  useEffect(() => {
    screenOpacity.value = withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Audio chime setup
  useEffect(() => {
    let isMounted = true
    const loadChime = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('@/assets/audio/chime.mp3'),
          { volume: 0.75 },
        )
        if (!isMounted) { await sound.unloadAsync(); return }
        chimeSoundRef.current = sound
      } catch { /* no-op */ }
    }
    loadChime()
    return () => {
      isMounted = false
      chimeSoundRef.current?.unloadAsync()
      if (waitTimerRef.current) globalThis.clearTimeout(waitTimerRef.current)
    }
  }, [])

  // Voice second timer
  useEffect(() => {
    if (!voiceStartTime) return
    const update = () => {
      const s = Math.max(0, (Date.now() - voiceStartTime) / 1000)
      voiceSecondRef.current = s
      setVoiceSecond(s)
    }
    update()
    const timer = globalThis.setInterval(update, 250)
    return () => globalThis.clearInterval(timer)
  }, [voiceStartTime])

  // Show consent circles trigger (voice-driven)
  useEffect(() => {
    if (voiceSecond >= CONSENT_APPEAR_SEC) setShowCircles(true)
  }, [voiceSecond])

  // Fallback: if voice never starts, show consent circles after a fixed wall-clock timeout
  useEffect(() => {
    if (showCircles) return
    const fallbackMs = (CONSENT_APPEAR_SEC + 8) * 1000
    const t = globalThis.setTimeout(() => setShowCircles(true), fallbackMs)
    return () => globalThis.clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Play chime at the right time
  useEffect(() => {
    if (!chimePlayedRef.current && voiceSecond >= CHIME_SEC) {
      chimePlayedRef.current = true
      chimeSoundRef.current?.replayAsync()
    }
  }, [voiceSecond])

  // Called when RitualConsentGate fires onComplete (both held for 1.5s simultaneously)
  const handleConsentDone = useCallback(() => {
    if (completeTriggeredRef.current) return

    const finishIntro = () => {
      completeTriggeredRef.current = true
      screenOpacity.value = withTiming(0, { duration: 700, easing: Easing.in(Easing.ease) }, (done) => {
        if (done) runOnJS(onConsentComplete)()
      })
    }

    // If voice never played (voiceStartTime is null), skip the wait entirely
    if (!voiceStartTime) {
      finishIntro()
      return
    }

    const currentSecond = voiceSecondRef.current
    if (currentSecond >= VOICEOVER_DURATION_SEC) {
      finishIntro()
    } else {
      const remainingMs = (VOICEOVER_DURATION_SEC - currentSecond) * 1000
      waitTimerRef.current = globalThis.setTimeout(finishIntro, Math.max(0, remainingMs))
    }
  }, [onConsentComplete, screenOpacity, voiceStartTime])

  const activeItem = useMemo(() => {
    if (!voiceStartTime || showCircles) return null
    return RITUAL_INTRO_TIMELINE.find(i => voiceSecond >= i.startSec && voiceSecond < i.endSec) ?? null
  }, [voiceSecond, voiceStartTime, showCircles])

  const fadeStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }))

  return (
    <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
      {!showCircles && <IntroText activeItem={activeItem} />}
      {showCircles && (
        <RitualConsentGate participants={participants} onComplete={handleConsentDone} />
      )}
    </Animated.View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  introText: {
    fontFamily: INTRO_FONT_FAMILY,
    fontWeight: '700',
    fontSize: 25,
    color: 'rgba(255, 255, 255, 0.97)',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: 0.08,
    textShadowColor: 'rgba(8, 3, 6, 0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
  introTextLarge: {
    fontSize: 31,
    lineHeight: 41,
    letterSpacing: -0.15,
  },
  introTextItalic: {
    fontStyle: 'italic',
    fontWeight: '600',
  },
  introTextAccent: {
    color: Colors.accentStrong,
    fontWeight: '700',
  },
})
