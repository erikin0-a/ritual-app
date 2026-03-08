import { Text, type TextProps } from 'react-native'
import { Typography, Colors } from '@/constants/theme'

type Preset = 'h1' | 'h2' | 'h3' | 'body' | 'caption'

interface RitualTextProps extends TextProps {
  preset?: Preset
  color?: string
}

/**
 * Themed text component using the design system presets.
 * Usage: <RitualText preset="h1">Title</RitualText>
 */
export function RitualText({ preset = 'body', color, style, children, ...rest }: RitualTextProps) {
  return (
    <Text
      style={[Typography[preset], color ? { color } : {}, style as object]}
      {...rest}
    >
      {children}
    </Text>
  )
}

// Convenience shorthand components
export const H1 = (props: Omit<RitualTextProps, 'preset'>) => <RitualText preset="h1" {...props} />
export const H2 = (props: Omit<RitualTextProps, 'preset'>) => <RitualText preset="h2" {...props} />
export const H3 = (props: Omit<RitualTextProps, 'preset'>) => <RitualText preset="h3" {...props} />
export const BodyText = (props: Omit<RitualTextProps, 'preset'>) => <RitualText preset="body" {...props} />
export const Caption = (props: Omit<RitualTextProps, 'preset'>) => (
  <RitualText preset="caption" color={Colors.textSecondary} {...props} />
)
