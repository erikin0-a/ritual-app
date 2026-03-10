import { View, StyleSheet, type ViewProps } from 'react-native'
import { BorderRadius, Colors, SemanticColors, Shadows, Spacing } from '@/constants/theme'

type Variant = 'default' | 'highlighted' | 'raised' | 'subtle'

interface CardProps extends ViewProps {
  variant?: Variant
  padded?: boolean
}

export function Card({ variant = 'default', padded = true, style, children, ...rest }: CardProps) {
  return (
    <View
      style={[styles.base, padded && styles.padded, styles[variant], style as object]}
      {...rest}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: SemanticColors.hairline,
    overflow: 'hidden',
  },
  padded: {
    padding: Spacing.lg,
  },
  default: {
    ...Shadows.soft,
  },
  highlighted: {
    borderColor: Colors.accent,
    backgroundColor: Colors.surfaceAlt,
    ...Shadows.glow,
  },
  raised: {
    backgroundColor: Colors.surfaceRaised,
    borderColor: SemanticColors.hairlineStrong,
    ...Shadows.soft,
  },
  subtle: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
})
