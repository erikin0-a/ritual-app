import { View, StyleSheet, type ViewProps } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing } from '@/constants/theme'

interface ScreenContainerProps extends ViewProps {
  /** Use SafeAreaView to handle notches/home indicators (default: true) */
  safe?: boolean
  /** Horizontal+vertical padding (default: Spacing.xl) */
  padded?: boolean
  centered?: boolean
}

export function ScreenContainer({ safe = true, padded = true, centered = false, style, children, ...rest }: ScreenContainerProps) {
  const content = (
    <View
      style={[
        styles.inner,
        padded && styles.padded,
        centered && styles.centered,
        style as object,
      ]}
      {...rest}
    >
      {children}
    </View>
  )

  if (safe) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {content}
      </SafeAreaView>
    )
  }

  return content
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  padded: {
    padding: Spacing.xl,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
