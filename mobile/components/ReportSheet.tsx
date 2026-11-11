/** ReportSheet - Rally design
 * Bottom sheet to report a user, Moment, comment, gift or message.
 * Posts to /api/moderation/report with a reason + optional details.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/components/ThemeProvider';
import { radii } from '@/constants/theme';
import { api } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#34D399';

type IconName = keyof typeof Ionicons.glyphMap;

const REASONS_COMMENT: { value: string; label: string; icon: IconName }[] = [
  { value: 'harassment', label: 'Harassment or threats', icon: 'flag-outline' },
  { value: 'hate', label: 'Hate speech', icon: 'warning-outline' },
  { value: 'doxxing', label: 'Doxxing or personal information', icon: 'eye-off-outline' },
  { value: 'scam', label: 'Scam or selling favors for Gifts', icon: 'cash-outline' },
  { value: 'impersonation', label: 'Impersonation', icon: 'person-circle-outline' },
];

const REASONS: { value: string; label: string; icon: IconName }[] = [
  { value: 'harassment', label: 'Harassment or bullying', icon: 'flag-outline' },
  { value: 'hate', label: 'Hate speech', icon: 'warning-outline' },
  { value: 'spam', label: 'Spam or misleading', icon: 'megaphone-outline' },
  { value: 'scam', label: 'Scam or fraud', icon: 'cash-outline' },
  { value: 'sexual', label: 'Sexual content', icon: 'eye-off-outline' },
  { value: 'violence', label: 'Violence or danger', icon: 'flash-outline' },
  { value: 'impersonation', label: 'Impersonation', icon: 'person-circle-outline' },
  { value: 'other', label: 'Something else', icon: 'help-circle-outline' },
];

export function ReportSheet({
  visible,
  onClose,
  targetType,
  targetId,
  subjectLabel,
  onBlock,
  onMute,
}: {
  visible: boolean;
  onClose: () => void;
  targetType: 'user' | 'moment' | 'gift' | 'comment' | 'message';
  targetId: string;
  subjectLabel: string;
  onBlock?: () => void;
  onMute?: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setReason(null);
    setDetails('');
    setDone(false);
    setError('');
  }, [visible]);

  async function submit() {
    if (!reason || sending) return;
    setSending(true);
    setError('');
    try {
      await api('/api/moderation/report', {
        method: 'POST',
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          details: details.trim() || undefined,
        }),
      });
      setDone(true);
      setTimeout(onClose, 1600);
    } catch (e: any) {
      setError(e && e.message ? e.message : 'Could not send report. Try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, paddingBottom: Math.max(16, insets.bottom) },
          ]}
        >
          <View style={styles.grabHandle} />

          <View style={styles.header}>
            <View style={[styles.flagBubble, { backgroundColor: GOLD }]}>
              <Ionicons name="flag" size={18} color="#111" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.title, { color: colors.text }]}>
                {targetType === 'comment' ? 'Report this comment' : 'Report'}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close report sheet">
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          {subjectLabel ? (
            <View style={[styles.quoteBox, { borderColor: colors.border }]}>
              <Text style={[styles.quoteText, { color: colors.muted }]}>{subjectLabel}</Text>
            </View>
          ) : null}

          {done ? (
            <View style={styles.doneWrap}>
              <View style={[styles.doneBubble, { borderColor: TEAL }]}>
                <Ionicons name="checkmark" size={28} color={TEAL} />
              </View>
              <Text style={[styles.doneTitle, { color: colors.text }]}>Report sent</Text>
              <Text style={[styles.doneBody, { color: colors.muted }]}>
                Thanks for keeping Rally safe. Our team will review it shortly.
              </Text>
            </View>
          ) : (
            <>
              <ScrollView style={{ flexGrow: 0, maxHeight: 320 }} contentContainerStyle={{ gap: 8 }}>
                {(targetType === 'comment' ? REASONS_COMMENT : REASONS).map((r) => {
                  const active = reason === r.value;
                  return (
                    <Pressable
                      key={r.value}
                      onPress={() => setReason(r.value)}
                      style={[
                        styles.reasonRow,
                        {
                          borderColor: active ? GOLD : colors.border,
                          backgroundColor: active ? GOLD + "1f" : colors.surface,
                        },
                      ]}
                      accessibilityLabel={r.label}
                    >
                      <Ionicons name={r.icon} size={20} color={active ? GOLD : colors.muted} />
                      <Text style={{ flex: 1, marginLeft: 10, color: colors.text, fontWeight: "700", fontSize: 14 }}>
                        {r.label}
                      </Text>
                      <Ionicons
                        name={active ? "checkmark-circle" : "ellipse-outline"}
                        size={20}
                        color={active ? GOLD : colors.border}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={[styles.detailsWrap, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.detailsInput, { color: colors.text }]}
                  placeholder="Add evidence or a note (optional)"
                  placeholderTextColor={colors.muted}
                  value={details}
                  onChangeText={(t) => setDetails(t.slice(0, 500))}
                  maxLength={500}
                  multiline
                />
                <Ionicons name="image-outline" size={18} color={colors.muted} />
              </View>

              {error ? <Text style={[styles.error, { color: "#ef5350" }]}>{error}</Text> : null}

              {onBlock || onMute ? (
                <View style={styles.actionsRow}>
                  {onBlock ? (
                    <Pressable style={[styles.secondaryBtn, { backgroundColor: colors.surfaceElevated }]} onPress={() => { onBlock(); onClose(); }} accessibilityLabel="Block">
                      <Ionicons name="ban-outline" size={17} color={colors.text} />
                      <Text style={[styles.secondaryText, { color: colors.text }]}>Block</Text>
                    </Pressable>
                  ) : null}
                  {onMute ? (
                    <Pressable style={[styles.secondaryBtn, { backgroundColor: colors.surfaceElevated }]} onPress={() => { onMute(); onClose(); }} accessibilityLabel="Mute">
                      <Ionicons name="eye-outline" size={17} color={colors.text} />
                      <Text style={[styles.secondaryText, { color: colors.text }]}>Mute</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              <Pressable onPress={submit} disabled={!reason || sending} accessibilityLabel="Send report">
                <LinearGradient
                  colors={[GOLD, GOLD_DEEP] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.submitBtn, (!reason || sending) && { opacity: 0.4 }]}
                >
                  <Text style={styles.submitText}>
                    {sending ? 'Sending\u2026' : 'Send report'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  grabHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 14,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  flagBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16, fontWeight: "900" },
  subtitle: { fontSize: 13, marginTop: 1 },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  detailsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  detailsInput: { flex: 1, fontSize: 14, minHeight: 44, padding: 0 },
  quoteBox: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  quoteText: { fontSize: 14, lineHeight: 21 },
  error: { marginTop: 8, fontSize: 13, fontWeight: "600" },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: radii.md,
    paddingVertical: 13,
  },
  secondaryText: { fontSize: 15, fontWeight: "800" },
  submitBtn: {
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 14,
  },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  doneWrap: { alignItems: "center", paddingVertical: 28 },
  doneBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  doneTitle: { fontSize: 18, fontWeight: "900", marginBottom: 6 },
  doneBody: { fontSize: 13, textAlign: "center", lineHeight: 18, paddingHorizontal: 16 },
});