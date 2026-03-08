/**
 * AnimatedGradientBackground — Premium Ritual
 *
 * Softly cycles through deep romantic color palettes (like meditation apps).
 * Reanimated 3 handles animation; expo-linear-gradient provides the gradients.
 *
 * Cycle: ~10s total (4 palettes × ~2.5s each).
 * Opacity is animated on the native/UI thread via Reanimated shared values.
 *
 * Requires: expo-linear-gradient (npx expo install expo-linear-gradient)
 */
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

// Color palettes — deep purples, roses, warm dark-reds
const PALETTES: [string, string, string][] = [
  ['#1E0A2E', '#3B0D3B', '#1E1B2E'], // deep violet → plum
  ['#2B0A1A', '#4A1235', '#1E1B2E'], // dark rose → deep crimson
  ['#0D1A2E', '#1A1045', '#2B0A2B'], // midnight blue → indigo
  ['#1A0A2E', '#3B1245', '#2B0A1A'], // purple → violet → rose
]

const HOLD_MS = 2000  // pause before fading to next palette
const FADE_MS = 1500  // cross-fade duration → total cycle ~14s

interface Props {
  style?: object
}

export function AnimatedGradientBackground({ style }: Props) {
  const opacity = useSharedValue(0)
  const [indices, setIndices] = useState({ current: 0, next: 1 })

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  useEffect(() => {
    let cancelled = false
    let idx = 0

    // Runs on JS thread — safe to read `cancelled` and update React state
    function advance(nextIdx: number) {
      if (cancelled) return
      idx = nextIdx
      opacity.value = 0
      startCycle()
    }

    function startCycle() {
      if (cancelled) return
      const nextIdx = (idx + 1) % PALETTES.length
      setIndices({ current: idx, next: nextIdx })

      // Animate on the UI thread; on completion dispatch advance to JS thread
      opacity.value = withDelay(
        HOLD_MS,
        withTiming(
          1,
          { duration: FADE_MS, easing: Easing.inOut(Easing.ease) },
          (finished) => {
            // This callback runs on the UI thread (Reanimated worklet context).
            // cancelAnimation sets finished=false — no recursion on cancel.
            if (finished) runOnJS(advance)(nextIdx)
          },
        ),
      )
    }

    startCycle()

    return () => {
      cancelled = true
      cancelAnimation(opacity)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      {/* Base layer — current palette (always visible) */}
      <LinearGradient
        colors={PALETTES[indices.current]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Top layer — next palette, fades in via Reanimated */}
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <LinearGradient
          colors={PALETTES[indices.next]}
          start={{ x: 0.3, y: 0.1 }}
          end={{ x: 0.7, y: 0.9 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  )
}
