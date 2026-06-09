// 설정 화면 — 테마/언어 + 글자 스타일 + 화면 잠금 + 백업/알림. 공통 컴포넌트 + Unistyles 테마.
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useQueryClient } from '@tanstack/react-query';

import { ScreenHeader } from '@/components/ScreenHeader';
import { DriveBackupButton } from '@/components/DriveBackupButton';
import { Box, Button, Card, SegmentedControl, Switch, Typography } from '@/components/ui';
import { confirm } from '@/lib/confirm';
import { toast } from '@/lib/toast';
import { deletePIN, hasPIN } from '@/lib/auth/secureStorage';
import { useBiometrics } from '@/lib/auth/useBiometrics';
import { useLockStore } from '@/lib/auth/useLockStore';
import { exportEntriesJson, importEntriesJson } from '@/lib/backup';
import { isDriveConfigured } from '@/lib/cloud/googleDrive';
import { exportEntriesPdf } from '@/lib/pdf';
import { FONT_FAMILY, FONT_KEYS, FONT_SCALES, type FontKey } from '@/lib/fonts';
import { cancelReminder, ensureNotificationPermission, scheduleDailyReminder } from '@/lib/notifications';
import { ThemeMode, useSettingsStore } from '@/stores/useSettingsStore';

const REMINDER_TIMES = ['08:00', '12:00', '21:00', '22:00'];
const AUTO_LOCK_MINUTES = [0, 1, 5, 10];
const SIZE_LABELS = ['sizeSmall', 'sizeNormal', 'sizeLarge', 'sizeXLarge'];

const styles = StyleSheet.create((theme) => ({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  fontLabel: (active: boolean) => ({ color: active ? theme.colors.onPrimary : theme.colors.text }),
  previewText: { color: theme.colors.text },
}));

function Section({ title }: { title: string }) {
  return (
    <Typography variant="label" style={{ marginTop: 8 }}>
      {title}
    </Typography>
  );
}

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

  const fontScale = useSettingsStore((s) => s.fontScale);
  const setFontScale = useSettingsStore((s) => s.setFontScale);
  const fontFamily = useSettingsStore((s) => s.fontFamily);
  const setFontFamily = useSettingsStore((s) => s.setFontFamily);

  const [pinSet, setPinSet] = useState(false);
  const { isAvailable, isEnrolled } = useBiometrics();
  const biometricUsable = isAvailable && isEnrolled;
  const isBiometricEnabled = useLockStore((s) => s.isBiometricEnabled);
  const setBiometricEnabled = useLockStore((s) => s.setBiometricEnabled);
  const autoLockMinutes = useLockStore((s) => s.autoLockMinutes);
  const setAutoLockMinutes = useLockStore((s) => s.setAutoLockMinutes);

  useFocusEffect(
    useCallback(() => {
      hasPIN().then(setPinSet);
    }, []),
  );

  async function toggleLock() {
    if (!pinSet) {
      router.push('/pin-setup');
      return;
    }
    const ok = await confirm({
      title: t('settings.removePinTitle'),
      message: t('settings.removePinMsg'),
      confirmLabel: t('settings.remove'),
      cancelLabel: t('entry.cancel'),
      destructive: true,
    });
    if (ok) {
      await deletePIN();
      setBiometricEnabled(false);
      setPinSet(false);
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
      toast.error(t('settings.notifyPermission'));
      return;
    }
    const [h, m] = time.split(':').map(Number);
    await scheduleDailyReminder(h, m);
    setNotifyTime(time);
  }

  function changeLanguage(lang: string) {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  }

  async function handleExport() {
    try {
      await exportEntriesJson();
    } catch {
      toast.error(t('settings.exportFailed'));
    }
  }

  async function handleExportPdf() {
    try {
      await exportEntriesPdf(t('entry.untitled'));
    } catch {
      toast.error(t('settings.exportFailed'));
    }
  }

  async function handleImport() {
    try {
      const n = await importEntriesJson();
      if (n === null) return;
      queryClient.invalidateQueries();
      toast.success(t('settings.importDone', { count: n }));
    } catch {
      toast.error(t('settings.importFailed'));
    }
  }

  const themeOptions: { key: ThemeMode; label: string }[] = [
    { key: 'system', label: t('settings.themeSystem') },
    { key: 'light', label: t('settings.themeLight') },
    { key: 'dark', label: t('settings.themeDark') },
  ];
  const langOptions = [
    { key: 'ko', label: '한국어' },
    { key: 'en', label: 'English' },
  ];
  const sizeOptions = FONT_SCALES.map((scale, i) => ({ key: String(scale), label: t(`settings.${SIZE_LABELS[i]}`) }));
  const fontOptions = FONT_KEYS.map((key) => ({ key, label: t(`settings.font_${key}`) }));
  const autoLockOptions = AUTO_LOCK_MINUTES.map((m) => ({
    key: String(m),
    label: m === 0 ? t('settings.lockImmediate') : t('settings.minutesShort', { count: m }),
  }));
  const reminderOptions = [
    { key: '', label: t('settings.reminderOff') },
    ...REMINDER_TIMES.map((time) => ({ key: time, label: time })),
  ];

  return (
    <Box flex={1} bg="surface">
      <ScreenHeader title={t('tabs.settings')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title={t('settings.theme')} />
        <SegmentedControl options={themeOptions} value={themeMode} onChange={setThemeMode} />

        <Section title={t('settings.language')} />
        <SegmentedControl options={langOptions} value={language} onChange={changeLanguage} />

        <Section title={t('settings.fontStyle')} />
        <Typography variant="caption">{t('settings.fontSize')}</Typography>
        <SegmentedControl
          options={sizeOptions}
          value={String(fontScale)}
          onChange={(k) => setFontScale(Number(k))}
        />
        <Typography variant="caption">{t('settings.fontFamily')}</Typography>
        <SegmentedControl
          options={fontOptions}
          value={fontFamily}
          onChange={(k) => setFontFamily(k as FontKey)}
          renderLabel={(o, active) => (
            <Text style={[styles.fontLabel(active), { fontFamily: FONT_FAMILY[o.key] }]}>{o.label}</Text>
          )}
        />
        <Card>
          <Text
            style={[
              styles.previewText,
              { fontSize: 18 * fontScale, lineHeight: 30 * fontScale, fontFamily: FONT_FAMILY[fontFamily] },
            ]}>
            안녕하세요. 오늘 하루도 수고했어요.
          </Text>
        </Card>

        <Section title={t('settings.lock')} />
        <Button variant="outline" onPress={toggleLock}>
          {pinSet ? t('settings.lockOnRemove') : t('settings.lockSet')}
        </Button>
        {pinSet && biometricUsable && (
          <Box row align="center" justify="space-between" py="xs">
            <Typography variant="body">{t('settings.biometric')}</Typography>
            <Switch value={isBiometricEnabled} onValueChange={setBiometricEnabled} />
          </Box>
        )}
        {pinSet && (
          <>
            <Typography variant="caption">{t('settings.autoLock')}</Typography>
            <SegmentedControl
              options={autoLockOptions}
              value={String(autoLockMinutes)}
              onChange={(k) => setAutoLockMinutes(Number(k))}
            />
          </>
        )}

        <Section title={t('settings.backup')} />
        <Button variant="outline" onPress={handleExport}>
          {t('settings.export')}
        </Button>
        <Button variant="outline" onPress={handleExportPdf}>
          {t('settings.exportPdf')}
        </Button>
        <Button variant="outline" onPress={handleImport}>
          {t('settings.import')}
        </Button>
        {isDriveConfigured ? (
          <DriveBackupButton />
        ) : (
          <Button variant="outline" onPress={() => toast.info(t('settings.cloudUnconfigured'))}>
            {t('settings.cloudBackup')}
          </Button>
        )}

        <Section title={t('settings.reminder')} />
        <SegmentedControl options={reminderOptions} value={notifyTime} onChange={selectReminder} />
      </ScrollView>
    </Box>
  );
}
