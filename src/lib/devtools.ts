// 개발도구 데이터 초기화 — 일기/사진/설정/전체 삭제. 되돌릴 수 없음.
import { deleteMMKV } from 'react-native-mmkv';

import { clearAllEntries, clearAllPhotoRows } from '@/db/queries/entries';
import { deletePIN } from '@/lib/auth/secureStorage';
import { deleteAllPhotoFiles } from '@/lib/db-photo';
import { invalidateEntryData } from '@/lib/query';
import { cacheStorage, lockStorage, settingsStorage } from '@/lib/storage/mmkv';
import { lockSecureStorage } from '@/lib/storage/secureMmkv';

// 일기 전부 삭제 — DB(entries/tags/FTS) + 사진 파일. moods·설정은 유지.
export function deleteAllEntries(): void {
  clearAllEntries();
  deleteAllPhotoFiles();
  invalidateEntryData();
}

// 사진만 삭제 — photos 행 + 파일. 일기 본문은 유지.
export function deleteAllPhotos(): void {
  clearAllPhotoRows();
  deleteAllPhotoFiles();
  invalidateEntryData();
}

// 설정만 초기화 — 테마/폰트/알림/언어(settings 네임스페이스). 일기·잠금은 유지.
export function resetSettings(): void {
  settingsStorage.clearAll();
}

// 모든 데이터 삭제 — 공장초기화 수준. 호출 후 앱 재시작 필수(메모리 상태 stale).
// moods 시드는 재시작 시 seedMoods()로 자동 복구되므로 건드리지 않음.
export async function wipeAllData(): Promise<void> {
  clearAllEntries();
  deleteAllPhotoFiles();

  settingsStorage.clearAll();
  cacheStorage.clearAll();
  lockStorage.clearAll();

  // 암호화 저장소: 메모리 참조 drop 후 파일 삭제
  lockSecureStorage();
  deleteMMKV('secure');

  // Keychain의 PIN 해시/암호키 제거
  await deletePIN();
}
