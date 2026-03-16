import React, { useEffect } from 'react'
import { StyleSheet, View, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { Colors } from '@/constants/theme'

const { width, height } = Dimensions.get('window')

interface LiquidBackgroundProps {
  /**
   * 0–1. Controls ambient blob intensity.
   * 0 = barely visible (round 1), 1 = fully vivid (round 5).
   * Defaults to 0.4 (neutral).
   */
  intensity?: number
}

/**
 * LiquidBackground
 * Animated dark canvas with a breathing warm-rose blob that also drifts
 * slowly across the canvas for a liquid, silk-like feel.
 * The `intensity` prop scales the blob opacity — use it to signal
 * escalating tension across ritual rounds.
 */
export const LiquidBackground = ({ intensity = 0.4 }: LiquidBackgroundProps) => {
  const pulseScale = useSharedValue(1)
  const pulseOpacity = useSharedValue(intensity * 0.6)
  // Primary blob drift
  const driftX = useSharedValue(0)
  const driftY = useSharedValue(0)
  // Secondary blob counter-drift
  const drift2X = useSharedValue(0)
  const drift2Y = useSharedValue(0)

  // Slow breathing scale (same for all intensities)
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 14000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Opacity breathing scales proportionally with intensity
  useEffect(() => {
    const lo = Math.max(0.08, intensity * 0.3)
    const hi = Math.max(0.2, intensity * 0.72)
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(hi, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
        withTiming(lo, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensity])

  // Primary blob slow drift — different period for X and Y so motion never repeats exactly
  useEffect(() => {
    driftX.value = withRepeat(
      withSequence(
        withTiming(28, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-28, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
    driftY.value = withRepeat(
      withSequence(
        withTiming(-24, { duration: 14500, easing: Easing.inOut(Easing.sin) }),
        withTiming(24, { duration: 14500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
    // Secondary blob drifts in the opposite phase
    drift2X.value = withRepeat(
      withSequence(
        withTiming(-22, { duration: 9800, easing: Easing.inOut(Easing.sin) }),
        withTiming(22, { duration: 9800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
    drift2Y.value = withRepeat(
      withSequence(
        withTiming(18, { duration: 12600, easing: Easing.inOut(Easing.sin) }),
        withTiming(-18, { duration: 12600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const blobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: driftX.value },
      { translateY: driftY.value },
      { scale: pulseScale.value },
    ],
    opacity: pulseOpacity.value,
  }))

  // Second smaller blob offset for richer depth at higher intensities
  const secondBlobOpacity = intensity > 0.5 ? intensity * 0.25 : 0
  const secondBlobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: drift2X.value },
      { translateY: drift2Y.value },
      { scale: 1 + (1 - pulseScale.value) * 0.4 },
    ],
    opacity: secondBlobOpacity * pulseOpacity.value,
  }))

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Base canvas */}
      <LinearGradient
        colors={[Colors.bg, '#080608', '#000000']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Primary warm-rose blob */}
      <Animated.View style={[styles.primaryBlob, blobStyle]} />

      {/* Secondary accent blob (visible at intensity > 0.5) */}
      {intensity > 0.5 && (
        <Animated.View style={[styles.secondaryBlob, secondBlobStyle]} />
      )}

      {/* Blur to soften blobs */}
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Vignette edges */}
      <LinearGradient
        colors={['rgba(0,0,0,0.75)', 'transparent', 'transparent', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.18, 0.82, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bg,
    overflow: 'hidden',
  },
  primaryBlob: {
    position: 'absolute',
    top: height * 0.08,
    left: width * 0.05,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    // Warm deep-rose, matches accent palette
    backgroundColor: 'rgba(139, 26, 74, 0.5)',
  },
  secondaryBlob: {
    position: 'absolute',
    bottom: height * 0.1,
    right: width * 0.05,
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
    backgroundColor: 'rgba(194, 24, 91, 0.4)',
  },
})
