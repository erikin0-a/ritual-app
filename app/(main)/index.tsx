import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, Fonts, Spacing, Typography } from '@/constants/theme'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'

const ritualImg = require('@/assets/images/ritual-card.png')
const chanceImg = require('@/assets/images/chance-card.png')

export default function ModesHubScreen() {
  const router = useRouter()

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(700)} style={styles.header}>
            <Text style={styles.label}>МЕНЮ НА СЕГОДНЯ</Text>
            <Text style={styles.heading}>Погружения</Text>
          </Animated.View>

          <View style={styles.cards}>
            {/* The Ritual */}
            <Animated.View entering={FadeInDown.duration(600).delay(120)}>
              <Pressable
                style={({ pressed }) => [styles.card, styles.cardTall, pressed && styles.cardPressed]}
                onPress={() => router.push('/(main)/ritual')}
              >
                <Image
                  source={ritualImg}
                  style={styles.cardBg}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0, 0, 0, 0.5)', 'rgba(8,8,8,0.94)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.cardContent}>
                  <View style={styles.cardTextBlock}>
                    <Text style={styles.cardTitle}>The Ritual</Text>
                    <Text style={styles.cardDesc}>Направляемое чувственное погружение.</Text>
                  </View>
                  <View style={styles.beginRow}>
                    <View style={styles.beginLine} />
                    <Text style={styles.beginText}>Попробовать</Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>

            {/* Chance */}
            <Animated.View entering={FadeInDown.duration(600).delay(260)}>
              <Pressable
                style={({ pressed }) => [styles.card, styles.cardShort, pressed && styles.cardPressed]}
                onPress={() => router.push('/(main)/dice')}
              >
                <Image
                  source={chanceImg}
                  style={styles.cardBg}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(8,8,8,0.55)', 'rgba(8,8,8,0.95)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.cardContent}>
                  <View style={styles.cardTextBlock}>
                    <Text style={styles.cardTitle}>Chance</Text>
                    <Text style={styles.cardDesc}>Random actions and spontaneous moments.</Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>

            {/* Mini row: Fantasy + Dice */}
            <View style={styles.miniRow}>
              {/* Fantasy */}
              <View style={[styles.card, styles.cardMini]}>
                <LinearGradient
                  colors={['#1E1035', '#110820', '#080610']}
                  start={{ x: 0.1, y: 0 }}
                  end={{ x: 0.9, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedBadgeText}>СКОРО</Text>
                </View>
                <View style={styles.miniContent}>
                  <Text style={styles.miniTitle}>Fantasy</Text>
                  <Text style={styles.miniDesc}>Сценарии и ролевые истории.</Text>
                </View>
              </View>

              {/* Dice */}
              <View style={[styles.card, styles.cardMini]}>
                <LinearGradient
                  colors={['#0E1E1A', '#080E0C', '#050808']}
                  start={{ x: 0.1, y: 0 }}
                  end={{ x: 0.9, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedBadgeText}>СКОРО</Text>
                </View>
                <View style={styles.miniContent}>
                  <Text style={styles.miniTitle}>Dice</Text>
                  <Text style={styles.miniDesc}>Случайные раунды на удачу.</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  label: {
    ...Typography.label,
    color: Colors.accent,
    letterSpacing: 3,
  },
  heading: {
    fontFamily: Fonts.display,
    fontSize: 42,
    fontWeight: '300' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  cards: {
    gap: Spacing.md,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardTall: {
    height: 300,
  },
  cardShort: {
    height: 200,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  cardBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  cardContent: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'flex-end',
    gap: Spacing.lg,
  },
  cardTextBlock: {
    gap: Spacing.xs + 2,
  },
  cardTitle: {
    fontFamily: Fonts.display,
    fontSize: 30,
    fontWeight: '300' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  cardDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  beginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  beginLine: {
    width: 28,
    height: 1,
    backgroundColor: Colors.accent,
  },
  beginText: {
    ...Typography.label,
    color: Colors.accent,
    letterSpacing: 2.5,
    fontSize: 10,
  },
  miniRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cardMini: {
    flex: 1,
    height: 160,
  },
  lockedBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lockedBadgeText: {
    ...Typography.label,
    fontSize: 9,
    letterSpacing: 1.8,
    color: Colors.textMuted,
  },
  miniContent: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'flex-end',
    gap: 4,
  },
  miniTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    fontWeight: '300' as const,
    color: Colors.text,
  },
  miniDesc: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 12,
  },
})
