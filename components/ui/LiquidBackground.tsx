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

/**
 * Noise Overlay Component
 * Creates an SVG noise pattern to simulate film grain.
 */
const NoiseOverlay = () => {
  return (
    <View style={[StyleSheet.absoluteFill, { opacity: 0.15, zIndex: 10 }]} pointerEvents="none">
      <View style={styles.noiseContainer} />
    </View>
  )
}

/**
 * LiquidBackground
 * A strict, minimalist background. 
 * Pure deep dark canvas with an ultra-subtle dusty rose breathing highlight.
 */
export const LiquidBackground = () => {
  // Single subtle breathing animation
  const pulseScale = useSharedValue(1)
  const pulseOpacity = useSharedValue(0.3)

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 15000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 15000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    )

    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.2, { duration: 12000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    )
  }, [])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }))

  return (
    <View style={styles.container}>
      {/* Base Canvas */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#080808', '#000000']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Subtle Dusty Rose Pulse */}
      <Animated.View style={[styles.dustyRosePulse, pulseStyle]} />

      {/* Global Blur Filter */}
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Vintage Noise Texture */}
      <NoiseOverlay />
      
      {/* Subtle Vignette */}
      <View style={styles.vignette} pointerEvents="none">
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'transparent', 'transparent', 'rgba(0,0,0,0.9)']}
          locations={[0, 0.2, 0.8, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  dustyRosePulse: {
    position: 'absolute',
    top: height * 0.1,
    left: width * 0.1,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(164, 115, 126, 0.15)', // Dusty Rose
    filter: [{ blur: 60 }], // Fallback for web, native is handled by BlurView
  },
  noiseContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // We use a CSS trick for noise on web, on native we might need a tiled image or SVG if strictly requested.
    // For now, React Native web handles this well, and native can use this as a placeholder for a true noise asset.
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
})
