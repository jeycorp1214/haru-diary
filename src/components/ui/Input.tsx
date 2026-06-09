// 입력 — TextInput 래퍼. 좌/우 아이콘, X 지우기, 비밀번호 토글, 에러 라벨, 포커스 강조.
import { forwardRef, useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Icon, type IconName } from './Icon';
import { Typography } from './Typography';

const styles = StyleSheet.create((theme) => ({
  wrap: { gap: 4 },
  field: (state: 'error' | 'focus' | 'blur') => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor:
      state === 'error' ? theme.colors.danger : state === 'focus' ? theme.colors.primary : 'transparent',
  }),
  input: { flex: 1, paddingVertical: 10, fontSize: 16, color: theme.colors.text },
  placeholder: { color: theme.colors.placeholder },
}));

export interface InputProps extends Omit<TextInputProps, 'style'> {
  leftIcon?: IconName;
  clearable?: boolean;
  secureToggle?: boolean;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { leftIcon, clearable, secureToggle, error, value, onChangeText, secureTextEntry, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const state = error ? 'error' : focused ? 'focus' : 'blur';

  return (
    <View style={styles.wrap}>
      <View style={styles.field(state)}>
        {leftIcon && <Icon name={leftIcon} color="textMuted" />}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          placeholderTextColor={styles.placeholder.color}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
          {...rest}
        />
        {clearable && !!value && (
          <Pressable onPress={() => onChangeText?.('')} hitSlop={6}>
            <Icon name="close-circle" color="textMuted" />
          </Pressable>
        )}
        {secureToggle && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={6}>
            <Icon name={hidden ? 'eye-off' : 'eye'} color="textMuted" />
          </Pressable>
        )}
      </View>
      {error ? (
        <Typography variant="caption" color="danger">
          {error}
        </Typography>
      ) : null}
    </View>
  );
});
