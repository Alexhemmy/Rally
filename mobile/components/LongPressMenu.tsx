import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '@/constants/theme';
import { useSounds } from '@/hooks/useSounds';

export type MenuAction = { label: string; onPress: () => void; destructive?: boolean };

type Props = { visible: boolean; title?: string; actions: MenuAction[]; onClose: () => void };

export function LongPressMenu({ visible, title, actions, onClose }: Props) {
  const { click } = useSounds();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {actions.map((a) => (
            <Pressable
              key={a.label}
              style={styles.row}
              onPress={() => {
                click();
                onClose();
                a.onPress();
              }}
            >
              <Text style={[styles.label, a.destructive && styles.destructive]}>{a.label}</Text>
            </Pressable>
          ))}
          <Pressable
            style={[styles.row, styles.cancel]}
            onPress={() => {
              click();
              onClose();
            }}
          >
            <Text style={styles.label}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    minHeight: 52,
    justifyContent: 'center',
  },
  cancel: { borderBottomWidth: 0, marginTop: 4 },
  label: { color: colors.text, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  destructive: { color: colors.danger },
});
