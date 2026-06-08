// 설정 화면 — 테마/언어 + 글자 스타일 + 화면 잠금 + 백업/알림
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';

import { ScreenHeader } from '@/components/ScreenHeader';
import { deletePIN, hasPIN } from '@/lib/auth/secureStorage';
import { useBiometrics } from '@/lib/auth/useBiometrics';
import { useLockStore } from '@/lib/auth/useLockStore';
import { exportEntriesJson, importEntriesJson } from '@/lib/backup';
import { DriveBackupButton } from '@/components/DriveBackupButton';
import { isDriveConfigured } from '@/lib/cloud/googleDrive';
import { FONT_FAMILY, FONT_KEYS, FONT_SCALES, type FontKey } from '@/lib/fonts';
import { cancelReminder, ensureNotificationPermission, scheduleDailyReminder } from '@/lib/notifications';
import { ThemeMode, useSettingsStore } from '@/stores/useSettingsStore';

const REMINDER_TIMES = ['08:00', '12:00', '21:00', '22:00'];
const AUTO_LOCK_MINUTES = [0, 1, 5, 10];

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
  const queryClient = useQueryClient();
  const notifyTime = useSettingsStore((s) => s.notifyTime);
  const setNotifyTime = useSettingsStore((s) => s.setNotifyTime);
  const router = useRouter();

  // 글자 스타일
  const fontScale = useSettingsStore((s) => s.fontScale);
  const setFontScale = useSettingsStore((s) => s.setFontScale);
  const fontFamily = useSettingsStore((s) => s.fontFamily);
  const setFontFamily = useSettingsStore((s) => s.setFontFamily);

  // 화면 잠금
  const [pinSet, setPinSet] = useState(false);
  const { isAvailable, isEnrolled } = useBiometrics();
  const biometricUsable = isAvailable && isEnrolled;
  const isBiometricEnabled = useLockStore((s) => s.isBiometricEnabled);
  const setBiometricEnabled = useLockStore((s) => s.setBiometricEnabled);
  const autoLockMinutes = useLockStore((s) => s.autoLockMinutes);
  const setAutoLockMinutes = useLockStore((s) => s.setAutoLockMinutes);

  // PIN 설정 화면에서 돌아올 때 갱신
  useFocusEffect(
    useCallback(() => {
      hasPIN().then(setPinSet);
    }, []),
  );

  function toggleLock() {
    if (pinSet) {
      Alert.alert(t('settings.removePinTitle'), t('settings.removePinMsg'), [
        { text: t('entry.cancel'), style: 'cancel' },
        {
          text: t('settings.remove'),
          style: 'destructive',
          onPress: async () => {
            await deletePIN();
            setBiometricEnabled(false);
            setPinSet(false);
          },
        },
      ]);
    } else {
      router.push('/pin-setup');
    }
  }

  async function selectReminder(time: string) {
    if (time === '') {
      await cancelReminder();
      setNotifyTime('');
      return;
    }
    const ok = await ensureNotificationPermission();
    if (!ok) {
      Alert.alert('알림 권한 필요', '설정에서 알림을 허용해 주세요.');
      return;
    }
    const [h, m] = time.split(':').map(Number);
    await scheduleDailyReminder(h, m);
    setNotifyTime(time);
  }

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

  async function handleImport() {
    try {
      const n = await importEntriesJson();
      if (n === null) return; // 취소
      queryClient.invalidateQueries();
      Alert.alert('', t('settings.importDone', { count: n }));
    } catch (e) {
      Alert.alert('가져오기 실패', String(e));
    }
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t('tabs.settings')} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

      <Text style={styles.section}>{t('settings.fontStyle')}</Text>
      <Text style={styles.subLabel}>{t('settings.fontSize')}</Text>
      <View style={styles.segment}>
        {FONT_SCALES.map((scale, i) => {
          const active = fontScale === scale;
          const labels = ['sizeSmall', 'sizeNormal', 'sizeLarge', 'sizeXLarge'];
          return (
            <Pressable
              key={scale}
              onPress={() => setFontScale(scale)}
              style={[styles.segmentItem, active && styles.segmentItemActive]}>
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {t(`settings.${labels[i]}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.subLabel}>{t('settings.fontFamily')}</Text>
      <View style={styles.segment}>
        {FONT_KEYS.map((key) => {
          const active = fontFamily === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFontFamily(key as FontKey)}
              style={[styles.segmentItem, active && styles.segmentItemActive]}>
              <Text
                style={[
                  styles.segmentText,
                  active && styles.segmentTextActive,
                  { fontFamily: FONT_FAMILY[key] },
                ]}>
                {t(`settings.font_${key}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.preview}>
        <Text
          style={{
            fontSize: 18 * fontScale,
            lineHeight: 30 * fontScale,
            fontFamily: FONT_FAMILY[fontFamily],
          }}>
          안녕하세요. 오늘 하루도 수고했어요.
        </Text>
      </View>

      <Text style={styles.section}>{t('settings.lock')}</Text>
      <Pressable onPress={toggleLock} style={styles.button}>
        <Text style={styles.buttonText}>
          {pinSet ? t('settings.lockOnRemove') : t('settings.lockSet')}
        </Text>
      </Pressable>
      {pinSet && biometricUsable && (
        <Pressable
          onPress={() => setBiometricEnabled(!isBiometricEnabled)}
          style={[styles.button, isBiometricEnabled && styles.buttonActive]}>
          <Text style={[styles.buttonText, isBiometricEnabled && styles.buttonTextActive]}>
            {t('settings.biometric')} {isBiometricEnabled ? '✓' : ''}
          </Text>
        </Pressable>
      )}
      {pinSet && (
        <>
          <Text style={styles.subLabel}>{t('settings.autoLock')}</Text>
          <View style={styles.segment}>
            {AUTO_LOCK_MINUTES.map((m) => {
              const active = autoLockMinutes === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setAutoLockMinutes(m)}
                  style={[styles.segmentItem, active && styles.segmentItemActive]}>
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {m === 0 ? t('settings.lockImmediate') : t('settings.minutesShort', { count: m })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <Text style={styles.section}>{t('settings.backup')}</Text>
      <Pressable onPress={handleExport} style={styles.button}>
        <Text style={styles.buttonText}>{t('settings.export')}</Text>
      </Pressable>
      <Pressable onPress={handleImport} style={styles.button}>
        <Text style={styles.buttonText}>{t('settings.import')}</Text>
      </Pressable>
      {isDriveConfigured ? (
        <DriveBackupButton />
      ) : (
        <Pressable
          onPress={() => Alert.alert('', t('settings.cloudUnconfigured'))}
          style={styles.button}>
          <Text style={styles.buttonText}>{t('settings.cloudBackup')}</Text>
        </Pressable>
      )}

      <Text style={styles.section}>{t('settings.reminder')}</Text>
      <View style={styles.segment}>
        <Pressable
          onPress={() => selectReminder('')}
          style={[styles.segmentItem, notifyTime === '' && styles.segmentItemActive]}>
          <Text style={[styles.segmentText, notifyTime === '' && styles.segmentTextActive]}>
            {t('settings.reminderOff')}
          </Text>
        </Pressable>
        {REMINDER_TIMES.map((time) => {
          const active = notifyTime === time;
          return (
            <Pressable
              key={time}
              onPress={() => selectReminder(time)}
              style={[styles.segmentItem, active && styles.segmentItemActive]}>
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{time}</Text>
            </Pressable>
          );
        })}
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  section: { fontSize: 13, color: '#888', fontWeight: '600', marginTop: 8 },
  subLabel: { fontSize: 12, color: '#aaa' },
  preview: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 16,
    backgroundColor: '#fafafa',
  },
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
  buttonActive: { backgroundColor: '#208AEF' },
  buttonTextActive: { color: '#fff' },
});
