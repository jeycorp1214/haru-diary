// React Query 키 팩토리 — 키 문자열 분산/오타 방지 + 무효화 일관성.
// entriesMonth는 'entries' 프리픽스 아래라 entries() 무효화 시 함께 갱신됨.
export const queryKeys = {
  entries: () => ['entries'] as const,
  entriesMonth: (yearMonth: string) => ['entries', 'month', yearMonth] as const,
  entry: (id: string) => ['entry', id] as const,
  search: (q: string) => ['search', q] as const,
  stats: () => ['stats'] as const,
  statsMoods: () => ['stats', 'moods'] as const,
  statsStreak: () => ['stats', 'streak'] as const,
};
