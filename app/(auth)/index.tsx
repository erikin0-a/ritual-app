import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  FadeInDown,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, Fonts } from '@/constants/theme'

const { height: SCREEN_H } = Dimensions.get('window')

// Each phrase: [prefix, italic last word]
const PHRASES: [string, string][] = [
  ['Искусство ', 'близости'],
  ['Истинное ', 'притяжение'],
  ['За гранью ', 'привычного'],
  ['Эстетика ', 'чувств'],
]

function CyclingPhrase() {
  const [index, setIndex] = useState(0)
  const opacity = useSharedValue(1)
  const translateY = useSharedValue(0)

  const advance = useCallback(() => {
    opacity.value = withTiming(0, { duration: 600, easing: Easing.in(Easing.ease) }, (done) => {
      if (!done) return
      translateY.value = 20
      runOnJS(setIndex)((prev) => (prev + 1) % PHRASES.length)
      opacity.value = withTiming(1, { duration: 750, easing: Easing.out(Easing.ease) })
      translateY.value = withTiming(0, { duration: 750, easing: Easing.out(Easing.cubic) })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = globalThis.setInterval(advance, 4000)
    return () => globalThis.clearInterval(timer)
  }, [advance])

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const [prefix, italic] = PHRASES[index]

  return (
    <Animated.Text style={[styles.phraseText, animStyle]}>
      {prefix}
      <Text style={styles.phraseItalic}>{italic}</Text>
    </Animated.Text>
  )
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const scale = useSharedValue(1)
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Pressable
      onPressIn={() => { scale.value = withTiming(0.97, { duration: 120 }) }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 200 }) }}
      onPress={onPress}
    >
      <Animated.View style={[styles.primaryBtn, btnStyle]}>
        <Text style={styles.primaryBtnText}>{label}</Text>
      </Animated.View>
    </Pressable>
  )
}

function SocialButton({ label, onPress }: { label: string; onPress: () => void }) {
  const scale = useSharedValue(1)
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Pressable
      onPressIn={() => { scale.value = withTiming(0.97, { duration: 120 }) }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 200 }) }}
      onPress={onPress}
    >
      <Animated.View style={[styles.socialBtn, btnStyle]}>
        <Text style={styles.socialBtnText}>{label}</Text>
      </Animated.View>
    </Pressable>
  )
}

function goToOnboarding() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
  router.replace('/(auth)/onboarding')
}

export default function AuthScreen() {
  return (
    <View style={styles.container}>
      {/* Top half — animated phrase */}
      <View style={styles.phraseArea}>
        <CyclingPhrase />
      </View>

      {/* Bottom — buttons */}
      <Animated.View
        entering={FadeInDown.duration(900).delay(300).springify().damping(22)}
        style={styles.buttonArea}
      >
        <PrimaryButton label="НАЧАТЬ СЕЙЧАС" onPress={goToOnboarding} />

        <View style={styles.socialGroup}>
          <SocialButton label="Войти через Apple" onPress={goToOnboarding} />
          <SocialButton label="Войти через Google" onPress={goToOnboarding} />
        </View>

        <View style={styles.linkRow}>
          <Pressable onPress={goToOnboarding} hitSlop={12}>
            <Text style={styles.linkText}>РЕГИСТРАЦИЯ</Text>
          </Pressable>
          <Pressable onPress={goToOnboarding} hitSlop={12}>
            <Text style={styles.linkText}>ВОЙТИ</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  phraseArea: {
    height: SCREEN_H * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  phraseText: {
    fontFamily: Fonts.display,
    fontSize: 44,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 52,
    letterSpacing: -0.5,
  },
  phraseItalic: {
    fontFamily: Fonts.displayItalic,
    fontStyle: 'italic',
    fontWeight: '300',
    color: 'rgba(255,255,255,0.75)',
  },
  buttonArea: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 48,
    justifyContent: 'flex-end',
    gap: 16,
  },
  primaryBtn: {
    backgroundColor: '#F5F2ED',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  socialGroup: {
    gap: 10,
  },
  socialBtn: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBtnText: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.8,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  linkText: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
})
