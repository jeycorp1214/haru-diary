// 알림 설정 — 매일 작성 리마인더 시각 선택.
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Box, SegmentedControl } from '@/components/ui';
import { toast } from '@/lib/toast';
import { cancelReminder, ensureNotificationPermission, scheduleDailyReminder } from '@/lib/notifications';
import { useSettingsStore } from '@/stores/useSettingsStore';

const REMINDER_TIMES = ['08:00', '12:00', '21:00', '22:00'];

const styles = StyleSheet.create(() => ({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
}));

export default function NotificationSettings() {
  const { t } = useTranslation();
  const notifyTime = useSettingsStore((s) => s.notifyTime);
  const setNotifyTime = useSettingsStore((s) => s.setNotifyTime);

  async function selectReminder(time: string) {
    if (time === '') {
      await cancelReminder();
      setNotifyTime('');
      return;
    }
    const ok = await ensureNotificationPermission();
    if (!ok) {
      toast.error(t('settings.notifyPermission'));
      return;
    }
    const [h, m] = time.split(':').map(Number);
    await scheduleDailyReminder(h, m);
    setNotifyTime(time);
  }

  const reminderOptions = [
    { key: '', label: t('settings.reminderOff') },
    ...REMINDER_TIMES.map((time) => ({ key: time, label: time })),
  ];

  return (
    <Box flex={1} bg="surface">
      <ScreenHeader title={t('settings.reminder')} showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <SegmentedControl options={reminderOptions} value={notifyTime} onChange={selectReminder} />
      </ScrollView>
    </Box>
  );
}
