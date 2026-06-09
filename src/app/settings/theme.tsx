// 테마 설정 — 시스템/라이트/다크 선택.
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Box, SegmentedControl } from '@/components/ui';
import { ThemeMode, useSettingsStore } from '@/stores/useSettingsStore';

const styles = StyleSheet.create(() => ({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
}));

export default function ThemeSettings() {
  const { t } = useTranslation();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);

  const themeOptions: { key: ThemeMode; label: string }[] = [
    { key: 'system', label: t('settings.themeSystem') },
    { key: 'light', label: t('settings.themeLight') },
    { key: 'dark', label: t('settings.themeDark') },
  ];

  return (
    <Box flex={1} bg="surface">
      <ScreenHeader title={t('settings.theme')} showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <SegmentedControl options={themeOptions} value={themeMode} onChange={setThemeMode} />
      </ScrollView>
    </Box>
  );
}
