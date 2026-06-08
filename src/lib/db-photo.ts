// 사진을 캐시/임시 경로에서 documentDirectory로 영구 복사 (OS가 캐시 삭제 방지, architecture §7)
import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

const PHOTO_DIR = new Directory(Paths.document, 'photos');

function ensurePhotoDir() {
  if (!PHOTO_DIR.exists) PHOTO_DIR.create();
}

// 임시 사진 uri → documentDirectory 영구 uri 반환
export async function persistPhoto(sourceUri: string): Promise<string> {
  ensurePhotoDir();
  const ext = sourceUri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
  const dest = new File(PHOTO_DIR, `${Crypto.randomUUID()}.${ext}`);
  await new File(sourceUri).copy(dest);
  return dest.uri;
}

// 일기 삭제 등으로 더 이상 쓰지 않는 사진 파일 제거
export function deletePhotoFile(uri: string) {
  const file = new File(uri);
  if (file.exists) file.delete();
}
