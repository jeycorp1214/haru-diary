// PIN 보안 저장 + 잠금 시도횟수/만료 관리. PIN은 pbkdf2 파생키만 SecureStore에 저장(평문 미저장).
// crypto.subtle은 Expo 런타임에 없음 — 난수는 expo-crypto, 해시·KDF는 순수 JS @noble/hashes(v2).
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { lockStorage } from '@/lib/storage/mmkv';

const PIN_HASH_KEY = 'diary_pin_hash';
const PIN_SALT_KEY = 'diary_pin_salt';
const ENC_KEY_KEY = 'diary_enc_key'; // PIN 파생 암호화 MMKV 키 (E2E)
const ENC_SALT_KEY = 'diary_enckey_salt'; // 암호키 전용 salt (auth 해시와 분리)
const FAILED_ATTEMPTS_KEY = 'pin_failed_attempts';
const LOCKOUT_UNTIL_KEY = 'pin_lockout_until';

export const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000; // 시도 초과 시 1분 잠금

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
}

// PIN + 사용자별 랜덤 salt로 pbkdf2 파생 (SHA-256, 100k 라운드)
async function derivePIN(pin: string, salt: Uint8Array): Promise<string> {
  const key = await pbkdf2Async(sha256, pin, salt, { c: 100_000, dkLen: 32 });
  return toHex(key);
}

export async function savePIN(pin: string) {
  const salt = Crypto.getRandomBytes(16);
  const hash = await derivePIN(pin, salt);
  await SecureStore.setItemAsync(PIN_SALT_KEY, toHex(salt));
  await SecureStore.setItemAsync(PIN_HASH_KEY, hash);

  // E2E: 검증 해시와 별도 salt로 암호화 MMKV 키 파생. 16B → hex 32자(AES-256 32B 한도 충족).
  const encSalt = Crypto.getRandomBytes(16);
  const encKey = await pbkdf2Async(sha256, pin, encSalt, { c: 100_000, dkLen: 16 });
  await SecureStore.setItemAsync(ENC_SALT_KEY, toHex(encSalt));
  await SecureStore.setItemAsync(ENC_KEY_KEY, toHex(encKey));
}

// 암호화 MMKV용 키 반환(hex 32자). PIN 미설정이면 null.
export async function getEncryptionKey(): Promise<string | null> {
  return SecureStore.getItemAsync(ENC_KEY_KEY);
}

export async function verifyPIN(pin: string): Promise<boolean> {
  const storedHash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  const storedSalt = await SecureStore.getItemAsync(PIN_SALT_KEY);
  if (!storedHash || !storedSalt) return false;
  const hash = await derivePIN(pin, fromHex(storedSalt));
  return hash === storedHash;
}

export async function hasPIN(): Promise<boolean> {
  return (await SecureStore.getItemAsync(PIN_HASH_KEY)) !== null;
}

export async function deletePIN() {
  await SecureStore.deleteItemAsync(PIN_HASH_KEY);
  await SecureStore.deleteItemAsync(PIN_SALT_KEY);
  await SecureStore.deleteItemAsync(ENC_KEY_KEY);
  await SecureStore.deleteItemAsync(ENC_SALT_KEY);
  resetAttempts();
}

// --- 시도횟수 / 잠금 (영속) — 앱 강제종료로도 우회 불가하도록 MMKV에 보관 (design §7) ---

export function getFailedAttempts(): number {
  return lockStorage.getNumber(FAILED_ATTEMPTS_KEY) ?? 0;
}

export function getLockoutUntil(): number {
  return lockStorage.getNumber(LOCKOUT_UNTIL_KEY) ?? 0;
}

export function isLockedOut(): boolean {
  return Date.now() < getLockoutUntil();
}

// 실패 1회 기록 → 잠금 진입 여부 + 남은 시도 횟수 반환
export function recordFailedAttempt(): { lockedOut: boolean; attemptsLeft: number } {
  const next = getFailedAttempts() + 1;
  if (next >= MAX_ATTEMPTS) {
    lockStorage.set(LOCKOUT_UNTIL_KEY, Date.now() + LOCKOUT_MS);
    lockStorage.set(FAILED_ATTEMPTS_KEY, 0); // 다음 라운드 위해 리셋
    return { lockedOut: true, attemptsLeft: 0 };
  }
  lockStorage.set(FAILED_ATTEMPTS_KEY, next);
  return { lockedOut: false, attemptsLeft: MAX_ATTEMPTS - next };
}

export function resetAttempts() {
  lockStorage.remove(FAILED_ATTEMPTS_KEY);
  lockStorage.remove(LOCKOUT_UNTIL_KEY);
}
