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
 * Animated dark canvas with a breathing warm-rose blob.
 * The `intensity` prop scales the blob opacity — use it to signal
 * escalating tension across ritual rounds.
 */
export const LiquidBackground = ({ intensity = 0.4 }: LiquidBackgroundProps) => {
  const pulseScale = useSharedValue(1)
  const pulseOpacity = useSharedValue(intensity * 0.6)

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

  const blobStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }))

  // Second smaller blob offset for richer depth at higher intensities
  const secondBlobOpacity = intensity > 0.5 ? intensity * 0.25 : 0
  const secondBlobStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (1 - pulseScale.value) * 0.4 }],
    opacity: secondBlobOpacity * pulseOpacity.value,
  }))

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Base canvas */}
      <LinearGradient
        colors={['#0D0A0F', '#080608', '#000000']}
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
    backgroundColor: '#0D0A0F',
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
