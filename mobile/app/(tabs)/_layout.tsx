import { Redirect, Tabs, useRouter } from 'expo-router';
import { Pressable, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/components/ThemeProvider';
import { useSession } from '@/components/SessionProvider';

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, color, focused }: { name: IconName; color: string; focused: boolean }) {
  return <Ionicons name={focused ? name : (name + '-outline') as IconName} size={24} color={color} />;
}

/** Home · Explore · [＋ create] · Wallet · You — floating pill bar. */
export default function TabsLayout() {
  const { session, loading } = useSession();
  const { colors, isDark, setMode, mode } = useTheme();
  const router = useRouter();

  if (loading) return null;
  if (!session) return <Redirect href="/login" />;

  const cycleTheme = () => setMode(isDark ? 'light' : 'dark');

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '800', fontSize: 18, letterSpacing: -0.3 },
        headerShadowVisible: false,
        tabBarStyle: {
          position: 'absolute',
          left: 14, right: 14, bottom: 12,
          height: Platform.OS === 'ios' ? 66 : 60,
          paddingTop: 6, paddingBottom: 6,
          backgroundColor: colors.surface,
          borderTopWidth: 1, borderTopColor: colors.border,
          borderRadius: 999,
          shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 }, elevation: 14,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Rally',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} />,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 16 }}>
              <Pressable onPress={() => router.push('/notifications')} hitSlop={8}>
                <Ionicons name="notifications-outline" size={22} color={colors.text} />
              </Pressable>
              <Pressable onPress={cycleTheme} accessibilityLabel="Toggle theme" hitSlop={8}>
                <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={colors.primary} />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, focused }) => <TabIcon name="search" color={color} focused={focused} />,
        }}
      />
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
              style={({ pressed }) => [styles.createWrap, pressed && { transform: [{ scale: 0.9 }] }]}
            >
              <LinearGradient
                colors={[...colors.gradient] as unknown as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.createBtn}
              >
                <Ionicons name="add" size={32} color="#fff" />
              </LinearGradient>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ color, focused }) => <TabIcon name="wallet" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: 'You',
          tabBarLabel: 'You',
          tabBarIcon: ({ color, focused }) => <TabIcon name="person" color={color} focused={focused} />,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 16 }}>
              <Pressable onPress={() => router.push('/connection')} hitSlop={8}>
                <Ionicons name="server-outline" size={21} color={colors.text} />
              </Pressable>
              <Pressable onPress={() => router.push('/permissions')} hitSlop={8}>
                <Ionicons name="shield-checkmarks-outline" size={22} color={colors.text} />
              </Pressable>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createWrap: {
    marginTop: -26,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C5CFC', shadowOpacity: 0.5, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  createBtn: {
    width: 54, height: 54, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
});
