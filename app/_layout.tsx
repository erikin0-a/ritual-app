import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { initAnalytics } from '@/lib/analytics'
import { Colors } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth.store'

const queryClient = new QueryClient()

function RootNavigator() {
  const { isLoading, isOnboarded, hydrate } = useAuthStore()

  useEffect(() => {
    initAnalytics()
    hydrate()
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (isOnboarded) {
      router.replace('/(main)')
    } else {
      router.replace('/(auth)/onboarding')
    }
  }, [isLoading, isOnboarded])

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
      <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor={Colors.background} />
        <RootNavigator />
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
