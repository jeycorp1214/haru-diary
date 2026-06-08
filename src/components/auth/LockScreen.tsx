// 잠금 화면 — PIN 입력 + 생체인증. 시도 초과 시 영속 잠금(secureStorage) 반영.
import { useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { Button, Text, YStack } from 'tamagui';

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
      setError('시도 초과. 잠시 후 다시 시도하세요.');
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
      setError('시도 초과. 1분 후 다시 시도하세요.');
    } else {
      setError(`PIN이 올바르지 않습니다. (남은 시도 ${attemptsLeft}회)`);
    }
  }

  return (
    <YStack style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
      <Text fontSize="$6" fontWeight="600">
        일기 잠금
      </Text>

      {error ? <Text color="$red10">{error}</Text> : null}

      <TextInput
        value={pin}
        onChangeText={handlePINChange}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        autoFocus
        editable={!lockedOut}
        style={{
          width: 160,
          fontSize: 28,
          letterSpacing: 12,
          textAlign: 'center',
          borderBottomWidth: 1,
          borderColor: '#ccc',
          paddingVertical: 8,
        }}
      />

      {isBiometricEnabled && isEnrolled && !lockedOut && (
        <Button onPress={tryBiometric}>
          {biometricType === 'facial' ? 'Face ID로 열기' : '지문으로 열기'}
        </Button>
      )}
    </YStack>
  );
}
