// 단계 슬라이더 — 트랙 위 노치(점) 탭으로 단계 선택. 드래그 없음. 글자 크기 등.
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Box } from './Box';

const styles = StyleSheet.create((theme) => ({
  track: { flex: 1, height: 28, justifyContent: 'center' as const },
  line: {
    position: 'absolute' as const,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: theme.colors.border,
  },
  dots: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  hit: { padding: 6 },
  dot: (active: boolean) => ({
    width: active ? 16 : 12,
    height: active ? 16 : 12,
    borderRadius: 8,
    backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: active ? theme.colors.primary : theme.colors.border,
  }),
}));

export function StepSlider<T extends string | number>({
  steps,
  value,
  onChange,
  minLabel,
  maxLabel,
}: {
  steps: T[];
  value: T;
  onChange: (v: T) => void;
  minLabel?: ReactNode;
  maxLabel?: ReactNode;
}) {
  return (
    <Box row align="center" gap="sm">
      {minLabel}
      <View style={styles.track}>
        <View style={styles.line} />
        <View style={styles.dots}>
          {steps.map((s) => (
            <Pressable key={String(s)} style={styles.hit} hitSlop={8} onPress={() => onChange(s)}>
              <View style={styles.dot(s === value)} />
            </Pressable>
          ))}
        </View>
      </View>
      {maxLabel}
    </Box>
  );
}
