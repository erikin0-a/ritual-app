import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Typography } from '@/constants/theme'

export default function HomeScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ritual</Text>
      <Text style={styles.subtitle}>Создайте близость вместе</Text>

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.push('/(main)/ritual')}
      >
        <Text style={styles.primaryButtonText}>Начать Ritual</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 32,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    ...Typography.h3,
    color: Colors.text,
  },
})
