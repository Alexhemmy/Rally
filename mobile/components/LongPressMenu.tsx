/** LongPressMenu
 * Bottom sheet style action menu.
 * Uses the current theme and plays a subtle click sound.
 */
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { radii, spacing, type as typo } from '@/constants/theme';
import { useSounds } from '@/hooks/useSounds';

export type MenuAction = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

type Props = {
  visible: boolean;
  title?: string;
  actions: MenuAction[];
  onClose: () => void;
};

export function LongPressMenu({ visible, title, actions, onClose }: Props) {
  const { colors } = useTheme();
  const { click } = useSounds();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {title ? (
            <Text style={[styles.title, { color: colors.muted, borderBottomColor: colors.border }]}>
              {title}
            </Text>
          ) : null}

          {actions.map((action) => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [
                styles.row,
                {
                  borderBottomColor: colors.border,
                  backgroundColor: pressed ? colors.surfaceHover : 'transparent',
                },
              ]}
              onPress={() => {
                click();
                onClose();
                // Small delay so the menu closes before the action runs
                setTimeout(() => action.onPress(), 50);
              }}
            >
              <Text
                style={[
                  styles.label,
                  {
                    color: action.destructive ? colors.danger : colors.text,
                  },
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}

          <Pressable
            style={({ pressed }) => [
              styles.row,
              styles.cancel,
              {
                backgroundColor: pressed ? colors.surfaceHover : 'transparent',
              },
            ]}
            onPress={() => {
              click();
              onClose();
            }}
          >
            <Text style={[styles.label, { color: colors.text }]}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 54,
    justifyContent: 'center',
  },
  cancel: {
    borderBottomWidth: 0,
    marginTop: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
