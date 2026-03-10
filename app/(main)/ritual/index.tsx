import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView, Image, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useEffect } from 'react'
import { Colors, Fonts, Spacing, Typography } from '@/constants/theme'
import { useSubscriptionStore } from '@/stores/subscription.store'
import { Analytics } from '@/lib/analytics'
import type { RitualMode } from '@/types'

const ritualImg = require('@/assets/images/ritual-card.png')

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'headset-outline', label: 'Иммерсивный голос' },
  { icon: 'phone-portrait-outline', label: 'Синхронная тактильность' },
  { icon: 'pulse-outline', label: 'Адаптивный звук' },
]

function ShimmerCard({ children, style }: { children: React.ReactNode; style?: object }) {
  const translateX = useSharedValue(-300)

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(400, { duration: 3200, easing: Easing.inOut(Easing.quad) }),
      -1,
      false,
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  return (
    <View style={style}>
      {children}
      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle, styles.shimmerWrap]} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.04)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGrad}
        />
      </Animated.View>
    </View>
  )
}

export default function RitualModeSelectionScreen() {
  const router = useRouter()
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

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
          <Text style={styles.topLabel}>УРОВЕНЬ ПОГРУЖЕНИЯ</Text>
          <View style={styles.backSpacer} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centerContent}>
            {/* Title */}
          <Animated.View entering={FadeIn.duration(600).delay(80)} style={styles.titleBlock}>
            <Text style={styles.heading}>Ритуал</Text>
            <Text style={styles.sub}>Выберите глубину погружения.</Text>
          </Animated.View>

          {/* Premium card */}
          <Animated.View entering={FadeInDown.duration(700).delay(180)}>
            <Pressable
              style={({ pressed }) => [pressed && styles.cardPressed]}
              onPress={() => handleSelect('guided')}
            >
              <ShimmerCard style={styles.premiumCard}>
                {/* Background Image */}
                <Image
                  source={ritualImg}
                  style={styles.cardBg}
                  resizeMode="cover"
                />
                
                {/* Background gradient */}
                <LinearGradient
                  colors={['rgba(210,46,136,0.3)', '#0a0a0a', '#000000']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                {/* Title row */}
                <View style={styles.premiumTitleRow}>
                  <Text style={styles.premiumTitle}>Privilège</Text>
                  <View style={styles.sparkleCircle}>
                    <Ionicons name="sparkles-outline" size={16} color={Colors.accent} />
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.premiumDesc}>
                  Полное сенсорное погружение. Направляющий голос, синхронизированные вибрации и адаптивный звуковой ландшафт.
                </Text>

                {/* Features */}
                <View style={styles.featureList}>
                  {FEATURES.map((f) => (
                    <View key={f.icon} style={styles.featureRow}>
                      <Ionicons name={f.icon} size={16} color="rgba(255,255,255,0.5)" />
                      <Text style={styles.featureText}>{f.label}</Text>
                    </View>
                  ))}
                </View>

                {/* CTA Button */}
                <View style={styles.ctaBtn}>
                  <Text style={styles.ctaText}>ОТКРЫТЬ ДОСТУП</Text>
                </View>
              </ShimmerCard>
            </Pressable>
          </Animated.View>

          {/* Free card */}
          <Animated.View entering={FadeInDown.duration(700).delay(320)}>
            <Pressable
              style={({ pressed }) => [styles.freeCard, pressed && styles.cardPressed]}
              onPress={() => handleSelect('free')}
            >
              <View style={styles.freeTop}>
                <Text style={styles.freeTitle}>Essential</Text>
                <Text style={styles.freeDesc}>
                  Базовый текстовый сценарий с таймером.
                </Text>
              </View>
              <View style={styles.freeFooter}>
                <Text style={styles.freeLink}>Продолжить</Text>
                <Ionicons name="arrow-back" size={14} color="rgba(255,255,255,0.5)" style={{ transform: [{ rotate: '180deg' }] }} />
              </View>
            </Pressable>
          </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safe: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  topLabel: {
    ...Typography.label,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.4)',
  },
  backSpacer: {
    width: 40,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.md,
    minHeight: '85%', // Force height to centering works
    paddingBottom: 40,
  },
  titleBlock: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: 2,
    gap: Spacing.xs,
  },
  heading: {
    fontFamily: Platform.OS === 'ios' ? 'Didot' : Fonts.display,
    fontSize: 42,
    fontWeight: '400' as const, // Didot regular is naturally thin/elegant
    color: '#ffffff',
    letterSpacing: 0, // Didot handles spacing well
  },
  sub: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '300' as const,
    marginBottom: Spacing.md,
  },
  premiumCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  shimmerWrap: {
    overflow: 'hidden',
    borderRadius: 24,
  },
  shimmerGrad: {
    width: 120,
    height: '100%',
  },
  premiumTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumTitle: {
    fontFamily: Fonts.display,
    fontSize: 30,
    fontWeight: '300' as const,
    color: '#ffffff',
  },
  sparkleCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(210,46,136,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(210,46,136,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },
  premiumDesc: {
    fontFamily: Fonts.display,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '300' as const,
    lineHeight: 21,
  },
  featureList: {
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureText: {
    fontFamily: Fonts.display,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '300' as const,
    letterSpacing: 0.2,
  },
  ctaBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  freeCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.xl,
    gap: Spacing.xl,
    justifyContent: 'space-between',
  },
  freeTop: {
    gap: Spacing.sm,
  },
  freeTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    fontWeight: '300' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  freeDesc: {
    fontFamily: Fonts.display,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '300' as const,
    lineHeight: 20,
  },
  freeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  freeLink: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
    fontSize: 11,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  cardBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
})
