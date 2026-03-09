import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme'
import { AppBackground } from '@/components/ui/AmbientBackground'
import { Logo } from '@/components/ui/Logo'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')

const MODES = [
  {
    id: 'ritual',
    title: 'Ritual',
    subtitle: 'Основной режим',
    description: 'Пять раундов близости. От взгляда до развязки.',
    route: '/(main)/ritual' as const,
    featured: true,
    delay: 100,
  },
  {
    id: 'dice',
    title: 'Dice',
    subtitle: 'Игра',
    description: 'Случайные действия и позы.',
    route: '/(main)/dice' as const,
    featured: false,
    delay: 200,
  },
  {
    id: 'stories',
    title: 'Stories',
    subtitle: 'Скоро',
    description: 'Эротические сценарии.',
    route: null,
    featured: false,
    disabled: true,
    delay: 300,
  },
]

export default function ModesHubScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <AppBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <Animated.View entering={FadeInUp.duration(800).delay(300)} style={styles.header}>
            <View style={styles.logoContainer}>
              <Logo width={32} height={28} />
            </View>
            <Text style={styles.headerTitle}>Nightly</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(400)}>
            <Text style={styles.sectionTitle}>Выберите режим</Text>
            <Text style={styles.sectionSubtitle}>Как вы хотите провести этот вечер?</Text>
          </Animated.View>

          <View style={styles.grid}>
            {MODES.map((mode, index) => (
              <Animated.View 
                key={mode.id} 
                entering={FadeInDown.duration(600).delay(mode.delay + 400)}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.card,
                    mode.featured && styles.cardFeatured,
                    mode.disabled && styles.cardDisabled,
                    pressed && !mode.disabled && styles.cardPressed
                  ]}
                  onPress={() => mode.route && router.push(mode.route)}
                  disabled={mode.disabled}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardTitle, mode.featured && styles.cardTitleFeatured]}>
                        {mode.title}
                      </Text>
                      {mode.subtitle && (
                        <View style={[styles.subtitleBadge, mode.featured && styles.subtitleBadgeFeatured]}>
                          <Text style={[styles.cardSubtitle, mode.featured && styles.cardSubtitleFeatured]}>
                            {mode.subtitle}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardDescription}>{mode.description}</Text>
                  </View>
                  
                  {mode.featured && (
                    <View style={styles.startBadge}>
                      <Text style={styles.startBadgeText}>→</Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    height: '100%', // Ensure full height
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl * 2, // Add extra padding at bottom
    gap: Spacing.xl,
    minHeight: '100%', // Ensure content stretches
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  headerTitle: {
    ...Typography.h3,
    fontSize: 20,
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  sectionTitle: {
    ...Typography.h1,
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  grid: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 100,
  },
  cardFeatured: {
    backgroundColor: 'rgba(210, 46, 136, 0.08)', // Accent color with very low opacity
    borderColor: 'rgba(210, 46, 136, 0.3)',
    paddingVertical: Spacing.xl,
  },
  cardDisabled: {
    opacity: 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: 4,
  },
  cardTitle: {
    ...Typography.h2,
    fontSize: 22,
  },
  cardTitleFeatured: {
    color: Colors.accent,
    textShadowColor: 'rgba(210, 46, 136, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  subtitleBadgeFeatured: {
    backgroundColor: 'rgba(210, 46, 136, 0.2)',
  },
  cardSubtitle: {
    ...Typography.caption,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  cardSubtitleFeatured: {
    color: Colors.accent,
  },
  cardDescription: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    maxWidth: '95%',
  },
  startBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  startBadgeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: -2,
  },
})
