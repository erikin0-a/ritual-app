import { View, Text, StyleSheet } from 'react-native'
import { Colors, Spacing, Typography } from '@/constants/theme'

// TODO: implement Truth or Dare mode
export default function TruthOrDareScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Правда или Действие</Text>
      <Text style={styles.subtitle}>Категории: Лёгкий · Острый · Дикий · Скоро</Text>
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
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
})
