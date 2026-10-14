import { View, Text, StyleSheet, Pressable, useWindowDimensions, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { colors, spacing, radii } from '@/constants/theme';

export default function Home() {
  const { width } = useWindowDimensions();
  const pad = width < 360 ? spacing.md : spacing.lg;

  return (
    <ScrollView contentContainerStyle={[styles.container, { padding: pad }]}>
      <Text style={styles.badge}>Fan support</Text>
      <Text style={styles.title}>Rally</Text>
      <Text style={styles.subtitle}>
        Support Favorites with Gifts, Moments, and live sessions. Sky blue clarity on galactic depth.
      </Text>
      <View style={styles.actions}>
        <Link href="/favorite/mia" asChild>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>Open @mia</Text>
          </Pressable>
        </Link>
        <Link href="/explore" asChild>
          <Pressable style={styles.btnGhost}>
            <Text style={styles.btnGhostText}>Explore</Text>
          </Pressable>
        </Link>
        <Link href="/wallet" asChild>
          <Pressable style={styles.btnGhost}>
            <Text style={styles.btnGhostText}>Wallet</Text>
          </Pressable>
        </Link>
        <Link href="/feed" asChild>
          <Pressable style={styles.btnGhost}>
            <Text style={styles.btnGhostText}>Feed</Text>
          </Pressable>
        </Link>
        <Link href="/login" asChild>
          <Pressable style={styles.btnGhost}>
            <Text style={styles.btnGhostText}>Log in</Text>
          </Pressable>
        </Link>
        <Link href="/settings" asChild>
          <Pressable style={styles.btnGhost}>
            <Text style={styles.btnGhostText}>Settings</Text>
          </Pressable>
        </Link>
        <Link href="/how-to-use" asChild>
          <Pressable style={styles.btnGhost}>
            <Text style={styles.btnGhostText}>How to use</Text>
          </Pressable>
        </Link>
        <Link href="/support" asChild>
          <Pressable style={styles.btnGhost}>
            <Text style={styles.btnGhostText}>Support</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingBottom: 48 },
  badge: {
    alignSelf: 'flex-start',
    color: colors.primaryHover,
    backgroundColor: colors.primaryMuted,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.35)',
  },
  title: { fontSize: 36, fontWeight: '800', color: colors.primary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.muted, marginBottom: spacing.lg, lineHeight: 24 },
  actions: { gap: 10 },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    alignItems: 'center',
    minHeight: 48,
  },
  btnText: { color: '#04101F', fontWeight: '700', fontSize: 16 },
  btnGhost: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    minHeight: 48,
  },
  btnGhostText: { color: colors.text, fontWeight: '600', fontSize: 15 },
});
