// drizzle + expo-sqlite DB 인스턴스. 외래키 활성 + FTS5 부트스트랩.
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

export const expoDb = openDatabaseSync('haru.db');

// SQLite는 외래키가 기본 OFF — entry_tags/photos cascade 삭제를 위해 명시 활성
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });

// FTS5 전문검색 가상테이블. 일기 저장과 동일 트랜잭션에서 수동 동기화(트리거 미사용, design §3).
// entry_id는 UNINDEXED — 토큰화 제외하고 저장만, 검색 결과에서 일기 PK 회수용.
export function bootstrapFts() {
  expoDb.execSync(
    `CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
      entry_id UNINDEXED,
      title,
      content_text
    );`,
  );
}
