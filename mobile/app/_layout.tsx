/** Root Layout
 * App-wide providers + themed navigation stack.
 * Fully driven by the Ink & Frost design system.
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';
import { SessionProvider } from '@/components/SessionProvider';
import { BiometricGate } from '@/components/BiometricGate';

function RootStack() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            color: colors.text,
            fontWeight: '700',
            fontSize: 17,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.bg,
          },
          animation: 'slide_from_right',
        }}
      >
        {/* Tabs */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Onboarding entry */}
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="intro" options={{ headerShown: false }} />
        <Stack.Screen name="how-use-rally" options={{ title: 'How will you use Rally?' }} />
        <Stack.Screen name="signup" options={{ title: 'Create your account' }} />
        <Stack.Screen name="verify-phone" options={{ title: 'Verify your phone' }} />
        <Stack.Screen name="onboarding-preferences" options={{ title: 'Language and interests' }} />
        <Stack.Screen name="terms-consent" options={{ title: 'Before you start' }} />
        <Stack.Screen name="account-created" options={{ headerShown: false }} />
        <Stack.Screen name="create-profile" options={{ title: 'Set up your profile' }} />
        <Stack.Screen name="follow-favorites" options={{ title: 'Follow Favorites' }} />
        <Stack.Screen name="spending-safety" options={{ title: 'Set a monthly limit' }} />
        <Stack.Screen name="setup-notifications" options={{ title: 'Stay in the loop' }} />
        <Stack.Screen name="safe-mode-welcome" options={{ title: 'Safe mode', headerShown: false }} />
        <Stack.Screen name="all-set" options={{ headerShown: false }} />
        <Stack.Screen name="favorite-ready" options={{ title: 'Your page is live' }} />

        {/* Core */}
        <Stack.Screen name="favorite/[handle]" options={{ title: 'Favorite' }} />
        <Stack.Screen name="u/[handle]" options={{ title: 'Profile' }} />
        <Stack.Screen name="moments/[id]" options={{ title: 'Moment' }} />
        <Stack.Screen name="search/index" options={{ title: 'Search' }} />

        {/* Auth (modals) */}
        <Stack.Screen
          name="login"
          options={{ title: 'Log in', presentation: 'modal' }}
        />
        <Stack.Screen
          name="register/index"
          options={{ title: 'Register', presentation: 'modal' }}
        />
        <Stack.Screen
          name="forgot-password/index"
          options={{ title: 'Forgot password', presentation: 'modal' }}
        />

        {/* Features */}
        <Stack.Screen name="campaigns/index" options={{ title: 'Campaigns' }} />
        <Stack.Screen name="campaigns/[id]" options={{ title: 'Campaign' }} />
        <Stack.Screen name="rankings/index" options={{ title: 'Rankings' }} />
        <Stack.Screen name="cityrankings" options={{ title: 'City rankings' }} />
        <Stack.Screen name="live/index" options={{ title: 'Live' }} />
        <Stack.Screen name="merch" options={{ title: 'Merch' }} />
        <Stack.Screen name="predictions" options={{ title: 'Predictions' }} />
        <Stack.Screen name="junior" options={{ title: 'Junior Favorite' }} />
        <Stack.Screen name="rivalries/index" options={{ title: 'Rivalries' }} />
        <Stack.Screen name="giveaways/index" options={{ title: 'Giveaways' }} />

        {/* Money */}
        <Stack.Screen name="earnings" options={{ title: 'Earnings' }} />
        <Stack.Screen name="cash-out" options={{ title: 'Cash out' }} />
        <Stack.Screen name="memberships" options={{ title: 'Memberships & orders' }} />
        <Stack.Screen name="payment-result" options={{ title: 'Payment', presentation: 'modal' }} />

        {/* Fan to Favorite + recognition + rivalry */}
        <Stack.Screen name="apply-favorite" options={{ title: 'Become a Favorite' }} />
        <Stack.Screen name="favorite-progress" options={{ title: 'Favorite Progress' }} />
        <Stack.Screen name="badges" options={{ title: 'Badges' }} />
        <Stack.Screen name="call-out" options={{ title: 'Call-Out Card' }} />
        <Stack.Screen name="beef-radar" options={{ title: 'Beef Radar' }} />

        {/* Creator tools */}
        <Stack.Screen name="dashboard/index" options={{ title: 'Dashboard' }} />
        <Stack.Screen name="dashboard/earnings/index" options={{ title: 'Earnings' }} />
        <Stack.Screen name="dashboard/payouts/index" options={{ title: 'Payouts' }} />
        <Stack.Screen name="dashboard/verify/index" options={{ title: 'Verify' }} />
        <Stack.Screen
          name="compose-moment"
          options={{ title: 'New Moment', presentation: 'modal' }}
        />

        {/* Account & settings */}
        <Stack.Screen name="security" options={{ title: 'Security' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="onboarding/index" options={{ title: 'Onboarding' }} />
        <Stack.Screen
          name="connection"
          options={{ title: 'Connection', presentation: 'modal' }}
        />
        <Stack.Screen
          name="permissions"
          options={{ title: 'App permissions', presentation: 'modal' }}
        />

        {/* Info */}
        <Stack.Screen name="about/index" options={{ title: 'About' }} />
        <Stack.Screen name="faq/index" options={{ title: 'FAQ' }} />
        <Stack.Screen name="how-to-use" options={{ title: 'How to use' }} />
        <Stack.Screen name="support" options={{ title: 'Support' }} />
        <Stack.Screen name="privacy/index" options={{ title: 'Privacy' }} />
        <Stack.Screen name="terms/index" options={{ title: 'Terms' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <SafeAreaProvider>
          <BiometricGate>
            <RootStack />
          </BiometricGate>
        </SafeAreaProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
