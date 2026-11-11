/** Face-Off Invite (mock 07)
 * Shows a challenge that was actually created on the backend. Honest
 * deviation: there is no accept/decline endpoint yet, so Accept opens
 * the live Face-Off (voting is real) and Decline explains that the
 * face-off stays open and you can simply not vote. Invites with real
 * expiration arrive with the invites backend.
 */
import { Text, StyleSheet, View, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';

const GOLD = '#FFA726';
const TEAL = '#34D399';

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function daysLabel(hours: number): string {
  if (hours <= 24) return '24 hours';
  return Math.round(hours / 24) + ' days';
}

export default function InviteScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const router = useRouter();
  const p = useLocalSearchParams<{ faceOffId?: string; topic?: string; hours?: string; heat?: string; nameA?: string; nameB?: string; quote?: string }>();

  const nameA = p.nameA || 'Side A';
  const nameB = p.nameB || 'You';
  const topic = p.topic || 'Face-Off';
  const hours = Number(p.hours || 72);

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel={'Back'}>
            <Ionicons name={'chevron-back'} size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Challenge</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* VS card */}
        <View style={[styles.vsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.vsRow}>
            <View style={styles.side}>
              <LinearGradient colors={['#F59E0B', '#F0663F'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 26 }}>{initials(nameA)}</Text>
              </LinearGradient>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 10 }} numberOfLines={1}>{nameA}</Text>
            </View>
            <Text style={{ color: GOLD, fontWeight: '900', fontSize: 22 }}>VS</Text>
            <View style={styles.side}>
              <LinearGradient colors={['#4F46E5', '#818CF8'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 26 }}>{initials(nameB)}</Text>
              </LinearGradient>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 10 }} numberOfLines={1}>{nameB}</Text>
            </View>
          </View>
          <Text style={[styles.topic, { color: colors.text }]}>{topic}</Text>
          <Text style={{ color: colors.muted, fontSize: 15 }}>{daysLabel(hours) + ' \u00b7 ' + (p.heat || 'Friendly')}</Text>
        </View>

        {/* Quote */}
        <View style={[styles.quoteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: colors.muted, fontSize: 17, lineHeight: 25 }}>{'"' + topic + '"'}</Text>
          <Text style={{ color: colors.muted, fontSize: 15, marginTop: 8 }}>{nameA}</Text>
        </View>

        <View style={[styles.expireRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name={'time-outline'} size={20} color={TEAL} />
          <Text style={{ color: colors.muted, fontSize: 15, flex: 1, marginLeft: 10 }}>
            This Face-Off is live and runs for {daysLabel(hours).toLowerCase()}.
          </Text>
        </View>

        <View style={{ marginTop: 'auto', marginBottom: spacing.lg }}>
          <Pressable
            onPress={() => {
              impact('medium');
              if (p.faceOffId) router.replace('/rivalries/faceoff?id=' + p.faceOffId);
              else router.back();
            }}
            style={styles.acceptBtn}
            accessibilityLabel="View the Face-Off"
          >
            <Text style={{ color: '#111', fontWeight: '900', fontSize: 18 }}>View Face-Off</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              impact('light');
              Alert.alert('Decline', 'There is no decline endpoint yet. The Face-Off stays open and you can simply not vote - it ends on its own.');
            }}
            hitSlop={10}
            style={{ paddingVertical: 16 }}
            accessibilityLabel="Decline"
          >
            <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 16, textAlign: 'center' }}>Decline</Text>
          </Pressable>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  h1: { fontSize: 20, fontWeight: '900' },
  vsCard: { borderWidth: 1, borderRadius: radii.xl, padding: 22, alignItems: 'center' },
  vsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  side: { alignItems: 'center', flex: 1 },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  topic: { fontWeight: '900', fontSize: 22, textAlign: 'center', marginTop: 20 },
  quoteCard: { borderWidth: 1, borderRadius: radii.lg, padding: 18, marginTop: spacing.md },
  expireRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.md },
  acceptBtn: { backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full },
});
