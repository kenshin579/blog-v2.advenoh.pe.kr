// Command-K 모달의 localStorage 영속 헬퍼.
// 모든 read/write 는 quota/비활성화/SSR 환경에서 silent fail.

export type RecentItem = {
  slug: string;       // URL slug (title only, no category prefix)
  title: string;
  category: string;
  date: string;       // 형식화된 날짜 문자열 (yyyy.MM.dd 등)
};

const KEY_RECENT = 'cmdk:recently_viewed';
const KEY_HISTORY = 'cmdk:history';
const MAX_ITEMS = 10;

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota / disabled / serialization failure — silent
  }
}

export function getRecentlyViewed(): RecentItem[] {
  return safeGet<RecentItem[]>(KEY_RECENT, []);
}

export function recordView(item: RecentItem): void {
  const cur = getRecentlyViewed();
  const next = [item, ...cur.filter((x) => x.slug !== item.slug)].slice(0, MAX_ITEMS);
  safeSet(KEY_RECENT, next);
}

export function getHistory(): string[] {
  return safeGet<string[]>(KEY_HISTORY, []);
}

export function recordSearch(q: string): void {
  const trimmed = q.trim();
  if (!trimmed) return;
  const cur = getHistory();
  const next = [trimmed, ...cur.filter((x) => x !== trimmed)].slice(0, MAX_ITEMS);
  safeSet(KEY_HISTORY, next);
}

export function clearHistory(): void {
  safeSet(KEY_HISTORY, []);
}
