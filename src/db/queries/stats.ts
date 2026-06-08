// 감정 통계 — 감정별 일기 수 분포 + 연속 작성 스트릭
// drizzle aggregate 빌더가 expo 드라이버에서 빈 결과 반환 → 검증된 raw SQL 사용
import dayjs from 'dayjs';
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

// 연속 작성 스트릭 — 오늘(없으면 어제 유예)부터 연속 작성한 날 수
export function currentStreak(): number {
  const rows = db.all<{ d: string }>(
    sql`SELECT DISTINCT entry_date AS d FROM entries ORDER BY d DESC`,
  );
  const dates = new Set(rows.map((r) => r.d));
  if (dates.size === 0) return 0;

  let cursor = dayjs();
  // 오늘 작성 없으면 어제부터 시작(하루 유예). 어제도 없으면 0
  if (!dates.has(cursor.format('YYYY-MM-DD'))) {
    cursor = cursor.subtract(1, 'day');
    if (!dates.has(cursor.format('YYYY-MM-DD'))) return 0;
  }

  let streak = 0;
  while (dates.has(cursor.format('YYYY-MM-DD'))) {
    streak++;
    cursor = cursor.subtract(1, 'day');
  }
  return streak;
}
