import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rally</Text>
      <Text style={styles.subtitle}>
        Support the Favorites you love. Send Gifts, earn badges, join Moments.
      </Text>
      <Link href="/favorite/mia" asChild>
        <Pressable style={styles.btn}>
          <Text style={styles.btnText}>Open Mia&apos;s page →</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: '#a78bfa', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#a1a1aa', marginBottom: 32, lineHeight: 24 },
  btn: {
    backgroundColor: '#a78bfa',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  btnText: { color: '#000', fontWeight: '600', fontSize: 16 },
});
