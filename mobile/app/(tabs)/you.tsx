/** Me tab - Rally design
 * Profile-style header (banner, avatar, stats), quick action grid,
 * account links, preferences, help and legal.
 */
import { useState, useCallback, useEffect } from 'react';
import { Text, StyleSheet, View, Switch, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader, Avatar } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds, setSoundsEnabled, getSoundsEnabled } from '@/hooks/useSounds';
import { clearToken, getToken, api } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const PURPLE = '#7C4DFF';

const QUICK_ACTIONS = [
  { href: '/live', label: 'Live', icon: 'radio-outline' },
  { href: '/wallet', label: 'Wallet', icon: 'wallet-outline' },
  { href: '/subscriptions', label: 'Fan Clubs', icon: 'people-outline' },
  { href: '/store', label: 'Store', icon: 'bag-outline' },
  { href: '/collections', label: 'Collections', icon: 'albums-outline' },
  { href: '/inbox', label: 'Inbox', icon: 'notifications-outline' },
  { href: '/favorite-studio', label: 'Studio', icon: 'stats-chart-outline' },
  { href: '/security', label: 'Security', icon: 'shield-checkmark-outline' },
  { href: '/upgrade', label: 'Upgrade', icon: 'star-outline' },
];

const ACCOUNT_LINKS = [
  { href: '/settings', label: 'Settings' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/onboarding', label: 'Onboarding checklist' },
  { href: '/search', label: 'Search' },
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

function fmt(n: any) {
  return Number(n || 0).toLocaleString();
}

export default function YouTab() {
  const router = useRouter();
  const { colors, isDark, setMode } = useTheme();
  const { impact, enabled, setEnabled } = useHaptics();
  const { click } = useSounds();

  const [soundOn, setSoundOn] = useState(getSoundsEnabled());
  const [biometrics, setBiometrics] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [me, setMe] = useState<any>(null);

  const authed = !!getToken();

  const loadMe = useCallback(async () => {
    if (!getToken()) {
      setMe(null);
      return;
    }
    try {
      const res = await api<{ user: any }>('/api/auth/me');
      setMe(res.user);
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    impact("selection");
    await loadMe();
    setRefreshing(false);
  }, [impact, loadMe]);

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
          impact("selection");
          router.push(href as any);
        }}
        style={({ pressed }) => [
          styles.linkRow,
          {
            borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
            backgroundColor: pressed ? colors.surfaceHover : "transparent",
          },
        ]}
      >
        <Text style={[styles.linkText, { color: colors.text }]}>{label}</Text>
        <Text style={{ color: colors.primary, fontSize: 18 }}>{"\u203a"}</Text>
      </Pressable>
    );
  }

  const handle = me?.handle || "";
  const name = me?.displayName || "Rally Fan";
  const balance = me?.tokenWallet?.balance ?? 0;
  const gifted = me?.tokenWallet?.giftedBalance ?? 0;
  const supporters = me?.favoriteProfile?.supporterCount ?? null;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {/* Profile header */}
      <GlassCard padded={false} style={styles.profileCard}>
        <LinearGradient
          colors={[GOLD, GOLD_DEEP, PURPLE] as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.banner}
        />
        <View style={styles.profileBody}>
          <View style={styles.avatarWrap}>
            <Avatar name={handle || "you"} size={72} ring uri={me?.avatarUrl || undefined} />
          </View>
          <View style={{ marginTop: 10 }}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
              {(me?.roles || []).indexOf("FAVORITE") > -1 ? (
                <View style={styles.roleChip}>
                  <Text style={styles.roleChipText}>FAVORITE</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.handleText, { color: colors.muted }]}>
              {handle ? "@" + handle : "Not signed in"}
            </Text>
            {me?.bio ? (
              <Text style={[styles.bio, { color: colors.muted }]}>{me.bio}</Text>
            ) : null}
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            <View style={styles.stat}>
              <Ionicons name="flash" size={15} color={GOLD} />
              <Text style={[styles.statValue, { color: colors.text }]}>T {fmt(balance)}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Tokens</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="gift" size={15} color={GOLD} />
              <Text style={[styles.statValue, { color: colors.text }]}>T {fmt(gifted)}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Gifted</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="people" size={15} color={GOLD} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {supporters !== null ? fmt(supporters) : "\u2014"}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Supporters</Text>
            </View>
          </View>

          {/* Auth actions */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 10 }}>
            {!authed ? (
              <>
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
              </>
            ) : (
              <GradientButton
                label="Log out"
                variant="outline"
                onPress={() => {
                  clearToken();
                  impact("medium");
                  router.push('/login');
                }}
              />
            )}
          </View>
        </View>
      </GlassCard>

      {/* Quick actions grid */}
      <View style={styles.gridWrap}>
        {QUICK_ACTIONS.map((a) => {
          return (
            <Pressable
              key={a.href}
              onPress={() => {
                click();
                impact("selection");
                router.push(a.href as any);
              }}
              style={({ pressed }) => [
                styles.gridTile,
                { backgroundColor: pressed ? colors.surfaceHover : colors.surface, borderColor: colors.border },
              ]}
              accessibilityLabel={a.label}
            >
              <Ionicons name={a.icon} size={22} color={GOLD} />
              <Text style={[styles.gridLabel, { color: colors.text }]}>{a.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Account */}
      <GlassCard style={{ marginBottom: spacing.md }} padded={false}>
        <SectionHeader title="Account" style={{ paddingHorizontal: 16, paddingTop: 14 }} />
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
          <Text style={[styles.label, { color: colors.text }]}>Click / type feedback</Text>
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
              if (v) impact("success");
            }}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor="#fff"
          />
        </View>
        <View style={[styles.switchRow, { marginTop: 14 }]}>
          <Text style={[styles.label, { color: colors.text }]}>Biometrics lock</Text>
          <Switch
            value={biometrics}
            onValueChange={(v) => {
              setBiometrics(v);
              impact("selection");
            }}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor="#fff"
          />
        </View>
        <View style={[styles.switchRow, { marginTop: 14 }]}>
          <Text style={[styles.label, { color: colors.text }]}>Dark mode</Text>
          <Switch
            value={isDark}
            onValueChange={(v) => {
              setMode(v ? 'dark' : 'light');
              impact("selection");
            }}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor="#fff"
          />
        </View>
      </GlassCard>

      {/* Help */}
      <GlassCard style={{ marginBottom: spacing.md }} padded={false}>
        <SectionHeader title="Help" style={{ paddingHorizontal: 16, paddingTop: 14 }} />
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
        <SectionHeader title="Legal" style={{ paddingHorizontal: 16, paddingTop: 14 }} />
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
  profileCard: {
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  banner: {
    height: 86,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  profileBody: { alignItems: "center", paddingHorizontal: 16, paddingTop: 0 },
  avatarWrap: { marginTop: -36 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 20, fontWeight: "900" },
  roleChip: {
    backgroundColor: GOLD,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleChipText: { color: "#111", fontSize: 10, fontWeight: "900" },
  handleText: { fontSize: 13, marginTop: 3 },
  bio: { fontSize: 13, lineHeight: 18, marginTop: 8, textAlign: "center" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
    paddingTop: 14,
    marginBottom: 14,
  },
  stat: { alignItems: "center", gap: 2 },
  statValue: { fontSize: 15, fontWeight: "800" },
  statLabel: { fontSize: 11 },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: spacing.md,
  },
  gridTile: {
    width: "31%",
    flexGrow: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  gridLabel: { fontSize: 12, fontWeight: "700" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    flex: 1,
    paddingRight: 12,
    fontSize: 15,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
  },
});