import { View, Text, StyleSheet, Pressable, SafeAreaView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { Sparkles, Headphones, Vibrate, Wind, ArrowRight } from 'lucide-react-native'
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withTiming, interpolate, interpolateColor } from 'react-native-reanimated'
import { useState, useEffect } from 'react'
import { Fonts } from '@/constants/theme'
import { useSubscriptionStore } from '@/stores/subscription.store'
import { Analytics } from '@/lib/analytics'
import type { RitualMode } from '@/types'
import { LiquidBackground } from '@/components/ui/LiquidBackground'
import { Skeleton } from '@/components/ui/Skeleton'
import { LinearGradient } from 'expo-linear-gradient'

export default function RitualModeSelectionScreen() {
  const router = useRouter()
  const isPremium = useSubscriptionStore((s) => s.isPremium())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

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

  // Press Animations
  const privPressed = useSharedValue(0)
  const privStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(privPressed.value, [0, 1], [1, 0.98]) }],
    borderColor: interpolateColor(privPressed.value, [0, 1], ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)']),
  }))

  const freePressed = useSharedValue(0)
  const freeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(freePressed.value, [0, 1], [1, 0.98]) }],
    backgroundColor: interpolateColor(freePressed.value, [0, 1], ['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.03)']),
  }))

  return (
    <View style={styles.screen}>
      <LiquidBackground />
      
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* Header */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <ArrowRight size={16} color="rgba(255,255,255,0.7)" style={{ transform: [{ rotate: '180deg' }] }} />
            </Pressable>
            <Text style={styles.topLabel}>ПОГРУЖЕНИЕ</Text>
            <View style={styles.backSpacer} />
          </Animated.View>

          {/* Title Area */}
          <View style={styles.titleArea}>
            {isLoading ? (
              <View style={{ gap: 8 }}>
                <Skeleton style={{ width: 140, height: 32 }} />
                <Skeleton style={{ width: 200, height: 12 }} />
              </View>
            ) : (
              <Animated.View entering={FadeIn.duration(600).delay(100)}>
                <Text style={styles.heading}>
                  Ритуал <Text style={styles.headingItalic}>depth</Text>
                </Text>
                <Text style={styles.sub}>Выберите глубину вашего опыта.</Text>
              </Animated.View>
            )}
          </View>

          <View style={styles.cardsWrapper}>
            {isLoading ? (
              <View style={{ gap: 16 }}>
                <Skeleton style={{ width: '100%', height: 320, borderRadius: 24 }} />
                <Skeleton style={{ width: '100%', height: 80, borderRadius: 16 }} />
              </View>
            ) : (
              <>
                {/* Premium Mode */}
                <Animated.View entering={FadeInDown.duration(700).delay(200)} style={styles.premiumWrapper}>
                  <Pressable
                    style={styles.pressableArea}
                    onPressIn={() => { privPressed.value = withTiming(1, { duration: 150 }) }}
                    onPressOut={() => { privPressed.value = withTiming(0, { duration: 300 }) }}
                    onPress={() => handleSelect('guided')}
                  >
                    <Animated.View style={[styles.premiumCardContainer, privStyle]}>
                      <LinearGradient
                        colors={['rgba(255,255,255,0.03)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      
                      <View style={styles.premiumHeader}>
                        <Text style={styles.premiumTitle}>Privilège</Text>
                        <Sparkles size={16} color="rgba(255,255,255,0.4)" />
                      </View>
                      
                      <Text style={styles.premiumDesc}>
                        Полное сенсорное погружение. Направляющий голос, бинауральный звук и тактильная синхронизация.
                      </Text>
                      
                      <View style={styles.features}>
                        <View style={styles.featureRow}>
                          <Headphones size={14} color="rgba(255,255,255,0.3)" />
                          <Text style={styles.featureText}>Иммерсивный голос</Text>
                        </View>
                        <View style={styles.featureRow}>
                          <Vibrate size={14} color="rgba(255,255,255,0.3)" />
                          <Text style={styles.featureText}>Тактильность</Text>
                        </View>
                        <View style={styles.featureRow}>
                          <Wind size={14} color="rgba(255,255,255,0.3)" />
                          <Text style={styles.featureText}>Адаптивный звук</Text>
                        </View>
                      </View>

                      <View style={styles.ctaBtn}>
                        <Text style={styles.ctaText}>ОТКРЫТЬ ДОСТУП</Text>
                      </View>
                    </Animated.View>
                  </Pressable>
                </Animated.View>

                {/* Free Mode (Essential) */}
                <Animated.View entering={FadeInDown.duration(700).delay(350)} style={styles.freeWrapper}>
                  <Pressable
                    style={styles.pressableArea}
                    onPressIn={() => { freePressed.value = withTiming(1, { duration: 150 }) }}
                    onPressOut={() => { freePressed.value = withTiming(0, { duration: 300 }) }}
                    onPress={() => handleSelect('free')}
                  >
                    <Animated.View style={[styles.freeCardContainer, freeStyle]}>
                      <View>
                        <Text style={styles.freeTitle}>Essential <Text style={styles.freeDesc}>— Текстовый сценарий</Text></Text>
                      </View>
                      <View style={styles.freeFooter}>
                        <Text style={styles.freeLink}>ПРОДОЛЖИТЬ</Text>
                        <ArrowRight size={14} color="rgba(255,255,255,0.4)" />
                      </View>
                    </Animated.View>
                  </Pressable>
                </Animated.View>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0D0A0F',
  },
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
    fontSize: 9,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
  },
  backSpacer: {
    width: 40,
  },
  titleArea: {
    paddingVertical: 24,
  },
  heading: {
    fontFamily: Fonts.display,
    fontSize: 40,
    color: '#fff',
    letterSpacing: -1,
  },
  headingItalic: {
    fontStyle: 'italic',
    fontWeight: '300',
    color: 'rgba(255,255,255,0.6)',
  },
  sub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '300',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  cardsWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 16,
  },
  pressableArea: {
    width: '100%',
  },
  premiumWrapper: {
    marginBottom: 8,
  },
  premiumCardContainer: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumTitle: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: '#fff',
  },
  premiumDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '300',
    lineHeight: 20,
    marginBottom: 24,
  },
  features: {
    gap: 12,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  ctaBtn: {
    backgroundColor: 'rgba(194,24,91,0.85)',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(233,30,140,0.4)',
  },
  ctaText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  freeWrapper: {
    width: '100%',
  },
  freeCardContainer: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  freeTitle: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
  },
  freeDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'San Francisco' : 'sans-serif',
  },
  freeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freeLink: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    letterSpacing: 1.5,
  },
})
