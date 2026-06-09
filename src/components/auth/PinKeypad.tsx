// PIN 입력 키패드 — 점 표시기 + 숫자 버튼(전체 리셋·1칸 지움). TextInput 대체.
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type Props = {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  disabled?: boolean;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'reset', '0', 'back'];

export function PinKeypad({ value, onChange, length = 4, disabled }: Props) {
  function press(k: string) {
    if (disabled) return;
    if (k === 'reset') return onChange('');
    if (k === 'back') return onChange(value.slice(0, -1));
    if (value.length >= length) return;
    onChange(value + k);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.dots}>
        {Array.from({ length }).map((_, i) => (
          <View key={i} style={styles.dot(i < value.length)} />
        ))}
      </View>
      <View style={styles.pad}>
        {KEYS.map((k) => (
          <Pressable
            key={k}
            onPress={() => press(k)}
            disabled={disabled || (k === 'reset' && value.length === 0) || (k === 'back' && value.length === 0)}
            style={({ pressed }) => styles.key(pressed)}>
            <Text style={styles.keyText(k)}>{k === 'reset' ? '✕' : k === 'back' ? '⌫' : k}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: { alignItems: 'center', gap: theme.space(4) },
  dots: { flexDirection: 'row', gap: theme.space(2) },
  dot: (active: boolean) => ({
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: active ? theme.colors.text : 'transparent',
    borderWidth: 1.5,
    borderColor: active ? theme.colors.text : theme.colors.border,
  }),
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 264,
    rowGap: theme.space(1.5),
    columnGap: theme.space(1.5),
    justifyContent: 'center',
  },
  key: (pressed: boolean) => ({
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: pressed ? theme.colors.surfaceAlt : 'transparent',
  }),
  keyText: (k: string) => ({
    fontSize: k === 'reset' || k === 'back' ? theme.fontSize.lg : 28,
    fontWeight: '500' as const,
    color: k === 'reset' || k === 'back' ? theme.colors.textMuted : theme.colors.text,
  }),
}));
