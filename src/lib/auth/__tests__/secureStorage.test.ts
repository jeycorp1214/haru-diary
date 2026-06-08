// secureStorage PIN 저장·검증 + 시도횟수/잠금 영속 로직 테스트
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

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    setItemAsync: jest.fn(async (k: string, v: string) => {
      store.set(k, v);
    }),
    getItemAsync: jest.fn(async (k: string) => (store.has(k) ? store.get(k)! : null)),
    deleteItemAsync: jest.fn(async (k: string) => {
      store.delete(k);
    }),
  };
});

jest.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => new Uint8Array(n).fill(7),
  randomUUID: () => 'uuid',
}));

import {
  MAX_ATTEMPTS,
  deletePIN,
  getFailedAttempts,
  hasPIN,
  isLockedOut,
  recordFailedAttempt,
  resetAttempts,
  savePIN,
  verifyPIN,
} from '@/lib/auth/secureStorage';

describe('secureStorage PIN', () => {
  afterEach(async () => {
    await deletePIN();
  });

  it('저장한 PIN은 검증 통과, 틀린 PIN은 실패', async () => {
    await savePIN('1234');
    expect(await verifyPIN('1234')).toBe(true);
    expect(await verifyPIN('0000')).toBe(false);
  });

  it('hasPIN은 저장 전 false, 후 true', async () => {
    expect(await hasPIN()).toBe(false);
    await savePIN('1234');
    expect(await hasPIN()).toBe(true);
  });

  it('deletePIN 후 검증 불가', async () => {
    await savePIN('1234');
    await deletePIN();
    expect(await hasPIN()).toBe(false);
    expect(await verifyPIN('1234')).toBe(false);
  });
});

describe('secureStorage 시도횟수/잠금', () => {
  beforeEach(() => resetAttempts());

  it('실패 누적, 남은 시도 감소', () => {
    const r1 = recordFailedAttempt();
    expect(r1.lockedOut).toBe(false);
    expect(r1.attemptsLeft).toBe(MAX_ATTEMPTS - 1);
    expect(getFailedAttempts()).toBe(1);
  });

  it('MAX 도달 시 잠금 진입', () => {
    let last = recordFailedAttempt();
    for (let i = 1; i < MAX_ATTEMPTS; i++) last = recordFailedAttempt();
    expect(last.lockedOut).toBe(true);
    expect(isLockedOut()).toBe(true);
  });

  it('resetAttempts는 잠금/카운트 초기화', () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailedAttempt();
    resetAttempts();
    expect(isLockedOut()).toBe(false);
    expect(getFailedAttempts()).toBe(0);
  });
});
