// 일기 CRUD — 본문/태그/FTS를 단일 트랜잭션에서 동기화 (design §3 불변식)
import { eq, like, sql } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

import { db } from '@/db/client';
import { entries, entryTags, photos, tags } from '@/db/schema';
import { deletePhotoFile } from '@/lib/db-photo';

// expo-sqlite sync 드라이버: 트랜잭션 콜백은 동기. 내부 쿼리는 .run()/.get()으로 실행
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface EntryInput {
  entryDate: string; // YYYY-MM-DD
  title?: string | null;
  content?: string | null; // 리치텍스트 직렬화
  contentText: string; // 평문 (FTS·미리보기)
  moodId?: string | null;
  weather?: string | null;
  tempC?: number | null;
  locationName?: string | null;
  lat?: number | null;
  lng?: number | null;
  tagNames?: string[]; // 태그 이름 배열 — 없으면 생성, 연결 동기화
  photos?: { uri: string; width?: number | null; height?: number | null }[]; // 영구 복사된 uri
}

// 사진 행 재구성 (영구 uri는 호출 전 persistPhoto로 준비된 상태)
function syncPhotos(
  tx: Tx,
  entryId: string,
  list: { uri: string; width?: number | null; height?: number | null }[],
) {
  tx.delete(photos).where(eq(photos.entryId, entryId)).run();
  list.forEach((p, i) => {
    tx.insert(photos)
      .values({
        id: Crypto.randomUUID(),
        entryId,
        uri: p.uri,
        width: p.width ?? null,
        height: p.height ?? null,
        sort: i,
      })
      .run();
  });
}

function entryColumns(input: EntryInput) {
  return {
    entryDate: input.entryDate,
    title: input.title ?? null,
    content: input.content ?? null,
    contentText: input.contentText,
    moodId: input.moodId ?? null,
    weather: input.weather ?? null,
    tempC: input.tempC ?? null,
    locationName: input.locationName ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
  };
}

// 태그 upsert 후 entry_tags 재연결 (기존 연결 전부 제거 → 재삽입)
function syncTags(tx: Tx, entryId: string, tagNames: string[]) {
  tx.delete(entryTags).where(eq(entryTags.entryId, entryId)).run();
  const unique = [...new Set(tagNames.map((n) => n.trim()).filter(Boolean))];
  for (const name of unique) {
    tx.insert(tags).values({ id: Crypto.randomUUID(), name }).onConflictDoNothing().run();
    const row = tx.select({ id: tags.id }).from(tags).where(eq(tags.name, name)).get();
    if (row) tx.insert(entryTags).values({ entryId, tagId: row.id }).onConflictDoNothing().run();
  }
}

// FTS 가상테이블 동기화 — 트리거 미사용, 본문 쓰기와 같은 트랜잭션
function syncFts(tx: Tx, entryId: string, title: string, contentText: string) {
  tx.run(sql`DELETE FROM entries_fts WHERE entry_id = ${entryId}`);
  tx.run(
    sql`INSERT INTO entries_fts (entry_id, title, content_text) VALUES (${entryId}, ${title}, ${contentText})`,
  );
}

export function createEntry(input: EntryInput): string {
  const id = Crypto.randomUUID();
  const now = Date.now();
  db.transaction((tx) => {
    tx.insert(entries).values({ id, ...entryColumns(input), createdAt: now, updatedAt: now }).run();
    syncTags(tx, id, input.tagNames ?? []);
    syncPhotos(tx, id, input.photos ?? []);
    syncFts(tx, id, input.title ?? '', input.contentText);
  });
  return id;
}

export function updateEntry(id: string, input: EntryInput): void {
  db.transaction((tx) => {
    tx.update(entries)
      .set({ ...entryColumns(input), updatedAt: Date.now() })
      .where(eq(entries.id, id))
      .run();
    syncTags(tx, id, input.tagNames ?? []);
    syncPhotos(tx, id, input.photos ?? []);
    syncFts(tx, id, input.title ?? '', input.contentText);
  });
}

export function deleteEntry(id: string): void {
  // 디스크의 사진 파일 정리 (DB 행은 cascade로 삭제됨)
  const files = db.select({ uri: photos.uri }).from(photos).where(eq(photos.entryId, id)).all();
  files.forEach((f) => deletePhotoFile(f.uri));

  db.transaction((tx) => {
    // entry_tags/photos는 FK cascade. FTS는 FK 밖이라 수동 삭제
    tx.run(sql`DELETE FROM entries_fts WHERE entry_id = ${id}`);
    tx.delete(entries).where(eq(entries.id, id)).run();
  });
}

// 상세 — 감정/사진/태그 포함
export function getEntry(id: string) {
  return db.query.entries.findFirst({
    where: eq(entries.id, id),
    with: {
      mood: true,
      photos: { orderBy: (p, { asc }) => [asc(p.sort)] },
      entryTags: { with: { tag: true } },
    },
  });
}

// 타임라인 피드 — 최신순 페이지네이션
export function listEntries(opts?: { limit?: number; offset?: number }) {
  return db.query.entries.findMany({
    orderBy: (e, { desc }) => [desc(e.createdAt)],
    limit: opts?.limit ?? 30,
    offset: opts?.offset ?? 0,
    with: { mood: true, photos: true },
  });
}

// 캘린더용 — 해당 월(YYYY-MM)의 일기 (감정 포함)
export function entriesInMonth(yearMonth: string) {
  return db.query.entries.findMany({
    where: like(entries.entryDate, `${yearMonth}-%`),
    with: { mood: true },
    orderBy: (e, { asc }) => [asc(e.createdAt)],
  });
}
