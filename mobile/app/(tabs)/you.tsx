/** Me tab (mock 01) - Rally design.
 * Compact identity header with level chip and a chevron to the full
 * profile, real token balance with Top up, account rows (Badges and
 * levels, Collections, Saved, Activity, Memberships and orders),
 * Settings / Privacy and safety, and the gold Become a Favorite row.
 * Sounds, haptics and dark mode stay here as a preferences card.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Switch, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds, setSoundsEnabled, getSoundsEnabled } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#34D399';

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export default function YouTab() {
  const router = useRouter();
  const { colors, isDark, setMode } = useTheme();
  const { impact, enabled, setEnabled } = useHaptics();
  const { click } = useSounds();

  const [me, setMe] = useState<any>(null);
  const [collectionsCount, setCollectionsCount] = useState(0);
  const [favHandle, setFavHandle] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(getSoundsEnabled());
  const [biometrics, setBiometrics] = useState(false);

  const load = useCallback(async () => {
    if (!getToken()) { setMe(null); return; }
    try {
      const r = await api<{ user: any }>('/api/auth/me');
      setMe(r.user || null);
    } catch { setMe(null); }
    try {
      const c: any = await api('/api/collections/me');
      setCollectionsCount((c.collections || []).length);
    } catch { /* offline */ }
    try {
      const raw = await AsyncStorage.getItem('rally.myFavoriteHandle');
      if (raw) setFavHandle(JSON.parse(raw));
    } catch { /* local only */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const authed = !!getToken();
  const balance = me && me.tokenWallet
    ? Number(me.tokenWallet.balance || 0) + Number(me.tokenWallet.giftedBalance || 0)
    : 0;
  const isFavorite = !!(me && me.favoriteProfile && me.favoriteProfile.isPublished);

  function Row(props: { icon: string; label: string; value?: string; onPress: () => void; last?: boolean; gold?: boolean }) {
    return (
      <Pressable
        onPress={props.onPress}
        style={[styles.row, !props.last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
        accessibilityLabel={props.label}
      >
        <View style={[styles.rowIcon, { backgroundColor: colors.surfaceElevated || colors.bg }]}>
          <Ionicons name={props.icon as any} size={20} color={GOLD} />
        </View>
        <Text style={{ flex: 1, color: colors.text, fontWeight: '800', fontSize: 17 }}>{props.label}</Text>
        {props.value ? <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 16 }}>{props.value}</Text> : null}
        <Ionicons name={props.gold ? 'chevron-forward' : 'chevron-forward'} size={18} color={props.gold ? GOLD : colors.muted} />
      </Pressable>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Identity header */}
        <Pressable
          onPress={() => authed && router.push('/my-profile')}
          style={styles.headRow}
          accessibilityLabel="Open my profile"
        >
          <Avatar uri={me && me.avatarUrl ? me.avatarUrl : undefined} name={me ? me.displayName : 'You'} size={64} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 22 }}>
              {me ? me.displayName : 'Not signed in'}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 15, marginTop: 1 }}>{me ? '@' + me.handle : 'Tap to log in'}</Text>
            <View style={[styles.levelChip, { backgroundColor: GOLD + '22' }]}>
              <Text style={{ color: GOLD, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 }}>
                {isFavorite ? 'FAVORITE' : 'SUPPORTER'}
              </Text>
            </View>
          </View>
          {authed ? <Ionicons name="chevron-forward" size={20} color={colors.muted} /> : null}
        </Pressable>

        {/* Tokens card */}
        <View style={[styles.tokensCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.tokenIcon, { backgroundColor: GOLD }]}>
            <Text style={{ color: '#1A1206', fontWeight: '900', fontSize: 18 }}>T</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ color: colors.muted, fontSize: 15 }}>Tokens</Text>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 26 }}>{fmt(balance)}</Text>
          </View>
          <Pressable
            onPress={() => { impact('light'); click(); router.push('/buy-tokens'); }}
            style={[styles.topUp, { backgroundColor: GOLD }]}
            accessibilityLabel="Top up"
          >
            <Text style={{ color: '#1A1206', fontWeight: '900', fontSize: 16 }}>Top up</Text>
          </Pressable>
        </View>

        {/* Account rows */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row
            icon="trophy-outline"
            label="Badges and levels"
            onPress={() => { impact('light'); router.push(favHandle ? '/badges?handle=' + favHandle : '/search'); }}
          />
          <Row icon="folder-outline" label="Collections" value={String(collectionsCount)} onPress={() => { impact('light'); router.push('/collections'); }} />
          <Row icon="bookmark-outline" label="Saved" onPress={() => { impact('light'); router.push('/saved'); }} />
          <Row icon="time-outline" label="Activity" onPress={() => { impact('light'); router.push('/notifications'); }} />
          <Row icon="ticket-outline" label="Memberships and orders" onPress={() => { impact('light'); router.push('/memberships'); }} last />
        </View>

        {/* Settings */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row icon="settings-outline" label="Settings" onPress={() => { impact('light'); router.push('/settings'); }} />
          <Row icon="shield-checkmark-outline" label="Privacy and safety" onPress={() => { impact('light'); router.push('/privacy-safety'); }} last />
        </View>

        {/* Become a Favorite */}
        {!isFavorite ? (
          <Pressable
            onPress={() => { impact('light'); router.push('/apply-favorite'); }}
            style={[styles.becomeCard, { borderColor: GOLD_DEEP, backgroundColor: colors.surface }]}
            accessibilityLabel="Become a Favorite"
          >
            <Ionicons name="crown" size={26} color={GOLD_DEEP} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>Become a Favorite</Text>
              <Text style={{ color: colors.muted, fontSize: 15, marginTop: 1 }}>Share your work and earn</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD_DEEP} />
          </Pressable>
        ) : null}

        {/* Preferences */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.md }]}>
          <View style={[styles.prefRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
            <Text style={{ flex: 1, color: colors.text, fontWeight: '700', fontSize: 15 }}>Click / type feedback</Text>
            <Switch
              value={soundOn}
              onValueChange={(v) => { setSoundOn(v); setSoundsEnabled(v); if (v) click(); }}
              trackColor={{ true: GOLD, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.prefRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
            <Text style={{ flex: 1, color: colors.text, fontWeight: '700', fontSize: 15 }}>Vibration</Text>
            <Switch
              value={enabled}
              onValueChange={(v) => { setEnabled(v); if (v) impact('success'); }}
              trackColor={{ true: GOLD, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.prefRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
            <Text style={{ flex: 1, color: colors.text, fontWeight: '700', fontSize: 15 }}>Biometrics lock</Text>
            <Switch value={biometrics} onValueChange={(v) => { setBiometrics(v); impact('selection'); }} trackColor={{ true: GOLD, false: colors.border }} thumbColor="#fff" />
          </View>
          <View style={styles.prefRow}>
            <Text style={{ flex: 1, color: colors.text, fontWeight: '700', fontSize: 15 }}>Dark mode</Text>
            <Switch
              value={isDark}
              onValueChange={(v) => { setMode(v ? 'dark' : 'light'); impact('selection'); }}
              trackColor={{ true: GOLD, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: spacing.md },
  levelChip: { borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8, alignSelf: 'flex-start' },
  tokensCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 16, marginHorizontal: 16 },
  tokenIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  topUp: { borderRadius: radii.full, paddingHorizontal: 20, paddingVertical: 12 },
  card: { borderWidth: 1, borderRadius: radii.lg, marginHorizontal: 16, marginTop: spacing.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14 },
  rowIcon: { width: 42, height: 42, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  becomeCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: radii.lg, padding: 18, marginHorizontal: 16, marginTop: spacing.md },
  prefRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
});
