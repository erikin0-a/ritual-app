import React, { useEffect } from 'react'
import Svg, { Path } from 'react-native-svg'
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withRepeat, 
  withTiming, 
  Easing,
  withSequence
} from 'react-native-reanimated'
import { Colors } from '@/constants/theme'

const AnimatedPath = Animated.createAnimatedComponent(Path)

interface LogoProps {
  width?: number
  height?: number
  color?: string
  animated?: boolean
}

export function Logo({ 
  width = 117, 
  height = 105, 
  color = Colors.accent,
  animated = false 
}: LogoProps) {
  const opacity = useSharedValue(1)

  useEffect(() => {
    if (animated) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    }
  }, [animated])

  const animatedProps = useAnimatedProps(() => ({
    fillOpacity: opacity.value
  }))

  return (
    <Svg width={width} height={height} viewBox="0 0 117 105" fill="none">
      <AnimatedPath 
        d="M0 88.8462C5.40219 75.9042 13.2211 60.5533 23.4569 42.7935C32.6501 26.7341 42.0328 12.4696 51.6051 0L65.6792 13.7449C65.8688 29.5209 66.7217 46.0999 68.2382 63.4818C78.3791 42.2267 89.7995 22.9082 102.499 5.52632L117 18.8462C101.457 40.4791 86.6245 67.9217 72.503 101.174L53.5954 105C50.5626 82.7058 48.5723 61.4507 47.6245 41.2348C34.9247 62.4899 24.5468 83.3671 16.4909 103.866L0 88.8462Z" 
        fill={color}
        animatedProps={animatedProps}
      />
    </Svg>
  )
}
