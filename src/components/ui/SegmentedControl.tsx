// 분할 선택 — 가로 칩 토글. 이 앱 설정에서 최다 중복(테마/언어/글꼴/크기/자동잠금/리마인더).
import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Box } from './Box';

const styles = StyleSheet.create((theme) => ({
  item: (active: boolean) => ({
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: active ? theme.colors.primary : theme.colors.border,
    backgroundColor: active ? theme.colors.primary : 'transparent',
    alignItems: 'center' as const,
  }),
  label: (active: boolean) => ({
    color: active ? theme.colors.onPrimary : theme.colors.text,
    fontWeight: (active ? '600' : '400') as '600' | '400',
  }),
}));

interface Option<T extends string> {
  key: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  renderLabel,
}: {
  options: Option<T>[];
  value: T;
  onChange: (key: T) => void;
  renderLabel?: (option: Option<T>, active: boolean) => ReactNode;
}) {
  return (
    <Box row gap="sm">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={styles.item(active)}>
            {renderLabel ? renderLabel(o, active) : <Text style={styles.label(active)}>{o.label}</Text>}
          </Pressable>
        );
      })}
    </Box>
  );
}
