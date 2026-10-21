/** You tab
 * Account, preferences, help, and legal — the personal hub.
 */
import { useState, useCallback } from 'react';
import { Text, StyleSheet, View, Switch, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader, Avatar } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds, setSoundsEnabled, getSoundsEnabled } from '@/hooks/useSounds';
import { clearToken, getToken } from '@/lib/api';

const ACCOUNT_LINKS = [
  { href: '/notifications', label: 'Notifications' },
  { href: '/dashboard', label: 'Dashboard (Favorite)' },
  { href: '/onboarding', label: 'Onboarding checklist' },
  { href: '/upgrade', label: 'Become a Favorite' },
  { href: '/subscriptions', label: 'Fan Clubs' },
  { href: '/store', label: 'Store orders' },
  { href: '/collections', label: 'Collections' },
  { href: '/search', label: 'Search' },
  { href: '/security', label: 'Security' },
  { href: '/permissions', label: 'App permissions' },
];

const HELP_LINKS = [
  { href: '/how-to-use', label: 'How to use' },
  { href: '/faq', label: 'FAQ' },
  { href: '/support', label: 'Support' },
  { href: '/about', label: 'About' },
];

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/terms', label: 'Terms of use' },
];

export default function YouTab() {
  const router = useRouter();
  const { colors, isDark, mode, setMode } = useTheme();
  const { impact, enabled, setEnabled } = useHaptics();
  const { click } = useSounds();

  const [soundOn, setSoundOn] = useState(getSoundsEnabled());
  const [biometrics, setBiometrics] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const authed = !!getToken();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    impact('selection');
    await new Promise((r) => setTimeout(r, 450));
    setRefreshing(false);
  }, [impact]);

  function LinkRow({
    href,
    label,
    isLast,
  }: {
    href: string;
    label: string;
    isLast?: boolean;
  }) {
    return (
      <Pressable
        onPress={() => {
          click();
          impact('selection');
          router.push(href as any);
        }}
        style={({ pressed }) => [
          styles.linkRow,
          {
            borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
            backgroundColor: pressed ? colors.surfaceHover : 'transparent',
          },
        ]}
      >
        <Text style={[styles.linkText, { color: colors.text }]}>{label}</Text>
        <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
      </Pressable>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {/* Header with logo */}
      <View style={styles.header}>
        <Image
          source={require('@/assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.h1, { color: colors.text }]}>You</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Session stays active with use. After 7 days inactive you’ll need to log in again.
          </Text>
        </View>
      </View>

      {/* Account */}
      <GlassCard style={{ marginBottom: spacing.md }} padded={false}>
        <SectionHeader
          title="Account"
          style={{ paddingHorizontal: 16, paddingTop: 14 }}
        />

        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          {!authed ? (
            <View style={{ gap: 10 }}>
              <GradientButton
                label="Log in"
                onPress={() => router.push('/login')}
                fullWidth
              />
              <GradientButton
                label="Create account"
                variant="ghost"
                onPress={() => router.push('/register')}
                fullWidth
              />
            </View>
          ) : (
            <GradientButton
              label="Log out"
              variant="outline"
              onPress={() => {
                clearToken();
                impact('medium');
                router.push('/login');
              }}
              fullWidth
            />
          )}
        </View>

        {ACCOUNT_LINKS.map((l, i) => (
          <LinkRow
            key={l.href}
            href={l.href}
            label={l.label}
            isLast={i === ACCOUNT_LINKS.length - 1}
          />
        ))}
      </GlassCard>

      {/* Preferences */}
      <GlassCard style={{ marginBottom: spacing.md }}>
        <SectionHeader title="Sounds & haptics" />

        <View style={styles.switchRow}>
          <Text style={[styles.label, { color: colors.text }]}>
            Click / type feedback
          </Text>
          <Switch
            value={soundOn}
            onValueChange={(v) => {
              setSoundOn(v);
              setSoundsEnabled(v);
              if (v) click();
            }}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor="#fff"
          />
        </View>

        <View style={[styles.switchRow, { marginTop: 14 }]}>
          <Text style={[styles.label, { color: colors.text }]}>Vibration</Text>
          <Switch
            value={enabled}
            onValueChange={(v) => {
              setEnabled(v);
              if (v) impact('success');
            }}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor="#fff"
          />
        </View>

        <View style={[styles.switchRow, { marginTop: 14 }]}>
          <Text style={[styles.label, { color: colors.text }]}>
            Biometrics lock
          </Text>
          <Switch
            value={biometrics}
            onValueChange={(v) => {
              setBiometrics(v);
              impact('selection');
            }}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor="#fff"
          />
        </View>

        {/* Theme toggle */}
        <View style={[styles.switchRow, { marginTop: 14 }]}>
          <Text style={[styles.label, { color: colors.text }]}>
            Dark mode
          </Text>
          <Switch
            value={isDark}
            onValueChange={(v) => {
              setMode(v ? 'dark' : 'light');
              impact('selection');
            }}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor="#fff"
          />
        </View>
      </GlassCard>

      {/* Help */}
      <GlassCard style={{ marginBottom: spacing.md }} padded={false}>
        <SectionHeader
          title="Help"
          style={{ paddingHorizontal: 16, paddingTop: 14 }}
        />
        {HELP_LINKS.map((l, i) => (
          <LinkRow
            key={l.href}
            href={l.href}
            label={l.label}
            isLast={i === HELP_LINKS.length - 1}
          />
        ))}
      </GlassCard>

      {/* Legal */}
      <GlassCard padded={false}>
        <SectionHeader
          title="Legal"
          style={{ paddingHorizontal: 16, paddingTop: 14 }}
        />
        {LEGAL_LINKS.map((l, i) => (
          <LinkRow
            key={l.href}
            href={l.href}
            label={l.label}
            isLast={i === LEGAL_LINKS.length - 1}
          />
        ))}
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  h1: {
    ...typo.h1,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    flex: 1,
    paddingRight: 12,
    fontSize: 15,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
