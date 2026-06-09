// 리스트 행 — 좌측 슬롯 + 제목/부제 + 우측 슬롯 + 터치. 피드/설정 행 등.
import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Box } from './Box';
import { Typography } from './Typography';

const styles = StyleSheet.create(() => ({
  row: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingVertical: 12 },
}));

export function ListRow({
  left,
  title,
  subtitle,
  right,
  onPress,
}: {
  left?: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      {left}
      <Box flex={1}>
        <Typography variant="bodyStrong" numberOfLines={1}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" numberOfLines={2}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {right}
    </Pressable>
  );
}
