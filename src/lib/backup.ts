// 일기 데이터 JSON 내보내기 — 전체 일기를 JSON 파일로 만들어 공유 시트로 전달
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { allEntriesForExport } from '@/db/queries/entries';

export const BACKUP_VERSION = 1;

export async function exportEntriesJson() {
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

  const file = new File(Paths.cache, `haru-export-${Date.now()}.json`);
  file.create();
  file.write(JSON.stringify(payload, null, 2));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
  }
}
