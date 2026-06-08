// 하단 탭 네비게이터 — 피드/캘린더/통계/설정
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const icon =
  (name: IoniconName) =>
  ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} color={color as string} size={size} />
  );

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.feed'), tabBarIcon: icon('book-outline') }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: t('tabs.calendar'), tabBarIcon: icon('calendar-outline') }}
      />
      <Tabs.Screen
        name="stats"
        options={{ title: t('tabs.stats'), tabBarIcon: icon('stats-chart-outline') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t('tabs.settings'), tabBarIcon: icon('settings-outline') }}
      />
    </Tabs>
  );
}
