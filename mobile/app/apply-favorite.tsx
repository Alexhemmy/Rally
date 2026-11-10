/** Apply as Favorite (UX 32) - Rally design
 * Two routes in: Apply directly or Grow into it. The checklist shows
 * identity, age 18 or over, specialty and proof of presence. The payout
 * account is requested only after approval. Submit is disabled until the
 * required items are done, and a reviewer replies within 3 business days.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const GREEN = '#34D399';
const RED = '#ef5350';

type Progress = {
  isAdult: boolean;
  isFavorite: boolean;
  signals: { id: string; label: string; done: boolean; hint: string | null }[];
};
type Status = {
  request: { id: string; status: string } | null;
  hasProfile: boolean;
  verificationStatus: string | null;
};

export default function ApplyAsFavoriteScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [route, setRoute] = useState<'direct' | 'grow'>('direct');
  const [progress, setProgress] = useState<Progress | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [pitch, setPitch] = useState('');
  const [links, setLinks] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        api<Progress>('/api/upgrade/progress'),
        api<Status>('/api/upgrade/status'),
      ]);
      setProgress(p);
      setStatus(s);
    } catch {
    } finally {
      setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const linkList = links.split(',').map((s) => s.trim()).filter((s) => s.length > 3);
  const sig = (id: string) => progress && progress.signals ? progress.signals.find((s) => s.id === id) : null;
  const ageOk = progress ? progress.isAdult : false;
  const identityOk = sig('phone') ? !!sig('phone')!.done : false;
  const profileOk = sig('profile') ? !!sig('profile')!.done : false;
  const specialtyOk = sig('specialty') ? !!sig('specialty')!.done : false;
  const requiredDone = ageOk && identityOk && profileOk && specialtyOk && pitch.trim().length >= 20 && linkList.length >= 1;
  const alreadyPending = status && status.request && ['screening', 'pending'].includes(status.request.status);

  async function submit() {
    if (!requiredOk || sending) return;
    setSending(true);
    setMsg(null);
    impact('medium');
    try {
      const res = await api<{ note: string }>('/api/upgrade/request', {
        method: 'POST',
        body: JSON.stringify({ pitch: pitch.trim(), samples: linkList }),
      });
      impact('success');
      setMsg({ ok: true, text: res.note || 'Submitted for review. A reviewer replies within 3 business days.' });
      await load();
    } catch (e: any) {
      setMsg({ ok: false, text: e && e.message ? e.message : 'Could not submit. Try again.' });
    } finally {
      setSending(false);
    }
  }

  const Row = ({ ok, title, value, hint }: { ok: boolean; title: string; value: string; hint?: string }) => (
    <View style={[styles.checkRow, { borderBottomColor: colors.border }]}>
      <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={ok ? GREEN : GOLD} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 1 }}>{value}</Text>
        {hint ? <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>{hint}</Text> : null}
      </View>
    </View>
  );

  return (
    <SwipeBack>
      <Screen>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Become a Favorite</Text>
        </View>
        <Text style={[styles.sub, { color: colors.muted }]}>
          Two ways in. A reviewer answers within 3 business days.
        </Text>

        {loading ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 60 }} />
        ) : progress && progress.isFavorite ? (
          <View style={[styles.noteBox, { backgroundColor: colors.surface, borderColor: GREEN + '55' }]}>
            <Ionicons name="sparkles" size={20} color={GREEN} />
            <Text style={[styles.noteText, { color: colors.text }]}>
              You already have a Favorite page. Payouts unlock after approval.
            </Text>
          </View>
        ) : alreadyPending ? (
          <View style={[styles.noteBox, { backgroundColor: colors.surface, borderColor: GOLD + '55' }]}>
            <Ionicons name="hourglass-outline" size={20} color={GOLD} />
            <Text style={[styles.noteText, { color: colors.text }]}>
              Your application is in review. The result arrives in your Inbox.
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
            {/* Two routes */}
            <Pressable
              style={[styles.routeCard, route === 'direct' && styles.routeOn, { borderColor: route === 'direct' ? GOLD : colors.border }]}
              onPress={() => { impact('light'); setRoute('direct'); }}
              accessibilityLabel="Apply directly"
            >
              <View style={styles.routeHead}>
                <View style={[styles.radio, route === 'direct' && styles.radioOn]} />
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15 }}>Apply directly</Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 }}>
                For people with an established presence. Verify your identity and show your work.
              </Text>
            </Pressable>
            <Pressable
              style={[styles.routeCard, route === 'grow' && styles.routeOn, { borderColor: route === 'grow' ? GOLD : colors.border }]}
              onPress={() => { impact('light'); setRoute('grow'); }}
              accessibilityLabel="Grow into it"
            >
              <View style={styles.routeHead}>
                <View style={[styles.radio, route === 'grow' && styles.radioOn]} />
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15 }}>Grow into it</Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 }}>
                Start as a fan, build your audience here, and ask for review when every signal is green.
              </Text>
              <Pressable onPress={() => router.push('/favorite-progress')} hitSlop={8}>
                <Text style={{ color: GOLD, fontWeight: '800', fontSize: 13, marginTop: 8 }}>See Favorite Progress</Text>
              </Pressable>
            </Pressable>

            {/* Checklist */}
            <Text style={[styles.section, { color: colors.muted }]}>CHECKLIST</Text>
            <View style={[styles.checkCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Row ok={ageOk} title="Age 18 or over" value={ageOk ? 'Verified' : 'Your date of birth is checked at sign up'} />
              <Row ok={identityOk} title="Identity" value={identityOk ? 'ID and selfie' : 'Verify your phone or social account'} />
              <Row ok={specialtyOk} title="Specialty" value={specialtyOk ? 'Chosen in Favorite Setup' : 'Choose a specialty first'} />
              <Row
                ok={linkList.length >= 1}
                title="Proof of presence"
                value={linkList.length + ' of 3 links'}
                hint="Press, a catalog, or a profile that shows your work."
              />
              <Row ok={false} title="Payout account" value="After approval" hint="In your own name. We check it before the first payout." />
            </View>

            {/* Pitch + links */}
            <Text style={[styles.section, { color: colors.muted }]}>YOUR PITCH</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="What you do, in your own words (20+ characters)"
              placeholderTextColor={colors.muted}
              value={pitch}
              onChangeText={setPitch}
              multiline
              maxLength={2000}
            />
            <Text style={[styles.section, { color: colors.muted }]}>LINKS THAT SHOW YOUR WORK</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Add links separated by commas"
              placeholderTextColor={colors.muted}
              value={links}
              onChangeText={setLinks}
              autoCapitalize="none"
            />

            {/* Impersonation note */}
            <View style={[styles.noteBox, { backgroundColor: colors.surface, borderColor: GREEN + '55' }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={GREEN} />
              <Text style={[styles.noteText, { color: colors.muted }]}>
                Well-known names are reserved for verified claimants. Impersonation is removed fast.
              </Text>
            </View>

            {msg ? (
              <Text style={{ color: msg.ok ? GREEN : RED, fontSize: 13, fontWeight: '700', lineHeight: 19, marginTop: 10 }}>
                {msg.text}
              </Text>
            ) : null}

            <Pressable
              style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
              onPress={submit}
              disabled={!requiredOk || sending}
              accessibilityLabel="Submit for review"
            >
              <LinearGradient
                colors={[GOLD, GOLD_DEEP] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.submitGradient, !requiredOk && { opacity: 0.4 }]}
              >
                <Text style={styles.submitText}>{sending ? 'Submitting\u2026' : 'Submit for review'}</Text>
              </LinearGradient>
            </Pressable>
            {!requiredOk ? (
              <Text style={styles.hint}>
                Complete the checklist above to enable Submit for review.
              </Text>
            ) : null}
          </ScrollView>
        )}
        </KeyboardAvoidingView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm },
  h1: { fontSize: 24, fontWeight: '900' },
  sub: { fontSize: 13, marginTop: 4, marginBottom: spacing.md },
  routeCard: { borderWidth: 1.5, borderRadius: radii.lg, padding: 16, marginBottom: 12 },
  routeOn: { backgroundColor: 'rgba(255,167,38,0.06)' },
  routeHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#8A8A9E' },
  radioOn: { borderColor: GOLD, backgroundColor: GOLD },
  section: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: spacing.md, marginBottom: 8 },
  checkCard: { borderWidth: 1, borderRadius: radii.lg },
  checkRow: { flexDirection: 'row', padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'flex-start' },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
    fontSize: 14,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  noteBox: { flexDirection: 'row', borderWidth: 1, borderRadius: radii.md, padding: 12, marginTop: 14, alignItems: 'flex-start', gap: 8 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  submitBtn: { borderRadius: radii.full, marginTop: 16, overflow: 'hidden' },
  submitGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  hint: { color: '#8A8A9E', fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 17 },
});
