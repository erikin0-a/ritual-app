import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, Dimensions, Platform } from 'react-native'
import { Audio } from 'expo-av'
import * as Haptics from 'expo-haptics'
import Svg, { Circle as SvgCircle } from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated'
import { Colors } from '@/constants/theme'
import {
  CHIME_SEC,
  CONSENT_APPEAR_SEC,
  RITUAL_INTRO_TIMELINE,
  type RitualIntroTimelineItem,
} from '@/constants/ritual-intro-timeline'

const { height } = Dimensions.get('window')
const INTRO_FONT_FAMILY = Platform.select({ ios: 'System', default: undefined })

// ─── Constants ────────────────────────────────────────────────────────────────
const VOICEOVER_DURATION_SEC = 83 // Total duration of voiceover
const CONT = 140          // total animated container size
const RING_R = 66         // SVG arc radius (diameter 132)
const CIRC = 2 * Math.PI * RING_R
const INNER = 108         // pressable inner circle diameter
const HOLD_MS = 1800      // hold duration in ms

const hapticImpact = () => {
  if (Platform.OS === 'web') return
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
}
const hapticSuccess = () => {
  if (Platform.OS === 'web') return
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
}

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle)

// ─── Consent Circle ───────────────────────────────────────────────────────────
interface ConsentCircleProps {
  position: 'top' | 'bottom'
  onConfirm: () => void
  visible: boolean
  mergeProgress: Animated.SharedValue<number>
}

function ConsentCircle({ position, onConfirm, visible, mergeProgress }: ConsentCircleProps) {
  const [confirmed, setConfirmed] = useState(false)
  const confirmedRef = useRef(false)
  const isHoldingRef = useRef(false)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Animation values
  const containerOpacity = useSharedValue(0)
  const containerScale = useSharedValue(0.5)
  const idlePulse = useSharedValue(1)
  const holdProgress = useSharedValue(0)
  const glowOpacity = useSharedValue(0)
  const innerScale = useSharedValue(1)
  
  // Appear animation
  useEffect(() => {
    if (!visible) return
    containerOpacity.value = withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) })
    containerScale.value = withTiming(1, { duration: 1300, easing: Easing.out(Easing.back(1.1)) })
    
    // Start idle pulse
    idlePulse.value = withDelay(
      1400,
      withRepeat(
        withSequence(
          withTiming(1.04, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    )
  }, [visible])

  // Cleanup
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    }
  }, [])

  const doConfirm = useCallback(() => {
    confirmedRef.current = true
    setConfirmed(true)
    
    // Success animation
    idlePulse.value = withTiming(1, { duration: 200 })
    holdProgress.value = 1
    glowOpacity.value = withSequence(
      withTiming(0.8, { duration: 150 }),
      withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) }),
    )
    innerScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1.15, { duration: 300, easing: Easing.out(Easing.back(1.5)) }),
      withTiming(1, { duration: 300 }),
    )
    
    hapticSuccess()
    onConfirm()
  }, [onConfirm])

  const handlePressIn = useCallback(() => {
    if (confirmedRef.current) return
    isHoldingRef.current = true
    hapticImpact()

    // Pause idle pulse
    idlePulse.value = withTiming(1, { duration: 200 })
    
    // Press feedback
    innerScale.value = withTiming(0.95, { duration: 200 })
    holdProgress.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear })
    glowOpacity.value = withTiming(0.5, { duration: 300 })

    holdTimerRef.current = setTimeout(() => {
      if (isHoldingRef.current && !confirmedRef.current) doConfirm()
    }, HOLD_MS)
  }, [doConfirm])

  const handlePressOut = useCallback(() => {
    if (confirmedRef.current) return
    isHoldingRef.current = false
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)

    // Reset animations
    holdProgress.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) })
    glowOpacity.value = withTiming(0, { duration: 300 })
    innerScale.value = withTiming(1, { duration: 300 })

    // Resume idle pulse
    idlePulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
  }, [])

  const progressArcProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRC * (1 - holdProgress.value),
  }))

  // Merge animation logic
  const containerStyle = useAnimatedStyle(() => {
    // Initial positions
    const initialTop = height * 0.15
    const initialBottom = height * 0.15
    const center = height / 2 - CONT / 2

    // Interpolate position based on mergeProgress
    let translateY = 0
    if (position === 'top') {
       // Move down to center
       translateY = interpolate(mergeProgress.value, [0, 1], [0, center - initialTop])
    } else {
       // Move up to center (negative translateY since bottom is fixed)
       // Wait, if bottom is fixed, increasing translateY moves it down.
       // We want to move it UP. So negative translateY.
       // Distance to travel: center - (height - initialBottom - CONT) ??
       // Easier: use top/bottom style directly if possible, or translateY relative to start.
       // Let's use absolute positioning with top/bottom and translateY.
       
       // Center Y coordinate is height/2.
       // Initial Bottom Y center is height - initialBottom - CONT/2.
       // Target Y center is height/2.
       // Delta = Target - Initial = height/2 - (height - initialBottom - CONT/2)
       //       = initialBottom + CONT/2 - height/2
       // But translateY adds to Y position (moves down).
       // So to move UP, we need negative value.
       // translateY = interpolate(mergeProgress.value, [0, 1], [0, -(initialBottom + CONT/2 - height/2 + CONT)]) 
       // Let's simplify:
       // Start Y (top edge) = height - initialBottom - CONT
       // End Y (top edge) = height/2 - CONT/2
       // Delta = End - Start
       translateY = interpolate(mergeProgress.value, [0, 1], [0, (height/2 - CONT/2) - (height - initialBottom - CONT)])
    }

    return {
      opacity: containerOpacity.value,
      transform: [
        { translateY },
        { scale: containerScale.value * (confirmed ? 1 : idlePulse.value) }
      ],
    }
  })

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(mergeProgress.value, [0, 0.5], [1, 0]),
  }))

  const positionStyle = position === 'top'
    ? { top: height * 0.15 }
    : { bottom: height * 0.15 }

  const label = position === 'top' ? 'Партнёр 1' : 'Партнёр 2'

  return (
    <Animated.View style={[styles.outerWrapper, positionStyle, containerStyle]}>
      {/* Glow Bloom */}
      <Animated.View style={[styles.glowBloom, { opacity: glowOpacity }]} />

      {/* SVG Ring */}
      <Svg width={CONT} height={CONT} style={StyleSheet.absoluteFill} viewBox={`0 0 ${CONT} ${CONT}`}>
        {/* Track */}
        <SvgCircle
          cx={CONT / 2}
          cy={CONT / 2}
          r={RING_R}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1.5}
        />
        {/* Progress */}
        <AnimatedSvgCircle
          cx={CONT / 2}
          cy={CONT / 2}
          r={RING_R}
          fill="none"
          stroke={confirmed ? 'rgba(185, 255, 210, 0.95)' : 'rgba(255, 255, 255, 0.9)'}
          strokeWidth={2.5}
          strokeDasharray={String(CIRC)}
          strokeLinecap="round"
          transform={`rotate(-90 ${CONT / 2} ${CONT / 2})`}
          animatedProps={progressArcProps}
        />
      </Svg>

      {/* Button */}
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[
          styles.innerCircle,
          confirmed && styles.innerCircleConfirmed,
          { transform: [{ scale: innerScale }] }
        ]}>
          <Text style={[styles.innerIcon, confirmed && styles.innerIconConfirmed]}>
            {confirmed ? '✓' : '·'}
          </Text>
          <Text style={[styles.innerHint, confirmed && styles.innerHintConfirmed]}>
            {confirmed ? 'Готово' : 'Удержать'}
          </Text>
        </Animated.View>
      </Pressable>

      {/* Label */}
      <Animated.Text style={[styles.partnerLabel, labelStyle]}>{label}</Animated.Text>
    </Animated.View>
  )
}

// ─── Intro Text ───────────────────────────────────────────────────────────────
function IntroText({ activeItem }: { activeItem: RitualIntroTimelineItem | null }) {
  const [displayedItem, setDisplayedItem] = useState<RitualIntroTimelineItem | null>(null)
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)
  const scaleBase = useSharedValue(0.97)
  const pulseScale = useSharedValue(1)
  const prevItemRef = useRef<RitualIntroTimelineItem | null>(null)
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (pulseTimerRef.current) {
      clearTimeout(pulseTimerRef.current)
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
      pulseScale.value = withTiming(1, { duration: 250 })
      opacity.value = withTiming(0, { duration: 750, easing: Easing.in(Easing.ease) })
      translateY.value = withTiming(-32, { duration: 750, easing: Easing.in(Easing.cubic) })
      scaleBase.value = withTiming(1.016, { duration: 750 })
    }
    return () => { if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current) }
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
        animStyle,
      ]}>
        {displayedItem.text}
      </Animated.Text>
    </View>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface RitualIntroProps {
  onConsentComplete: () => void
  voiceStartTime: number | null
}

export function RitualIntro({ onConsentComplete, voiceStartTime }: RitualIntroProps) {
  const [voiceSecond, setVoiceSecond] = useState(0)
  const [topConfirmed, setTopConfirmed] = useState(false)
  const [bottomConfirmed, setBottomConfirmed] = useState(false)
  const [showCircles, setShowCircles] = useState(false)
  
  const screenOpacity = useSharedValue(0)
  const mergeProgress = useSharedValue(0)
  
  const chimePlayedRef = useRef(false)
  const chimeSoundRef = useRef<Audio.Sound | null>(null)
  const completeTriggeredRef = useRef(false)

  useEffect(() => {
    screenOpacity.value = withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) })
  }, [])

  // Audio setup
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
      } catch (e) { console.log('chime error', e) }
    }
    loadChime()
    return () => { isMounted = false; chimeSoundRef.current?.unloadAsync() }
  }, [])

  // Timer loop
  useEffect(() => {
    if (!voiceStartTime) return
    const update = () => setVoiceSecond(Math.max(0, (Date.now() - voiceStartTime) / 1000))
    update()
    const timer = setInterval(update, 250)
    return () => clearInterval(timer)
  }, [voiceStartTime])

  // Triggers
  useEffect(() => { if (voiceSecond >= CONSENT_APPEAR_SEC) setShowCircles(true) }, [voiceSecond])
  useEffect(() => {
    if (!chimePlayedRef.current && voiceSecond >= CHIME_SEC) {
      chimePlayedRef.current = true
      chimeSoundRef.current?.replayAsync()
    }
  }, [voiceSecond])

  // Completion Logic
  useEffect(() => {
    if (completeTriggeredRef.current) return
    if (topConfirmed && bottomConfirmed) {
      
      const finishIntro = () => {
        completeTriggeredRef.current = true
        // 1. Animate merge
        mergeProgress.value = withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.cubic) }, (finished) => {
          if (finished) {
            // 2. Wait a moment then complete
            runOnJS(onConsentComplete)()
          }
        })
      }

      // Check if voiceover is done
      if (voiceSecond >= VOICEOVER_DURATION_SEC) {
        finishIntro()
      } else {
        // Wait for voiceover
        const remainingMs = (VOICEOVER_DURATION_SEC - voiceSecond) * 1000
        const t = setTimeout(finishIntro, Math.max(0, remainingMs))
        return () => clearTimeout(t)
      }
    }
  }, [topConfirmed, bottomConfirmed, voiceSecond, onConsentComplete])

  const activeItem = useMemo(() => {
    if (!voiceStartTime) return null
    return RITUAL_INTRO_TIMELINE.find(i => voiceSecond >= i.startSec && voiceSecond < i.endSec) ?? null
  }, [voiceSecond, voiceStartTime])

  const fadeStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }))

  return (
    <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
      <IntroText activeItem={activeItem} />
      <ConsentCircle
        position="top"
        visible={showCircles}
        onConfirm={() => setTopConfirmed(true)}
        mergeProgress={mergeProgress}
      />
      <ConsentCircle
        position="bottom"
        visible={showCircles}
        onConfirm={() => setBottomConfirmed(true)}
        mergeProgress={mergeProgress}
      />
    </Animated.View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    width: CONT,
    height: CONT,
    alignItems: 'center',
    justifyContent: 'center', // Fixes centering
    zIndex: 20,
  },
  glowBloom: {
    position: 'absolute',
    width: CONT * 1.8,
    height: CONT * 1.8,
    borderRadius: CONT,
    backgroundColor: 'rgba(255, 210, 235, 0.25)',
    ...(Platform.OS === 'web' ? { filter: 'blur(32px)' } : {}),
  },
  innerCircle: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  innerCircleConfirmed: {
    backgroundColor: 'rgba(185, 255, 210, 0.12)',
    borderColor: 'rgba(185, 255, 210, 0.5)',
  },
  innerIcon: {
    fontSize: 22,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 2,
  },
  innerIconConfirmed: {
    fontSize: 26,
    color: 'rgba(185, 255, 210, 0.95)',
    marginBottom: 0,
  },
  innerHint: {
    fontFamily: INTRO_FONT_FAMILY,
    fontWeight: '600',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  innerHintConfirmed: {
    color: 'rgba(185, 255, 210, 0.8)',
  },
  partnerLabel: {
    position: 'absolute',
    bottom: -32, // Push outside the circle
    fontFamily: INTRO_FONT_FAMILY,
    fontWeight: '500',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.25)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
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
})
