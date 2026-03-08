import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { Colors } from '@/constants/theme'

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  )
}

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ритуал',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dice"
        options={{
          title: 'Кубики',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎲" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="truth-or-dare"
        options={{
          title: 'Правда/Дело',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎭" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stories"
        options={{
          title: 'Истории',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📖" focused={focused} />,
        }}
      />
      {/* ritual/ subfolder — not a tab, navigated to directly */}
      <Tabs.Screen name="ritual" options={{ href: null }} />
    </Tabs>
  )
}
