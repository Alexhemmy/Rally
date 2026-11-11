/** Gifts and Thank-yous (mock 09) - Favorite gift settings.
 * Accept Gifts / Show supporter wall / Allow anonymous Gifts toggles,
 * the gift catalog a Favorite enables, and the automatic thank-you
 * note with a 160 character counter. Rally has no server fields for
 * these yet, so settings persist locally (rally.giftSettings).
 */
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';

const GIFT_KINDS = [
  { id: 'heart', label: 'Heart' },
  { id: 'flame', label: 'Flame' },
  { id: 'drum', label: 'Drum' },
  { id: 'spark', label: 'Spark' },
  { id: 'mic', label: 'Mic' },
  { id: 'vinyl', label: 'Vinyl' },
  { id: 'crown', label: 'Crown' },
];

const DEFAULT_THANK_YOU = 'Thank you for showing up for me. Your Gift means more than you know.';

type Settings = {
  acceptGifts: boolean;
  supporterWall: boolean;
  anonymousGifts: boolean;
  kinds: string[];
  thankYou: string;
};

const DEFAULTS: Settings = {
  acceptGifts: true,
  supporterWall: true,
  anonymousGifts: true,
  kinds: ['heart', 'flame', 'drum', 'spark', 'mic', 'crown'],
  thankYou: DEFAULT_THANK_YOU,
};

export default function GiftsSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click } = useSounds();

  const [s, setS] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('rally.giftSettings');
        if (raw) setS({ ...DEFAULTS, ...JSON.parse(raw) });
      } catch { /* fresh */ }
      setLoaded(true);
    })();
  }, []);

  async function save(next: Settings) {
    setS(next);
    try {
      await AsyncStorage.setItem('rally.giftSettings', JSON.stringify(next));
    } catch { /* local only */ }
  }

  function toggleKind(id: string) {
    if (id === 'vinyl') return; // coming soon
    impact('light');
    click();
    const kinds = s.kinds.indexOf(id) > -1
      ? s.kinds.filter((k) => k !== id)
      : s.kinds.concat(id);
    save({ ...s, kinds });
  }

  const counter = Math.min(s.thankYou.length, 160);

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Gifts</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          {/* Toggles */}
          {[
            { key: 'acceptGifts' as const, icon: 'gift-outline', label: 'Accept Gifts' },
            { key: 'supporterWall' as const, icon: 'eye-outline', label: 'Show supporter wall' },
            { key: 'anonymousGifts' as const, icon: 'ban-outline', label: 'Allow anonymous Gifts' },
          ].map((row, i) => (
            <View key={row.key} style={[styles.toggleRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <View style={[styles.toggleIcon, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name={row.icon as any} size={18} color={GOLD} />
              </View>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>{row.label}</Text>
              <Switch
                value={s[row.key]}
                onValueChange={(v) => { impact('light'); save({ ...s, [row.key]: v }); }}
                trackColor={{ true: TEAL, false: colors.border }}
                thumbColor="#fff"
                disabled={!loaded}
              />
            </View>
          ))}

          {/* Gift kinds */}
          <Text style={[styles.section, { color: colors.muted }]}>GIFTS FANS CAN SEND</Text>
          <View style={styles.chipWrap}>
            {GIFT_KINDS.map((g) => {
              const on = s.kinds.indexOf(g.id) > -1;
              const soon = g.id === 'vinyl';
              return (
                <Pressable
                  key={g.id}
                  onPress={() => toggleKind(g.id)}
                  disabled={soon}
                  style={[
                    styles.kindChip,
                    on && !soon ? { borderColor: GOLD, backgroundColor: GOLD + '1a' } : { borderColor: 'transparent' },
                    soon && { opacity: 0.55 },
                  ]}
                  accessibilityLabel={g.label + (soon ? ' (coming soon)' : on ? ' on' : ' off')}
                >
                  <Text style={{ color: on && !soon ? GOLD : colors.text, fontWeight: '800', fontSize: 15 }}>{g.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Automatic thank-you */}
          <Text style={[styles.section, { color: colors.muted }]}>AUTOMATIC THANK-YOU</Text>
          <View style={[styles.tyBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <TextInput
              style={[styles.tyInput, { color: colors.text }]}
              value={s.thankYou}
              onChangeText={(t) => save({ ...s, thankYou: t.slice(0, 160) })}
              multiline
              maxLength={160}
            />
          </View>
          <View style={styles.tyMeta}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Sent to every supporter</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{counter + ' / 160'}</Text>
          </View>

          {/* Fee note */}
          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              You keep 70% of each Gift after fees. Fans see prices in Tokens and naira before they pay.
            </Text>
          </View>

          <Text style={[styles.localNote, { color: colors.muted }]}>
            Saved on this device for now - gift settings sync to your profile once the backend fields land.
          </Text>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  toggleIcon: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { flex: 1, fontSize: 17, fontWeight: '800' },
  section: { fontSize: 13, fontWeight: '900', letterSpacing: 0.8, marginTop: spacing.lg, marginBottom: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kindChip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.04)' },
  tyBox: { borderWidth: 1, borderRadius: radii.lg, padding: 14, minHeight: 110 },
  tyInput: { fontSize: 16, lineHeight: 24, padding: 0 },
  tyMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: spacing.lg,
  },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20 },
  localNote: { fontSize: 12, marginTop: spacing.md, lineHeight: 18 },
});
