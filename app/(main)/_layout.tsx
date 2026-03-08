import { Stack } from 'expo-router'
import { Colors } from '@/constants/theme'

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="dice" />
      <Stack.Screen name="truth-or-dare" />
      <Stack.Screen name="stories" />
      <Stack.Screen name="ritual" />
    </Stack>
  )
}
