// 일기 데이터 JSON 내보내기/가져오기 — 파일 생성·공유 + 파일 선택·검증·삽입
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { z } from 'zod';

import { allEntriesForExport, importEntries } from '@/db/queries/entries';

export const BACKUP_VERSION = 1;

const ImportSchema = z.object({
  version: z.number(),
  entries: z.array(
    z.object({
      entryDate: z.string(),
      title: z.string().nullish(),
      content: z.string().nullish(),
      contentText: z.string(),
      mood: z.string().nullish(),
      weather: z.string().nullish(),
      tempC: z.number().nullish(),
      locationName: z.string().nullish(),
      lat: z.number().nullish(),
      lng: z.number().nullish(),
      createdAt: z.number().nullish(),
      updatedAt: z.number().nullish(),
      tags: z.array(z.string()).optional(),
      photos: z.array(z.string()).optional(),
    }),
  ),
});

// 전체 일기 → 백업 JSON 문자열 (내보내기·클라우드 백업 공용)
export async function buildBackupJson(): Promise<string> {
  const entries = await allEntriesForExport();
  const payload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    entries: entries.map((e) => ({
      entryDate: e.entryDate,
      title: e.title,
      content: e.content,
      contentText: e.contentText,
      mood: e.mood?.key ?? null,
      weather: e.weather,
      tempC: e.tempC,
      locationName: e.locationName,
      lat: e.lat,
      lng: e.lng,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      tags: e.entryTags.map((et) => et.tag.name),
      photos: e.photos.map((p) => p.uri), // 로컬 경로 — 기기 간 이동 시 사진은 별도 처리 필요
    })),
  };
  return JSON.stringify(payload, null, 2);
}

export async function exportEntriesJson() {
  const json = await buildBackupJson();
  const file = new File(Paths.cache, `haru-export-${Date.now()}.json`);
  file.create();
  file.write(json);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
  }
}

// JSON 파일 선택 → 검증 → 삽입. 가져온 일기 수 반환(취소 시 null)
export async function importEntriesJson(): Promise<number | null> {
  const res = await File.pickFileAsync({ mimeTypes: ['application/json'] });
  if (res.canceled) return null;

  const text = await res.result.text();
  const parsed = ImportSchema.parse(JSON.parse(text));
  return importEntries(parsed.entries);
}
