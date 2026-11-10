/** NotInterestedSheet - Rally design
 * Shown after "Not interested": reason chips, optional 30-day mute and
 * a gold Done. The parent hides the post and shows a calm Post hidden
 * toast with Undo. This never affects the Favorite's rank.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/components/ThemeProvider';
import { radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';

const REASONS = ['Not my style', 'Too much of this', 'Already seen it', 'Wrong language', 'Something else'];

export function NotInterestedSheet({
  visible,
  onClose,
  authorName,
  onDone,
}: {
  visible: boolean;
  onClose: () => void;
  authorName: string;
  /** Called with (reason, muteFor30Days) when Done is pressed. */
  onDone: (reason: string, muteFor30Days: boolean) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();
  const [reason, setReason] = useState<string | null>(null);
  const [mute, setMute] = useState(false);

  useEffect(() => {
    if (visible) {
      setReason(null);
      setMute(false);
    }
  }, [visible]);

  const firstName = authorName.split(' ')[0];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(20, insets.bottom) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.grabHandle} />

          <Text style={[styles.title, { color: colors.text }]}>We will show less like this</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Tell us why so your feed gets better. This never affects the Favorite's rank.
          </Text>

          <View style={styles.chips}>
            {REASONS.map((r) => {
              const active = reason === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => {
                    impact('selection');
                    setReason(r);
                  }}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                    active && { borderColor: GOLD, backgroundColor: GOLD + '1f' },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={r}
                >
                  <Text style={[styles.chipText, { color: active ? GOLD : colors.text }]}>{r}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => {
              impact('light');
              setMute((m) => !m);
            }}
            style={[styles.muteBtn, { backgroundColor: colors.surfaceElevated }]}
            accessibilityRole="button"
            accessibilityState={{ selected: mute }}
            accessibilityLabel={'Mute ' + firstName + ' for 30 days'}
          >
            <Text style={[styles.muteText, { color: colors.text }]}>
              {mute ? 'Muted ' + firstName + ' for 30 days' : 'Mute ' + firstName + ' for 30 days'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              impact('light');
              onDone(reason || 'Not my style', mute);
            }}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <LinearGradient
              colors={[GOLD, GOLD_DEEP] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.doneBtn}
            >
              <Text style={styles.doneText}>Done</Text>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  grabHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: '700' },
  muteBtn: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginBottom: 12,
  },
  muteText: { fontSize: 15, fontWeight: '800' },
  doneBtn: {
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  doneText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
