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
        <Stack.Screen name="favorite/[handle]" options={{ title: 'Favorite' }} />
        <Stack.Screen name="login" options={{ title: 'Log in', presentation: 'modal' }} />
        <Stack.Screen name="register/index" options={{ title: 'Register', presentation: 'modal' }} />
        <Stack.Screen name="forgot-password/index" options={{ title: 'Forgot password', presentation: 'modal' }} />
        <Stack.Screen name="moments/[id]" options={{ title: 'Moment' }} />
        <Stack.Screen name="campaigns/index" options={{ title: 'Campaigns' }} />
        <Stack.Screen name="campaigns/[id]" options={{ title: 'Campaign' }} />
        <Stack.Screen name="rankings/index" options={{ title: 'Rankings' }} />
        <Stack.Screen name="cityrankings" options={{ title: 'City rankings' }} />
        <Stack.Screen name="live/index" options={{ title: 'Live' }} />
        <Stack.Screen name="merch" options={{ title: 'Merch' }} />
        <Stack.Screen name="predictions" options={{ title: 'Predictions' }} />
        <Stack.Screen name="junior" options={{ title: 'Junior Favorite' }} />
        <Stack.Screen name="security" options={{ title: 'Security' }} />
        <Stack.Screen name="dashboard/index" options={{ title: 'Dashboard' }} />
        <Stack.Screen name="dashboard/earnings/index" options={{ title: 'Earnings' }} />
        <Stack.Screen name="dashboard/payouts/index" options={{ title: 'Payouts' }} />
        <Stack.Screen name="dashboard/verify/index" options={{ title: 'Verify' }} />
        <Stack.Screen name="onboarding/index" options={{ title: 'Onboarding' }} />
        <Stack.Screen name="u/[handle]" options={{ title: 'Profile' }} />
        <Stack.Screen name="search/index" options={{ title: 'Search' }} />
        <Stack.Screen name="rivalries/index" options={{ title: 'Rivalries' }} />
        <Stack.Screen name="giveaways/index" options={{ title: 'Giveaways' }} />
        <Stack.Screen name="privacy/index" options={{ title: 'Privacy' }} />
        <Stack.Screen name="terms/index" options={{ title: 'Terms' }} />
        <Stack.Screen name="about/index" options={{ title: 'About' }} />
        <Stack.Screen name="faq/index" options={{ title: 'FAQ' }} />
        <Stack.Screen name="support" options={{ title: 'Support' }} />
        <Stack.Screen name="how-to-use" options={{ title: 'How to use' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="compose-moment" options={{ title: 'New Moment', presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
