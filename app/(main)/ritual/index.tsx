import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Headphones, Vibrate, Wind, ArrowRight, Sparkles } from 'lucide-react-native'
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Fonts } from '@/constants/theme'
import { useSubscriptionStore } from '@/stores/subscription.store'
import { Analytics } from '@/lib/analytics'
import type { RitualMode } from '@/types'
import { LiquidBackground } from '@/components/ui/LiquidBackground'
import { LinearGradient } from 'expo-linear-gradient'

export default function RitualModeSelectionScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const isPremium = useSubscriptionStore((s) => s.isPremium())

  const handleSelect = (mode: RitualMode) => {
    if (mode === 'guided') {
      Analytics.premiumToggleClicked({
        paywall_source: 'ritual_mode_select',
        has_premium_access: isPremium,
      })
    }
    if (mode === 'guided' && !isPremium) {
      router.push({ pathname: '/paywall', params: { source: 'ritual_mode_select' } })
      return
    }
    router.push({ pathname: '/(main)/ritual/setup', params: { mode } })
  }

  const simplePressed = useSharedValue(0)
  const simpleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(simplePressed.value, [0, 1], [1, 0.98]) }],
    backgroundColor: interpolateColor(
      simplePressed.value,
      [0, 1],
      ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.09)'],
    ),
  }))

  const privPressed = useSharedValue(0)
  const privStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(privPressed.value, [0, 1], [1, 0.98]) }],
  }))

  return (
    <View style={styles.screen}>
      <LiquidBackground />

      <View style={[styles.content, { paddingTop: insets.top + 12 }]}>

        {/* Back button */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.backRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowRight
              size={16}
              color="rgba(255,255,255,0.7)"
              style={{ transform: [{ rotate: '180deg' }] }}
            />
          </Pressable>
        </Animated.View>

        {/* Title block */}
        <Animated.View entering={FadeIn.duration(500).delay(60)} style={styles.titleBlock}>
          <Text style={styles.heading}>РИТУАЛ</Text>
          <Text style={styles.sub}>Выберите глубину{'\n'}вашего погружения.</Text>
        </Animated.View>

        {/* Cards */}
        <View style={styles.cards}>

          {/* Simple (Free) */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)}>
            <Pressable
              onPressIn={() => { simplePressed.value = withTiming(1, { duration: 120 }) }}
              onPressOut={() => { simplePressed.value = withTiming(0, { duration: 240 }) }}
              onPress={() => handleSelect('free')}
            >
              <Animated.View style={[styles.card, styles.simpleCard, simpleStyle]}>
                <Text style={styles.simpleTitle}>Simple</Text>
                <Text style={styles.simpleDesc}>
                  Базовый сенсорный опыт. Таймер и субтитры.
                </Text>
                <View style={styles.simpleFeatList}>
                  <Text style={styles.simpleFeat}>· Круговой таймер</Text>
                  <Text style={styles.simpleFeat}>· Субтитры фраз</Text>
                  <Text style={styles.simpleFeat}>· 5 раундов близости</Text>
                </View>
                <View style={styles.simpleFooter}>
                  <Text style={styles.simpleLink}>НАЧАТЬ БЕСПЛАТНО</Text>
                  <ArrowRight size={13} color="rgba(255,255,255,0.4)" />
                </View>
              </Animated.View>
            </Pressable>
          </Animated.View>

          {/* Privilège (Premium) */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)}>
            <Pressable
              onPressIn={() => { privPressed.value = withTiming(1, { duration: 120 }) }}
              onPressOut={() => { privPressed.value = withTiming(0, { duration: 240 }) }}
              onPress={() => handleSelect('guided')}
            >
              <Animated.View style={[styles.card, styles.privCard, privStyle]}>
                <LinearGradient
                  colors={['rgba(194,24,91,0.08)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.privHeader}>
                  <Text style={styles.privTitle}>Privilège</Text>
                  <Sparkles size={15} color="rgba(255,255,255,0.35)" />
                </View>
                <Text style={styles.privDesc}>
                  Полное сенсорное погружение. Направляющий голос,
                  синхронизированные вибрации и адаптивный звук.
                </Text>
                <View style={styles.features}>
                  <View style={styles.featureRow}>
                    <Headphones size={13} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.featureText}>Иммерсивный голос</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Vibrate size={13} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.featureText}>Синхронная тактильность</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Wind size={13} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.featureText}>Адаптивный звук</Text>
                  </View>
                </View>
                <View style={styles.ctaBtn}>
                  <Text style={styles.ctaText}>ОТКРЫТЬ ДОСТУП</Text>
                </View>
              </Animated.View>
            </Pressable>
          </Animated.View>

        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  backRow: {
    marginBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  titleBlock: {
    marginTop: 20,
    gap: 8,
  },
  heading: {
    fontFamily: Fonts.display,
    fontSize: 44,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '300',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  cards: {
    marginTop: 32,
    gap: 12,
  },
  card: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  // ─── Simple (Free) ─────────────────────────────────────────────────────────
  simpleCard: {
    borderColor: 'rgba(255,255,255,0.10)',
    gap: 12,
  },
  simpleTitle: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: -0.3,
  },
  simpleDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '300',
    lineHeight: 19,
  },
  simpleFeatList: {
    gap: 5,
  },
  simpleFeat: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  simpleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  simpleLink: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  // ─── Privilège (Premium) ───────────────────────────────────────────────────
  privCard: {
    borderColor: 'rgba(194,24,91,0.35)',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 0.2,
    elevation: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  privHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  privTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 28,
    color: '#ffffff',
  },
  privDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '300',
    lineHeight: 20,
    marginBottom: 20,
  },
  features: {
    gap: 11,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  featureText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '300',
    letterSpacing: 0.4,
  },
  ctaBtn: {
    backgroundColor: 'rgba(194,24,91,0.85)',
    paddingVertical: 13,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(233,30,140,0.4)',
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
})
