import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Lock, ChevronRight } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  interpolateColor,
  FadeInDown,
  withTiming,
  FadeIn,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LiquidBackground } from '@/components/ui/LiquidBackground'
import { Skeleton } from '@/components/ui/Skeleton'
import { Fonts } from '@/constants/theme'

const modes = [
  { 
    id: 'ritual', 
    title: 'Ритуал', 
    desc: 'Направляемое путешествие для двоих', 
    active: true,
    image: require('@/assets/images/ritual-card.png'),
    num: '01'
  },
  { 
    id: 'dice', 
    title: 'Случайность', 
    desc: 'Доверьтесь воле случая', 
    active: false,
    image: require('@/assets/images/chance-card.png'),
    num: '02'
  },
  { 
    id: 'stories', 
    title: 'Фантазии', 
    desc: 'Сюжетные ролевые погружения', 
    active: false,
    image: require('@/assets/images/chance-card.png'), // placeholder
    num: '03'
  },
]

function StrictModeRow({ mode, index, router }: { mode: typeof modes[0], index: number, router: any }) {
  const isPressed = useSharedValue(0)
  
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(isPressed.value, [0, 1], [1, 0.98]) }],
    backgroundColor: interpolateColor(
      isPressed.value, 
      [0, 1], 
      ['rgba(255,255,255,0)', 'rgba(255,255,255,0.03)']
    )
  }))

  return (
    <Animated.View entering={FadeInDown.delay(index * 200).duration(1000).springify()}>
      <Pressable
        onPressIn={() => { isPressed.value = withTiming(1, { duration: 150 }) }}
        onPressOut={() => { isPressed.value = withTiming(0, { duration: 300 }) }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
          if (mode.active) {
            router.push(`/(main)/${mode.id}`)
          }
        }}
        disabled={!mode.active}
      >
        <Animated.View style={[styles.rowContainer, !mode.active && styles.rowInactive, pressStyle]}>
          <Image source={mode.image} style={styles.rowImage} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(13,10,15,0.82)', 'rgba(13,10,15,0.96)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          {mode.active && <View style={styles.activeAccentBar} />}
          
          <View style={styles.rowLeft}>
            <Text style={styles.rowNum}>{mode.num}</Text>
            <View>
              <Text style={styles.rowTitle}>{mode.title}</Text>
              <Text style={styles.rowDesc}>{mode.desc}</Text>
            </View>
          </View>

          <View style={styles.rowRight}>
            {mode.active ? (
              <View style={styles.beginIndicator}>
                <ChevronRight color="rgba(194,24,91,0.8)" size={18} strokeWidth={1.5} />
              </View>
            ) : (
              <View style={styles.lockCircle}>
                <Lock color="rgba(255,255,255,0.4)" size={14} />
              </View>
            )}
          </View>
          
          {/* Very thin separator line at the bottom */}
          <View style={styles.separator} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}

export default function ModesHubScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={styles.container}>
      <LiquidBackground />

      <Animated.View entering={FadeIn.duration(1200)} style={[styles.header, { paddingTop: insets.top + 24 }]}>
        {isLoading ? (
          <View style={{ gap: 16 }}>
             <Skeleton style={{ width: 100, height: 10 }} />
             <Skeleton style={{ width: 220, height: 40 }} />
          </View>
        ) : (
          <View>
            <Text style={styles.subtitle}>Коллекция</Text>
            <Text style={styles.title}>
              Погружения <Text style={styles.titleItalic}>aura</Text>
            </Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={{ gap: 32, marginTop: 40 }}>
            <Skeleton style={{ width: '100%', height: 80, borderRadius: 0 }} />
            <Skeleton style={{ width: '100%', height: 80, borderRadius: 0 }} />
            <Skeleton style={{ width: '100%', height: 80, borderRadius: 0 }} />
          </View>
        ) : (
          <View style={styles.menuWrapper}>
            {modes.map((mode, idx) => (
              <StrictModeRow 
                key={mode.id} 
                mode={mode} 
                index={idx} 
                router={router} 
              />
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0A0F',
  },
  header: {
    paddingHorizontal: 32,
    zIndex: 30,
    width: '100%',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: 16,
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
  listContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  menuWrapper: {
    gap: 0,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  rowInactive: {
    opacity: 0.5,
  },
  rowImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.15,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  rowNum: {
    fontFamily: Fonts.display,
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    fontStyle: 'italic',
  },
  rowTitle: {
    fontSize: 28,
    fontFamily: Fonts.display,
    color: 'white',
    marginBottom: 6,
  },
  rowDesc: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  rowRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  beginIndicator: {
    width: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  activeAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(194,24,91,0.6)',
  },
  lockCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  separator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
})
