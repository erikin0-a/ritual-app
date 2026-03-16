import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, ImageBackground, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { Lock } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  withTiming,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LiquidBackground } from '@/components/ui/LiquidBackground'
import { Skeleton } from '@/components/ui/Skeleton'
import { Colors, Fonts } from '@/constants/theme'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

const { height: SCREEN_H } = Dimensions.get('window')
const CARD_HEIGHT = SCREEN_H * 0.5

const modes = [
  {
    id: 'ritual',
    title: 'Ритуал',
    desc: 'Направляемое путешествие для двоих',
    active: true,
    image: require('@/assets/images/ritual-card.png'),
  },
  {
    id: 'dice',
    title: 'Случайность',
    desc: 'Доверьтесь воле случая',
    active: false,
    image: require('@/assets/images/chance-card.png'),
  },
  {
    id: 'stories',
    title: 'Фантазии',
    desc: 'Сюжетные ролевые погружения',
    active: false,
    image: require('@/assets/images/chance-card.png'),
  },
]

function ModeCard({
  mode,
  index,
  router,
}: {
  mode: (typeof modes)[0]
  index: number
  router: ReturnType<typeof useRouter>
}) {
  const scale = useSharedValue(1)

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 180).duration(900).springify().damping(22)}
      style={pressStyle}
    >
      <Pressable
        onPressIn={() => {
          if (mode.active) scale.value = withTiming(0.985, { duration: 140 })
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 260 })
        }}
        onPress={() => {
          if (!mode.active) return
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
          router.push(`/(main)/${mode.id}` as never)
        }}
      >
        <View style={[styles.card, !mode.active && styles.cardLocked]}>
          <ImageBackground
            source={mode.image}
            style={styles.cardImage}
            resizeMode="cover"
          >
            {/* Bottom-up gradient overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
              locations={[0.3, 0.65, 1]}
              style={StyleSheet.absoluteFill}
            />

            {/* Lock badge — top right */}
            {!mode.active && (
              <View style={styles.lockBadge}>
                <Lock color="rgba(255,255,255,0.55)" size={13} />
              </View>
            )}

            {/* Card content — bottom */}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{mode.title}</Text>
              <Text style={styles.cardDesc}>{mode.desc}</Text>
              {mode.active && (
                <View style={styles.startRow}>
                  <View style={styles.startDash} />
                  <Text style={styles.startLabel}>НАЧАТЬ</Text>
                </View>
              )}
            </View>
          </ImageBackground>
        </View>
      </Pressable>
    </Animated.View>
  )
}

export default function ModesHubScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [isLoading, setIsLoading] = useState(true)
  const scrollY = useSharedValue(0)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y
  })

  const headerBlurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [0, 1], 'clamp'),
  }))

  const headerHeight = insets.top + 100

  return (
    <View style={styles.container}>
      <LiquidBackground />

      {/* Floating header — fixed over ScrollView */}
      <Animated.View
        entering={FadeIn.duration(1200)}
        style={[styles.header, { paddingTop: insets.top + 24, height: headerHeight }]}
      >
        {/* Backdrop blur + dark overlay — fades in at scroll > 80 */}
        <AnimatedBlurView
          intensity={20}
          tint="dark"
          style={[StyleSheet.absoluteFill, headerBlurStyle]}
          pointerEvents="none"
        />
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.headerOverlay, headerBlurStyle]}
          pointerEvents="none"
        />
        {isLoading ? (
          <View style={{ gap: 16 }}>
            <Skeleton style={{ width: 100, height: 10 }} />
            <Skeleton style={{ width: 220, height: 40 }} />
          </View>
        ) : (
          <View>
            <Text style={styles.subtitle}>КОЛЛЕКЦИЯ</Text>
            <Text style={styles.title}>
              Погружения <Text style={styles.titleItalic}>aura</Text>
            </Text>
          </View>
        )}
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight }]}
      >
        {isLoading ? (
          <View style={{ gap: 16, paddingHorizontal: 20, marginTop: 16 }}>
            <Skeleton style={{ width: '100%', height: CARD_HEIGHT, borderRadius: 24 }} />
            <Skeleton style={{ width: '100%', height: CARD_HEIGHT, borderRadius: 24 }} />
          </View>
        ) : (
          <View style={styles.cardsWrapper}>
            {modes.map((mode, idx) => (
              <ModeCard key={mode.id} mode={mode} index={idx} router={router} />
            ))}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0A0F',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    zIndex: 30,
    justifyContent: 'flex-end',
    paddingBottom: 20,
    overflow: 'hidden',
  },
  headerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: 14,
  },
  title: {
    fontSize: 36,
    fontFamily: Fonts.display,
    color: 'white',
  },
  titleItalic: {
    fontStyle: 'italic',
    fontWeight: '300',
    color: 'rgba(255,255,255,0.6)',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  cardsWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardLocked: {
    opacity: 0.42,
  },
  cardImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  lockBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    paddingHorizontal: 28,
    paddingBottom: 32,
    gap: 8,
  },
  cardTitle: {
    fontSize: 28,
    fontFamily: Fonts.display,
    color: '#fff',
    letterSpacing: -0.3,
  },
  cardDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.4,
    fontWeight: '400',
  },
  startRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  startDash: {
    width: 20,
    height: 1,
    backgroundColor: 'rgba(194,24,91,0.8)',
  },
  startLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: 'rgba(194,24,91,0.85)',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
})
