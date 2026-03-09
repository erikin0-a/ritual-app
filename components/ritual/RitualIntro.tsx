import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { View, StyleSheet, Pressable, Dimensions, Platform } from 'react-native'
import { Audio } from 'expo-av'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { Colors } from '@/constants/theme'
import {
  CHIME_SEC,
  CONSENT_APPEAR_SEC,
  RITUAL_INTRO_TIMELINE,
  type RitualIntroTimelineItem,
} from '@/constants/ritual-intro-timeline'

const { height } = Dimensions.get('window')
const CIRCLE_SIZE = 72

// SF Pro Bold on iOS (system font), Roboto Bold fallback on Android / web
const INTRO_FONT_FAMILY = Platform.select({ ios: 'System', default: undefined })

// ─── Consent Circle ───────────────────────────────────────────────────────────

interface ConsentCircleProps {
  position: 'top' | 'bottom'
  onPress: () => void
  visible: boolean
}

function ConsentCircle({ position, onPress, visible }: ConsentCircleProps) {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.6)
  const pulseScale = useSharedValue(1)
  const ringOpacity = useSharedValue(0)
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    if (!visible) return

    opacity.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) })
    scale.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) })

    pulseScale.value = withDelay(
      1200,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    )

    ringOpacity.value = withDelay(
      1200,
      withRepeat(
        withSequence(
          withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.15, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    )
  }, [visible])

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: pulseScale.value * 1.3 }],
  }))

  const handlePress = useCallback(() => {
    if (pressed) return
    setPressed(true)
    scale.value = withSequence(
      withTiming(0.9, { duration: 150 }),
      withTiming(1.1, { duration: 200 }),
      withTiming(1, { duration: 150 }),
    )
    onPress()
  }, [onPress, pressed])

  const positionStyle = position === 'top' ? { top: height * 0.22 } : { bottom: height * 0.22 }

  return (
    <Animated.View style={[styles.circleWrapper, positionStyle, containerStyle]}>
      <Animated.View style={[styles.outerRing, ringStyle]} />
      <Pressable onPress={handlePress}>
        <Animated.View style={[styles.consentCircle, pressed && styles.consentCirclePressed, circleStyle]}>
          <Animated.Text style={[styles.consentIcon, pressed && styles.consentIconPressed]}>
            {pressed ? '✓' : '◦'}
          </Animated.Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}

// ─── Intro Text ───────────────────────────────────────────────────────────────

function IntroText({ activeItem }: { activeItem: RitualIntroTimelineItem | null }) {
  // Keep last non-null item so we can render it during its fade-out
  const [displayedItem, setDisplayedItem] = useState<RitualIntroTimelineItem | null>(null)

  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)
  const scaleBase = useSharedValue(0.97)
  const pulseScale = useSharedValue(1)

  // Track previous item via ref to detect transitions
  const prevItemRef = useRef<RitualIntroTimelineItem | null>(null)
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Cancel any running pulse timer before handling new state
    if (pulseTimerRef.current) {
      clearTimeout(pulseTimerRef.current)
      pulseTimerRef.current = null
    }

    const prev = prevItemRef.current
    prevItemRef.current = activeItem

    if (activeItem !== null && activeItem !== prev) {
      // ── New phrase: lyrics-style entry
      setDisplayedItem(activeItem)

      // Hard-reset shared values so animation always starts fresh
      opacity.value = 0
      translateY.value = 20
      scaleBase.value = 0.97
      pulseScale.value = 1

      // Rise up + fill opacity (simulates "drawing in")
      opacity.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) })
      translateY.value = withTiming(0, { duration: 950, easing: Easing.out(Easing.cubic) })
      scaleBase.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) })

      // Gentle breathing pulse once text has settled
      pulseTimerRef.current = setTimeout(() => {
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
      // ── Phrase over: float upward + dissolve
      pulseScale.value = withTiming(1, { duration: 250 })
      opacity.value = withTiming(0, { duration: 750, easing: Easing.in(Easing.ease) })
      translateY.value = withTiming(-32, { duration: 750, easing: Easing.in(Easing.cubic) })
      scaleBase.value = withTiming(1.016, { duration: 750 })
    }

    return () => {
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current)
        pulseTimerRef.current = null
      }
    }
  }, [activeItem])

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scaleBase.value * pulseScale.value },
    ],
  }))

  if (!displayedItem) return null

  return (
    <View style={styles.textContainer} pointerEvents="none">
      <Animated.Text
        style={[
          styles.introText,
          displayedItem.style === 'large' && styles.introTextLarge,
          displayedItem.style === 'italic' && styles.introTextItalic,
          animStyle,
        ]}
      >
        {displayedItem.text}
      </Animated.Text>
    </View>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface RitualIntroProps {
  onConsentComplete: () => void
  voiceStartTime: number | null
}

export function RitualIntro({ onConsentComplete, voiceStartTime }: RitualIntroProps) {
  const [voiceSecond, setVoiceSecond] = useState(0)
  const [topPressed, setTopPressed] = useState(false)
  const [bottomPressed, setBottomPressed] = useState(false)
  const [showCircles, setShowCircles] = useState(false)
  const screenOpacity = useSharedValue(0)
  const chimePlayedRef = useRef(false)
  const chimeSoundRef = useRef<Audio.Sound | null>(null)

  useEffect(() => {
    screenOpacity.value = withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) })
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadChime = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('@/assets/audio/chime.mp3'),
          { volume: 0.75 },
        )
        if (!isMounted) {
          await sound.unloadAsync()
          return
        }
        chimeSoundRef.current = sound
      } catch (error) {
        console.log('Error loading chime:', error)
      }
    }

    loadChime()

    return () => {
      isMounted = false
      chimeSoundRef.current?.unloadAsync()
    }
  }, [])

  // Track elapsed voice time at 250ms resolution
  useEffect(() => {
    if (!voiceStartTime) return

    const update = () => {
      setVoiceSecond(Math.max(0, (Date.now() - voiceStartTime) / 1000))
    }

    update()
    const timer = setInterval(update, 250)
    return () => clearInterval(timer)
  }, [voiceStartTime])

  useEffect(() => {
    if (voiceSecond >= CONSENT_APPEAR_SEC) setShowCircles(true)
  }, [voiceSecond])

  useEffect(() => {
    if (!chimePlayedRef.current && voiceSecond >= CHIME_SEC) {
      chimePlayedRef.current = true
      chimeSoundRef.current?.replayAsync()
    }
  }, [voiceSecond])

  useEffect(() => {
    if (!(topPressed && bottomPressed)) return
    const t = setTimeout(() => onConsentComplete(), 1500)
    return () => clearTimeout(t)
  }, [topPressed, bottomPressed, onConsentComplete])

  // KEY: guard voiceStartTime === null so no text appears before voiceover starts
  const activeItem = useMemo(() => {
    if (!voiceStartTime) return null
    return (
      RITUAL_INTRO_TIMELINE.find(
        (item) => voiceSecond >= item.startSec && voiceSecond < item.endSec,
      ) ?? null
    )
  }, [voiceSecond, voiceStartTime])

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }))

  return (
    <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
      <IntroText activeItem={activeItem} />
      <ConsentCircle position="top" visible={showCircles} onPress={() => setTopPressed(true)} />
      <ConsentCircle position="bottom" visible={showCircles} onPress={() => setBottomPressed(true)} />
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
  circleWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  outerRing: {
    position: 'absolute',
    width: CIRCLE_SIZE * 1.6,
    height: CIRCLE_SIZE * 1.6,
    borderRadius: CIRCLE_SIZE,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  consentCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentCirclePressed: {
    backgroundColor: 'rgba(210, 46, 136, 0.2)',
    borderColor: Colors.accent,
  },
  consentIcon: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  consentIconPressed: {
    color: Colors.accent,
  },
})
