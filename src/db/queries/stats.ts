// 감정 통계 — 감정별 일기 수 분포 (점수 오름차순)
// drizzle aggregate 빌더가 expo 드라이버에서 빈 결과 반환 → 검증된 raw SQL 사용
import { sql } from 'drizzle-orm';

import { db } from '@/db/client';

export type MoodCount = { key: string; emoji: string; score: number; count: number };

export function moodDistribution(): MoodCount[] {
  return db.all<MoodCount>(
    sql`SELECT m.key AS key, m.emoji AS emoji, m.score AS score, COUNT(e.id) AS count
        FROM moods m
        JOIN entries e ON e.mood_id = m.id
        GROUP BY m.id
        ORDER BY m.score`,
  );
}
