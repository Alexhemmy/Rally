import { Text, StyleSheet, View, Switch, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing, radii } from '@/constants/theme';
import { useState, useCallback } from 'react';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds, setSoundsEnabled, getSoundsEnabled } from '@/hooks/useSounds';
import { clearToken, getToken } from '@/lib/api';

export default function YouTab() {
  const router = useRouter();
  const { impact, enabled, setEnabled } = useHaptics();
  const { click } = useSounds();
  const [soundOn, setSoundOn] = useState(getSoundsEnabled());
  const [biometrics, setBiometrics] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const authed = !!getToken();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    impact('selection');
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  }, [impact]);

  const accountLinks = [
    { href: '/notifications', label: 'Notifications' },
    { href: '/dashboard', label: 'Dashboard (Favorite)' },
    { href: '/onboarding', label: 'Onboarding checklist' },
    { href: '/search', label: 'Search' },
  ];
  const helpLinks = [
    { href: '/how-to-use', label: 'How to use' },
    { href: '/faq', label: 'FAQ' },
    { href: '/support', label: 'Support' },
    { href: '/about', label: 'About' },
  ];
  const legalLinks = [
    { href: '/privacy', label: 'Privacy policy' },
    { href: '/terms', label: 'Terms of use' },
  ];

  function LinkRow({ href, label }: { href: string; label: string }) {
    return (
      <Link href={href as any} asChild>
        <Pressable
          style={styles.linkRow}
          onPress={() => {
            click();
            impact('selection');
          }}
        >
          <Text style={styles.linkText}>{label}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </Link>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={styles.h1}>You</Text>
      <Text style={styles.muted}>
        Session stays active with use. After 7 days inactive you must log in again.
      </Text>

      <View style={styles.card}>
        <Text style={styles.h2}>Account</Text>
        {!authed ? (
          <>
            <PrimaryButton label="Log in" onPress={() => router.push('/login')} />
            <PrimaryButton
              label="Create account"
              variant="ghost"
              onPress={() => router.push('/register')}
              style={{ marginTop: 10 }}
            />
          </>
        ) : (
          <PrimaryButton
            label="Log out"
            variant="ghost"
            onPress={() => {
              clearToken();
              impact('medium');
              router.push('/login');
            }}
          />
        )}
        {accountLinks.map((l) => (
          <LinkRow key={l.href} href={l.href} label={l.label} />
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>Sounds and haptics</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Click / type feedback</Text>
          <Switch
            value={soundOn}
            onValueChange={(v) => {
              setSoundOn(v);
              setSoundsEnabled(v);
              if (v) click();
            }}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.text}
          />
        </View>
        <View style={[styles.row, { marginTop: 12 }]}>
          <Text style={styles.label}>Vibration</Text>
          <Switch
            value={enabled}
            onValueChange={(v) => {
              setEnabled(v);
              if (v) impact('success');
            }}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.text}
          />
        </View>
        <View style={[styles.row, { marginTop: 12 }]}>
          <Text style={styles.label}>Biometrics lock</Text>
          <Switch
            value={biometrics}
            onValueChange={(v) => {
              setBiometrics(v);
              impact('selection');
            }}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.text}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>Help</Text>
        {helpLinks.map((l) => (
          <LinkRow key={l.href} href={l.href} label={l.label} />
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>Legal</Text>
        {legalLinks.map((l) => (
          <LinkRow key={l.href} href={l.href} label={l.label} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: 8 },
  h2: { color: colors.primaryHover, fontWeight: '600', marginBottom: 10 },
  muted: { color: colors.muted, fontSize: 13, marginBottom: 12 },
  label: { color: colors.text, flex: 1, paddingRight: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 10,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  linkText: { color: colors.text, fontSize: 16 },
  chevron: { color: colors.muted, fontSize: 20 },
});
