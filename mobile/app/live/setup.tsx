/** Go live (mock 17) - host setup.
 * Cover square, Title, audience chips, Allow Gifts, Gift goal,
 * Schedule and Slow mode rows. Creates a real session via
 * POST /api/live then starts it and opens the host view. Audience,
 * goal, schedule and slow mode have no backend fields yet, so the
 * goal travels as a route param and the rest stay client-side.
 */
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#34D399';

const AUDIENCES = ['Everyone', 'Followers', 'Fan Club'];

export default function LiveSetupScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click } = useSounds();

  const [title, setTitle] = useState('Sunday rehearsal and Q and A');
  const [audience, setAudience] = useState('Everyone');
  const [allowGifts, setAllowGifts] = useState(true);
  const [goal, setGoal] = useState('5000');
  const [slowMode, setSlowMode] = useState(false);
  const [starting, setStarting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('rally.liveSetup');
        if (raw) {
          const s = JSON.parse(raw);
          if (s.title) setTitle(s.title);
          if (s.audience) setAudience(s.audience);
          if (typeof s.allowGifts === 'boolean') setAllowGifts(s.allowGifts);
          if (s.goal) setGoal(s.goal);
          if (typeof s.slowMode === 'boolean') setSlowMode(s.slowMode);
        }
      } catch { /* fresh */ }
    })();
  }, []);

  async function persistSetup() {
    try {
      await AsyncStorage.setItem('rally.liveSetup', JSON.stringify({ title, audience, allowGifts, goal, slowMode }));
    } catch { /* local only */ }
  }

  async function goLive() {
    if (starting) return;
    if (!getToken()) { router.push('/login'); return; }
    setStarting(true);
    setErr(null);
    impact('medium');
    await persistSetup();
    try {
      const handleRaw = await AsyncStorage.getItem('rally.myHandle');
      const handle = handleRaw ? JSON.parse(handleRaw) : null;
      if (!handle) throw new Error('Set up your Favorite page first.');
      const u = await api<any>('/api/users/' + handle);
      const favoriteId = u.favoriteProfile && u.favoriteProfile.id;
      if (!favoriteId) throw new Error('Apply as a Favorite to go live.');
      const created = await api<{ session: { id: string } }>('/api/live', {
        method: 'POST',
        body: JSON.stringify({ favoriteId, title: title.trim() || 'Live session', kind: 'video' }),
      });
      await api('/api/live/' + created.session.id + '/start', { method: 'POST' });
      impact('success');
      router.replace({ pathname: '/live/host', params: { id: created.session.id, goal } });
    } catch (e: any) {
      setErr(e.message || 'Could not start the session');
      setStarting(false);
    }
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Go live</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Cover */}
          <LinearGradient colors={['#B34FD1', GOLD] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cover}>
            <Ionicons name="camera-outline" size={30} color="#fff" />
          </LinearGradient>

          {/* Title */}
          <Text style={[styles.label, { color: colors.text }]}>Title</Text>
          <TextInput
            style={[styles.input, { borderColor: GOLD, color: colors.text }]}
            value={title}
            onChangeText={(t) => setTitle(t.slice(0, 120))}
            maxLength={120}
            placeholder="What are you doing live?"
            placeholderTextColor={colors.muted}
          />

          {/* Audience */}
          <Text style={[styles.label, { color: colors.text }]}>Who can watch</Text>
          <View style={styles.chipRow}>
            {AUDIENCES.map((a) => {
              const on = audience === a;
              return (
                <Pressable
                  key={a}
                  onPress={() => { impact('light'); click(); setAudience(a); }}
                  style={[styles.chip, on ? { borderColor: GOLD } : { backgroundColor: colors.surfaceElevated, borderColor: 'transparent' }]}
                  accessibilityLabel={a}
                >
                  <Text style={{ color: on ? GOLD : colors.text, fontWeight: '800', fontSize: 16 }}>{a}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Rows */}
          <View style={styles.rowsCard}>
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={[styles.rowIcon, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="gift-outline" size={18} color={GOLD} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Allow Gifts</Text>
              <Switch value={allowGifts} onValueChange={(v) => { impact('light'); setAllowGifts(v); }} trackColor={{ true: TEAL, false: colors.border }} thumbColor="#fff" />
            </View>
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={[styles.rowIcon, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="trophy-outline" size={18} color={GOLD} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Set a Gift goal</Text>
              <Pressable
                onPress={() => {
                  impact('light');
                  click();
                  const options: number[] = [1000, 5000, 10000, 25000];
                  Alert.alert(
                    'Set a Gift goal',
                    'Fans see the goal bar while you are live.',
                    options.map((n) => ({ text: n.toLocaleString('en-US') + ' Gifts', onPress: () => setGoal(String(n)) })).concat([{ text: 'Cancel', style: 'cancel' as const }])
                  );
                }}
                hitSlop={8}
                accessibilityLabel="Set a Gift goal"
              >
                <Text style={{ color: colors.muted, fontSize: 16, fontWeight: '700' }}>
                  {(parseInt(goal, 10) || 0).toLocaleString('en-US') + ' Gifts'}
                </Text>
              </Pressable>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ marginLeft: 6 }} />
            </View>
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={[styles.rowIcon, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="calendar-outline" size={18} color={GOLD} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Schedule for later</Text>
              <Text style={{ color: colors.muted, fontSize: 16, fontWeight: '700' }}>Now</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ marginLeft: 6 }} />
            </View>
            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={GOLD} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Slow mode in chat</Text>
              <Switch value={slowMode} onValueChange={(v) => { impact('light'); setSlowMode(v); }} trackColor={{ true: TEAL, false: colors.border }} thumbColor="#fff" />
            </View>
          </View>

          {err ? <Text style={{ color: colors.danger, fontSize: 13, marginTop: 12 }}>{err}</Text> : null}
          <Text style={[styles.localNote, { color: colors.muted }]}>
            Audience, goal and slow mode are saved on this device until the live backend grows those fields.
          </Text>
        </ScrollView>

        <Pressable onPress={goLive} disabled={starting} accessibilityLabel="Go live now">
          <LinearGradient colors={[GOLD, GOLD_DEEP] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.goLiveBtn, starting && { opacity: 0.7 }]}>
            <Text style={{ color: '#111', fontWeight: '900', fontSize: 18 }}>{starting ? 'Starting\u2026' : 'Go live now'}</Text>
          </LinearGradient>
        </Pressable>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  cover: { height: 170, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16, fontWeight: '800', marginTop: spacing.md, marginBottom: 8 },
  input: { borderWidth: 1.5, borderRadius: radii.md, paddingHorizontal: 16, minHeight: 56, fontSize: 17 },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 20, paddingVertical: 12 },
  rowsCard: { marginTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  rowIcon: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 17, fontWeight: '800' },
  localNote: { fontSize: 12, marginTop: spacing.md, lineHeight: 18 },
  goLiveBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full },
});
