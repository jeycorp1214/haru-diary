// 라디오 단일 선택 그룹 — 세로 목록. 각 행 탭 시 선택. 인라인/다이얼로그 공용.
import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Box } from './Box';
import { Icon } from './Icon';
import { Typography } from './Typography';

type Option<T> = { key: T; label: string };

const styles = StyleSheet.create(() => ({
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 12,
  },
}));

export function RadioGroup<T extends string | number>({
  options,
  value,
  onChange,
  renderLabel,
}: {
  options: Option<T>[];
  value: T;
  onChange: (key: T) => void;
  renderLabel?: (option: Option<T>, selected: boolean) => ReactNode;
}) {
  return (
    <Box>
      {options.map((o) => {
        const selected = o.key === value;
        return (
          <Pressable key={String(o.key)} style={styles.row} onPress={() => onChange(o.key)}>
            {renderLabel ? renderLabel(o, selected) : <Typography variant="body">{o.label}</Typography>}
            <Icon
              name={selected ? 'radio-button-on' : 'radio-button-off'}
              color={selected ? 'primary' : 'textMuted'}
            />
          </Pressable>
        );
      })}
    </Box>
  );
}
