// PIN 파생키로 암호화된 MMKV 인스턴스 lifecycle (E2E). 민감 데이터(위치/날씨 PII) 전용.
// 키는 SecureStore(Keychain)에 영속 → PIN/생체 unlock 모두에서 로드 가능.
import { createMMKV, type MMKV } from 'react-native-mmkv';

import { getEncryptionKey } from '@/lib/auth/secureStorage';

let instance: MMKV | null = null;

// unlock 시 호출. 암호키 로드 성공 시 인스턴스 생성. PIN 미설정(키 없음)이면 false.
export async function unlockSecureStorage(): Promise<boolean> {
  if (instance) return true;
  const key = await getEncryptionKey();
  if (!key) return false;
  instance = createMMKV({ id: 'secure', encryptionKey: key, encryptionType: 'AES-256' });
  return true;
}

// lock 시 호출. 메모리 참조만 drop(파일은 암호화된 채 잔존).
export function lockSecureStorage() {
  instance = null;
}

// 잠금 중/PIN 미설정이면 null. 소비처는 null 폴백 필수.
export function getSecureStorage(): MMKV | null {
  return instance;
}

export function isSecureStorageUnlocked(): boolean {
  return instance !== null;
}
