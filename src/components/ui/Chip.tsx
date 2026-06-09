// 칩 — 태그/감정 선택. pill 라운드, selected 시 primary 채움. onRemove면 X 버튼.
import { Pressable, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Icon } from './Icon';

const styles = StyleSheet.create((theme) => ({
  chip: (selected: boolean) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: selected ? theme.colors.primary : theme.colors.primarySoft,
  }),
  label: (selected: boolean) => ({
    color: selected ? theme.colors.onPrimary : theme.colors.primary,
    fontSize: 14,
  }),
}));

export function Chip({
  label,
  selected = false,
  onPress,
  onRemove,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.chip(selected)}>
      <Text style={styles.label(selected)}>{label}</Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={6}>
          <Icon name="close" size={14} color={selected ? 'onPrimary' : 'primary'} />
        </Pressable>
      )}
    </Pressable>
  );
}
