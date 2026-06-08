// 일기 작성 리마인더 — 매일 지정 시각 로컬 알림 (expo-notifications)
import * as Notifications from 'expo-notifications';

import i18n from '@/lib/i18n';

// 포그라운드에서도 배너 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function scheduleDailyReminder(hour: number, minute: number) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: i18n.t('notification.title'), body: i18n.t('notification.body') },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

export async function cancelReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
