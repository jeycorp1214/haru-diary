// 공통 아이콘 — Ionicons 단일화 + 테마 색 연동. 색은 토큰명, 크기는 number.
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native-unistyles';

import type { ColorToken } from '@/unistyles';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

const styles = StyleSheet.create((theme) => ({
  tint: (c: ColorToken) => ({ color: theme.colors[c] }),
}));

export function Icon({
  name,
  size = 20,
  color = 'text',
}: {
  name: IconName;
  size?: number;
  color?: ColorToken;
}) {
  return <Ionicons name={name} size={size} color={styles.tint(color).color as string} />;
}
