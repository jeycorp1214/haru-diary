// 설정 화면 — 테마 모드 선택 (잠금/알림/백업은 후속)
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemeMode, useSettingsStore } from '@/stores/useSettingsStore';

const THEME_OPTIONS: { key: ThemeMode; label: string }[] = [
  { key: 'system', label: '시스템' },
  { key: 'light', label: '라이트' },
  { key: 'dark', label: '다크' },
];

export default function SettingsScreen() {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);

  return (
    <View style={styles.container}>
      <Text style={styles.section}>테마</Text>
      <View style={styles.segment}>
        {THEME_OPTIONS.map((opt) => {
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  section: { fontSize: 13, color: '#888', fontWeight: '600' },
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
});
