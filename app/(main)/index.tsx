import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme'

const MODES = [
  {
    emoji: '🔥',
    title: 'Ритуал',
    description: 'Пять раундов близости с таймерами и заданиями',
    route: '/(main)/ritual' as const,
  },
  {
    emoji: '🎲',
    title: 'Кубики',
    description: 'Случайные действия, части тела и стиль — всё в игре',
    route: '/(main)/dice' as const,
  },
  {
    emoji: '🎭',
    title: 'Правда или Дело',
    description: 'Вопросы и задания для двоих',
    route: '/(main)/truth-or-dare' as const,
  },
  {
    emoji: '📖',
    title: 'Истории',
    description: 'Эротические сценарии для чтения вместе',
    route: '/(main)/stories' as const,
  },
]

export default function ModesHubScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.appName}>Nightly</Text>
          <Text style={styles.tagline}>Ваш ежевечерний ритуал близости</Text>
        </View>

        <View style={styles.grid}>
          {MODES.map((mode) => (
            <Pressable
              key={mode.route}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(mode.route)}
            >
              <Text style={styles.cardEmoji}>{mode.emoji}</Text>
              <Text style={styles.cardTitle}>{mode.title}</Text>
              <Text style={styles.cardDescription}>{mode.description}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xl,
  },
  header: {
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  appName: {
    fontSize: 38,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -1,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  grid: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardPressed: {
    opacity: 0.75,
    borderColor: Colors.accent,
  },
  cardEmoji: {
    fontSize: 32,
  },
  cardTitle: {
    ...Typography.h3,
  },
  cardDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
})
