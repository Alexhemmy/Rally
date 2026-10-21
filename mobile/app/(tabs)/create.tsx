/** Create slot
 * Center tab (+) routes to the Moment composer.
 * This screen is only a deep-link safety net.
 */
import { Redirect } from 'expo-router';

export default function CreateSlot() {
  return <Redirect href="/compose-moment" />;
}
