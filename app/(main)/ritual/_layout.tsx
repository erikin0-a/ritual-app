import { Stack } from 'expo-router'
import { Colors } from '@/constants/theme'

export default function RitualLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="consent" />
      <Stack.Screen name="session" />
    </Stack>
  )
}
