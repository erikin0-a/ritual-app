import { Pressable, Text, StyleSheet, ActivityIndicator, type PressableProps } from 'react-native'
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'

interface ButtonProps extends PressableProps {
  title: string
  variant?: Variant
  loading?: boolean
  fullWidth?: boolean
}

export function Button({ title, variant = 'primary', loading = false, fullWidth = false, disabled, style, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      style={[
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style as object,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.text : Colors.accent} size="small" />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{title}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    minHeight: 52,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.4,
  },

  // Variants
  primary: {
    backgroundColor: Colors.accent,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  outline: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Labels
  label: {
    ...Typography.h3,
  },
  primaryLabel: {
    color: Colors.text,
  },
  secondaryLabel: {
    color: Colors.text,
  },
  outlineLabel: {
    color: Colors.textSecondary,
  },
  ghostLabel: {
    color: Colors.textSecondary,
  },
})
