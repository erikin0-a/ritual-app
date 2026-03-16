import { Pressable, Text, StyleSheet, ActivityIndicator, type PressableProps } from 'react-native'
import { BorderRadius, Colors, SemanticColors, Shadows, Spacing, Typography } from '@/constants/theme'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'md' | 'lg'

interface ButtonProps extends PressableProps {
  title: string
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

export function Button({
  title,
  variant = 'primary',
  size = 'lg',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style as object,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.text : Colors.accent} size="small" />
      ) : (
        <Text style={[styles.label, size === 'md' && styles.labelMd, styles[`${variant}Label`]]}>{title}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    minHeight: 52,
    ...Shadows.soft,
  },
  md: {
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 16,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.45,
  },

  primary: {
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    shadowColor: Colors.accent,
    shadowOpacity: 0.24,
    shadowRadius: 22,
  },
  secondary: {
    backgroundColor: SemanticColors.surfaceSecondary,
    borderWidth: 1,
    borderColor: SemanticColors.hairline,
  },
  outline: {
    borderWidth: 1,
    borderColor: SemanticColors.hairlineStrong,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  label: {
    ...Typography.bodyStrong,
  },
  labelMd: {
    fontSize: 15,
    lineHeight: 20,
  },
  primaryLabel: {
    color: Colors.text,
  },
  secondaryLabel: {
    color: Colors.text,
  },
  outlineLabel: {
    color: Colors.text,
  },
  ghostLabel: {
    color: Colors.textSecondary,
  },
})
