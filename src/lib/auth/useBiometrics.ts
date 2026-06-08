// 기기 생체인증(FaceID/지문/홍채) 가용성 확인 + 인증 실행 훅
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useState } from 'react';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export function useBiometrics() {
  const [state, setState] = useState({
    isAvailable: false,
    biometricType: 'none' as BiometricType,
    isEnrolled: false,
  });

  useEffect(() => {
    checkAvailability();
  }, []);

  async function checkAvailability() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let biometricType: BiometricType = 'none';
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = 'facial';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = 'fingerprint';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometricType = 'iris';
    }

    setState({ isAvailable: compatible, biometricType, isEnrolled: enrolled });
  }

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!state.isAvailable || !state.isEnrolled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: '일기를 열려면 인증하세요',
      fallbackLabel: 'PIN 입력', // iOS 전용
      cancelLabel: '취소',
      disableDeviceFallback: false, // false = 기기 PIN/패턴 폴백 허용
    });

    return result.success;
  }, [state]);

  return { ...state, authenticate };
}
