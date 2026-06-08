// 암호화 MMKV lifecycle + PIN 파생 암호키 테스트 (E2E)
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
  return { createMMKV: jest.fn(() => makeInstance()) };
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

import { createMMKV } from 'react-native-mmkv';

import { deletePIN, getEncryptionKey, savePIN } from '@/lib/auth/secureStorage';
import {
  getSecureStorage,
  isSecureStorageUnlocked,
  lockSecureStorage,
  unlockSecureStorage,
} from '@/lib/storage/secureMmkv';

describe('secureMmkv E2E 암호화', () => {
  afterEach(async () => {
    lockSecureStorage();
    await deletePIN();
    (createMMKV as jest.Mock).mockClear();
  });

  it('savePIN은 32자 hex 암호키를 SecureStore에 저장', async () => {
    expect(await getEncryptionKey()).toBeNull();
    await savePIN('1234');
    const key = await getEncryptionKey();
    expect(key).toMatch(/^[0-9a-f]{32}$/);
  });

  it('PIN 미설정이면 unlock 실패(인스턴스 미생성)', async () => {
    expect(await unlockSecureStorage()).toBe(false);
    expect(isSecureStorageUnlocked()).toBe(false);
    expect(getSecureStorage()).toBeNull();
  });

  it('PIN 설정 후 unlock 성공 + AES-256 인스턴스 생성', async () => {
    await savePIN('1234');
    const key = await getEncryptionKey();
    expect(await unlockSecureStorage()).toBe(true);
    expect(isSecureStorageUnlocked()).toBe(true);
    expect(createMMKV).toHaveBeenCalledWith({
      id: 'secure',
      encryptionKey: key,
      encryptionType: 'AES-256',
    });
  });

  it('unlock 후 read/write 라운드트립', async () => {
    await savePIN('1234');
    await unlockSecureStorage();
    getSecureStorage()!.set('k', 'v');
    expect(getSecureStorage()!.getString('k')).toBe('v');
  });

  it('lock하면 인스턴스 접근 차단', async () => {
    await savePIN('1234');
    await unlockSecureStorage();
    lockSecureStorage();
    expect(getSecureStorage()).toBeNull();
    expect(isSecureStorageUnlocked()).toBe(false);
  });

  it('deletePIN하면 암호키 제거 → unlock 불가', async () => {
    await savePIN('1234');
    await deletePIN();
    expect(await getEncryptionKey()).toBeNull();
    expect(await unlockSecureStorage()).toBe(false);
  });
});
