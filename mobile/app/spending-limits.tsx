/** Spending Limits (mock 14) - settings screen.
 * Real: weekly cap via PUT /api/limits (server stores Tokens), spend
 * ring from GET /api/limits. Client-side with honest notes: daily cap
 * (no backend column), warn at 80% (local reminder), break reminder
 * (feeds BreakPrompt) and Pause Gifting 24h (the gift tray honours it
 * on this device). Lowering is instant; raising takes effect after 24h
 * server-side.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#34D399';

const WEEKLY_CHOICES = [2500, 5000, 10000, 20000];

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export default function SpendingLimitsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [spentWeek, setSpentWeek] = useState(0);
  const [weeklyCap, setWeeklyCap] = useState<number | null>(null);
  const [dailyCap, setDailyCap] = useState<number | null>(null);
  const [warn80, setWarn80] = useState(true);
  const [breakReminders, setBreakReminders] = useState(true);
  const [pausedUntil, setPausedUntil] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!getToken()) return;
    try {
      const l = await api<any>('/api/limits');
      setSpentWeek(Number(l.spentThisWeek || 0));
      setWeeklyCap(l.weeklySpendCap == null ? null : Number(l.weeklySpendCap));
    } catch { /* offline */ }
    try {
      const d = await AsyncStorage.getItem('rally.spendPrefs');
      if (d) {
        const p = JSON.parse(d);
        if (p.dailyCap !== undefined) setDailyCap(p.dailyCap);
        if (p.warn80 !== undefined) setWarn80(p.warn80);
      }
      const b = await AsyncStorage.getItem('rally.breakPrefs');
      if (b) setBreakReminders(JSON.parse(b).reminders !== false);
      const pu = await AsyncStorage.getItem('rally.giftingPausedUntil');
      if (pu) {
        const t = JSON.parse(pu);
        if (t > Date.now()) setPausedUntil(t);
      }
    } catch { /* fresh */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveWeekly(cap: number) {
    setSaving(true);
    impact('medium');
    try {
      await api('/api/limits', { method: 'PUT', body: JSON.stringify({ weeklySpendCap: cap }) });
      setWeeklyCap(cap);
      impact('success');
    } catch (e: any) {
      Alert.alert('Spending limits', e.message || 'Could not save the weekly limit');
    } finally {
      setSaving(false);
    }
  }

  function persistPrefs(daily: number | null, warn: boolean) {
    AsyncStorage.setItem('rally.spendPrefs', JSON.stringify({ dailyCap: daily, warn80: warn })).catch(() => {});
  }

  function toggleBreak(v: boolean) {
    setBreakReminders(v);
    AsyncStorage.setItem('rally.breakPrefs', JSON.stringify({ reminders: v })).catch(() => {});
  }

  function pause24h() {
    impact('medium');
    const until = Date.now() + 24 * 3600000;
    setPausedUntil(until);
    AsyncStorage.setItem('rally.giftingPausedUntil', JSON.stringify(until)).catch(() => {});
  }

  function resume() {
    impact('light');
    setPausedUntil(null);
    AsyncStorage.removeItem('rally.giftingPausedUntil').catch(() => {});
  }

  const pct = weeklyCap ? Math.min(1, spentWeek / weeklyCap) : 0;

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Spending limits</Text>
          <View style={{ width: 26 }} />
        </View>

        <Text style={[styles.sub, { color: colors.muted }]}>
          Set a ceiling for Gifts. We remind you before you reach it.
        </Text>

        {/* Ring + numbers */}
        <View style={styles.ringWrap}>
          <View style={[styles.ring, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 30 }}>{fmt(spentWeek)}</Text>
            <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>
              {'of ' + (weeklyCap === null ? '\u2014' : fmt(weeklyCap)) + ' Tokens this week'}
            </Text>
          </View>
          <View style={[styles.ringBar, { backgroundColor: colors.border }]}>
            <View style={{ width: Math.round(pct * 100) + '%', height: '100%', borderRadius: 3, backgroundColor: TEAL }} />
          </View>
        </View>

        {/* Weekly limit */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.rowHead}>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>Weekly limit</Text>
            <Text style={{ color: GOLD, fontWeight: '900', fontSize: 17 }}>
              {weeklyCap === null ? 'No limit' : fmt(weeklyCap) + ' Tokens'}
            </Text>
          </View>
          <View style={styles.chipRow}>
            {WEEKLY_CHOICES.map((c) => (
              <Pressable
                key={c}
                onPress={() => saveWeekly(c)}
                disabled={saving}
                style={[styles.chip, { borderColor: weeklyCap === c ? GOLD : colors.border }]}
                accessibilityLabel={'Weekly limit ' + fmt(c)}
              >
                <Text style={{ color: weeklyCap === c ? GOLD : colors.text, fontWeight: '800', fontSize: 13 }}>{fmt(c)}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={async () => {
                setSaving(true);
                try {
                  await api('/api/limits', { method: 'PUT', body: JSON.stringify({ weeklySpendCap: null }) });
                  setWeeklyCap(null);
                } catch { /* keep */ }
                setSaving(false);
              }}
              style={[styles.chip, { borderColor: weeklyCap === null ? GOLD : colors.border }]}
              accessibilityLabel="No weekly limit"
            >
              <Text style={{ color: weeklyCap === null ? GOLD : colors.text, fontWeight: '800', fontSize: 13 }}>None</Text>
            </Pressable>
          </View>

          {/* Daily limit (client-side) */}
          <View style={[styles.rowHead, { marginTop: 16 }]}>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>Daily limit</Text>
            <Text style={{ color: GOLD, fontWeight: '900', fontSize: 17 }}>
              {dailyCap === null ? 'No limit' : fmt(dailyCap) + ' Tokens'}
            </Text>
          </View>
          <View style={styles.chipRow}>
            {[1000, 3000, 5000].map((c) => (
              <Pressable
                key={c}
                onPress={() => { impact('light'); setDailyCap(c); persistPrefs(c, warn80); }}
                style={[styles.chip, { borderColor: dailyCap === c ? GOLD : colors.border }]}
                accessibilityLabel={'Daily limit ' + fmt(c)}
              >
                <Text style={{ color: dailyCap === c ? GOLD : colors.text, fontWeight: '800', fontSize: 13 }}>{fmt(c)}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => { impact('light'); setDailyCap(null); persistPrefs(null, warn80); }}
              style={[styles.chip, { borderColor: dailyCap === null ? GOLD : colors.border }]}
              accessibilityLabel="No daily limit"
            >
              <Text style={{ color: dailyCap === null ? GOLD : colors.text, fontWeight: '800', fontSize: 13 }}>None</Text>
            </Pressable>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 10 }}>
            Daily limits are kept on this phone for now - the server stores weekly and monthly caps.
          </Text>
        </View>

        {/* Toggles */}
        <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
          <View style={[styles.rowIcon, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="notifications-outline" size={18} color={GOLD} />
          </View>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Warn me at 80% of my limit</Text>
          <Switch
            value={warn80}
            onValueChange={(v) => { impact('light'); setWarn80(v); persistPrefs(dailyCap, v); }}
            trackColor={{ true: TEAL, false: colors.border }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.toggleRow}>
          <View style={[styles.rowIcon, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="time-outline" size={18} color={GOLD} />
          </View>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Remind me to take a break</Text>
          <Switch
            value={breakReminders}
            onValueChange={(v) => { impact('light'); toggleBreak(v); }}
            trackColor={{ true: TEAL, false: colors.border }}
            thumbColor="#fff"
          />
        </View>

        {/* Pause gifting */}
        {pausedUntil ? (
          <Pressable onPress={resume} style={[styles.pauseBtn, { backgroundColor: colors.surfaceElevated }]} accessibilityLabel="Resume gifting">
            <Ionicons name="play" size={18} color={TEAL} />
            <Text style={{ color: TEAL, fontWeight: '900', fontSize: 16, marginLeft: 10 }}>
              {'Gifting paused until ' + new Date(pausedUntil).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' - tap to resume'}
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={pause24h} style={[styles.pauseBtn, { backgroundColor: colors.surfaceElevated }]} accessibilityLabel="Pause gifting for 24 hours">
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>Pause Gifting for 24 hours</Text>
          </Pressable>
        )}

        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 10, lineHeight: 18 }}>
          Raising a limit takes effect after 24 hours. Lowering it is instant.
        </Text>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  h1: { fontSize: 26, fontWeight: '900', flex: 1 },
  sub: { fontSize: 15, lineHeight: 21, marginBottom: spacing.md },
  ringWrap: { alignItems: 'center', marginBottom: spacing.md },
  ring: { width: 170, height: 170, borderRadius: 85, borderWidth: 14, alignItems: 'center', justifyContent: 'center' },
  ringBar: { width: 200, height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 14 },
  card: { borderWidth: 1, borderRadius: radii.lg, padding: 16, marginBottom: spacing.md },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  chip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 9 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  rowIcon: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '800' },
  pauseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: radii.lg, paddingVertical: 18, marginTop: spacing.md },
});
