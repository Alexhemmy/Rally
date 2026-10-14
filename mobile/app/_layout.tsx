import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="favorite/[handle]" options={{ title: 'Favorite', presentation: 'card' }} />
        <Stack.Screen name="login" options={{ title: 'Log in', presentation: 'modal' }} />
        <Stack.Screen name="support" options={{ title: 'Support' }} />
        <Stack.Screen name="how-to-use" options={{ title: 'How to use' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="compose-moment" options={{ title: 'New Moment', presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
