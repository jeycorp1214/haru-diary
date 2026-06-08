// 감정 정의표(moods) 시드 — 앱 최초 실행 시 1회. label은 i18n 키(design §8).
import { db } from './client';
import { moods } from './schema';

export const MOOD_SEED = [
  { id: 'mood_great', key: 'great', emoji: '😄', label: 'mood.great', score: 2 },
  { id: 'mood_good', key: 'good', emoji: '🙂', label: 'mood.good', score: 1 },
  { id: 'mood_meh', key: 'meh', emoji: '😐', label: 'mood.meh', score: 0 },
  { id: 'mood_bad', key: 'bad', emoji: '😟', label: 'mood.bad', score: -1 },
  { id: 'mood_awful', key: 'awful', emoji: '😢', label: 'mood.awful', score: -2 },
];

// onConflictDoNothing으로 멱등 — 재실행해도 중복 삽입 없음
export async function seedMoods() {
  await db.insert(moods).values(MOOD_SEED).onConflictDoNothing();
}
