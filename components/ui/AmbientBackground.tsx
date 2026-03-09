import React, { useEffect } from 'react'
import { StyleSheet, View, Dimensions, Platform } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')

// Ritual session palette: warm, sensual, wine-toned
const RITUAL_PALETTE = {
  wine:       '#5C1A2A',
  deepRose:   '#8B3050',
  dustyPink:  '#A0586C',
  peach:      '#C08070',
  darkBase:   '#1A0A10',
}

// App-wide palette: darker, more neutral, subtle accent
const APP_PALETTE = {
  dark1:      '#1A0E14',
  dark2:      '#2A1520',
  muted:      '#4A2535',
  subtle:     '#3A1A28',
  darkBase:   '#0C0C0C',
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

// Warm, sensual background for ritual session screens
export function AmbientBackground() {
  const P = RITUAL_PALETTE
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.darkBase, { backgroundColor: P.darkBase }]} />
      <Blob color={P.wine} size={width * 1.6} startX={-width * 0.5} startY={height * 0.2}
        endX={-width * 0.2} endY={height * 0.1} duration={25000} opacity={0.8} rotation={45} blurRadius={100} shape={[0.62, 0.38, 0.58, 0.44]} />
      <Blob color={P.deepRose} size={width * 1.3} startX={width * 0.2} startY={-height * 0.2}
        endX={-width * 0.1} endY={height * 0.1} duration={22000} delay={3000} opacity={0.7} rotation={-60} blurRadius={90} shape={[0.45, 0.6, 0.4, 0.62]} />
      <Blob color={P.dustyPink} size={width * 1.1} startX={-width * 0.1} startY={height * 0.3}
        endX={width * 0.2} endY={height * 0.1} duration={28000} delay={5000} opacity={0.5} rotation={90} blurRadius={95} shape={[0.52, 0.48, 0.66, 0.35]} />
      <Blob color={P.peach} size={width * 0.9} startX={width * 0.3} startY={height * 0.5}
        endX={width * 0.1} endY={height * 0.3} duration={30000} delay={8000} opacity={0.4} rotation={120} blurRadius={100} shape={[0.4, 0.58, 0.42, 0.62]} />
      <Blob color={P.darkBase} size={width * 1.4} startX={width * 0.1} startY={height * 0.4}
        endX={-width * 0.2} endY={height * 0.2} duration={20000} delay={2000} opacity={0.6} rotation={-30} blurRadius={80} shape={[0.57, 0.36, 0.65, 0.41]} />
    </View>
  )
}

// Darker, subtler background for non-ritual screens (hub, mode selection, setup)
export function AppBackground() {
  const P = APP_PALETTE
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.darkBase, { backgroundColor: P.darkBase }]} />
      <Blob color={P.dark1} size={width * 1.5} startX={-width * 0.3} startY={-height * 0.1}
        endX={-width * 0.1} endY={height * 0.1} duration={25000} opacity={0.9} rotation={30} blurRadius={100} shape={[0.62, 0.4, 0.56, 0.42]} />
      <Blob color={P.muted} size={width * 1.2} startX={width * 0.1} startY={height * 0.3}
        endX={-width * 0.1} endY={height * 0.15} duration={22000} delay={4000} opacity={0.4} rotation={-50} blurRadius={90} shape={[0.46, 0.6, 0.38, 0.64]} />
      <Blob color={P.dark2} size={width * 1.3} startX={width * 0.2} startY={-height * 0.15}
        endX={width * 0.05} endY={height * 0.05} duration={28000} delay={2000} opacity={0.6} rotation={70} blurRadius={95} shape={[0.54, 0.44, 0.67, 0.35]} />
      <Blob color={P.subtle} size={width * 0.8} startX={-width * 0.1} startY={height * 0.6}
        endX={width * 0.15} endY={height * 0.4} duration={30000} delay={6000} opacity={0.35} rotation={-90} blurRadius={100} shape={[0.43, 0.58, 0.39, 0.66]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  darkBase: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    overflow: 'visible',
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
})
