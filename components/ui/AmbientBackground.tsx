import React, { useEffect } from 'react'
import { StyleSheet, View, useWindowDimensions, Platform } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '@/constants/theme'

type AmbientVariant = 'ritual' | 'app'

const PALETTES: Record<AmbientVariant, { base: [string, string, string]; blobs: string[] }> = {
  ritual: {
    base: [Colors.gradientStart, '#110E17', Colors.gradientEnd],
    blobs: ['rgba(161, 61, 103, 0.55)', 'rgba(226, 179, 126, 0.18)', 'rgba(116, 56, 110, 0.42)', 'rgba(240, 106, 166, 0.22)'],
  },
  app: {
    base: ['#17121E', '#0F0C14', Colors.gradientEnd],
    blobs: ['rgba(105, 72, 124, 0.3)', 'rgba(240, 106, 166, 0.12)', 'rgba(62, 42, 86, 0.42)', 'rgba(226, 179, 126, 0.12)'],
  },
}

interface BlobProps {
  color: string
  size: number
  startX: number
  startY: number
  endX: number
  endY: number
  duration: number
  delay?: number
  rotation?: number
  opacity?: number
  blurRadius?: number
  shape?: [number, number, number, number]
}

function Blob({
  color,
  size,
  startX,
  startY,
  endX,
  endY,
  duration,
  delay: delayMs = 0,
  rotation = 0,
  opacity: baseOpacity = 0.7,
  blurRadius = 90,
  shape = [0.58, 0.42, 0.64, 0.38],
}: BlobProps) {
  const translateX = useSharedValue(startX)
  const translateY = useSharedValue(startY)
  const rotate = useSharedValue(0)
  const scale = useSharedValue(1)
  const opacity = useSharedValue(baseOpacity)

  useEffect(() => {
    translateX.value = withDelay(delayMs, withRepeat(
      withSequence(
        withTiming(endX, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(startX, { duration, easing: Easing.inOut(Easing.sin) })
      ), -1, false
    ))

    translateY.value = withDelay(delayMs, withRepeat(
      withSequence(
        withTiming(endY, { duration: duration * 1.1, easing: Easing.inOut(Easing.sin) }),
        withTiming(startY, { duration: duration * 1.1, easing: Easing.inOut(Easing.sin) })
      ), -1, false
    ))

    rotate.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(rotation, { duration: duration * 1.8, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    )

    scale.value = withDelay(delayMs, withRepeat(
      withSequence(
        withTiming(1.15, { duration: duration * 0.6, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: duration * 0.6, easing: Easing.inOut(Easing.sin) })
      ), -1, false
    ))

    opacity.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(baseOpacity * 1.06, { duration: duration * 0.55, easing: Easing.inOut(Easing.sin) }),
          withTiming(baseOpacity * 0.94, { duration: duration * 0.55, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    )
    // Reanimated shared values are intentionally initialized once per blob.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }))

  const blobStyle = Platform.OS === 'web'
    ? { filter: `blur(${blurRadius}px)` }
    : {}
  const layerShapeStyle = {
    borderTopLeftRadius: size * shape[0],
    borderTopRightRadius: size * shape[1],
    borderBottomRightRadius: size * shape[2],
    borderBottomLeftRadius: size * shape[3],
  }

  return (
    <Animated.View
      style={[
        styles.blob,
        {
          width: size,
          height: size * 0.75,
          borderTopLeftRadius: size * shape[0],
          borderTopRightRadius: size * shape[1],
          borderBottomRightRadius: size * shape[2],
          borderBottomLeftRadius: size * shape[3],
        },
        style,
      ]}
    >
      <View
        style={[
          styles.layer,
          {
            backgroundColor: color,
            opacity: 0.55,
            ...layerShapeStyle,
            ...blobStyle,
          },
        ]}
      />
      <View
        style={[
          styles.layer,
          {
            backgroundColor: color,
            opacity: 0.28,
            transform: [{ scale: 1.25 }],
            ...layerShapeStyle,
            ...blobStyle,
          },
        ]}
      />
      <View
        style={[
          styles.layer,
          {
            backgroundColor: color,
            opacity: 0.12,
            transform: [{ scale: 1.48 }],
            ...layerShapeStyle,
            ...blobStyle,
          },
        ]}
      />
    </Animated.View>
  )
}

function AmbientLayer({ variant }: { variant: AmbientVariant }) {
  const { width, height } = useWindowDimensions()
  const palette = PALETTES[variant]

  return (
    <View style={styles.container} pointerEvents="none">
      <LinearGradient
        colors={palette.base}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.textureVeil, variant === 'ritual' ? styles.textureVeilRitual : styles.textureVeilApp]} />
      <Blob color={palette.blobs[0]} size={width * 1.5} startX={-width * 0.45} startY={-height * 0.05}
        endX={-width * 0.15} endY={height * 0.14} duration={22000} opacity={0.9} rotation={34} blurRadius={95} shape={[0.6, 0.42, 0.55, 0.48]} />
      <Blob color={palette.blobs[1]} size={width * 1.18} startX={width * 0.15} startY={height * 0.34}
        endX={-width * 0.08} endY={height * 0.14} duration={28000} delay={3200} opacity={0.45} rotation={-56} blurRadius={90} shape={[0.46, 0.58, 0.42, 0.64]} />
      <Blob color={palette.blobs[2]} size={width * 1.28} startX={width * 0.28} startY={-height * 0.16}
        endX={width * 0.02} endY={height * 0.06} duration={26000} delay={1800} opacity={0.55} rotation={74} blurRadius={88} shape={[0.52, 0.46, 0.68, 0.36]} />
      <Blob color={palette.blobs[3]} size={width * 0.92} startX={-width * 0.14} startY={height * 0.58}
        endX={width * 0.12} endY={height * 0.34} duration={31000} delay={6200} opacity={0.34} rotation={-96} blurRadius={98} shape={[0.44, 0.58, 0.4, 0.67]} />
    </View>
  )
}

export function AmbientBackground({ variant = 'ritual' }: { variant?: AmbientVariant }) {
  return <AmbientLayer variant={variant} />
}

export function AppBackground() {
  return <AmbientLayer variant="app" />
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  textureVeil: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  textureVeilRitual: {
    backgroundColor: 'rgba(14, 10, 18, 0.2)',
  },
  textureVeilApp: {
    backgroundColor: 'rgba(8, 7, 11, 0.26)',
  },
  blob: {
    position: 'absolute',
    overflow: 'visible',
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
})
