import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { ScreenContainer } from '@/components/common/ScreenContainer'
import { Colors } from '@/constants/theme'

export default function ConsentScreen() {
  const router = useRouter()

  useEffect(() => {
    router.replace({ pathname: '/(main)/ritual/setup', params: { mode: 'guided' } })
  }, [router])

  return (
    <ScreenContainer background="app" safe={false} centered>
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
