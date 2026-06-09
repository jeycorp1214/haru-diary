// 데이터 초기화 — 비밀번호 분실 시 전체 삭제 후 잠금 해제(복구 불가, 마지막 수단).
import { expoDb } from '@/db/client';
import { deletePIN } from '@/lib/auth/secureStorage';
import { cacheStorage } from '@/lib/storage/mmkv';
import { getSecureStorage } from '@/lib/storage/secureMmkv';

export async function factoryReset() {
  await deletePIN(); // PIN 해시·암호키·시도횟수 제거

  // 일기 데이터 전체 삭제 (moods 시드는 유지). FK 자식 → 부모 순서.
  expoDb.execSync(
    `DELETE FROM photos;
     DELETE FROM entry_tags;
     DELETE FROM tags;
     DELETE FROM entries;
     DELETE FROM entries_fts;`,
  );

  cacheStorage.clearAll(); // 스트릭/날씨 캐시
  getSecureStorage()?.clearAll(); // 위치 PII 캐시(잠금 중이면 null → 키 삭제로 무력)
}
