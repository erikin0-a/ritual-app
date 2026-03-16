import { useEffect, useState } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as ExpoSplashScreen from 'expo-splash-screen'
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display'
import { initAnalytics } from '@/lib/analytics'
import { initRevenueCat } from '@/lib/revenuecat'
import { Colors } from '@/constants/theme'
import { useAuthStore } from '@/stores/auth.store'
import { SplashScreen } from '@/components/ui/SplashScreen'

// Keep the native Expo splash visible until fonts + auth are ready.
ExpoSplashScreen.preventAutoHideAsync().catch(() => null)

const queryClient = new QueryClient()

// ─── Root Navigator ─────────────────────────────────────────────────────────
function RootNavigator() {
  const { isLoading, isOnboarded, hydrate } = useAuthStore()
  const [splashDone, setSplashDone] = useState(false)
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold,
  })

  useEffect(() => {
    initAnalytics()
    initRevenueCat().catch(() => null)
    hydrate()
  // hydrate is a stable store selector — intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Hide the native Expo splash once fonts are loaded so our custom
  // splash can take over seamlessly without a gap or double-flash.
  useEffect(() => {
    if (!fontsLoaded) return
    ExpoSplashScreen.hideAsync().catch(() => null)
  }, [fontsLoaded])

  // Navigate once custom splash is done AND auth hydration is complete.
  useEffect(() => {
    if (!splashDone || isLoading || !fontsLoaded) return

    if (isOnboarded) {
      router.replace('/(main)')
    } else {
      router.replace('/(auth)/' as never)
    }
  }, [splashDone, isLoading, isOnboarded, fontsLoaded])

  if (!splashDone || !fontsLoaded) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />
  }

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
