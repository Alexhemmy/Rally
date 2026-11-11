/** Post settings - Rally design (mock 19)
 * Final gate before a Moment goes live: audience, gifts, comments,
 * captions, schedule and Fan Club only. Toggles that need backends that
 * do not exist yet say so honestly. Post publishes the Moment.
 */
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { api } from '@/lib/api';
import { spacing, radii } from '@/constants/theme';

const GOLD = '#FFA726';
const TEAL = '#34D399';

const WATCH_MAP: Record<string, string> = { Everyone: 'PUBLIC', Followers: 'FOLLOWERS', Supporters: 'SUPPORTERS' };
const WATCH_ORDER = ['Everyone', 'Followers', 'Supporters'];

export default function PostSettingsScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { click, success: okSound, error: errSound } = useSounds();
  const router = useRouter();
  const p = useLocalSearchParams<{ title?: string; tag?: string; description?: string; mediaUrl?: string }>();

  const [watch, setWatch] = useState('Everyone');
  const [gifts, setGifts] = useState(true);
  const [comments, setComments] = useState(true);
  const [captions, setCaptions] = useState(true);
  const [fanOnly, setFanOnly] = useState(false);
  const [posting, setPosting] = useState(false);

  async function post() {
    if (posting) return;
    setPosting(true);
    impact('medium');
    try {
      const created = await api<{ moment: { id: string } }>('/api/moments', {
        method: 'POST',
        body: JSON.stringify({
          title: (p.title || 'Untitled Moment').slice(0, 120),
          description: p.description || undefined,
          categoryTag: p.tag || undefined,
          visibility: fanOnly ? 'SUPPORTERS' : WATCH_MAP[watch],
          isFlash: false,
          mediaUrl: p.mediaUrl || undefined,
          mediaType: p.mediaUrl ? 'video' : undefined,
        }),
      });
      okSound();
      impact('success');
      router.replace('/moment-posted?id=' + encodeURIComponent(created.moment.id) + '&title=' + encodeURIComponent(p.title || ''));
    } catch (e: any) {
      errSound();
      impact('error');
      Alert.alert('Could not post', e.message || 'Please try again.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel={'Back'}>
            <Ionicons name={'chevron-back'} size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Post settings</Text>
          <Pressable onPress={post} disabled={posting} hitSlop={10}>
            <Text style={[styles.post, { color: GOLD, opacity: posting ? 0.5 : 1 }]}>{posting ? 'Posting' : 'Post'}</Text>
          </Pressable>
        </View>

        {/* Preview */}
        <View style={styles.previewRow}>
          <LinearGradient colors={['#E9355B', GOLD] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.thumb} />
          <View style={[styles.captionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.captionText, { color: colors.text }]} numberOfLines={4}>
              {(p.title || '') + (p.description ? '. ' + p.description : '')}
            </Text>
          </View>
        </View>

        {/* Who can watch */}
        <Pressable
          style={[styles.row, { borderBottomColor: colors.border }]}
          onPress={() => {
            impact('light');
            click();
            const i = WATCH_ORDER.indexOf(watch);
            setWatch(WATCH_ORDER[(i + 1) % WATCH_ORDER.length]);
            if (fanOnly) setFanOnly(false);
          }}
        >
          <View style={[styles.iconTile, { backgroundColor: colors.surface }]}>
            <Ionicons name={'globe-outline'} size={20} color={GOLD} />
          </View>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Who can watch</Text>
          <Text style={[styles.rowValue, { color: colors.muted }]}>{fanOnly ? 'Supporters' : watch}</Text>
          <Ionicons name={'chevron-forward'} size={18} color={colors.muted} />
        </Pressable>

        <SettingRow icon={'gift-outline'} label={'Allow Gifts'} colors={colors} value={gifts} onChange={(v) => { impact('light'); setGifts(v); }} />
        <SettingRow icon={'chatbubble-outline'} label={'Allow comments'} colors={colors} value={comments} onChange={(v) => { impact('light'); setComments(v); }} />
        <SettingRow icon={'language-outline'} label={'Auto-translate captions'} colors={colors} value={captions} onChange={(v) => { impact('light'); setCaptions(v); }} />

        <Pressable style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => Alert.alert('Schedule', 'Scheduling arrives with the scheduler backend. Moments post immediately for now.')}>
          <View style={[styles.iconTile, { backgroundColor: colors.surface }]}>
            <Ionicons name={'calendar-outline'} size={20} color={GOLD} />
          </View>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Schedule</Text>
          <Text style={[styles.rowValue, { color: colors.muted }]}>Post now</Text>
          <Ionicons name={'chevron-forward'} size={18} color={colors.muted} />
        </Pressable>

        <SettingRow icon={'ticket-outline'} label={'Fan Club only'} colors={colors} value={fanOnly} onChange={(v) => { impact('light'); setFanOnly(v); }} />

        <View style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name={'shield-checkmark-outline'} size={18} color={TEAL} />
          <Text style={[styles.noteText, { color: colors.muted }]}>
            Music you do not own can get a Moment removed. Use sounds from the Rally library.
          </Text>
        </View>
        <Text style={[styles.honestNote, { color: colors.muted }]}>
          Per-Moment gifts, comment rules, captions and scheduling arrive with their backends. Fan Club only sets the Moment to Supporters.
        </Text>
      </Screen>
    </SwipeBack>
  );
}

function SettingRow(props: { icon: string; label: string; value: boolean; onChange: (v: boolean) => void; colors: any }) {
  return (
    <View style={[styles.row, { borderBottomColor: props.colors.border }]}>
      <View style={[styles.iconTile, { backgroundColor: props.colors.surface }]}>
        <Ionicons name={props.icon as any} size={20} color={GOLD} />
      </View>
      <Text style={[styles.rowLabel, { color: props.colors.text }]}>{props.label}</Text>
      <Switch
        value={props.value}
        onValueChange={props.onChange}
        trackColor={{ false: props.colors.border, true: TEAL }}
        thumbColor={'#fff'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  h1: { fontSize: 20, fontWeight: '900' },
  post: { fontSize: 17, fontWeight: '800' },
  previewRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.lg },
  thumb: { width: 96, height: 128, borderRadius: radii.md },
  captionCard: { flex: 1, borderWidth: 1, borderRadius: radii.md, padding: 14 },
  captionText: { fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  iconTile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '800' },
  rowValue: { fontSize: 15, fontWeight: '600' },
  noteCard: { flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 1, borderRadius: radii.md, padding: 14, marginTop: spacing.lg },
  noteText: { flex: 1, fontSize: 13, lineHeight: 19 },
  honestNote: { fontSize: 12, lineHeight: 18, marginTop: spacing.md, marginBottom: spacing.lg },
});
