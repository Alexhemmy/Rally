/** Settings - Rally design
 * Spending Limits: monthly token cap with a spent-this-month progress bar,
 * set/remove cap, gift anonymity default, and quick links.
 * Data from GET/PUT /api/limits.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { GlassCard, SectionHeader, GradientButton, EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#00897B';

const LINKS = [
  { href: '/security', label: 'Security', icon: 'shield-checkmark-outline' },
  { href: '/permissions', label: 'App permissions', icon: 'hardware-chip-outline' },
  { href: '/connection', label: 'Connection', icon: 'server-outline' },
  { href: '/notifications', label: 'Notifications', icon: 'notifications-outline' },
];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click } = useSounds();

  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [cap, setCap] = useState<number | null>(null);
  const [spent, setSpent] = useState(0);
  const [anon, setAnon] = useState(false);
  const [capInput, setCapInput] = useState('');
  const [weekCap, setWeekCap] = useState<number | null>(null);
  const [weekSpent, setWeekSpent] = useState(0);
  const [weekInput, setWeekInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const apply = useCallback((d: any) => {
    setCap(d.monthlySpendCap ?? null);
    setSpent(Number(d.spentThisMonth || 0));
    setAnon(!!d.anonymityDefault);
    setWeekCap(d.weeklySpendCap ?? null);
    setWeekSpent(Number(d.spentThisWeek || 0));
  }, []);

  const load = useCallback(async () => {
    if (!getToken()) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    setAuthed(true);
    setLoading(true);
    try {
      const res = await api<any>('/api/limits');
      apply(res);
    } catch {
      setStatus({ type: "error", text: "Could not load your limits. Pull to retry." });
    } finally {
      setLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveCap(next: number | null) {
    if (saving) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await api<any>('/api/limits', {
        method: 'PUT',
        body: JSON.stringify({ monthlySpendCap: next }),
      });
      apply(res);
      setCapInput('');
      impact("success");
      setStatus({
        type: "success",
        text: next === null ? "Limit removed" : "Monthly limit set to T " + next.toLocaleString(),
      });
    } catch (e: any) {
      setStatus({ type: "error", text: e && e.message ? e.message : "Could not save." });
    } finally {
      setSaving(false);
    }
  }

  async function saveWeekly(next: number | null) {
    if (saving) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await api<any>('/api/limits', {
        method: 'PUT',
        body: JSON.stringify({ weeklySpendCap: next }),
      });
      apply(res);
      setWeekInput('');
      impact("success");
      setStatus({
        type: "success",
        text: next === null ? "Weekly limit removed" : "Weekly limit set to T " + next.toLocaleString(),
      });
    } catch (e: any) {
      setStatus({ type: "error", text: e && e.message ? e.message : "Could not save." });
    } finally {
      setSaving(false);
    }
  }

  async function toggleAnon(v: boolean) {
    setAnon(v);
    impact("light");
    try {
      await api('/api/limits', {
        method: 'PUT',
        body: JSON.stringify({ anonymityDefault: v }),
      });
    } catch {
      setAnon(!v);
    }
  }

  const pct = cap ? Math.min(100, Math.round((spent / cap) * 100)) : 0;
  const over = cap !== null && spent > cap;
  const weekOver = weekCap !== null && weekSpent > weekCap;
  const weekPct = weekCap ? Math.min(100, Math.round((weekSpent / weekCap) * 100)) : 0;

  return (
    <SwipeBack>
      <Screen>
        {/* Header */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Settings</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 60 }} />
        ) : !authed ? (
          <View style={{ marginTop: spacing.lg, gap: 12, alignItems: "center" }}>
            <EmptyState
              icon="lock-closed-outline"
              title="Sign in to manage settings"
              body="Spending limits and preferences need an account."
            />
            <GradientButton
              label="Log in"
              onPress={() => router.push('/login')}
              fullWidth
            />
          </View>
        ) : (
          <>
            {/* Spending limits */}
            <GlassCard style={{ marginTop: spacing.md }}>
              <View style={styles.cardHead}>
                <View style={styles.iconBubble}>
                  <Ionicons name="wallet-outline" size={17} color="#111" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Spending limits</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 1 }}>
                    A monthly cap on the tokens you gift
                  </Text>
                </View>
                {over ? (
                  <View style={styles.overBadge}>
                    <Text style={styles.overText}>OVER</Text>
                  </View>
                ) : null}
              </View>

              {/* Cap display */}
              <View style={[styles.capRow, { borderTopColor: colors.border }]}>
                <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "700" }}>MONTHLY LIMIT</Text>
                <Text style={[styles.capValue, { color: colors.text }]}>
                  {cap === null ? "No limit" : "T " + cap.toLocaleString()}
                </Text>
              </View>

              {/* Spent progress */}
              <View style={styles.progressWrap}>
                <View style={styles.progressLabels}>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>Spent this month</Text>
                  <Text style={[styles.spentValue, { color: over ? "#ef5350" : TEAL }]}>
                    T {spent.toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.track, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: (cap === null ? (spent > 0 ? 100 : 0) : pct) + "%",
                        backgroundColor: over ? "#ef5350" : GOLD,
                      },
                    ]}
                  />
                </View>
                {cap === null ? (
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>
                    Set a cap to track your monthly gifting budget.
                  </Text>
                ) : (
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>
                    {pct}% of your limit used
                  </Text>
                )}
              </View>

              {/* Set cap */}
              <View style={[styles.capInputRow, { borderColor: colors.border }]}>
                <Text style={{ color: GOLD, fontWeight: "900", fontSize: 15 }}>T</Text>
                <TextInput
                  style={[styles.capInput, { color: colors.text }]}
                  placeholder="New monthly limit"
                  placeholderTextColor={colors.muted}
                  value={capInput}
                  onChangeText={(t) => setCapInput(t.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  maxLength={7}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => {
                    const n = parseInt(capInput, 10);
                    if (!n || n < 1) {
                      setStatus({ type: "error", text: "Enter a limit of at least 1 token." });
                      return;
                    }
                    saveCap(n);
                  }}
                  disabled={saving}
                  accessibilityLabel="Save monthly limit"
                >
                  <LinearGradient
                    colors={[GOLD, GOLD_DEEP] as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.saveBtn, saving && { opacity: 0.5 }]}
                  >
                    <Text style={styles.saveText}>{saving ? "Saving\u2026" : "Save limit"}</Text>
                  </LinearGradient>
                </Pressable>
                {cap !== null ? (
                  <Pressable
                    onPress={() => saveCap(null)}
                    disabled={saving}
                    style={[styles.removeBtn, { borderColor: colors.border }]}
                    accessibilityLabel="Remove monthly limit"
                  >
                    <Text style={{ color: colors.muted, fontWeight: "700", fontSize: 14 }}>Remove</Text>
                  </Pressable>
                ) : null}
              </View>

              {status ? (
                <Text
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    fontWeight: "600",
                    color: status.type === "success" ? TEAL : "#ef5350",
                  }}
                >
                  {status.text}
                </Text>
              ) : null}
            </GlassCard>

            {/* Weekly spending limit */}
            <GlassCard style={{ marginTop: spacing.md }}>
              <View style={[styles.capRow, { borderTopColor: colors.border }]}>
                <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "700" }}>WEEKLY LIMIT</Text>
                <Text style={[styles.capValue, { color: colors.text }]}>
                  {weekCap === null ? "No limit" : "T " + weekCap.toLocaleString()}
                </Text>
              </View>
              <View style={styles.progressWrap}>
                <View style={styles.progressLabels}>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>Spent this week</Text>
                  <Text style={[styles.spentValue, { color: weekOver ? "#ef5350" : TEAL }]}>
                    T {weekSpent.toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.track, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: (weekCap === null ? (weekSpent > 0 ? 100 : 0) : weekPct) + "%",
                        backgroundColor: weekOver ? "#ef5350" : GOLD,
                      },
                    ]}
                  />
                </View>
                {weekCap === null ? (
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>
                    Set a weekly cap to track your gift tray limit.
                  </Text>
                ) : (
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>
                    {weekPct}% of your weekly limit used
                  </Text>
                )}
              </View>
              <View style={[styles.capInputRow, { borderColor: colors.border }]}>
                <Text style={{ color: GOLD, fontWeight: "900", fontSize: 15 }}>T</Text>
                <TextInput
                  style={[styles.capInput, { color: colors.text }]}
                  placeholder="New weekly limit"
                  placeholderTextColor={colors.muted}
                  value={weekInput}
                  onChangeText={(t) => setWeekInput(t.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  maxLength={7}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => {
                    const n = parseInt(weekInput, 10);
                    if (!n || n < 1) {
                      setStatus({ type: "error", text: "Enter a limit of at least 1 token." });
                      return;
                    }
                    saveWeekly(n);
                  }}
                  disabled={saving}
                  accessibilityLabel="Save weekly limit"
                >
                  <LinearGradient
                    colors={[GOLD, GOLD_DEEP] as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.saveBtn, saving && { opacity: 0.5 }]}
                  >
                    <Text style={styles.saveText}>{saving ? "Saving\u2026" : "Save weekly limit"}</Text>
                  </LinearGradient>
                </Pressable>
                {weekCap !== null ? (
                  <Pressable
                    onPress={() => saveWeekly(null)}
                    disabled={saving}
                    style={[styles.removeBtn, { borderColor: colors.border }]}
                    accessibilityLabel="Remove weekly limit"
                  >
                    <Text style={{ color: colors.muted, fontWeight: "700", fontSize: 14 }}>Remove</Text>
                  </Pressable>
                ) : null}
              </View>
            </GlassCard>

            {/* Gifting preferences */}
            <GlassCard style={{ marginTop: spacing.md }}>
              <SectionHeader title="Gifting" />
              <View style={styles.switchRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ color: colors.text, fontSize: 15 }}>Gifts default to anonymous</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                    Preselects the anonymous switch in the gift tray
                  </Text>
                </View>
                <Switch
                  value={anon}
                  onValueChange={toggleAnon}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor="#fff"
                />
              </View>
            </GlassCard>

            {/* Links */}
            <GlassCard style={{ marginTop: spacing.md }} padded={false}>
              {LINKS.map((l, i) => (
                <Pressable
                  key={l.href}
                  onPress={() => {
                    click();
                    router.push(l.href as any);
                  }}
                  style={({ pressed }) => [
                    styles.linkRow,
                    {
                      borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                      borderTopColor: colors.border,
                      backgroundColor: pressed ? colors.surfaceHover : "transparent",
                    },
                  ]}
                >
                  <Ionicons name={l.icon} size={20} color={GOLD} />
                  <Text style={[styles.linkText, { color: colors.text }]}>{l.label}</Text>
                  <Text style={{ color: colors.primary, fontSize: 18 }}>{"\u203a"}</Text>
                </Pressable>
              ))}
            </GlassCard>
          </>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.sm },
  h1: { fontSize: 24, fontWeight: "900" },
  cardHead: { flexDirection: "row", alignItems: "center" },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "900" },
  overBadge: {
    backgroundColor: "#ef5350",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  overText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  capRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
    paddingTop: 14,
  },
  capValue: { fontSize: 18, fontWeight: "900" },
  progressWrap: { marginTop: 14 },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  spentValue: { fontSize: 14, fontWeight: "800" },
  track: { height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  capInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 16,
    marginTop: 16,
    height: 46,
  },
  capInput: { flex: 1, fontSize: 15, fontWeight: "700", padding: 0 },
  saveBtn: {
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  saveText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  removeBtn: {
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  linkText: { flex: 1, fontSize: 15, fontWeight: "500" },
});