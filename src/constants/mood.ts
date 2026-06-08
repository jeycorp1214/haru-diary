// 감정 점수(-2..2) → 마킹/그래프 색상 매핑
export function moodColor(score?: number | null): string {
  switch (score) {
    case 2:
      return '#34C759';
    case 1:
      return '#30B0C7';
    case 0:
      return '#8E8E93';
    case -1:
      return '#FF9500';
    case -2:
      return '#FF3B30';
    default:
      return '#C7C7CC';
  }
}
