import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radii } from '@/constants/theme';

export default function Feed() {
  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.h1}>Home feed</Text>
      <Text style={styles.muted}>Moments from Favorites you follow · chronological toggle on web</Text>
      <View style={styles.card}>
        <Text style={styles.muted}>Log in and follow Favorites to populate. Demo: open @mia.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.md },
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  muted: { color: colors.muted, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
});
