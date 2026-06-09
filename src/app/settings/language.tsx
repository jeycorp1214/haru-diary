// 언어 설정 — 한국어/English 전환.
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Box, SegmentedControl } from '@/components/ui';
import { useSettingsStore } from '@/stores/useSettingsStore';

const styles = StyleSheet.create(() => ({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
}));

export default function LanguageSettings() {
  const { t, i18n } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  function changeLanguage(lang: string) {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  }

  const langOptions = [
    { key: 'ko', label: '한국어' },
    { key: 'en', label: 'English' },
  ];

  return (
    <Box flex={1} bg="surface">
      <ScreenHeader title={t('settings.language')} showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <SegmentedControl options={langOptions} value={language} onChange={changeLanguage} />
      </ScrollView>
    </Box>
  );
}
