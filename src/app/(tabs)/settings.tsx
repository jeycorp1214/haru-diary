// 설정 화면 — 테마 모드 + 언어 선택 (잠금/알림/백업은 후속)
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { exportEntriesJson } from '@/lib/backup';
import { ThemeMode, useSettingsStore } from '@/stores/useSettingsStore';

const LANGUAGES = [
  { key: 'ko', label: '한국어' },
  { key: 'en', label: 'English' },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const themeOptions: { key: ThemeMode; label: string }[] = [
    { key: 'system', label: t('settings.themeSystem') },
    { key: 'light', label: t('settings.themeLight') },
    { key: 'dark', label: t('settings.themeDark') },
  ];

  function changeLanguage(lang: string) {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  }

  async function handleExport() {
    try {
      await exportEntriesJson();
    } catch (e) {
      Alert.alert('내보내기 실패', String(e));
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.section}>{t('settings.theme')}</Text>
      <View style={styles.segment}>
        {themeOptions.map((opt) => {
          const active = themeMode === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setThemeMode(opt.key)}
              style={[styles.segmentItem, active && styles.segmentItemActive]}>
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.section}>{t('settings.language')}</Text>
      <View style={styles.segment}>
        {LANGUAGES.map((opt) => {
          const active = language === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => changeLanguage(opt.key)}
              style={[styles.segmentItem, active && styles.segmentItemActive]}>
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.section}>{t('settings.backup')}</Text>
      <Pressable onPress={handleExport} style={styles.button}>
        <Text style={styles.buttonText}>{t('settings.export')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  section: { fontSize: 13, color: '#888', fontWeight: '600', marginTop: 8 },
  segment: { flexDirection: 'row', gap: 8 },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  segmentItemActive: { backgroundColor: '#208AEF', borderColor: '#208AEF' },
  segmentText: { color: '#444' },
  segmentTextActive: { color: '#fff', fontWeight: '600' },
  button: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#208AEF',
    alignItems: 'center',
  },
  buttonText: { color: '#208AEF', fontWeight: '600' },
});
