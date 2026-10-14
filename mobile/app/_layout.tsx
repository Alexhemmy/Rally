import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#16161d' },
          headerTintColor: '#f4f4f5',
          contentStyle: { backgroundColor: '#0b0b0f' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Rally' }} />
        <Stack.Screen name="favorite/[handle]" options={{ title: 'Favorite' }} />
      </Stack>
    </>
  );
}
