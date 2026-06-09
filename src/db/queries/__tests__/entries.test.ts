// queries/entries CRUD 테스트 — better-sqlite3 인메모리로 실제 SQL(트랜잭션/FK cascade/FTS) 검증
import { sql } from 'drizzle-orm';

// @/db/client을 better-sqlite3 인메모리 인스턴스로 교체.
// expo-sqlite 드라이버와 better-sqlite3 드라이버는 sync 트랜잭션·.run/.get/.all API가 동일 → 소스 무수정.
jest.mock('@/db/client', () => {
  const Database = require('better-sqlite3');
  const { drizzle } = require('drizzle-orm/better-sqlite3');
  const schema = require('@/db/schema');
  const { readFileSync } = require('fs');
  const { join } = require('path');

  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON'); // cascade 검증용

  // 마이그레이션 SQL 적용 (drizzle 구분자로 분할)
  const migration = readFileSync(
    join(__dirname, '../../migrations/0000_numerous_sharon_ventura.sql'),
    'utf8',
  );
  for (const stmt of migration.split('--> statement-breakpoint')) {
    const s = stmt.trim();
    if (s) sqlite.exec(s);
  }

  const db = drizzle(sqlite, { schema });
  return {
    expoDb: { execSync: (q: string) => sqlite.exec(q) },
    db,
    bootstrapFts: () =>
      sqlite.exec(
        `CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(entry_id UNINDEXED, title, content_text);`,
      ),
  };
});

// UUID는 삽입마다 유일해야 PK 충돌 없음 → 카운터
jest.mock('expo-crypto', () => {
  let n = 0;
  return {
    randomUUID: () => `id-${++n}`,
    getRandomBytes: (k: number) => new Uint8Array(k).fill(7),
  };
});

// db-photo는 expo-file-system 의존 → no-op 모킹 (파일 정리는 이 테스트 범위 밖)
jest.mock('@/lib/db-photo', () => ({ deletePhotoFile: jest.fn() }));

import { db, expoDb, bootstrapFts } from '@/db/client';
import { moods } from '@/db/schema';
import {
  createEntry,
  updateEntry,
  deleteEntry,
  getEntry,
  listEntries,
  importEntries,
  entriesInMonth,
} from '@/db/queries/entries';

// FTS 행 조회 헬퍼
function ftsRows() {
  return db.all<{ entry_id: string; title: string; content_text: string }>(
    sql`SELECT entry_id, title, content_text FROM entries_fts`,
  );
}

beforeAll(() => {
  bootstrapFts();
});

beforeEach(() => {
  // 매 테스트 깨끗한 상태 (FK 순서대로 비우기)
  expoDb.execSync(
    'DELETE FROM entries_fts; DELETE FROM entry_tags; DELETE FROM photos; DELETE FROM entries; DELETE FROM tags; DELETE FROM moods;',
  );
  // createEntry(moodId) FK 충족용 기본 감정 1행
  db.insert(moods).values({ id: 'mood-happy', key: 'happy', emoji: '😀', label: '행복', score: 5 }).run();
});

describe('createEntry', () => {
  it('본문+태그+FTS를 한 트랜잭션에서 함께 생성', async () => {
    const id = createEntry({
      entryDate: '2026-06-09',
      title: '제목',
      contentText: 'hello world',
      moodId: 'mood-happy',
      tagNames: ['운동', '독서'],
    });

    const entry = await getEntry(id);
    expect(entry?.title).toBe('제목');
    expect(entry?.mood?.key).toBe('happy');
    expect(entry?.entryTags.map((et) => et.tag.name).sort()).toEqual(['독서', '운동']);

    const fts = ftsRows();
    expect(fts).toHaveLength(1);
    expect(fts[0]).toMatchObject({ entry_id: id, title: '제목', content_text: 'hello world' });
  });

  it('중복 태그는 dedup (공백 trim + Set)', async () => {
    const id = createEntry({
      entryDate: '2026-06-09',
      contentText: 'x',
      tagNames: ['운동', ' 운동 ', '운동', ''],
    });
    const entry = await getEntry(id);
    expect(entry?.entryTags).toHaveLength(1);
    expect(entry?.entryTags[0].tag.name).toBe('운동');
  });
});

describe('updateEntry', () => {
  it('본문 갱신 + 태그/FTS 재동기화', async () => {
    const id = createEntry({ entryDate: '2026-06-09', title: '구', contentText: 'old', tagNames: ['a'] });
    updateEntry(id, { entryDate: '2026-06-09', title: '신', contentText: 'new', tagNames: ['b', 'c'] });

    const entry = await getEntry(id);
    expect(entry?.title).toBe('신');
    expect(entry?.entryTags.map((et) => et.tag.name).sort()).toEqual(['b', 'c']);

    const fts = ftsRows();
    expect(fts).toHaveLength(1);
    expect(fts[0].content_text).toBe('new');
  });
});

describe('deleteEntry', () => {
  it('entry 삭제 시 entry_tags/photos는 FK cascade, FTS는 수동 삭제', async () => {
    const id = createEntry({
      entryDate: '2026-06-09',
      contentText: 'x',
      tagNames: ['t1'],
      photos: [{ uri: 'file:///a.jpg' }],
    });

    // 사전: 자식 행 존재
    expect(db.all(sql`SELECT 1 FROM entry_tags WHERE entry_id = ${id}`)).toHaveLength(1);
    expect(db.all(sql`SELECT 1 FROM photos WHERE entry_id = ${id}`)).toHaveLength(1);
    expect(ftsRows()).toHaveLength(1);

    deleteEntry(id);

    expect(await getEntry(id)).toBeUndefined();
    expect(db.all(sql`SELECT 1 FROM entry_tags WHERE entry_id = ${id}`)).toHaveLength(0); // cascade
    expect(db.all(sql`SELECT 1 FROM photos WHERE entry_id = ${id}`)).toHaveLength(0); // cascade
    expect(ftsRows()).toHaveLength(0); // 수동
  });
});

describe('listEntries / entriesInMonth', () => {
  it('createdAt 내림차순 + limit', async () => {
    importEntries([
      { entryDate: '2026-06-01', contentText: 'a', createdAt: 100 },
      { entryDate: '2026-06-02', contentText: 'b', createdAt: 300 },
      { entryDate: '2026-06-03', contentText: 'c', createdAt: 200 },
    ]);
    const list = await listEntries({ limit: 2 });
    expect(list).toHaveLength(2);
    expect(list.map((e) => e.contentText)).toEqual(['b', 'c']); // 300, 200
  });

  it('해당 월만 필터', async () => {
    importEntries([
      { entryDate: '2026-05-31', contentText: 'may' },
      { entryDate: '2026-06-15', contentText: 'jun' },
    ]);
    const jun = await entriesInMonth('2026-06');
    expect(jun).toHaveLength(1);
    expect(jun[0].contentText).toBe('jun');
  });
});

describe('importEntries', () => {
  it('감정 key 매핑 + 원본 타임스탬프 보존 + 개수 반환', async () => {
    const count = importEntries([
      { entryDate: '2026-06-09', contentText: 'x', mood: 'happy', createdAt: 555, tags: ['여행'] },
      { entryDate: '2026-06-09', contentText: 'y', mood: 'unknown' },
    ]);
    expect(count).toBe(2);

    const list = await listEntries();
    const x = list.find((e) => e.contentText === 'x');
    expect(x?.moodId).toBe('mood-happy'); // key→id 매핑
    expect(x?.createdAt).toBe(555); // 원본 보존
    const y = list.find((e) => e.contentText === 'y');
    expect(y?.moodId).toBeNull(); // 미존재 key → null
  });
});
