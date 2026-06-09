// 잠금 화면 — PIN 입력 + 생체인증. 시도 초과 시 영속 잠금(secureStorage) 반영.
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useBiometrics } from '@/lib/auth/useBiometrics';
import { useLockStore } from '@/lib/auth/useLockStore';
import {
  getLockoutUntil,
  isLockedOut,
  recordFailedAttempt,
  resetAttempts,
  verifyPIN,
} from '@/lib/auth/secureStorage';

export function LockScreen() {
  const { t } = useTranslation();
  const unlock = useLockStore((s) => s.unlock);
  const isBiometricEnabled = useLockStore((s) => s.isBiometricEnabled);
  const { authenticate, biometricType, isEnrolled } = useBiometrics();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [lockedOut, setLockedOut] = useState(isLockedOut());
  const triedBiometric = useRef(false);

  // 진입 시 생체인증 시도 (isEnrolled는 비동기로 늦게 채워지므로 deps 포함)
  useEffect(() => {
    if (!triedBiometric.current && isBiometricEnabled && isEnrolled && !isLockedOut()) {
      triedBiometric.current = true;
      tryBiometric();
    }
  }, [isBiometricEnabled, isEnrolled]);

  // 잠금 만료까지 입력 비활성, 만료 시 자동 해제
  useEffect(() => {
    if (!lockedOut) return;
    const ms = getLockoutUntil() - Date.now();
    if (ms <= 0) {
      setLockedOut(false);
      return;
    }
    const t = setTimeout(() => {
      setLockedOut(false);
      setError('');
    }, ms);
    return () => clearTimeout(t);
  }, [lockedOut]);

  async function tryBiometric() {
    if (await authenticate()) {
      resetAttempts();
      unlock();
    }
  }

  async function handlePINChange(input: string) {
    setError('');
    setPin(input);
    if (isLockedOut()) {
      setLockedOut(true);
      setPin('');
      setError(t('lock.lockedOut'));
      return;
    }
    if (input.length !== 4) return;

    if (await verifyPIN(input)) {
      resetAttempts();
      unlock();
      return;
    }

    const { lockedOut: lo, attemptsLeft } = recordFailedAttempt();
    setPin('');
    if (lo) {
      setLockedOut(true);
      setError(t('lock.lockedOut1min'));
    } else {
      setError(t('lock.wrong', { count: attemptsLeft }));
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('lock.title')}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        value={pin}
        onChangeText={handlePINChange}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        autoFocus
        editable={!lockedOut}
        style={styles.input}
      />

      {isBiometricEnabled && isEnrolled && !lockedOut && (
        <Pressable onPress={tryBiometric} style={styles.bioButton}>
          <Text style={styles.bioButtonText}>
            {biometricType === 'facial' ? t('lock.faceId') : t('lock.fingerprint')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space(2),
    padding: theme.space(3),
    backgroundColor: theme.colors.background,
  },
  title: { fontSize: theme.fontSize.lg, fontWeight: '600', color: theme.colors.text },
  error: { color: theme.colors.danger },
  input: {
    width: 160,
    fontSize: theme.fontSize.xl,
    letterSpacing: 12,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.space(1),
    color: theme.colors.text,
  },
  bioButton: {
    paddingHorizontal: theme.space(2.5),
    paddingVertical: theme.space(1.25),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brand,
  },
  bioButtonText: { color: '#fff', fontWeight: '600' },
}));
