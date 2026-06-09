// 라디오 단일 선택 다이얼로그 — 탭 즉시 선택+닫기. ConfirmHost의 Modal 스타일 차용.
import { Modal, Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Box } from './Box';
import { Icon } from './Icon';
import { Typography } from './Typography';

type Option<T> = { key: T; label: string };

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000080',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%' as const,
    maxWidth: 360,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.lg,
    padding: 20,
    gap: 8,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 12,
  },
}));

export function RadioDialog<T extends string | number>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: Option<T>[];
  value: T;
  onSelect: (key: T) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <Typography variant="title">{title}</Typography>
          <Box>
            {options.map((o) => {
              const selected = o.key === value;
              return (
                <Pressable
                  key={String(o.key)}
                  style={styles.row}
                  onPress={() => {
                    onSelect(o.key);
                    onClose();
                  }}>
                  <Typography variant="body">{o.label}</Typography>
                  <Icon
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    color={selected ? 'primary' : 'textMuted'}
                  />
                </Pressable>
              );
            })}
          </Box>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
