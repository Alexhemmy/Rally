/** Settings (UX 44) - Rally design
 * The settings hub: profile row, ACCOUNT, MONEY and SAFETY sections.
 * Anonymity is real (PUT /api/limits); wallet balance and weekly cap
 * come from the live account.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type Me = {
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  roles?: string[];
  tokenWallet?: { balance?: number | string } | null;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0] || 'R')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click } = useSounds();

  const [me, setMe] = useState<Me | null>(null);
  const [anon, setAnon] = useState(false);
  const [weekCap, setWeekCap] = useState<number | null>(null);
  const [balance, setBalance] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [inSearch, setInSearch] = useState(true);
  const [slurs, setSlurs] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('rally.blockedAccounts');
      if (raw) setBlockedCount((JSON.parse(raw) || []).length);
      const prefs = await AsyncStorage.getItem('rally.privacyPrefs');
      if (prefs) {
        const p = JSON.parse(prefs);
        if (p.inSearch !== undefined) setInSearch(p.inSearch);
        if (p.slurs !== undefined) setSlurs(p.slurs);
      }
    } catch { /* local only */ }
    if (getToken()) {
      try {
        const r: any = await api('/api/auth/me');
        setMe(r.user || null);
        setBalance(Number(r.user && r.user.tokenWallet ? r.user.tokenWallet.balance || 0 : 0));
      } catch { /* offline */ }
      try {
        const l: any = await api('/api/limits');
        setAnon(Boolean(l.anonymityDefault));
        setWeekCap(l.weeklySpendCap === undefined ? null : (l.weeklySpendCap === null ? null : Number(l.weeklySpendCap)));
      } catch { /* offline */ }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleAnon(v: boolean) {
    setAnon(v);
    impact('light');
    try {
      await api('/api/limits', { method: 'PUT', body: JSON.stringify({ anonymityDefault: v }) });
    } catch {
      setAnon(!v);
    }
  }

  function toggleSearch(v: boolean) {
    setInSearch(v);
    AsyncStorage.getItem('rally.privacyPrefs')
      .then((raw) => {
        const p = raw ? JSON.parse(raw) : {};
        p.inSearch = v;
        return AsyncStorage.setItem('rally.privacyPrefs', JSON.stringify(p));
      })
      .catch(() => undefined);
    impact('light');
  }

  function toggleSlurs(v: boolean) {
    setSlurs(v);
    impact('light');
    AsyncStorage.getItem('rally.privacyPrefs')
      .then((raw) => {
        const p = raw ? JSON.parse(raw) : {};
        p.slurs = v;
        return AsyncStorage.setItem('rally.privacyPrefs', JSON.stringify(p));
      })
      .catch(() => undefined);
  }

  function link(icon: string, label: string, value: string | null, href: string, accent?: string) {
    return (
      <Pressable
        key={label}
        style={styles.row}
        onPress={() => { click(); impact('light'); router.push(href as any); }}
        accessibilityLabel={label}
      >
        <View style={[styles.iconBubble, { backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name={icon as any} size={19} color={accent || GOLD} />
        </View>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {value ? <Text style={{ color: colors.muted, fontSize: 15 }}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>
    );
  }

  return (
    <SwipeBack>
      <Screen>
        <Text style={[styles.h1, { color: colors.text }]}>Settings</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Profile row */}
          <Pressable
            style={[styles.profileCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={() => router.push('/profile')}
            accessibilityLabel="Your profile"
          >
            {me && me.avatarUrl ? (
              <View style={[styles.avatar, { backgroundColor: '#1E88E5' }]} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#1E88E5' }]}>
                <Text style={styles.avatarText}>{me ? initials(me.displayName) : 'R'}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>{me ? me.displayName : 'Guest'}</Text>
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2 }}>
                {me ? '@' + me.handle + (me.roles && me.roles.indexOf('FAVORITE') >= 0 ? ' · Favorite' : ' · Fan') : 'Sign in to personalize'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>

          {/* ACCOUNT */}
          <Text style={[styles.section, { color: colors.muted }]}>ACCOUNT</Text>
          <View style={[styles.group, { borderColor: colors.border }]}>
            {link('person-outline', 'Profile and handle', null, '/edit-profile')}
            {link('globe-outline', 'Language and translation', 'English', '/language-region')}
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <View style={[styles.iconBubble, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="eye-outline" size={19} color={GOLD} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Show me as anonymous on walls</Text>
              <Switch
                value={anon}
                onValueChange={toggleAnon}
                trackColor={{ true: TEAL, false: colors.border }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* MONEY */}
          <Text style={[styles.section, { color: colors.muted }]}>MONEY</Text>
          <View style={[styles.group, { borderColor: colors.border }]}>
            {link('gift-outline', 'Wallet', balance > 0 ? balance.toLocaleString('en-US') + ' Tokens' : null, '/wallet')}
            {link('shield-checkmark-outline', 'Spending limits', weekCap !== null ? 'T ' + weekCap.toLocaleString('en-US') + ' / wk' : null, '/spending-limits')}
            {link('card-outline', 'Payment methods', null, '/wallet')}
          </View>

          {/* SAFETY */}
          <Text style={[styles.section, { color: colors.muted }]}>SAFETY</Text>
          <View style={[styles.group, { borderColor: colors.border }]}>
            {link('lock-closed-outline', 'Blocked and muted', blockedCount > 0 ? String(blockedCount) : null, '/blocked-muted')}
            <View style={styles.row}>
              <View style={[styles.iconBubble, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="chatbox-outline" size={19} color={GOLD} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Slurs and blocked words</Text>
              <Switch
                value={slurs}
                onValueChange={toggleSlurs}
                trackColor={{ true: TEAL, false: colors.border }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.iconBubble, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="search-outline" size={19} color={GOLD} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Show me in search results</Text>
              <Switch
                value={inSearch}
                onValueChange={toggleSearch}
                trackColor={{ true: TEAL, false: colors.border }}
                thumbColor="#fff"
              />
            </View>
            {link('ban-outline', 'Privacy and safety', null, '/privacy-safety')}
            {link('notifications-outline', 'Notifications', null, '/notification-settings')}
            {link('person-circle-outline', 'Account and security', null, '/account')}
            {link('shield-outline', 'Security', null, '/security')}
            {link('phone-portrait-outline', 'Devices', null, '/devices')}
            {link('log-out-outline', 'Log out', null, '/logout')}
            {link('help-circle-outline', 'Help and support', null, '/help-center')}
            {link('information-circle-outline', 'About Rally', null, '/about')}
          </View>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '900', marginBottom: spacing.md },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 16,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  section: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: spacing.lg, marginBottom: 8 },
  group: { borderWidth: 1, borderRadius: radii.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBubble: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '700' },
});
