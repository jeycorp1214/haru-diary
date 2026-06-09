// 화면 잠금 끄기 — 현재 PIN 검증 후 삭제. 표준대로 비밀번호 확인 요구.
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/ScreenHeader';
import { PinKeypad } from '@/components/auth/PinKeypad';
import { Box, Typography } from '@/components/ui';
import { deletePIN, verifyPIN } from '@/lib/auth/secureStorage';
import { useLockStore } from '@/lib/auth/useLockStore';

export default function PinVerifyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const setBiometricEnabled = useLockStore((s) => s.setBiometricEnabled);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  async function handleChange(input: string) {
    setError('');
    setPin(input);
    if (input.length !== 4) return;

    if (await verifyPIN(input)) {
      await deletePIN();
      setBiometricEnabled(false);
      router.back();
      return;
    }
    setPin('');
    setError(t('lockSetup.removeWrong'));
  }

  return (
    <Box flex={1} bg="surface">
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <ScreenHeader title={t('settings.removePinTitle')} showBack />
      <Box flex={1} align="center" justify="center" gap="md" p="lg">
        <Typography variant="body">{t('lockSetup.removeEnter')}</Typography>
        {error ? (
          <Typography variant="body" color="danger">
            {error}
          </Typography>
        ) : null}
        <PinKeypad value={pin} onChange={handleChange} />
      </Box>
    </Box>
  );
}
