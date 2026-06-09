// PIN 설정 화면 — 4자리 입력 후 확인 재입력 일치 시 savePIN (화면 잠금 활성화)
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Box, Typography } from '@/components/ui';
import { savePIN } from '@/lib/auth/secureStorage';

const styles = StyleSheet.create((theme) => ({
  input: {
    width: 160,
    fontSize: 28,
    letterSpacing: 12,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 8,
    color: theme.colors.text,
  },
}));

export default function PinSetupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [first, setFirst] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  async function handleChange(input: string) {
    setError('');
    setPin(input);
    if (input.length !== 4) return;

    if (step === 'enter') {
      setFirst(input);
      setStep('confirm');
      setPin('');
      return;
    }
    if (input === first) {
      await savePIN(input);
      router.back();
    } else {
      setError(t('lockSetup.mismatch'));
      setStep('enter');
      setFirst('');
      setPin('');
    }
  }

  return (
    <Box flex={1} bg="surface">
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <ScreenHeader title={t('lockSetup.title')} showBack />
      <Box flex={1} align="center" justify="center" gap="md" p="lg">
        <Typography variant="body">
          {step === 'enter' ? t('lockSetup.enter') : t('lockSetup.confirm')}
        </Typography>
        {error ? (
          <Typography variant="body" color="danger">
            {error}
          </Typography>
        ) : null}
        <TextInput
          value={pin}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          autoFocus
          style={styles.input}
        />
      </Box>
    </Box>
  );
}
