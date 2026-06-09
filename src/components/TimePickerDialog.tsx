// 시각 선택 다이얼로그 — 버튼 그리드(오전/오후 · 시 1~12 · 분 5분 간격). 일기 알림 추가용.
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Box, Button, Typography } from '@/components/ui';

const HOUR_ROWS = [
  [1, 2, 3, 4, 5, 6],
  [7, 8, 9, 10, 11, 12],
];
const MINUTE_ROWS = [
  [0, 5, 10, 15, 20, 25],
  [30, 35, 40, 45, 50, 55],
];

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
  row: { flexDirection: 'row' as const, gap: 8 },
  cell: (active: boolean) => ({
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
    borderWidth: 1,
    borderColor: active ? theme.colors.primary : theme.colors.border,
  }),
  cellText: (active: boolean) => ({
    color: active ? theme.colors.onPrimary : theme.colors.text,
    fontWeight: '500' as const,
  }),
}));

function Cell({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.cell(active)} onPress={onPress}>
      <Text style={styles.cellText(active)}>{label}</Text>
    </Pressable>
  );
}

export function TimePickerDialog({
  visible,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  onConfirm: (hhmm: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [pm, setPm] = useState(false);
  const [hour, setHour] = useState(8); // 12시간제 표시값(1~12)
  const [minute, setMinute] = useState(0);

  function confirm() {
    let h = hour % 12; // 12 → 0 (오전 자정/오후 정오 보정)
    if (pm) h += 12;
    onConfirm(`${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <Typography variant="title">{t('notification.addTitle')}</Typography>

          <View style={styles.row}>
            <Cell label={t('notification.am')} active={!pm} onPress={() => setPm(false)} />
            <Cell label={t('notification.pm')} active={pm} onPress={() => setPm(true)} />
          </View>

          <Typography variant="caption">{t('notification.hour')}</Typography>
          {HOUR_ROWS.map((r, i) => (
            <View key={i} style={styles.row}>
              {r.map((h) => (
                <Cell key={h} label={String(h)} active={hour === h} onPress={() => setHour(h)} />
              ))}
            </View>
          ))}

          <Typography variant="caption">{t('notification.minute')}</Typography>
          {MINUTE_ROWS.map((r, i) => (
            <View key={i} style={styles.row}>
              {r.map((m) => (
                <Cell
                  key={m}
                  label={String(m).padStart(2, '0')}
                  active={minute === m}
                  onPress={() => setMinute(m)}
                />
              ))}
            </View>
          ))}

          <Box row gap="sm" justify="flex-end" mt="sm">
            <Button variant="text" onPress={onClose}>
              {t('entry.cancel')}
            </Button>
            <Button onPress={confirm}>{t('notification.confirm')}</Button>
          </Box>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
