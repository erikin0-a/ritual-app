import { View, Text, StyleSheet } from 'react-native'
import { Colors, Spacing, Typography } from '@/constants/theme'

// TODO: implement Stories mode
export default function StoriesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Истории</Text>
      <Text style={styles.subtitle}>Короткие сценарии · Скоро</Text>
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
  },
})
