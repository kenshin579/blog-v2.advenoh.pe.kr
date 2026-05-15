// 정적 큐레이션 인기 검색어 (분석 연동 없음).
// 발행 콘텐츠 변화에 따라 수동으로 갱신.

export type PopularSearch = {
  q: string;
  n: number;
};

export const POPULAR: readonly PopularSearch[] = [
  { q: 'kubernetes', n: 142 },
  { q: 'terraform', n: 98 },
  { q: 'goroutine', n: 76 },
  { q: 'jpa n+1', n: 54 },
  { q: 'spring boot', n: 48 },
] as const;
