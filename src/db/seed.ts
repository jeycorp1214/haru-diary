// 감정 정의표(moods) 시드 — 앱 최초 실행 시 1회.
// 이모티콘 이미지(emoticon_1..36) 36종. emoji 컬럼에 이미지 키 저장(장식용), score 미사용으로 0 고정.
import { EMOTICON_KEYS } from '@/constants/emoticons';

import { db } from './client';
import { moods } from './schema';

export const MOOD_SEED = EMOTICON_KEYS.map((key) => ({
  id: key,
  key,
  emoji: key, // emoticonSource(emoji)로 이미지 변환
  label: key,
  score: 0,
}));

// onConflictDoNothing으로 멱등 — 재실행해도 중복 삽입 없음
export async function seedMoods() {
  await db.insert(moods).values(MOOD_SEED).onConflictDoNothing();
}
