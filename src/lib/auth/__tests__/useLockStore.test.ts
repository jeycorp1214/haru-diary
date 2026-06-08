// useLockStore 잠금 상태 + 자동잠금 판단 로직 테스트
import { act } from '@testing-library/react-native';

// MMKV는 네이티브 — 인메모리 mock으로 대체
jest.mock('react-native-mmkv', () => {
  const makeInstance = () => {
    const m = new Map<string, unknown>();
    return {
      set: (k: string, v: unknown) => m.set(k, v),
      getString: (k: string) => (m.has(k) ? String(m.get(k)) : undefined),
      getNumber: (k: string) => (m.has(k) ? Number(m.get(k)) : undefined),
      getBoolean: (k: string) => (m.has(k) ? Boolean(m.get(k)) : undefined),
      remove: (k: string) => m.delete(k),
    };
  };
  return { createMMKV: () => makeInstance() };
});

import { useLockStore } from '@/lib/auth/useLockStore';

describe('useLockStore', () => {
  beforeEach(() => {
    act(() => {
      useLockStore.setState({ isLocked: true, autoLockMinutes: 5 });
    });
  });

  it('unlock은 잠금 해제하고 마지막 인증 시각 기록', () => {
    act(() => useLockStore.getState().unlock());
    expect(useLockStore.getState().isLocked).toBe(false);
  });

  it('lock은 다시 잠금', () => {
    act(() => useLockStore.getState().unlock());
    act(() => useLockStore.getState().lock());
    expect(useLockStore.getState().isLocked).toBe(true);
  });

  it('autoLockMinutes=0이면 복귀 시 즉시 잠금', () => {
    act(() => useLockStore.getState().unlock());
    act(() => useLockStore.getState().setAutoLockMinutes(0));
    act(() => useLockStore.getState().checkShouldLock());
    expect(useLockStore.getState().isLocked).toBe(true);
  });

  it('유예 시간 내 복귀는 잠금 유지 안 함', () => {
    act(() => useLockStore.getState().setAutoLockMinutes(5));
    act(() => useLockStore.getState().unlock()); // 방금 인증
    act(() => useLockStore.getState().checkShouldLock());
    expect(useLockStore.getState().isLocked).toBe(false);
  });

  it('유예 시간 초과 복귀는 잠금', () => {
    const past = Date.now() - 10 * 60 * 1000; // 10분 전
    jest.spyOn(Date, 'now').mockReturnValue(past);
    act(() => useLockStore.getState().unlock());
    jest.restoreAllMocks();
    act(() => useLockStore.getState().setAutoLockMinutes(5));
    act(() => useLockStore.getState().checkShouldLock());
    expect(useLockStore.getState().isLocked).toBe(true);
  });
});
