import { Redirect, Tabs, useRouter } from 'expo-router';
import { Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeProvider';
import { useSession } from '@/components/SessionProvider';

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, color }: { name: IconName; color: string }) {
  return <Ionicons name={name} size={24} color={color} />;
}

/**
 * Auth-gated bottom tabs. X-like structure: Home feed, Explore, Moments,
 * Wallet, You — floating premium tab bar with a theme toggle.
 */
export default function TabsLayout() {
  const { session, loading } = useSession();
  const { colors, isDark, setMode, mode } = useTheme();
  const router = useRouter();

  if (loading) return null; // splash while restoring session
  if (!session) return <Redirect href="/login" />;

  const cycleTheme = () => {
    if (mode === 'system') setMode(isDark ? 'light' : 'dark');
    else setMode(isDark ? 'light' : 'dark');
  };

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '800', fontSize: 17 },
        headerShadowVisible: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: -6 },
          elevation: 12,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Rally',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
          headerRight: () => (
            <Pressable onPress={cycleTheme} accessibilityLabel="Toggle theme" style={{ paddingHorizontal: 16 }}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={22} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <TabIcon name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Moments',
          tabBarIcon: ({ color }) => <TabIcon name="sparkles" color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color }) => <TabIcon name="wallet" color={color} />,
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: 'You',
          tabBarIcon: ({ color }) => <TabIcon name="person" color={color} />,
          headerRight: () => (
            <Pressable onPress={() => router.push('/connection')} accessibilityLabel="Connection settings" style={{ paddingHorizontal: 16 }}>
              <Ionicons name="server-outline" size={22} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
    </Tabs>
  );
}
