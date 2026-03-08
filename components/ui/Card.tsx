import { View, StyleSheet, type ViewProps } from 'react-native'
import { Colors, Spacing, BorderRadius } from '@/constants/theme'

type Variant = 'default' | 'highlighted'

interface CardProps extends ViewProps {
  variant?: Variant
}

export function Card({ variant = 'default', style, children, ...rest }: CardProps) {
  return (
    <View
      style={[styles.base, styles[variant], style as object]}
      {...rest}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  default: {},
  highlighted: {
    borderColor: Colors.accent,
  },
})
