import React, { useEffect } from 'react'
import { StyleSheet, View, Dimensions, Platform } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withDelay,
} from 'react-native-reanimated'
import { Colors } from '@/constants/theme'

const { width, height } = Dimensions.get('window')

// A single floating blob component
function Blob({
  size,
  color,
  initialX,
  initialY,
  duration,
  delay = 0,
}: {
  size: number
  color: string
  initialX: number
  initialY: number
  duration: number
  delay?: number
}) {
  const translateX = useSharedValue(initialX)
  const translateY = useSharedValue(initialY)
  const scale = useSharedValue(1)

  useEffect(() => {
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(initialX + (Math.random() * 100 - 50), {
          duration: duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    )
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(initialY + (Math.random() * 100 - 50), {
          duration: duration * 1.2,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    )
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.2, {
          duration: duration * 1.5,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    )
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  return (
    <Animated.View
      style={[
        styles.blob,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  )
}

export function LiquidBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.background} />
      
      {/* Layer 1: Deep purple/dark base */}
      <Blob
        size={width * 1.2}
        color="#1A0510"
        initialX={-width * 0.2}
        initialY={-height * 0.2}
        duration={10000}
      />

      {/* Layer 2: Accent color blobs */}
      <Blob
        size={width * 0.8}
        color={`${Colors.accent}40`} // 40 = ~25% opacity
        initialX={width * 0.4}
        initialY={height * 0.1}
        duration={8000}
        delay={1000}
      />
      
      <Blob
        size={width * 0.9}
        color={`${Colors.accent}20`}
        initialX={-width * 0.2}
        initialY={height * 0.5}
        duration={9000}
        delay={500}
      />

      <Blob
        size={width * 0.7}
        color="#6A1B4D40"
        initialX={width * 0.3}
        initialY={height * 0.7}
        duration={11000}
        delay={2000}
      />

      {/* Overlay blur to smooth everything out */}
      {/* Note: On Android, simple View with opacity/blurRadius is tricky. 
          We rely on the blobs being soft. If we need real blur, we'd use expo-blur 
          but it can be expensive. For "liquid" feel, soft shapes are usually enough. 
          Let's add a dark overlay to ensure text contrast. */}
      <View style={styles.overlay} />
    </View>
  )
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
  },
  blob: {
    position: 'absolute',
    opacity: 0.6,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 12, 12, 0.3)', // Subtle dark overlay
    // backdropFilter is web-only and can cause issues if not handled
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(30px)' } : {}),
  },
})
