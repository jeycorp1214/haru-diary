// 일기 알림 — 다중 알림 시각 목록 + 추가(시각 선택 다이얼로그)/삭제.
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ScreenHeader } from '@/components/ScreenHeader';
import { TimePickerDialog } from '@/components/TimePickerDialog';
import { Box, Button, Icon, ListRow, Typography } from '@/components/ui';
import { toast } from '@/lib/toast';
import { ensureNotificationPermission, syncReminders } from '@/lib/notifications';
import { useSettingsStore } from '@/stores/useSettingsStore';

const styles = StyleSheet.create(() => ({
  content: { padding: 16, gap: 8, paddingBottom: 40 },
}));

// 'HH:mm' → '오전 8:00' 형태 표시 라벨
function formatLabel(t: (k: string) => string, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const pm = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${t(pm ? 'notification.pm' : 'notification.am')} ${h12}:${String(m).padStart(2, '0')}`;
}

export default function NotificationSettings() {
  const { t } = useTranslation();
  const notifyTimes = useSettingsStore((s) => s.notifyTimes);
  const setNotifyTimes = useSettingsStore((s) => s.setNotifyTimes);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function addReminder(hhmm: string) {
    if (notifyTimes.includes(hhmm)) return; // 중복 무시
    const ok = await ensureNotificationPermission();
    if (!ok) {
      toast.error(t('settings.notifyPermission'));
      return;
    }
    const next = [...notifyTimes, hhmm].sort();
    setNotifyTimes(next);
    await syncReminders(next);
  }

  async function removeReminder(hhmm: string) {
    const next = notifyTimes.filter((x) => x !== hhmm);
    setNotifyTimes(next);
    await syncReminders(next);
  }

  return (
    <Box flex={1} bg="surface">
      <ScreenHeader title={t('settings.reminder')} showBack />
      <ScrollView contentContainerStyle={styles.content}>
        {notifyTimes.length === 0 ? (
          <Typography variant="caption">{t('notification.empty')}</Typography>
        ) : (
          notifyTimes.map((time) => (
            <ListRow
              key={time}
              title={formatLabel(t, time)}
              right={
                <Pressable onPress={() => removeReminder(time)} hitSlop={8}>
                  <Icon name="trash-outline" color="danger" />
                </Pressable>
              }
            />
          ))
        )}
        <Button variant="outline" leftIcon="add" onPress={() => setPickerOpen(true)}>
          {t('notification.add')}
        </Button>
      </ScrollView>
      <TimePickerDialog
        visible={pickerOpen}
        onConfirm={addReminder}
        onClose={() => setPickerOpen(false)}
      />
    </Box>
  );
}
