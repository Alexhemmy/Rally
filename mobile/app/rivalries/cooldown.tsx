/** Cool Down (mock 13)
 * Shown after a rival or moderator pauses the channel for real via
 * POST /api/rivalries/:id/pause-channel. Honest deviation: the backend
 * pauses until both sides are ready (no 2-hour timer yet), so the
 * countdown row says that instead of a fake clock. Leave this Rivalry
 * hides rivalry content in your feed for real.
 */
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';

const GOLD = '#FFA726';
const TEAL = '#34D399';
const RED = '#E9355B';

export default function CoolDownScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const router = useRouter();
  const p = useLocalSearchParams<{ id?: string; name?: string }>();
  const [other, setOther] = useState(p.name || 'the other fandom');

  useEffect(() => {
    AsyncStorage.getItem('rally.rivalryMutedFandom')
      .then((v) => { if (v) setOther(v === 'None' ? (p.name || 'the other fandom') : v); })
      .catch(() => undefined);
  }, [p.name]);

  async function leave() {
    impact('medium');
    try {
      const raw = await AsyncStorage.getItem('rally.feedPrefs');
      const prefs = raw ? JSON.parse(raw) : {};
      prefs.hideRivalry = true;
      await AsyncStorage.setItem('rally.feedPrefs', JSON.stringify(prefs));
      await AsyncStorage.setItem('rivalry.pausedNotice', '1');
      Alert.alert('Rivalry hidden', 'Rivalry content is hidden from your feed. You can turn it back on in Rivalry settings.', [
        { text: 'OK', onPress: () => router.dismissTo('/(tabs)/feed') },
      ]);
    } catch {
      Alert.alert('Rivalry', 'Could not update your settings. Try again.');
    }
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.wrap}>
          <View style={styles.fireWrap}>
            <View style={styles.fire}>
              <Ionicons name="flame" size={40} color="#fff" />
            </View>
          </View>
          <Text style={[styles.h1, { color: colors.text }]}>{'Let\'s cool things down'}</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>
            {'This Rivalry got heated, so Call-Outs are paused for you and ' + other + '\'s fandom until both sides are ready.'}
          </Text>

          <View style={[styles.rows, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={{ color: colors.muted, fontSize: 16, flex: 1 }}>Paused for</Text>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>Until both sides are ready</Text>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={{ color: colors.muted, fontSize: 16, flex: 1 }}>You can still</Text>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>Watch and vote</Text>
            </View>
          </View>

          <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={TEAL} />
            <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22, flex: 1, marginLeft: 10 }}>
              Reports and heated replies trigger this. It does not affect your rank or earnings.
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 'auto', marginBottom: spacing.lg }}>
          <Pressable
            onPress={() => {
              impact('light');
              router.back();
            }}
            style={styles.gotIt}
            accessibilityLabel="Got it"
          >
            <Text style={{ color: '#111', fontWeight: '900', fontSize: 18 }}>Got it</Text>
          </Pressable>
          <Pressable onPress={leave} hitSlop={10} style={{ paddingVertical: 16 }} accessibilityLabel="Leave this Rivalry">
            <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 16, textAlign: 'center' }}>Leave this Rivalry</Text>
          </Pressable>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 70 },
  fireWrap: { shadowColor: RED, shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 0 } },
  fire: { width: 104, height: 104, borderRadius: 30, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 30, fontWeight: '900', marginTop: 30, textAlign: 'center' },
  sub: { fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 12, paddingHorizontal: 26 },
  rows: { borderWidth: 1, borderRadius: radii.lg, alignSelf: 'stretch', marginTop: 34 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  note: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, alignSelf: 'stretch', padding: 16, marginTop: 16 },
  gotIt: { backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full },
});
