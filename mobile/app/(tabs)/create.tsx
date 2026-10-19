import { Redirect } from 'expo-router';

/** Slot for the center ＋ tab button. The button routes to the composer,
 * so this screen is only a deep-link safety net. */
export default function CreateSlot() {
  return <Redirect href="/compose-moment" />;
}
