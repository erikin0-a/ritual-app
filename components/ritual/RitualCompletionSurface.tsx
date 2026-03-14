import { StyleSheet, Text, View, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, Fonts } from '@/constants/theme'
import { LiquidBackground } from '@/components/ui/LiquidBackground'

interface RitualCompletionSurfaceProps {
  title: string
  body: string
  onRestart: () => void
  onClose: () => void
}

export function RitualCompletionSurface({
  title,
  body,
  onRestart,
  onClose,
}: RitualCompletionSurfaceProps) {
  const insets = useSafeAreaInsets()

  const restartPressed = useSharedValue(0)
  const closePressed = useSharedValue(0)

  const restartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(restartPressed.value, [0, 1], [1, 0.97]) }],
    opacity: interpolate(restartPressed.value, [0, 1], [1, 0.75]),
  }))
  const closeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(closePressed.value, [0, 1], [1, 0.97]) }],
    opacity: interpolate(closePressed.value, [0, 1], [1, 0.75]),
  }))

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + 24, paddingTop: insets.top + 24 }]}>
      <LiquidBackground intensity={0.6} />

      {/* Mark */}
      <Animated.View entering={FadeIn.duration(1400)} style={styles.markContainer}>
        <Text style={styles.mark}>✦</Text>
      </Animated.View>

      {/* Copy */}
      <Animated.View entering={FadeInDown.delay(300).duration(900)} style={styles.copyBlock}>
        <Text style={styles.eyebrow}>РИТУАЛ ЗАВЕРШЁН</Text>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.divider} />
        <Text style={styles.body}>{body}</Text>
      </Animated.View>

      {/* Actions */}
      <Animated.View entering={FadeInDown.delay(700).duration(800)} style={styles.actions}>
        <Pressable
          onPressIn={() => { restartPressed.value = withTiming(1, { duration: 120 }) }}
          onPressOut={() => { restartPressed.value = withTiming(0, { duration: 250 }) }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null)
            onRestart()
          }}
        >
          <Animated.View style={[styles.btnSecondary, restartStyle]}>
            <Text style={styles.btnSecondaryText}>ПРОЙТИ ЕЩЁ РАЗ</Text>
          </Animated.View>
        </Pressable>

        <Pressable
          onPressIn={() => { closePressed.value = withTiming(1, { duration: 120 }) }}
          onPressOut={() => { closePressed.value = withTiming(0, { duration: 250 }) }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null)
            onClose()
          }}
        >
          <Animated.View style={[styles.btnPrimary, closeStyle]}>
            <Text style={styles.btnPrimaryText}>ЗАКРЫТЬ</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: 32,
  },
  markContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(194,24,91,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(194,24,91,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    fontSize: 28,
    color: Colors.accent,
  },
  copyBlock: {
    alignItems: 'center',
    gap: 16,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 3.5,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 38,
    color: '#fff',
    fontWeight: '300',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  divider: {
    width: 32,
    height: 1,
    backgroundColor: 'rgba(194,24,91,0.4)',
  },
  body: {
    fontSize: 15,
    color: 'rgba(245,240,242,0.5)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '300',
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  btnPrimary: {
    width: '100%',
    height: 56,
    borderRadius: 999,
    backgroundColor: 'rgba(194,24,91,0.80)',
    borderWidth: 1,
    borderColor: 'rgba(233,30,140,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  btnSecondary: {
    width: '100%',
    height: 52,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
  },
})
