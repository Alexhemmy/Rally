/** Log out (mock 21) - confirmation sheet.
 * Spotlight hero with a silhouette, then a bottom sheet: Log out
 * clears the local session token and returns to Welcome; Stay logged
 * in goes back. Tokens, badges and saved items live on the account,
 * so they stay safe.
 */
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { radii } from '@/constants/theme';
import { setToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const RED = '#E9355B';

const SESSION_KEYS = ['rally.watchHistory', 'rally.likedItems', 'rally.myComments', 'rally.liveReminders', 'rally.liveGiftsSent'];

export default function LogOutScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  async function logOut() {
    impact('medium');
    setToken('');
    for (const k of SESSION_KEYS) {
      AsyncStorage.removeItem(k).catch(() => undefined);
    }
    router.replace('/welcome');
  }

  return (
    <Screen>
      <View style={styles.flex}>
        {/* Spotlight hero */}
        <View style={styles.hero}>
          <View style={[styles.beam, { backgroundColor: GOLD + '14' }]} />
          <View style={[styles.beamWide, { backgroundColor: GOLD + '0a' }]} />
          {/* Silhouette */}
          <View style={styles.figure}>
            <View style={styles.head} />
            <View style={styles.body}>
              <View style={styles.slash} />
            </View>
          </View>
        </View>

        {/* Bottom sheet */}
        <View style={[styles.sheet, { backgroundColor: colors.surfaceElevated }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.text }]}>Log out of Rally?</Text>
          <Text style={[styles.copy, { color: colors.muted }]}>
            Your Tokens, badges and saved items stay safe. You can log back in any time.
          </Text>

          <Pressable onPress={logOut} style={[styles.outlineBtn, { borderColor: RED }]} accessibilityLabel="Log out">
            <Text style={{ color: RED, fontWeight: '900', fontSize: 17 }}>Log out</Text>
          </Pressable>

          <Pressable
            onPress={() => { impact('light'); router.back(); }}
            style={styles.goldBtn}
            accessibilityLabel="Stay logged in"
          >
            <Text style={{ color: '#111', fontWeight: '900', fontSize: 17 }}>Stay logged in</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  beam: { position: 'absolute', top: -80, left: -40, width: 300, height: 700, transform: [{ rotate: '18deg' }] },
  beamWide: { position: 'absolute', top: -80, left: -120, width: 420, height: 700, transform: [{ rotate: '24deg' }] },
  figure: { alignItems: 'center' },
  head: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#0d0d10' },
  body: { width: 170, height: 260, borderTopLeftRadius: 85, borderTopRightRadius: 85, backgroundColor: '#0d0d10', marginTop: 4, alignItems: 'center' },
  slash: { width: 8, height: 64, borderRadius: 4, backgroundColor: '#6b6b74', transform: [{ rotate: '28deg' }], marginTop: 40 },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 34 },
  handle: { width: 64, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 18 },
  title: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  copy: { fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 8, marginBottom: 22 },
  outlineBtn: { borderWidth: 1.5, borderRadius: radii.lg, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  goldBtn: { backgroundColor: GOLD, borderRadius: radii.lg, paddingVertical: 16, alignItems: 'center' },
});
