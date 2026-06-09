// 잠금 게이트 — PIN 미설정이면 자동 해제(잠금은 opt-in), 설정 시 LockScreen 표시.
// 백그라운드 복귀 시 자동잠금 판단.
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { hasPIN } from '@/lib/auth/secureStorage';
import { useLockStore } from '@/lib/auth/useLockStore';
import { LockScreen } from './LockScreen';

export function LockGate({ children }: { children: React.ReactNode }) {
  const isLocked = useLockStore((s) => s.isLocked);
  const unlock = useLockStore((s) => s.unlock);
  const checkShouldLock = useLockStore((s) => s.checkShouldLock);
  const [checking, setChecking] = useState(true);

  // PIN 미설정 → 잠금 비활성(데드락 방지)
  useEffect(() => {
    hasPIN().then((has) => {
      if (!has) unlock();
      setChecking(false);
    });
  }, []);

  // 백그라운드 → 포그라운드 복귀 시 자동잠금 체크
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkShouldLock();
    });
    return () => sub.remove();
  }, [checkShouldLock]);

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isLocked) return <LockScreen />;
  return <>{children}</>;
}

const styles = StyleSheet.create((theme) => ({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
}));
