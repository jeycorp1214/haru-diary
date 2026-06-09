// PIN 보안 저장 + 잠금 시도횟수/만료 관리. PIN 해시(salt+sha256)만 SecureStore에 저장(평문 미저장).
// PIN = UI 게이트용 단방향 해시. 온라인 추측은 5회 1분 잠금으로 제한.
// 느린 KDF(오프라인 대입 방어) 제거: 일기 본문이 평문 SQLite라 무의미했음.
// 암호화 MMKV 키는 PIN 파생이 아닌 랜덤키(Keychain 보관) → unlock 즉시, 4자리 PIN보다 강함.
// crypto.subtle은 Expo 런타임에 없음 — 난수는 expo-crypto, 해시는 순수 JS @noble/hashes(v2).
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
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

// 게이트 검증용 단방향 해시 — salt + PIN, sha256 1회(즉시).
function hashPIN(pin: string, saltHex: string): string {
  return toHex(sha256(utf8ToBytes(`${saltHex}:${pin}`)));
}

export async function savePIN(pin: string) {
  const saltHex = toHex(Crypto.getRandomBytes(16));
  await SecureStore.setItemAsync(PIN_SALT_KEY, saltHex);
  await SecureStore.setItemAsync(PIN_HASH_KEY, hashPIN(pin, saltHex));

  // 암호화 MMKV 키 — PIN 파생 아님. 랜덤 16B → hex 32자(AES-256). Keychain 보관, unlock 시 로드.
  const encKey = toHex(Crypto.getRandomBytes(16));
  await SecureStore.setItemAsync(ENC_KEY_KEY, encKey);
}

// 암호화 MMKV용 키 반환(hex 32자). PIN 미설정이면 null.
export async function getEncryptionKey(): Promise<string | null> {
  return SecureStore.getItemAsync(ENC_KEY_KEY);
}

export async function verifyPIN(pin: string): Promise<boolean> {
  const storedHash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  const storedSalt = await SecureStore.getItemAsync(PIN_SALT_KEY);
  if (!storedHash || !storedSalt) return false;
  return hashPIN(pin, storedSalt) === storedHash;
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
