// 화면 잠금 설정 — PIN 설정/해제, 생체 인증, 자동 잠금 시간.
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Box, Button, SegmentedControl, Switch, Typography } from '@/components/ui';
import { confirm } from '@/lib/confirm';
import { deletePIN, hasPIN } from '@/lib/auth/secureStorage';
import { useBiometrics } from '@/lib/auth/useBiometrics';
import { useLockStore } from '@/lib/auth/useLockStore';

const AUTO_LOCK_MINUTES = [0, 1, 5, 10];

const styles = StyleSheet.create(() => ({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
}));

export default function LockSettings() {
  const { t } = useTranslation();
  const router = useRouter();
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

  const autoLockOptions = AUTO_LOCK_MINUTES.map((m) => ({
    key: String(m),
    label: m === 0 ? t('settings.lockImmediate') : t('settings.minutesShort', { count: m }),
  }));

  return (
    <Box flex={1} bg="surface">
      <ScreenHeader title={t('settings.lock')} showBack />
      <ScrollView contentContainerStyle={styles.content}>
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
      </ScrollView>
    </Box>
  );
}
