# Sub-project #3: Command-K 검색 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 `SearchDialog` 를 Bento 스타일의 모노크롬 미니멀 Command-K 모달(`⌘K`/`Ctrl+K`)로 교체한다. localStorage 기반 "최근 본 글", "인기 검색어", "검색 히스토리" 빈 상태 + 키보드 nav (↑↓ Enter Esc) + 매치 하이라이트 지원. 기존 MiniSearch 인덱스(`public/search-index.json`)를 그대로 재사용.

**Architecture:** 새 `components/command-k.tsx` 컴포넌트가 SearchDialog 의 자리를 대체. localStorage 헬퍼와 popular 큐레이션은 별도 파일로 분리. Header 의 import 1줄 swap. Article 페이지에는 `recordView` 호출용 작은 client 컴포넌트(`components/article/record-view.tsx`) 추가. 기존 `SearchDialog` 컴포넌트 파일은 sub-project #9 cleanup 단계까지 그대로 둔다 (rollback 안전망).

**Tech Stack:** Next.js 16, React 19, MiniSearch (이미 설치), `next/navigation` `useRouter`, `localStorage` (try/catch 가드), `lucide-react`.

**브랜치:** `feature/redesign-bento` 위에서 누적. 모든 sub-PR 또는 단일 누적 커밋. `main` 직접 커밋 금지.

**참고 문서:**
- spec: `docs/superpowers/specs/2026-05-13-blog-v2-bento-redesign-design.md` (§6 Command-K 검색)
- prototype 참고: `docs/design/blog-v3-bento/components/command-k.tsx` (단, MiniSearch 어댑터로 교체 — prototype 은 정적 ARTICLES 사용)
- 기존: `components/search-dialog.tsx` (MiniSearch 셋업 패턴 그대로 재사용)
- 데이터 셰이프: `public/search-index.json` 의 entry 는 `{ id, slug, title, excerpt, content, category, tags[], date }` (slug 는 카테고리 prefix 포함, 예: `ai/claude-code-mcp-추천-가이드`)

---

## Files Touched

- Create: `lib/cmdk-storage.ts` — localStorage 헬퍼 (`recordView`, `recordSearch`, `getRecentlyViewed`, `getHistory`, `clearHistory`)
- Create: `config/popular-searches.ts` — 큐레이션된 인기 검색어 5개 (정적)
- Create: `components/command-k.tsx` — Bento 스타일 ⌘K 모달
- Create: `components/article/record-view.tsx` — Article 페이지 mount 시 `recordView()` 호출하는 작은 client 컴포넌트
- Modify: `components/site-header.tsx` — `SearchDialog` import → `CommandK` import (1~2줄)
- Modify: `app/[slug]/page.tsx` — `<RecordView />` 컴포넌트를 article 페이지에 렌더 (1~2줄)
- 의존: `components/search-dialog.tsx` 파일은 그대로 유지 (sub-project #9 에서 삭제)

---

## Design Decisions (sub-project #3 한정)

### 1. URL 정책
- Article click navigation: `getArticleTitleFromSlug(fullSlug)` 로 title 추출 → `/${title}` (기존 라우팅 유지)
- Tag click navigation: `/tags/${encodeURIComponent(tag)}` — sub-project #8 까지는 임시 404 (의도된 상태)

### 2. localStorage 영속 키
- `cmdk:recently_viewed` — `RecentItem[]`, 최대 10개 (표시는 상위 5개)
- `cmdk:history` — `string[]` (검색어), 최대 10개 (표시는 상위 5개)
- 모든 read/write 는 `try/catch` 로 감싸 quota/비활성화 silent fail

### 3. 인기 검색어
`config/popular-searches.ts` 의 정적 5개 큐레이션. 분석 연동 없음 (YAGNI). 화면에는 검색어 + 임의 카운트(브랜딩용) 표시.

### 4. MiniSearch 재사용
기존 SearchDialog 가 사용한 동일한 셋업 (fields, boost, fuzzy, prefix, storeFields). 모달 첫 open 시 lazy load.

### 5. Hydration 안전
- `useTheme` 같은 hydration 위험 없음 — CommandK 는 client 컴포넌트, localStorage 는 mount 후 useEffect 안에서만 접근.
- 모달 자체는 `if (!open) return null` 로 닫힌 상태에선 DOM 미존재.

### 6. recordView 호출 시점
Article 페이지 mount 시 1회. `useEffect(() => { recordView(...); }, [slug])`.

### 7. Tags 매칭 로직
검색어 q 가 어떤 article 의 tag 의 부분문자열이면, 그 tag 를 결과에 포함. tag 별 문서 카운트는 검색 인덱스를 1회 순회하여 집계.

---

## Tailwind Dynamic-Class Note

CommandK 의 className 은 모두 정적 문자열. dynamic safelist 불필요.

---

### Task 1: localStorage 헬퍼 + 인기 검색어 config

**Files:**
- Create: `lib/cmdk-storage.ts`
- Create: `config/popular-searches.ts`

⚠️ **이 task 는 신규 2개 파일만 생성한다. 다른 파일 수정 금지.**

- [ ] **Step 1: `config/popular-searches.ts` 생성**

```ts
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
```

- [ ] **Step 2: `lib/cmdk-storage.ts` 생성**

```ts
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
```

- [ ] **Step 3: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력. 에러 시 quote + BLOCKED.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공.

- [ ] **Step 4: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add lib/cmdk-storage.ts config/popular-searches.ts && git commit -m "$(cat <<'EOF'
feat(cmdk): localStorage 헬퍼 + 인기 검색어 큐레이션 추가

* lib/cmdk-storage.ts: recordView/recordSearch/getRecentlyViewed/getHistory/clearHistory
  — try/catch 로 quota·비활성화·SSR silent fail
  — 키: cmdk:recently_viewed, cmdk:history (최대 10개)
* config/popular-searches.ts: 정적 큐레이션 5개 (kubernetes/terraform/goroutine/jpa n+1/spring boot)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: CommandK 모달 컴포넌트

**Files:**
- Create: `components/command-k.tsx`

⚠️ **신규 1개 파일만 생성. 다른 파일 수정 금지.** 이 task 가 가장 큰 부분이며, 한 번에 끝낸다 (분할 시 중간 broken state 생김).

- [ ] **Step 1: `components/command-k.tsx` 생성**

```tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MiniSearch from 'minisearch';
import { POPULAR } from '@/config/popular-searches';
import {
  type RecentItem,
  getHistory,
  getRecentlyViewed,
  recordSearch,
  recordView,
  clearHistory,
} from '@/lib/cmdk-storage';

// ────────────────────────────────────────────────────────────────────
// Types

type SearchDocument = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  date: string;
};

type Row =
  | { kind: 'article'; slug: string; title: string; category: string; date: string }
  | { kind: 'tag'; tag: string; count: number }
  | { kind: 'popular'; q: string; n: number }
  | { kind: 'history'; q: string };

// slug 가 "category/title" 형태면 마지막 segment 만 추출 (URL 라우팅 형식)
function urlSlug(fullSlug: string): string {
  const parts = fullSlug.split('/');
  return parts[parts.length - 1];
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

// ────────────────────────────────────────────────────────────────────
// Main component

export function CommandK({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentItem[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [docs, setDocs] = useState<SearchDocument[]>([]);
  const [miniSearch, setMiniSearch] = useState<MiniSearch<SearchDocument> | null>(null);
  const [indexLoading, setIndexLoading] = useState(false);

  // Lazy-load MiniSearch index on first open
  useEffect(() => {
    if (!open || miniSearch || indexLoading) return;
    setIndexLoading(true);
    fetch('/search-index.json')
      .then((res) => res.json())
      .then((documents: SearchDocument[]) => {
        const ms = new MiniSearch<SearchDocument>({
          fields: ['title', 'excerpt', 'content', 'tags'],
          storeFields: ['slug', 'title', 'excerpt', 'category', 'tags', 'date'],
          searchOptions: {
            boost: { title: 2, excerpt: 1.5, tags: 1.2 },
            fuzzy: 0.2,
            prefix: true,
          },
        });
        ms.addAll(documents);
        setMiniSearch(ms);
        setDocs(documents);
      })
      .catch((err) => {
        console.warn('[CommandK] failed to load search index:', err);
      })
      .finally(() => setIndexLoading(false));
  }, [open, miniSearch, indexLoading]);

  // Refresh localStorage state when modal opens
  useEffect(() => {
    if (!open) return;
    setRecentlyViewed(getRecentlyViewed());
    setHistory(getHistory());
    setQuery('');
    setActiveIdx(0);
  }, [open]);

  // Build the flat row list for keyboard nav
  const rows: Row[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const empty: Row[] = [];
      recentlyViewed.slice(0, 5).forEach((r) =>
        empty.push({ kind: 'article', slug: r.slug, title: r.title, category: r.category, date: r.date }),
      );
      POPULAR.forEach((p) => empty.push({ kind: 'popular', q: p.q, n: p.n }));
      history.slice(0, 5).forEach((h) => empty.push({ kind: 'history', q: h }));
      return empty;
    }

    if (!miniSearch) return [];

    // Article matches via MiniSearch (top 6)
    const hits = miniSearch.search(q).slice(0, 6) as unknown as SearchDocument[];
    const articleRows: Row[] = hits.map((h) => ({
      kind: 'article',
      slug: urlSlug(h.slug),
      title: h.title,
      category: h.category,
      date: formatDate(h.date),
    }));

    // Tag matches: aggregate tags across all docs whose tag includes q (top 4)
    const tagMap = new Map<string, number>();
    for (const d of docs) {
      for (const t of d.tags) {
        if (t.toLowerCase().includes(q)) {
          tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
        }
      }
    }
    const tagRows: Row[] = Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tag, count]) => ({ kind: 'tag', tag, count }));

    return [...articleRows, ...tagRows];
  }, [query, miniSearch, docs, recentlyViewed, history]);

  // Reset active index when rows change
  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  // Global keyboard handling (only while open)
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, Math.max(rows.length - 1, 0)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        const row = rows[activeIdx];
        if (!row) return;
        e.preventDefault();
        if (row.kind === 'article') {
          recordView({
            slug: row.slug,
            title: row.title,
            category: row.category,
            date: row.date,
          });
          if (query.trim()) recordSearch(query.trim());
          onClose();
          router.push(`/${encodeURIComponent(row.slug)}`);
        } else if (row.kind === 'tag') {
          if (query.trim()) recordSearch(query.trim());
          onClose();
          router.push(`/tags/${encodeURIComponent(row.tag)}`);
        } else if (row.kind === 'popular' || row.kind === 'history') {
          setQuery(row.q);
          setActiveIdx(0);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, rows, activeIdx, query, onClose, router]);

  if (!open) return null;

  const showEmpty = query.trim().length === 0;
  const totalIndexed = docs.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="검색"
      className="fixed inset-0 z-50 flex items-start justify-center bg-bento-ink/50 px-4 pt-[110px] backdrop-blur-sm dark:bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[760px] overflow-hidden rounded-[14px] bg-bento-card shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b border-bento-ink/10 px-5 py-4 dark:border-white/10">
          <span aria-hidden="true" className="font-mono text-sm font-semibold tracking-wider text-bento-accent">
            ›
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어를 입력하세요"
            autoFocus
            aria-label="검색어"
            className="flex-1 border-0 bg-transparent font-mono text-base text-bento-ink outline-none placeholder:text-bento-dim"
            style={{ caretColor: 'rgb(var(--bento-accent))' }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="검색 닫기"
            className="rounded border border-bento-ink/10 px-1.5 py-0.5 font-mono text-[11px] text-bento-dim dark:border-white/10"
          >
            esc
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[480px] overflow-auto py-3">
          {showEmpty ? (
            <EmptyState
              recentlyViewed={recentlyViewed}
              history={history}
              activeIdx={activeIdx}
              rows={rows}
              onPickHistory={(q) => {
                setQuery(q);
                setActiveIdx(0);
              }}
              onPickPopular={(q) => {
                setQuery(q);
                setActiveIdx(0);
              }}
              onClearHistory={() => {
                clearHistory();
                setHistory([]);
              }}
            />
          ) : !miniSearch ? (
            <div className="px-6 py-8 text-center font-mono text-xs text-bento-dim">
              검색 인덱스를 불러오는 중…
            </div>
          ) : (
            <SearchResults
              query={query}
              activeIdx={activeIdx}
              rows={rows}
              onActivateArticle={(row) => {
                recordView({
                  slug: row.slug,
                  title: row.title,
                  category: row.category,
                  date: row.date,
                });
                if (query.trim()) recordSearch(query.trim());
                onClose();
              }}
              onActivateTag={() => {
                if (query.trim()) recordSearch(query.trim());
                onClose();
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-bento-ink/10 bg-bento-cream px-5 py-2.5 font-mono text-[11px] text-bento-dim dark:border-white/10 dark:bg-bento-card">
          <div className="flex gap-4">
            <FooterKey keys={['↑', '↓']}>navigate</FooterKey>
            <FooterKey keys={['↵']}>open</FooterKey>
            <FooterKey keys={['esc']}>close</FooterKey>
          </div>
          <div>
            <span aria-hidden="true" className="text-bento-accent">●</span> indexed · {totalIndexed} posts
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Subviews

function EmptyState({
  recentlyViewed,
  history,
  activeIdx,
  rows,
  onPickHistory,
  onPickPopular,
  onClearHistory,
}: {
  recentlyViewed: RecentItem[];
  history: string[];
  activeIdx: number;
  rows: Row[];
  onPickHistory: (q: string) => void;
  onPickPopular: (q: string) => void;
  onClearHistory: () => void;
}) {
  return (
    <>
      {recentlyViewed.length > 0 && (
        <Section label="recently viewed" count={Math.min(recentlyViewed.length, 5)}>
          {recentlyViewed.slice(0, 5).map((r, i) => {
            const rowIdx = rows.findIndex((x) => x.kind === 'article' && x.slug === r.slug);
            const active = rowIdx === activeIdx;
            return (
              <RowLink
                key={r.slug}
                href={`/${encodeURIComponent(r.slug)}`}
                active={active}
                num={String(i + 1).padStart(2, '0')}
                title={r.title}
                meta={r.category}
                trailing={r.date}
              />
            );
          })}
        </Section>
      )}

      <Section label="popular this week" count={POPULAR.length}>
        {POPULAR.map((p, i) => {
          const rowIdx = rows.findIndex((x) => x.kind === 'popular' && x.q === p.q);
          const active = rowIdx === activeIdx;
          return (
            <RowQuery
              key={p.q}
              active={active}
              num={String(i + 1).padStart(2, '0')}
              q={p.q}
              meta={`${p.n} searches`}
              onPick={() => onPickPopular(p.q)}
            />
          );
        })}
      </Section>

      {history.length > 0 && (
        <Section
          label="your history"
          count={Math.min(history.length, 5)}
          extra={
            <button
              type="button"
              onClick={onClearHistory}
              className="font-mono text-[10px] text-bento-dim hover:text-bento-ink"
            >
              clear
            </button>
          }
        >
          {history.slice(0, 5).map((q) => {
            const rowIdx = rows.findIndex((x) => x.kind === 'history' && x.q === q);
            const active = rowIdx === activeIdx;
            return (
              <RowQuery
                key={q}
                active={active}
                icon="↻"
                q={q}
                muted
                onPick={() => onPickHistory(q)}
              />
            );
          })}
        </Section>
      )}
    </>
  );
}

function SearchResults({
  query,
  activeIdx,
  rows,
  onActivateArticle,
  onActivateTag,
}: {
  query: string;
  activeIdx: number;
  rows: Row[];
  onActivateArticle: (row: { slug: string; title: string; category: string; date: string }) => void;
  onActivateTag: (row: { tag: string }) => void;
}) {
  const articles = rows.filter((r): r is Extract<Row, { kind: 'article' }> => r.kind === 'article');
  const tags = rows.filter((r): r is Extract<Row, { kind: 'tag' }> => r.kind === 'tag');

  if (articles.length === 0 && tags.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <span aria-hidden="true" className="font-mono text-2xl text-bento-dim">∅</span>
        <div className="text-sm font-medium text-bento-ink">"{query}"에 대한 결과 없음</div>
        <div className="text-xs text-bento-dim">다른 검색어를 시도해보세요</div>
      </div>
    );
  }

  return (
    <>
      {articles.length > 0 && (
        <Section label="articles" count={articles.length}>
          {articles.map((r, i) => {
            const rowIdx = rows.indexOf(r);
            const active = rowIdx === activeIdx;
            return (
              <RowLink
                key={r.slug}
                href={`/${encodeURIComponent(r.slug)}`}
                active={active}
                num={String(i + 1).padStart(2, '0')}
                title={highlight(r.title, query)}
                meta={r.category}
                trailing={r.date}
                onSelect={() => onActivateArticle(r)}
              />
            );
          })}
        </Section>
      )}

      {tags.length > 0 && (
        <Section label="tags" count={tags.length}>
          {tags.map((r) => {
            const rowIdx = rows.indexOf(r);
            const active = rowIdx === activeIdx;
            return (
              <RowLink
                key={r.tag}
                href={`/tags/${encodeURIComponent(r.tag)}`}
                active={active}
                num="#"
                title={highlight(r.tag, query)}
                meta={`${r.count} posts`}
                trailing=""
                onSelect={() => onActivateTag(r)}
              />
            );
          })}
        </Section>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Atoms

function Section({
  label,
  count,
  extra,
  children,
}: {
  label: string;
  count: number;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center justify-between px-6 pb-1.5 pt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-bento-dim">
        <span>{label}</span>
        <span className="flex items-center gap-2">
          {extra}
          <span>{String(count).padStart(2, '0')}</span>
        </span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function RowLink({
  href,
  active,
  num,
  title,
  meta,
  trailing,
  onSelect,
}: {
  href: string;
  active: boolean;
  num: string;
  title: React.ReactNode;
  meta: string;
  trailing: string;
  onSelect?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className={[
        'flex items-center gap-3 border-l-2 px-6 py-2 no-underline',
        active
          ? 'border-bento-accent bg-bento-ink/5 dark:bg-white/5'
          : 'border-transparent hover:bg-bento-ink/[0.03] dark:hover:bg-white/[0.03]',
      ].join(' ')}
    >
      <span
        className={[
          'w-6 font-mono text-[11px]',
          active ? 'text-bento-accent' : 'text-bento-dim',
        ].join(' ')}
      >
        {num}
      </span>
      <span
        className={[
          'flex-1 truncate text-[14px] tracking-tight text-bento-ink',
          active ? 'font-semibold' : 'font-medium',
        ].join(' ')}
      >
        {title}
      </span>
      <span className="w-[80px] truncate text-right font-mono text-[11px] text-bento-dim">
        {meta}
      </span>
      <span className="w-[60px] truncate text-right font-mono text-[11px] text-bento-dim">
        {trailing}
      </span>
      <span
        aria-hidden="true"
        className={[
          'w-3.5 text-center font-mono text-[10px]',
          active ? 'text-bento-accent' : 'text-transparent',
        ].join(' ')}
      >
        ↵
      </span>
    </Link>
  );
}

function RowQuery({
  active,
  num,
  icon,
  q,
  meta,
  muted,
  onPick,
}: {
  active: boolean;
  num?: string;
  icon?: string;
  q: string;
  meta?: string;
  muted?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={[
        'flex w-full items-center gap-3 border-l-2 px-6 py-2 text-left',
        active
          ? 'border-bento-accent bg-bento-ink/5 dark:bg-white/5'
          : 'border-transparent hover:bg-bento-ink/[0.03] dark:hover:bg-white/[0.03]',
      ].join(' ')}
    >
      <span aria-hidden="true" className="w-6 font-mono text-[11px] text-bento-dim">
        {icon || num}
      </span>
      <span
        className={[
          'flex-1 font-mono text-[13px] font-medium',
          muted ? 'text-bento-dim' : 'text-bento-ink',
        ].join(' ')}
      >
        {q}
      </span>
      {meta && (
        <span className="font-mono text-[11px] text-bento-dim">{meta}</span>
      )}
      <span aria-hidden="true" className="w-3.5" />
    </button>
  );
}

function FooterKey({
  keys,
  children,
}: {
  keys: string[];
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex gap-0.5">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="min-w-[16px] rounded-[3px] border border-bento-ink/10 bg-bento-card px-1.5 py-0 text-center font-mono text-[10px] font-semibold text-bento-ink dark:border-white/10"
          >
            {k}
          </kbd>
        ))}
      </span>
      <span>{children}</span>
    </span>
  );
}

function highlight(text: string, q: string): React.ReactNode {
  if (!q.trim()) return text;
  const lowered = text.toLowerCase();
  const i = lowered.indexOf(q.toLowerCase());
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <span className="rounded-sm bg-bento-accent/20 px-0.5 text-bento-ink">
        {text.slice(i, i + q.length)}
      </span>
      {text.slice(i + q.length)}
    </>
  );
}
```

- [ ] **Step 2: 타입 검사**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력. 에러 시 quote + BLOCKED.

- [ ] **Step 3: 빌드 통과 확인**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공.

- [ ] **Step 4: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add components/command-k.tsx && git commit -m "$(cat <<'EOF'
feat(cmdk): CommandK 모달 컴포넌트 — Bento 스타일 ⌘K 검색

* 모달 셸: 모노크롬 미니멀, 상단 prompt + esc, 하단 kbd hint + indexed count
* 빈 상태: recently viewed (5) + popular this week (5) + your history (5)
* 검색 상태: MiniSearch 기반 article (top 6) + tag (top 4) 결과
* 키보드 nav: ↑↓ Enter Esc, 활성 row 는 left-border accent
* highlight: 매치 부분 bg-bento-accent/20
* 기존 SearchDialog 의 MiniSearch 셋업(boost/fuzzy/prefix) 그대로 재사용
* localStorage 헬퍼는 lib/cmdk-storage.ts 에서 import (Task 1)
* 헤더의 SearchDialog 교체는 Task 3, article 페이지 recordView 는 Task 4

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Header 의 SearchDialog → CommandK 교체

**Files:**
- Modify: `components/site-header.tsx`

⚠️ **이 task 는 SearchDialog import + JSX 호출 1쌍만 교체. 다른 변경 금지.**

- [ ] **Step 1: 현재 import 및 호출 위치 확인**

```bash
grep -n "SearchDialog" /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/components/site-header.tsx
```

기대 결과: 2개 라인 (import 1개 + JSX 호출 1개).

- [ ] **Step 2: import 라인 교체**

`components/site-header.tsx` 에서:

기존:
```ts
import { SearchDialog } from '@/components/search-dialog';
```

변경:
```ts
import { CommandK } from '@/components/command-k';
```

- [ ] **Step 3: JSX 호출 교체**

기존:
```tsx
<SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
```

변경:
```tsx
<CommandK open={searchOpen} onClose={() => setSearchOpen(false)} />
```

(prop 시그니처가 다름 — `onOpenChange` 가 boolean 받는 것에서 `onClose` 가 무인자로 변경)

- [ ] **Step 4: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공.

- [ ] **Step 5: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add components/site-header.tsx && git commit -m "$(cat <<'EOF'
feat(cmdk): Header 의 SearchDialog 를 CommandK 로 교체

* import: SearchDialog → CommandK
* JSX: <SearchDialog onOpenChange={setSearchOpen}> → <CommandK onClose={() => setSearchOpen(false)}>
* 검색 트리거 button(⌘K kbd 포함) 은 그대로, 모달만 새 CommandK 가 처리
* 기존 search-dialog.tsx 파일은 sub-project #9 정리 단계까지 유지 (rollback 안전망)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Article 페이지의 recordView 호출

**Files:**
- Create: `components/article/record-view.tsx`
- Modify: `app/[slug]/page.tsx`

⚠️ **신규 1개 파일 생성 + `app/[slug]/page.tsx` 1군데 추가만. 다른 변경 금지.**

- [ ] **Step 1: 신규 client 컴포넌트 생성**

`components/article/record-view.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { recordView } from '@/lib/cmdk-storage';

type Props = {
  slug: string;       // URL slug (title only, no category prefix)
  title: string;
  category: string;
  date: string;       // formatted yyyy.MM.dd
};

export function RecordView({ slug, title, category, date }: Props) {
  useEffect(() => {
    recordView({ slug, title, category, date });
  }, [slug, title, category, date]);

  return null;
}
```

- [ ] **Step 2: `app/[slug]/page.tsx` 의 article render JSX 안에 RecordView 추가**

먼저 현재 `app/[slug]/page.tsx` 파일을 Read 해서 article 정보 (`article.frontmatter.title`, `manifestArticle.category`, `article.frontmatter.date`) 가 사용되는 위치 확인. 그 다음:

`app/[slug]/page.tsx` 의 import 영역 마지막에 추가:

```ts
import { RecordView } from '@/components/article/record-view';
```

그리고 return JSX 의 가장 첫 element 바로 안에 다음을 삽입 (예: `<div className="container ..."> <header ...>` 이전):

```tsx
<RecordView
  slug={decodedSlug}
  title={article.frontmatter.title}
  category={manifestArticle?.category || ''}
  date={article.frontmatter.date}
/>
```

⚠️ `decodedSlug` 는 이미 page 함수 내에서 `decodeURIComponent(resolvedParams.slug)` 로 정의되어 있음. `article.frontmatter.title`, `article.frontmatter.date` 도 이미 사용 중. `manifestArticle.category` 는 page 내에서 가져옴.

⚠️ `RecordView` 는 client 컴포넌트인데 server 컴포넌트인 page 안에서 호출하는 것은 OK (Next.js App Router 의 server-into-client composition).

⚠️ `date` 는 `formatDate` 로 가공된 문자열 형태가 적합. 하지만 page.tsx 가 이미 `formatDate(article.frontmatter.date)` 를 import 해서 사용 중인지 확인. 사용 중이면 그 결과를 prop 으로 넘기고, 아니면 raw ISO 그대로 넘긴다 (storage 에는 어떤 형식이든 저장됨, 표시 시 일관성만 유지하면 됨).

- [ ] **Step 3: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공.

- [ ] **Step 4: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add components/article/record-view.tsx app/[slug]/page.tsx && git commit -m "$(cat <<'EOF'
feat(cmdk): Article 페이지 mount 시 recordView 호출 추가

* 신규 client 컴포넌트 components/article/record-view.tsx (return null)
* app/[slug]/page.tsx 가 RecordView 를 렌더 — slug/title/category/date 전달
* 사용자가 article 을 보면 cmdk:recently_viewed localStorage 에 누적
* 다음 ⌘K 모달 빈 상태에 'recently viewed' 섹션으로 노출

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: 회귀 검증

**Files:** (변경 없음)

코드 변경 + 커밋 없음. 검증만.

- [ ] **Step 1: 타입 검사 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력.

- [ ] **Step 2: 프로덕션 빌드 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. 모든 기존 라우트 정상 생성.

- [ ] **Step 3: 컨트롤러 시각 + 동작 확인 (subagent SKIP, controller 진행)**

`npm run dev` 후 확인 사항:
- `http://localhost:3000/` 에서 헤더 Search 버튼 클릭 → 새 CommandK 모달 열림 (모노크롬 미니멀, prompt `›` + 입력란 + esc 버튼)
- ⌘K (Mac) / Ctrl+K (Win/Linux) 단축키도 동작
- 빈 상태 (검색어 없음): popular this week 5개 (kubernetes/terraform/goroutine/jpa n+1/spring boot) 표시
- 입력란에 "kubernetes" 입력 → 인덱스 로드 후 articles 결과 + tags 결과 (있으면) 노출, 매치 부분 highlight 됨
- ↑↓ 키로 활성 row 이동 (좌측 border-accent + 우측 ↵ 표시)
- Enter 로 article 선택 → 해당 article 페이지로 이동, 모달 닫힘
- Article 방문 후 다시 ⌘K → recently viewed 섹션에 방금 본 글이 1번으로 노출
- 검색 쿼리 확정 (Enter 후 다시 ⌘K) → your history 섹션에 검색어 노출, "clear" 버튼으로 비울 수 있음
- Esc 또는 모달 외부 클릭 → 닫힘
- 다크 모드 토글 후 동일 동작 확인 (배경 어두워지고 텍스트 밝아짐)
- footer: `↑↓ navigate` `↵ open` `esc close` kbd hint + `● indexed · {N} posts` 카운트
- 모바일 (<768px): 모달이 전체 화면 차지, 입력 + 결과 영역 + esc 정상 동작

- [ ] **Step 4: 브랜치 상태 확인**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git log --oneline feature/redesign-bento ^main | head -20
```

기대: sub-project #1 의 10 커밋 + #2 의 4 커밋 + #3 의 4~5 커밋 = 약 18~19 커밋.

---

## Self-Review Notes

### Spec coverage (§6)

- §6.1 재사용: MiniSearch + `/search-index.json` + 셋업(boost/fuzzy/prefix) → Task 2 의 useEffect 안에서 정확히 동일 셋업
- §6.2 신규 UI: 상단/본문/footer 구성 → Task 2 모달 마크업
- §6.3 localStorage: cmdk:recently_viewed, cmdk:history, popular curation → Task 1 (helpers + config) + Task 2 (consumption)
- §6.4 키보드 nav: ↑↓ Enter Esc → Task 2 keyboard handler
- §6.5 결과 highlight: bg-bento-accent/20, ∅ no-result → Task 2 의 highlight 함수 + SearchResults
- §6.6 컴포넌트 위치: command-k.tsx / cmdk-storage.ts / popular-searches.ts / Header swap / article recordView → Task 1~4 모두 커버
- §6.7 모바일: inset-0 전체 화면, 키보드 hint footer → Task 2 마크업

### Placeholder scan
TBD/TODO 없음. 모든 코드 스니펫 완성형.

### Type consistency
- `RecentItem` 타입 정의는 `lib/cmdk-storage.ts` 한 곳, 다른 모듈에서 `import type` 으로만 참조
- `SearchDocument` 타입은 CommandK 내부 정의 — 다른 모듈에서 사용 안 함
- `Row` 유니온 타입은 CommandK 내부 정의 — 다른 모듈에서 사용 안 함
- 함수 시그니처: `recordView(item: RecentItem)`, `recordSearch(q: string)`, `clearHistory()`, `getRecentlyViewed()`, `getHistory()` — Task 1 정의 후 Task 2/4 에서 동일하게 참조

### 외부 의존성 사전 검증
- `minisearch` ^7.2.0 — 이미 package.json 에 있음 ✓
- `next/navigation` `useRouter` — Next 16 기본 ✓
- 검색 인덱스 `/public/search-index.json` — 빌드 시 generate-search-index.ts 가 생성, 셰이프 검증 완료 (id/slug/title/excerpt/content/category/tags/date) ✓
- `@/components/...` alias — tsconfig.json paths 에 설정됨 ✓

### Decoupling
- `lib/cmdk-storage.ts` 는 React/Next 의존 없음 — 단위 함수로 어디서든 사용 가능
- `config/popular-searches.ts` 는 정적 데이터 — 분석 연동 없음 (YAGNI)
- `components/article/record-view.tsx` 는 전적으로 client-side, return null — Article 페이지의 SEO/SSR 영향 없음
- `components/search-dialog.tsx` 는 그대로 유지 (sub-project #9 cleanup 까지) — rollback 안전망

### Risks 및 완화
- **MiniSearch 인덱스 로드 실패**: 콘솔 경고만, 모달은 "검색 인덱스를 불러오는 중…" 표시 후 빈 결과. UI 깨지지 않음.
- **localStorage quota/비활성**: 모든 read/write 가 try/catch 로 silent fail. 모달은 빈 배열로 동작.
- **Korean tag URL**: `encodeURIComponent` 으로 인코딩. sub-project #8 까지는 `/tags/[name]` 라우트가 없어 임시 404 — 의도된 상태.
- **Article URL slug 매칭**: `urlSlug()` 가 search index 의 full slug 에서 마지막 segment 추출, `encodeURIComponent` 으로 한글 안전 처리.
- **Hydration**: 모달은 `if (!open) return null` 로 닫힌 상태에선 DOM 미존재 — hydration mismatch 위험 없음.
