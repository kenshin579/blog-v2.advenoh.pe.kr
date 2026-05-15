// URL slug 헬퍼.
// sub#7 에서 inline 정의를 단일 출처로 추출.

export function seriesSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export function categorySlug(name: string): string {
  return name.toLowerCase();
}
