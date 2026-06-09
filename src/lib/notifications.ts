// 일기 알림 — 매일 지정 시각(다중) 로컬 알림 (expo-notifications)
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

// 알림 시각 목록 전체 동기화 — 기존 전부 취소 후 목록대로 매일 알림 재등록(id 추적 불요).
export async function syncReminders(times: string[]) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const time of times) {
    const [hour, minute] = time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: { title: i18n.t('notification.title'), body: i18n.t('notification.body') },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  }
}
