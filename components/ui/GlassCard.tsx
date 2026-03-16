import React from 'react'
import { ViewProps, StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'

interface GlassCardProps extends ViewProps {
  highlight?: boolean
}

export const GlassCard = React.forwardRef<View, GlassCardProps>(function GlassCard({ children, style, highlight = false, ...rest }, ref) {
  return (
    <View ref={ref} style={[styles.container, highlight && styles.highlight, style]} {...rest}>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  )
})

export const AnimatedGlassCard = Animated.createAnimatedComponent(GlassCard)

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  highlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
  }
})
