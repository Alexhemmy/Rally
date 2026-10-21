/** Tabs layout
 * Home · Explore · [＋ create] · Feed · You
 * Floating pill tab bar with a centered gradient create button.
 */
import { Redirect, Tabs, useRouter } from 'expo-router';
import { Pressable, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/components/ThemeProvider';
import { useSession } from '@/components/SessionProvider';
import { radii } from '@/constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  name,
  color,
  focused,
}: {
  name: IconName;
  color: string;
  focused: boolean;
}) {
  const iconName = focused ? name : ((name + '-outline') as IconName);
  return <Ionicons name={iconName} size={24} color={color} />;
}

export default function TabsLayout() {
  const { session, loading } = useSession();
  const { colors, isDark, setMode } = useTheme();
  const router = useRouter();

  if (loading) return null;
  if (!session) return <Redirect href="/login" />;

  const cycleTheme = () => setMode(isDark ? 'light' : 'dark');

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '800',
          fontSize: 18,
          letterSpacing: -0.3,
        },
        headerShadowVisible: false,
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: Platform.OS === 'ios' ? 20 : 12,
          height: Platform.OS === 'ios' ? 68 : 62,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.full,
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.4 : 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 14,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {/* Home (For You) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Rally',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push('/notifications')}
                hitSlop={10}
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={22} color={colors.text} />
              </Pressable>
              <Pressable
                onPress={cycleTheme}
                hitSlop={10}
                accessibilityLabel="Toggle theme"
              >
                <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={colors.primary} />
              </Pressable>
            </View>
          ),
        }}
      />

      {/* Explore */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="compass" color={color} focused={focused} />
          ),
        }}
      />

      {/* Center create (+) */}
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: () => (
            <Pressable
              onPress={() => router.push('/compose-moment')}
              accessibilityLabel="Create a Moment"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.createWrap,
                pressed && { transform: [{ scale: 0.92 }] },
              ]}
            >
              <LinearGradient
                colors={[...colors.gradient] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createBtn}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </LinearGradient>
            </Pressable>
          ),
        }}
      />

      {/* Feed (random) */}
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="play-circle" color={color} focused={focused} />
          ),
        }}
      />

      {/* You */}
      <Tabs.Screen
        name="you"
        options={{
          title: 'You',
          tabBarLabel: 'You',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" color={color} focused={focused} />
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push('/connection')}
                hitSlop={10}
                accessibilityLabel="Connection settings"
              >
                <Ionicons name="server-outline" size={21} color={colors.text} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/permissions')}
                hitSlop={10}
                accessibilityLabel="App permissions"
              >
                <Ionicons name="shield-checkmark-outline" size={22} color={colors.text} />
              </Pressable>
            </View>
          ),
        }}
      />

      {/* Wallet — reachable by deep links, hidden from the tab bar */}
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 16,
  },
  createWrap: {
    marginTop: -14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C5CFC',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  createBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
