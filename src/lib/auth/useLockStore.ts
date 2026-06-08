// 전역 잠금 상태 관리 (Zustand) — 잠금 여부/생체활성/자동잠금 + 백그라운드 복귀 시 잠금 판단
import { create } from 'zustand';

import { lockStorage } from '@/lib/storage/mmkv';
import { lockSecureStorage, unlockSecureStorage } from '@/lib/storage/secureMmkv';

const LAST_AUTH_KEY = 'last_authenticated_at';
const AUTO_LOCK_MINUTES_KEY = 'auto_lock_minutes';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

interface LockStore {
  isLocked: boolean;
  isBiometricEnabled: boolean;
  autoLockMinutes: number;
  lock: () => void;
  unlock: () => void;
  setAutoLockMinutes: (minutes: number) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  checkShouldLock: () => void;
}

export const useLockStore = create<LockStore>((set, get) => ({
  isLocked: true,
  isBiometricEnabled: lockStorage.getBoolean(BIOMETRIC_ENABLED_KEY) ?? false,
  autoLockMinutes: lockStorage.getNumber(AUTO_LOCK_MINUTES_KEY) ?? 5,

  lock: () => {
    lockSecureStorage();
    set({ isLocked: true });
  },

  unlock: () => {
    lockStorage.set(LAST_AUTH_KEY, Date.now());
    void unlockSecureStorage(); // 암호 store 활성화(키 없으면 무동작)
    set({ isLocked: false });
  },

  setAutoLockMinutes: (minutes) => {
    lockStorage.set(AUTO_LOCK_MINUTES_KEY, minutes);
    set({ autoLockMinutes: minutes });
  },

  setBiometricEnabled: (enabled) => {
    lockStorage.set(BIOMETRIC_ENABLED_KEY, enabled);
    set({ isBiometricEnabled: enabled });
  },

  // 백그라운드 복귀 시 유예 시간 초과 여부 확인
  checkShouldLock: () => {
    // 0 = 즉시 잠금
    if (get().autoLockMinutes === 0) {
      lockSecureStorage();
      set({ isLocked: true });
      return;
    }
    const lastAuth = lockStorage.getNumber(LAST_AUTH_KEY) ?? 0;
    const autoLockMs = get().autoLockMinutes * 60 * 1000;
    const elapsed = Date.now() - lastAuth;
    if (elapsed > autoLockMs) {
      lockSecureStorage();
      set({ isLocked: true });
    }
  },
}));
