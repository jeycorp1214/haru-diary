// 감정 통계 — 감정별 일기 수 분포 (점수 오름차순)
import { count, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { entries, moods } from '@/db/schema';

export async function moodDistribution() {
  return db
    .select({
      key: moods.key,
      emoji: moods.emoji,
      score: moods.score,
      count: count(entries.id),
    })
    .from(moods)
    .innerJoin(entries, eq(entries.moodId, moods.id))
    .groupBy(moods.id)
    .orderBy(moods.score);
}
