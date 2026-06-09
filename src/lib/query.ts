// TanStack Query 전역 클라이언트 + 표준 기본값 + 파생 데이터 무효화 헬퍼
import { QueryClient } from '@tanstack/react-query';

import { queryKeys } from './queryKeys';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 로컬 SQLite 데이터 — 쓰기 시 명시적 무효화하므로 짧은 staleTime로 충분.
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false, // RN: 무의미 + 불필요한 재조회 방지
    },
    mutations: { retry: 0 },
  },
});

// 일기 생성/수정/삭제 후 파생 데이터(목록·월별·검색·통계) 일괄 무효화.
// entries 무효화는 entriesMonth(프리픽스)까지 포함. stats는 별도 트리라 따로 무효화 필요.
export function invalidateEntryData() {
  queryClient.invalidateQueries({ queryKey: queryKeys.entries() });
  queryClient.invalidateQueries({ queryKey: queryKeys.stats() });
  queryClient.invalidateQueries({ queryKey: ['search'] });
}
