/** SoundTextInput
 * A TextInput that plays a subtle typing sound on focus and while typing.
 * Keeps the original onChangeText / onFocus behavior intact.
 */
import { TextInput, TextInputProps } from 'react-native';
import { useSounds } from '@/hooks/useSounds';

export function SoundTextInput(props: TextInputProps) {
  const { type } = useSounds();

  return (
    <TextInput
      {...props}
      onChangeText={(text) => {
        // Play typing sound only when the user actually types something
        if (text.length > 0) {
          type();
        }
        props.onChangeText?.(text);
      }}
      onFocus={(e) => {
        type();
        props.onFocus?.(e);
      }}
    />
  );
}
