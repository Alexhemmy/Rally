/** ShareSheet - Rally design
 * Bottom sheet for sharing a post or Moment: send to people you follow
 * (client-side confirmation - no DM backend yet), copy link, image card,
 * email and the system share sheet. Shared links open a public preview.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Share, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { getApiUrl } from '@/lib/config';

type Recipient = { handle: string; displayName: string; avatarUrl?: string | null };

export function ShareSheet({
  visible,
  onClose,
  linkId,
  kind = 'post',
  recipients,
}: {
  visible: boolean;
  onClose: () => void;
  linkId: string;
  kind?: 'post' | 'moment';
  recipients: Recipient[];
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();
  const [sentTo, setSentTo] = useState<Record<string, boolean>>({});
  const [base, setBase] = useState('');

  useEffect(() => {
    if (visible) {
      setSentTo({});
      getApiUrl().then((b) => setBase(b || '')).catch(() => undefined);
    }
  }, [visible]);

  function link() {
    return (base || 'https://rally.app') + '/' + (kind === 'moment' ? 'moment/' : 'post/') + linkId;
  }

  async function sendTo(r: Recipient) {
    impact('light');
    setSentTo((prev) => ({ ...prev, [r.handle]: true }));
  }

  async function copyLink() {
    impact('light');
    try {
      await Share.share({ message: link() });
    } catch {
      // user cancelled
    }
  }

  async function imageCard() {
    impact('light');
    try {
      await Share.share({ message: link() });
    } catch {
      // user cancelled
    }
  }

  async function email() {
    impact('light');
    try {
      await Linking.openURL('mailto:?subject=' + encodeURIComponent('A post from Rally') + '&body=' + encodeURIComponent(link()));
    } catch {
      // no mail app
    }
  }

  async function more() {
    impact('light');
    try {
      await Share.share({ message: link() });
    } catch {
      // user cancelled
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(20, insets.bottom) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.grabHandle} />

          <Text style={[styles.title, { color: colors.text }]}>Share</Text>
          <Text style={[styles.section, { color: colors.muted }]}>SEND TO</Text>
          <View style={styles.peopleRow}>
            {recipients.slice(0, 4).map((r) => (
              <Pressable key={r.handle} style={styles.person} onPress={() => sendTo(r)} accessibilityLabel={'Send to ' + r.displayName}>
                <View>
                  <Avatar name={r.handle} size={50} uri={r.avatarUrl || undefined} />
                  {sentTo[r.handle] ? (
                    <View style={styles.sentBadge}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  ) : null}
                </View>
                <Text numberOfLines={1} style={[styles.personName, { color: colors.text }]}>
                  {sentTo[r.handle] ? 'Sent' : r.displayName.split(' ')[0]}
                </Text>
              </Pressable>
            ))}
            <Pressable style={styles.person} onPress={more} accessibilityLabel="Share to a group">
              <View style={[styles.groupTile, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="people" size={22} color={colors.text} />
              </View>
              <Text style={[styles.personName, { color: colors.text }]}>Group</Text>
            </Pressable>
          </View>

          <Text style={[styles.section, { color: colors.muted }]}>SHARE OUTSIDE RALLY</Text>
          <View style={styles.outRow}>
            <Pressable style={styles.outItem} onPress={copyLink} accessibilityLabel="Copy link">
              <View style={[styles.outTile, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="link" size={22} color={colors.text} />
              </View>
              <Text style={[styles.outLabel, { color: colors.text }]}>Copy link</Text>
            </Pressable>
            <Pressable style={styles.outItem} onPress={imageCard} accessibilityLabel="Share image card">
              <View style={[styles.outTile, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="image-outline" size={22} color={colors.text} />
              </View>
              <Text style={[styles.outLabel, { color: colors.text }]}>Image{'\n'}card</Text>
            </Pressable>
            <Pressable style={styles.outItem} onPress={email} accessibilityLabel="Share by email">
              <View style={[styles.outTile, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="mail-outline" size={22} color={colors.text} />
              </View>
              <Text style={[styles.outLabel, { color: colors.text }]}>Email</Text>
            </Pressable>
            <Pressable style={styles.outItem} onPress={more} accessibilityLabel="More share options">
              <View style={[styles.outTile, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="share-outline" size={22} color={colors.text} />
              </View>
              <Text style={[styles.outLabel, { color: colors.text }]}>More</Text>
            </Pressable>
          </View>

          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark" size={15} color={colors.success} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Shared links open a preview for people without an account.
            </Text>
          </View>
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
  title: { fontSize: 20, fontWeight: '900', marginBottom: 12 },
  section: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, marginBottom: 10 },
  peopleRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  person: { alignItems: 'center', width: 56 },
  sentBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.6)',
  },
  personName: { fontSize: 12, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  groupTile: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  outRow: { flexDirection: 'row', gap: 18, marginBottom: 16 },
  outItem: { alignItems: 'center', width: 64 },
  outTile: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  outLabel: { fontSize: 12, fontWeight: '700', marginTop: 6, textAlign: 'center', lineHeight: 15 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 10,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
