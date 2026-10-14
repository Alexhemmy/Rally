import { Tabs } from 'expo-router';
import { Text, Platform } from 'react-native';
import { colors } from '@/constants/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Explore: '🔎',
    Feed: '✨',
    Wallet: '🪙',
    You: '👤',
  };
  return (
    <Text style={{ fontSize: focused ? 20 : 18, opacity: focused ? 1 : 0.7 }}>
      {icons[label] || '•'}
    </Text>
  );
}

/** Mobile-only bottom tabs — primary navigation on phones */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.secondary,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => <TabIcon label="Explore" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => <TabIcon label="Feed" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ focused }) => <TabIcon label="Wallet" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: 'You',
          tabBarIcon: ({ focused }) => <TabIcon label="You" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
