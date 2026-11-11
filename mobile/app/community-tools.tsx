/** Community tools (mock 24) - moderation hub for the Favorite.
 * Tabs: Fan Moments (real queue + approve/feature/hide), Reports (no
 * listing endpoint yet, so an honest empty note) and Team (real roster
 * + invite). The mock's "HEAT 1 - CALM" pill has no backend, so it is
 * omitted rather than faked.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';
const RED = '#E9355B';

type Moment = { id: string; title: string | null; description: string | null; author?: { displayName?: string; handle?: string } };
type Member = { id: string; role: string; permissions: string[]; user: { handle: string; displayName: string; avatarUrl?: string | null } };

const AVATAR_COLORS = ['#06B6D4', '#F97316', '#A855F7', '#EC4899', '#3B82F6'];

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function CommunityToolsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [tab, setTab] = useState<'moments' | 'reports' | 'team'>('moments');
  const [moments, setMoments] = useState<Moment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteHandle, setInviteHandle] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'moderator'>('moderator');
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    setLoading(true);
    try {
      const handleRaw = await AsyncStorage.getItem('rally.myHandle');
      const handle = handleRaw ? JSON.parse(handleRaw) : null;
      if (!handle) { setLoading(false); return; }
      const u = await api<any>('/api/users/' + handle);
      const fid = u.favoriteProfile && u.favoriteProfile.id;
      setFavoriteId(fid || null);
      const jobs: Promise<void>[] = [
        api<Moment[]>('/api/fanmoments/queue').then((r) => setMoments(Array.isArray(r) ? r : [])).catch(() => {}),
      ];
      if (fid) {
        jobs.push(
          api<{ members: Member[] }>('/api/team/list/' + fid)
            .then((r) => setMembers(r.members || []))
            .catch(() => {}),
        );
      }
      await Promise.all(jobs);
    } catch { /* offline */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(m: Moment, action: 'approve' | 'feature' | 'hide') {
    impact('medium');
    try {
      await api('/api/fanmoments/' + m.id + '/' + action, { method: 'POST' });
      setMoments((prev) => prev.filter((x) => x.id !== m.id));
    } catch (e: any) {
      Alert.alert('Fan Moments', e.message || 'Action failed');
    }
  }

  async function invite() {
    if (!favoriteId || !inviteHandle.trim()) return;
    impact('medium');
    setInviting(true);
    try {
      await api('/api/team/invite', {
        method: 'POST',
        body: JSON.stringify({ favoriteId, handle: inviteHandle.trim().replace(/^@/, ''), role: inviteRole, permissions: inviteRole === 'manager' ? ['*'] : ['comments'] }),
      });
      setInviteHandle('');
      await load();
    } catch (e: any) {
      Alert.alert('Invite', e.message || 'Could not send the invite');
    } finally {
      setInviting(false);
    }
  }

  const reportsCount = 0;

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Community tools</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Tabs */}
        <View style={[styles.tabWrap, { backgroundColor: colors.surfaceElevated }]}>
          {([
            ['moments', 'Fan Moments (' + moments.length + ')'],
            ['reports', 'Reports (' + reportsCount + ')'],
            ['team', 'Team'],
          ] as const).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => { impact('light'); setTab(key); }}
              style={[styles.tabBtn, tab === key && { backgroundColor: '#1C1C22', borderRadius: radii.md }]}
              accessibilityLabel={label}
            >
              <Text style={{ color: tab === key ? colors.text : colors.muted, fontWeight: '900', fontSize: 14 }}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'moments' ? (
          <>
            <View style={styles.creditRow}>
              <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Fans keep credit when you feature</Text>
            </View>
            {loading ? <ActivityIndicator color={GOLD} style={{ marginTop: 20 }} /> : null}
            {!loading && moments.length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 12, lineHeight: 20 }}>
                No fan moments waiting. When fans tag you, they land here for review.
              </Text>
            ) : null}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {moments.map((m) => (
                <View key={m.id} style={[styles.momentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.momentHead}>
                    <View style={[styles.thumb, { backgroundColor: colors.surfaceElevated }]}>
                      <Ionicons name="image-outline" size={22} color={colors.muted} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }} numberOfLines={1}>
                        {m.title || m.description || 'Fan moment'}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                        {'by ' + ((m.author && (m.author.displayName || m.author.handle)) || 'a fan')}
                      </Text>
                      <View style={styles.chipRow}>
                        <View style={[styles.chip, { backgroundColor: colors.surfaceElevated }]}>
                          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>Fan Moment</Text>
                        </View>
                        <View style={[styles.chip, { backgroundColor: colors.surfaceElevated }]}>
                          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>English</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.actionRow}>
                    <Pressable onPress={() => act(m, 'approve')} style={[styles.actionBtn, { backgroundColor: 'rgba(52,211,153,0.16)' }]} accessibilityLabel="Approve">
                      <Text style={{ color: TEAL, fontWeight: '900', fontSize: 16 }}>Approve</Text>
                    </Pressable>
                    <Pressable onPress={() => act(m, 'feature')} style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated }]} accessibilityLabel="Feature">
                      <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>Feature</Text>
                    </Pressable>
                    <Pressable onPress={() => act(m, 'hide')} style={[styles.actionBtn, { backgroundColor: 'rgba(233,53,91,0.16)' }]} accessibilityLabel="Hide">
                      <Text style={{ color: RED, fontWeight: '900', fontSize: 16 }}>Hide</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        ) : null}

        {tab === 'reports' ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="flag-outline" size={22} color={GOLD} />
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 10 }}>No report queue yet</Text>
            <Text style={{ color: colors.muted, fontSize: 14, marginTop: 6, lineHeight: 20, textAlign: 'center' }}>
              Fans can already report posts and comments. A review queue for creators is on the roadmap, so this tab stays empty until then.
            </Text>
          </View>
        ) : null}

        {tab === 'team' ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={[styles.teamCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.teamHead}>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>Your team</Text>
                <Pressable onPress={() => { impact('light'); setInviteRole(inviteRole === 'manager' ? 'moderator' : 'manager'); }} accessibilityLabel="Toggle invite role">
                  <Text style={{ color: GOLD, fontWeight: '900', fontSize: 15 }}>Invite as {inviteRole === 'manager' ? 'Manager' : 'Moderator'}</Text>
                </Pressable>
              </View>

              {members.map((mem, i) => (
                <View key={mem.id} style={styles.memberRow}>
                  <View style={[styles.memberAvatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>{initials(mem.user.displayName || mem.user.handle)}</Text>
                  </View>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                    {(mem.user.displayName || mem.user.handle) + ' \u00b7 ' + (mem.role === 'manager' ? 'Manager' : 'Moderator')}
                  </Text>
                  <View style={[styles.permPill, { backgroundColor: mem.role === 'manager' ? 'rgba(52,211,153,0.16)' : 'rgba(255,167,38,0.16)' }]}>
                    <Text style={{ color: mem.role === 'manager' ? TEAL : GOLD, fontWeight: '900', fontSize: 11, letterSpacing: 0.5 }}>
                      {mem.role === 'manager' ? 'FULL ACCESS' : 'COMMENTS ONLY'}
                    </Text>
                  </View>
                </View>
              ))}
              {members.length === 0 && !loading ? (
                <Text style={{ color: colors.muted, fontSize: 14 }}>Just you so far. Invite a manager or moderator below.</Text>
              ) : null}

              <View style={[styles.inviteRow, { borderTopColor: colors.border }]}>
                <TextInput
                  style={[styles.inviteInput, { borderColor: colors.border, color: colors.text }]}
                  placeholder="@handle to invite"
                  placeholderTextColor={colors.muted}
                  value={inviteHandle}
                  onChangeText={setInviteHandle}
                  autoCapitalize="none"
                />
                <Pressable onPress={invite} disabled={inviting || !favoriteId} style={styles.inviteBtn} accessibilityLabel="Send invite">
                  <Text style={{ color: '#111', fontWeight: '900', fontSize: 14 }}>{inviting ? '\u2026' : 'Invite'}</Text>
                </Pressable>
              </View>

              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 10 }}>Every action is saved in an audit log.</Text>
            </View>
          </ScrollView>
        ) : null}

        {tab === 'moments' && !loading && moments.length > 0 ? <View /> : null}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  tabWrap: { flexDirection: 'row', borderRadius: radii.md, padding: 4 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  creditRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.sm, marginBottom: 8 },
  momentCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16, marginBottom: 14 },
  momentHead: { flexDirection: 'row' },
  thumb: { width: 64, height: 64, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: { borderRadius: radii.sm, paddingHorizontal: 10, paddingVertical: 5 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: radii.md },
  emptyCard: { borderWidth: 1, borderRadius: radii.lg, padding: 20, alignItems: 'center', marginTop: spacing.md },
  teamCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.md },
  teamHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  memberAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  permPill: { borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 5 },
  inviteRow: { flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
  inviteInput: { flex: 1, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, minHeight: 46, fontSize: 15 },
  inviteBtn: { backgroundColor: GOLD, borderRadius: radii.md, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
});
