/** Tabs layout - Rally design system
 * Home - Moments - [+ create] - Inbox - Me
 * Gold accent, centered create button, Discover hidden (opened from Home).
 */
import { Redirect, Tabs, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/components/ThemeProvider';
import { useSession } from '@/components/SessionProvider';
import { radii } from '@/constants/theme';
import { api } from '@/lib/api';
import { BreakPrompt } from '@/components/BreakPrompt';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';

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
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    let alive = true;
    api<{ sessions: { status: string }[] }>('/api/live', { skipAuth: true })
      .then((r) => {
        if (alive) setLiveCount((r.sessions || []).filter((s) => s.status === 'live').length);
      })
      .catch(() => {
        // offline
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return null;
  if (!session) return <Redirect href="/login" />;

  const cycleTheme = () => setMode(isDark ? 'light' : 'dark');

  return (
    <>
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: GOLD,
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '800',
          fontSize: 18,
          letterSpacing: -0.3,
        },
        headerShadowVisible: false,
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: Platform.OS === 'ios' ? 20 : 12,
          height: Platform.OS === 'ios' ? 66 : 60,
          paddingHorizontal: 6,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.full,
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.45 : 0.14,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 14,
        },
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {/* Home */}
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
                onPress={() => router.push('/live')}
                hitSlop={10}
                accessibilityLabel="Live sessions"
                style={styles.liveWrap}
              >
                <Ionicons name="radio-outline" size={22} color={colors.text} />
                {liveCount > 0 && <View style={styles.liveDot} />}
              </Pressable>
              <Pressable
                onPress={() => router.push('/explore')}
                hitSlop={10}
                accessibilityLabel="Discover and search"
              >
                <Ionicons name="search" size={22} color={colors.text} />
              </Pressable>
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
                <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={GOLD} />
              </Pressable>
            </View>
          ),
        }}
      />

      {/* Moments */}
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Moments',
          tabBarLabel: 'Moments',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="play" color={color} focused={focused} />
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
              onPress={() => router.push('/create')}
              accessibilityLabel="Create"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.createWrap,
                pressed && { transform: [{ scale: 0.92 }] },
              ]}
            >
              <LinearGradient
                colors={[GOLD, GOLD_DEEP] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createBtn}
              >
                <Ionicons name="add" size={26} color="#fff" />
              </LinearGradient>
            </Pressable>
          ),
        }}
      />

      {/* Inbox */}
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarLabel: 'Inbox',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="mail" color={color} focused={focused} />
          ),
        }}
      />

      {/* Me */}
      <Tabs.Screen
        name="you"
        options={{
          title: 'Me',
          tabBarLabel: 'Me',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" color={color} focused={focused} />
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push('/wallet')}
                hitSlop={10}
                accessibilityLabel="Wallet"
              >
                <Ionicons name="wallet-outline" size={21} color={colors.text} />
              </Pressable>
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

      {/* Discover - opened from the Home search icon */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Discover',
          href: null,
        }}
      />

      {/* Wallet - reachable from Me */}
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          href: null,
        }}
      />
    </Tabs>
    <BreakPrompt />
    </>
  );
}

const styles = StyleSheet.create({
  liveWrap: {
    position: 'relative',
  },
  liveDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF5350',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
  },
  createWrap: {
    marginTop: -6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F57C00',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  createBtn: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
