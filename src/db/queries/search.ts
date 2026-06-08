// FTS5 전문 검색 — entries_fts MATCH로 일기 id 회수 후 관계 포함 조회
import { inArray, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { entries } from '@/db/schema';

export async function searchEntries(query: string) {
  const q = query.trim();
  if (!q) return [];

  // FTS 특수문자 제거 후 접두 검색(prefix*). 토큰별 prefix 매칭.
  const sanitized = q
    .replace(/["*()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => `${tok}*`)
    .join(' ');
  if (!sanitized) return [];

  const matched = db.all<{ entry_id: string }>(
    sql`SELECT entry_id FROM entries_fts WHERE entries_fts MATCH ${sanitized}`,
  );
  const ids = matched.map((r) => r.entry_id);
  if (!ids.length) return [];

  return db.query.entries.findMany({
    where: inArray(entries.id, ids),
    with: { mood: true, photos: true },
    orderBy: (e, { desc }) => [desc(e.createdAt)],
  });
}
