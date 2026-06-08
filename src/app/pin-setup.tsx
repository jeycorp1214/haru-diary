// PIN 설정 화면 — 4자리 입력 후 확인 재입력 일치 시 savePIN (화면 잠금 활성화)
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { savePIN } from '@/lib/auth/secureStorage';

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
    // confirm
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
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('lockSetup.title'), headerShown: true, presentation: 'modal' }} />
      <Text style={styles.label}>
        {step === 'enter' ? t('lockSetup.enter') : t('lockSetup.confirm')}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        value={pin}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        autoFocus
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  label: { fontSize: 16, color: '#444' },
  error: { color: '#e0245e' },
  input: {
    width: 160,
    fontSize: 28,
    letterSpacing: 12,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
  },
});
