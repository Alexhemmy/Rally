import { TextInput, TextInputProps } from 'react-native';
import { useSounds } from '@/hooks/useSounds';

export function SoundTextInput(props: TextInputProps) {
  const { type } = useSounds();
  return (
    <TextInput
      {...props}
      onChangeText={(t) => {
        type();
        props.onChangeText?.(t);
      }}
      onFocus={(e) => {
        type();
        props.onFocus?.(e);
      }}
    />
  );
}
