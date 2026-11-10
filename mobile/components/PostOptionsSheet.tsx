/** PostOptionsSheet - Rally design
 * Bottom sheet for the ellipsis on a post: save, translate, copy link,
 * feed explanation, not interested, mute and report. Calm by default:
 * explanations render inline, never as dialogs.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeProvider';
import { radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { getApiUrl } from '@/lib/config';

type IconName = keyof typeof Ionicons.glyphMap;

export function PostOptionsSheet({
  visible,
  onClose,
  postId,
  authorHandle,
  authorName,
  postBody,
  onNotInterested,
  onMute,
  onReport,
  onSaveToCollection,
  onShare,
  onTranslated,
  onWhyExplain,
}: {
  visible: boolean;
  onClose: () => void;
  postId: string;
  authorHandle: string;
  authorName: string;
  postBody: string;
  onNotInterested: () => void;
  onMute: () => void;
  onReport: () => void;
  onSaveToCollection: () => void;
  onShare: () => void;
  onTranslated: () => void;
  onWhyExplain?: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();
  const [why, setWhy] = useState(false);
  const [translated, setTranslated] = useState(false);

  useEffect(() => {
    if (visible) {
      setWhy(false);
      setTranslated(false);
    }
  }, [visible]);

  async function copyLink() {
    impact('light');
    try {
      const base = await getApiUrl();
      const url = (base || 'https://rally.app') + '/post/' + postId;
      await Share.share({ message: url });
    } catch {
      // user cancelled the share sheet
    }
    onClose();
  }

  type Row = { icon: IconName; label: string; sub?: string; danger?: boolean; onPress: () => void };

  const rows: Row[] = [
    { icon: 'bookmark-outline', label: 'Save to Collection', onPress: () => { impact('light'); onSaveToCollection(); } },
    {
      icon: 'language-outline',
      label: 'Translate',
      sub: 'Yor\u00f9b\u00e1 to English',
      onPress: () => { impact('light'); onTranslated(); },
    },
    { icon: 'link-outline', label: 'Copy link', onPress: copyLink },
    { icon: 'share-social-outline', label: 'Share to...', onPress: () => { impact('light'); onShare(); } },
    { icon: 'sparkles-outline', label: 'Why am I seeing this', onPress: () => { impact('light'); if (onWhyExplain) { onWhyExplain(); } else { setWhy((w) => !w); } } },
    { icon: 'eye-outline', label: 'Not interested', onPress: () => { impact('light'); onNotInterested(); } },
    { icon: 'ban-outline', label: 'Mute ' + authorName, onPress: () => { impact('light'); onMute(); } },
    { icon: 'flag-outline', label: 'Report', danger: true, onPress: () => { impact('light'); onReport(); } },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(20, insets.bottom) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.grabHandle} />

          <Text style={[styles.subject, { color: colors.muted }]} numberOfLines={1}>
            {authorName} {'\u00b7'} {postBody.slice(0, 40)}
          </Text>

          {translated ? (
            <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Ionicons name="language-outline" size={15} color={colors.success} />
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Translation runs on device. Original text is kept on the post.
              </Text>
            </View>
          ) : null}

          {why ? (
            <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Ionicons name="sparkles-outline" size={15} color={colors.primary} />
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                You follow {authorName}. Posts from Favorites you follow are ranked by recency and engagement.
              </Text>
            </View>
          ) : null}

          <View style={styles.rows}>
            {rows.map((r) => (
              <Pressable
                key={r.label}
                onPress={r.onPress}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel={r.label}
              >
                <Ionicons name={r.icon} size={21} color={r.danger ? colors.danger : colors.text} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.rowLabel, { color: r.danger ? colors.danger : colors.text }]}>{r.label}</Text>
                  {r.sub ? <Text style={[styles.rowSub, { color: colors.muted }]}>{r.sub}</Text> : null}
                </View>
              </Pressable>
            ))}
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
  subject: { fontSize: 13, marginBottom: 10 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 10,
    marginBottom: 8,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18 },
  rows: { gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  rowLabel: { fontSize: 16, fontWeight: '700' },
  rowSub: { fontSize: 12, marginTop: 1 },
});
