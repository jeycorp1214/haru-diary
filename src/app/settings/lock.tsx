// 화면 잠금 설정 — PIN 설정/해제, 생체 인증, 자동 잠금 시간.
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Box, SegmentedControl, Switch, Typography } from '@/components/ui';
import { hasPIN } from '@/lib/auth/secureStorage';
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

  function toggleLock() {
    // 켜기: PIN 설정. 끄기: 현재 PIN 검증 화면 경유(삭제는 거기서). 복귀 시 useFocusEffect로 상태 갱신.
    router.push(pinSet ? '/pin-verify' : '/pin-setup');
  }

  const autoLockOptions = AUTO_LOCK_MINUTES.map((m) => ({
    key: String(m),
    label: m === 0 ? t('settings.lockImmediate') : t('settings.minutesShort', { count: m }),
  }));

  return (
    <Box flex={1} bg="surface">
      <ScreenHeader title={t('settings.lock')} showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Box row align="center" justify="space-between" py="xs">
          <Typography variant="body">{t('settings.pinLabel')}</Typography>
          <Switch value={pinSet} onValueChange={() => toggleLock()} />
        </Box>
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
