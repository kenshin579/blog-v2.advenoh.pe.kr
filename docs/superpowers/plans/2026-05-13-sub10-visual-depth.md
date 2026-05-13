# Sub-project #10: 시각 깊이 강화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** prototype 대비 누락된 시각 깊이 항목을 일괄 강화. Breadcrumb 내비게이션, 카테고리/태그/시리즈 detail 페이지의 풍부한 Hero + 사이드바 + variable col-span Bento 그리드 + 시리즈 timeline + Other 섹션 추가.

**Architecture:** 신규 공통 `Breadcrumb` 컴포넌트 + 3개 detail 페이지(category, series, tag) 의 페이지 파일 풍부화. 데이터 모델 변경 없이 manifest 의 기존 필드(excerpt, tags, seriesOrder)만 활용. 시리즈 progress 도넛 차트 같은 미보유 데이터 시각화는 보유 데이터로 대체 (편수 표기, blurb 는 시리즈 첫 글 excerpt 자동 추출). 변경되지 않는 카드/리스트 컴포넌트는 그대로 둔다.

**Tech Stack:** Next.js 16 App Router (server components), Tailwind (`bento-*` 토큰), 기존 `lib/articles.ts` 함수만 재사용 (manifest 스키마 변경 없음).

**브랜치:** `feature/redesign-bento` 위에서 누적.

**참고 문서:**
- prototype: `docs/design/blog-v3-bento/app/category/[name]/page.tsx`, `app/series/[slug]/page.tsx`, `app/tags/[name]/page.tsx`
- 비교 결과: 사용자 요청에 따라 prototype 의 시각 깊이를 현실 데이터 모델 안에서 최대한 따라간다.

---

## Files Touched

### Task 1 — Breadcrumb 공통 컴포넌트
- Create: `components/breadcrumb.tsx`
- Modify: `app/category/[name]/page.tsx` (Breadcrumb 추가)
- Modify: `app/series/[slug]/page.tsx` (Breadcrumb 추가)
- Modify: `app/tags/[name]/page.tsx` (Breadcrumb 추가)

### Task 2 — 카테고리 페이지 풍부화
- Modify: `app/category/[name]/page.tsx` — 2-col Hero (dark + cream 사이드바) + variable col-span grid + 카드 메타

### Task 3 — 시리즈 detail 풍부화
- Modify: `app/series/[slug]/page.tsx` — 2-col Hero (lavender + 우측 mini 카드) + timeline + Other series

### Task 4 — 태그 detail 풍부화
- Modify: `app/tags/[name]/page.tsx` — 2-col Hero (dark + Related tags 사이드바)

### Task 5 — 검증

---

## Design Decisions

### 1. Breadcrumb 컴포넌트 형식
- `items: { label: string; href?: string }[]`
- 마지막 항목은 `href` 없음 (현재 페이지). 텍스트 색 `text-bento-accent`.
- 중간 항목들은 `<Link>` (text-bento-dim, hover accent).
- 구분자 `/` (회색 small)

### 2. 데이터 모델 변경 없음
- 시리즈 blurb: 시리즈의 첫 글(seriesOrder asc 정렬 후 첫 글) 의 excerpt 사용. 자동.
- 시리즈 progress: prototype 의 도넛 차트는 done/planned 데이터가 필요한데 우리 manifest 엔 없음. 대체: 단순 "{N}편" 큰 숫자 + "전체 발행" 라벨.
- "Other series": 알파벳 정렬 후 현재 시리즈 제외 첫 3개. 진행 바 대신 편수 표기.
- "Other categories": 카운트 desc 정렬 후 현재 카테고리 제외 모두 (sidebar 칩들).
- "Related tags": 카운트 desc 정렬 후 현재 태그 제외 상위 12개.

### 3. Variable col-span Bento 패턴 (카테고리 페이지)
prototype 그대로:
- i=0: col-span-12 (dark featured, 가장 최근 글)
- i%3=1: col-span-7
- i%3=2: col-span-5
- i%3=0 (i≠0): col-span-4

이 패턴 → col-7+col-5 한 줄 + col-4×3 한 줄 반복.

### 4. 카드 메타 (카테고리/태그 detail)
- 현재: date + category(또는 #tag) 만 표시
- 강화: category · date + 태그 칩 (최대 2개) + (manifest 에서 가능하다면) tag 개수
- readTime 은 manifest 에 없음 → 생략

### 5. 시리즈 timeline 단순화
prototype 은 done/next/planned 3가지 상태 + 연결선 + 상태 뱃지. 우리는 모두 발행됐다고 가정 → 단순화:
- 모든 에피소드를 동일 스타일 (number ink bg + 흰 글자)
- 에피소드 사이 vertical 연결선 (ink/10)
- 상태 뱃지 없음
- card bg = `bg-bento-card` (border 있음)

### 6. CTA "처음부터 읽기 →"
시리즈 첫 글로 이동. 시리즈 detail Hero 의 좌측 하단에 배치. accent 캡슐.

### 7. 태그 detail Hero
prototype 의 `#태그` 큰 사이즈 그대로. # 만 accent 색.

---

## Tailwind Dynamic-Class Note

variable col-span 매핑 — 정적 문자열 분기 (i % 3) 이라 Tailwind purge 안전.

---

### Task 1: Breadcrumb 공통 컴포넌트 + 3개 detail 페이지 적용

**Files:**
- Create: `components/breadcrumb.tsx`
- Modify: `app/category/[name]/page.tsx`
- Modify: `app/series/[slug]/page.tsx`
- Modify: `app/tags/[name]/page.tsx`

⚠️ Breadcrumb 추가만. 다른 시각 변경은 Task 2~4 영역.

- [ ] **Step 1: `components/breadcrumb.tsx` 생성**

```tsx
import Link from 'next/link';

type Item = {
  label: string;
  href?: string;
};

type Props = {
  items: Item[];
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export function Breadcrumb({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-canvas px-6 pb-4 pt-2 text-xs md:px-10">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-bento-dim">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${i}-${item.label}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={['text-bento-dim no-underline hover:text-bento-ink transition', FOCUS_RING].join(' ')}
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-bento-accent' : 'text-bento-dim'}>
                  {item.label}
                </span>
              )}
              {!isLast && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 2: 카테고리 페이지에 Breadcrumb 추가**

`app/category/[name]/page.tsx` 의 imports 영역에 추가:

```ts
import { Breadcrumb } from '@/components/breadcrumb';
```

`<main>` 의 `<header>` 바로 위에 Breadcrumb 삽입:

```tsx
<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Posts', href: '/posts' },
    { label: matchedCategory },
  ]}
/>
```

- [ ] **Step 3: 시리즈 detail 페이지에 Breadcrumb 추가**

`app/series/[slug]/page.tsx` 의 imports 영역에 추가:

```ts
import { Breadcrumb } from '@/components/breadcrumb';
```

`<main>` 의 첫 `<section>` 바로 위에 삽입:

```tsx
<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Series', href: '/series' },
    { label: matched },
  ]}
/>
```

- [ ] **Step 4: 태그 detail 페이지에 Breadcrumb 추가**

`app/tags/[name]/page.tsx` 의 imports 영역에 추가:

```ts
import { Breadcrumb } from '@/components/breadcrumb';
```

`<main>` 의 `<header>` 바로 위에 삽입:

```tsx
<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Tags', href: '/tags' },
    { label: `#${decoded}` },
  ]}
/>
```

- [ ] **Step 5: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공.

- [ ] **Step 6: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add components/breadcrumb.tsx "app/category/[name]/page.tsx" "app/series/[slug]/page.tsx" "app/tags/[name]/page.tsx" && git commit -m "$(cat <<'EOF'
feat(nav): Breadcrumb 공통 컴포넌트 + 3개 detail 페이지 적용

* components/breadcrumb.tsx 신규 — items prop 으로 Home / section / current 패턴
* 마지막 항목은 text-bento-accent + 미링크, 중간 항목은 text-bento-dim + 호버 ink
* category/series detail/tag detail 모든 페이지에 Home / 섹션 / 현재 트레일 표시
* a11y: nav aria-label="Breadcrumb", 마지막 항목 자동 강조

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: 카테고리 페이지 풍부화

**Files:**
- Modify: `app/category/[name]/page.tsx`

⚠️ Breadcrumb 는 Task 1 에서 추가됨. 본 task 는 Hero + grid 풍부화.

- [ ] **Step 1: `app/category/[name]/page.tsx` 전면 재작성**

Task 1 이 적용된 후의 상태에서, 전체 내용을 다음으로 덮어쓴다:

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getAllArticles,
  getArticlesByCategory,
  getArticleTitleFromSlug,
} from '@/lib/articles';
import { formatDate } from '@/lib/utils';
import { Breadcrumb } from '@/components/breadcrumb';
import { categorySlug } from '@/lib/url';

interface PageProps {
  params: Promise<{ name: string }>;
}

export const dynamicParams = false;

const TINTS = ['bg-bento-sage', 'bg-bento-butter', 'bg-bento-rose', 'bg-bento-lavender'] as const;

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export async function generateStaticParams() {
  const all = await getAllArticles();
  const cats = Array.from(new Set(all.map((a) => a.category.toLowerCase())));
  return cats.map((name) => ({ name }));
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const displayName = decoded.charAt(0).toUpperCase() + decoded.slice(1);
  return {
    title: `${displayName} | Frank's IT Blog`,
    description: `${displayName} 카테고리 글 모음`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { name } = await params;
  const decoded = decodeURIComponent(name).toLowerCase();

  const all = await getAllArticles();
  const matchedCategory = all.find(
    (a) => a.category.toLowerCase() === decoded,
  )?.category;
  if (!matchedCategory) notFound();

  const articles = (await getArticlesByCategory(matchedCategory)).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  if (articles.length === 0) notFound();

  // Aggregate other categories with counts
  const countByCat = new Map<string, number>();
  for (const a of all) countByCat.set(a.category, (countByCat.get(a.category) ?? 0) + 1);
  const otherCats = Array.from(countByCat.entries())
    .filter(([cat]) => cat !== matchedCategory)
    .map(([cat, count]) => ({ name: cat, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Posts', href: '/posts' },
          { label: matchedCategory },
        ]}
      />

      {/* Hero: 2-col (dark + cream sidebar) */}
      <section className="mx-auto grid max-w-canvas grid-cols-12 gap-4 px-6 md:px-10">
        <div className="relative col-span-12 overflow-hidden rounded-card-xl bg-bento-hero-dark p-8 text-white md:col-span-8 md:p-12">
          <div
            aria-hidden="true"
            className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-55"
            style={{ background: 'radial-gradient(circle, rgb(var(--bento-accent)) 0%, transparent 70%)' }}
          />
          <div className="relative">
            <p className="text-[12px] uppercase tracking-[0.12em] text-white/70">Category</p>
            <div className="my-4 text-[56px] font-bold capitalize leading-[0.95] tracking-tightest md:text-[88px]">
              {matchedCategory}.
            </div>
            <div className="flex gap-6 text-xs text-white/70">
              <span><strong className="text-base text-white">{articles.length}</strong> 편</span>
            </div>
          </div>
        </div>

        <aside className="col-span-12 rounded-card-lg bg-bento-cream p-5 md:col-span-4">
          <div className="mb-3 text-[11px] uppercase tracking-wider text-bento-dim">
            Other categories
          </div>
          <div className="flex flex-wrap gap-2">
            {otherCats.map((c) => (
              <Link
                key={c.name}
                href={`/category/${encodeURIComponent(categorySlug(c.name))}`}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full bg-bento-card px-3.5 py-2 text-[13px] text-bento-ink no-underline',
                  FOCUS_RING,
                ].join(' ')}
              >
                <span className="capitalize">{c.name}</span>
                <span className="text-[11px] text-bento-dim">{c.count}</span>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      {/* Article Bento grid (variable col-span) */}
      <section className="mx-auto mt-8 grid max-w-canvas grid-cols-12 gap-3 px-6 md:gap-4 md:px-10">
        {articles.map((a, i) => {
          const isFirst = i === 0;
          const colSpan = isFirst
            ? 'col-span-12'
            : i % 3 === 1
              ? 'col-span-12 md:col-span-7'
              : i % 3 === 2
                ? 'col-span-12 md:col-span-5'
                : 'col-span-6 md:col-span-4';
          const bg = isFirst
            ? 'bg-bento-hero-dark text-white'
            : `${TINTS[i % TINTS.length]} text-bento-ink`;
          const minH = isFirst ? 'min-h-[220px] md:min-h-[260px]' : 'min-h-[160px] md:min-h-[200px]';
          const dimColor = isFirst ? 'text-white/60' : 'text-bento-dim';
          return (
            <Link
              key={a.slug}
              href={`/${encodeURIComponent(getArticleTitleFromSlug(a.slug))}`}
              className={[
                'flex flex-col justify-between rounded-card-lg p-5 no-underline md:p-6',
                colSpan,
                bg,
                minH,
                FOCUS_RING,
              ].join(' ')}
            >
              <div>
                <div className={['mb-2 text-[10px] uppercase tracking-wider', dimColor].join(' ')}>
                  <span className="capitalize">{a.category}</span> · {formatDate(a.date)}
                </div>
                <h3
                  className={[
                    'font-bold leading-tight tracking-tighter',
                    isFirst ? 'text-2xl md:text-3xl' : 'text-base md:text-lg',
                  ].join(' ')}
                >
                  {a.title}
                </h3>
                {isFirst && a.excerpt && (
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">{a.excerpt}</p>
                )}
              </div>
              {a.tags && a.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {a.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className={[
                        'rounded-full px-2 py-0.5 text-[10px]',
                        isFirst ? 'bg-white/10 text-white/85' : 'bg-bento-ink/[0.06] text-bento-ink',
                      ].join(' ')}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </section>
    </main>
  );
}
```

⚠️ 변경 노트:
- imports 에 `Breadcrumb`, `categorySlug` 추가
- 톤 4번째에 `cream` 대신 `lavender` 사용 (cream 은 배경과 차이 약함 — sub#6 시각 확인 단계에서 발견)
- Hero 2-col (8/4), 모바일 stack
- variable col-span: 첫 글 col-12 + i%3 패턴
- 카드에 태그 칩 (최대 2개)

- [ ] **Step 2: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공.

- [ ] **Step 3: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add "app/category/[name]/page.tsx" && git commit -m "$(cat <<'EOF'
feat(category): 페이지 풍부화 — 2-col Hero + Other categories 사이드바 + variable col-span grid + 태그 칩

* Hero 8/4 grid: 좌측 dark hero (text-88px 카테고리명 + accent radial) / 우측 cream "Other categories" 사이드바
* Article grid variable col-span: 첫 글 col-12 dark featured, 나머지 col-7/col-5/col-4 cycling (prototype 패턴)
* 4가지 톤 순환에서 cream → lavender 교체 (sub#6 시각 검토에서 cream 이 bg 와 구분 약함 발견)
* 각 카드에 카테고리 · 날짜 + 태그 칩 (최대 2개) 메타라인
* readTime 은 manifest 에 없어 생략

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 시리즈 detail 풍부화

**Files:**
- Modify: `app/series/[slug]/page.tsx`

⚠️ Breadcrumb 는 Task 1 에서 추가됨.

- [ ] **Step 1: `app/series/[slug]/page.tsx` 전면 재작성**

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getAllSeries,
  getArticlesBySeries,
  getArticleTitleFromSlug,
} from '@/lib/articles';
import { seriesSlug } from '@/lib/url';
import { formatDate } from '@/lib/utils';
import { Breadcrumb } from '@/components/breadcrumb';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

const OTHER_TINTS = ['bg-bento-sage', 'bg-bento-rose', 'bg-bento-butter'] as const;

export async function generateStaticParams() {
  const names = await getAllSeries();
  return names.map((name) => ({ slug: seriesSlug(name) }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const names = await getAllSeries();
  const matched = names.find((n) => seriesSlug(n) === decoded);
  if (!matched) return { title: '시리즈를 찾을 수 없습니다' };
  return {
    title: `${matched} | Frank's IT Blog`,
    description: `${matched} 시리즈 — 에피소드 모음`,
  };
}

export default async function SeriesDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const names = await getAllSeries();
  const matched = names.find((n) => seriesSlug(n) === decoded);
  if (!matched) notFound();

  const eps = await getArticlesBySeries(matched);
  const sorted = eps.slice().sort((a, b) => {
    const ao = a.seriesOrder ?? Number.POSITIVE_INFINITY;
    const bo = b.seriesOrder ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  if (sorted.length === 0) notFound();

  const firstEpisode = sorted[0];
  const blurb = firstEpisode.excerpt || '';

  // Other series (alphabetical, exclude current, take 3)
  const others = await Promise.all(
    names
      .filter((n) => n !== matched)
      .sort((a, b) => a.localeCompare(b, 'ko'))
      .slice(0, 3)
      .map(async (name) => {
        const list = await getArticlesBySeries(name);
        return { name, count: list.length, slug: seriesSlug(name) };
      }),
  );

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Series', href: '/series' },
          { label: matched },
        ]}
      />

      {/* Hero: 2-col (lavender main + butter mini card) */}
      <section className="mx-auto max-w-canvas px-6 md:px-10">
        <div className="grid grid-cols-12 gap-4 rounded-card-xl bg-bento-lavender p-6 text-bento-ink md:p-10">
          <div className="col-span-12 md:col-span-8">
            <p className="text-[12px] uppercase tracking-[0.12em] opacity-60">Series</p>
            <h1 className="my-4 text-4xl font-bold leading-[1.05] tracking-tightest md:text-6xl">
              {matched}.
            </h1>
            {blurb && (
              <p className="mb-7 max-w-xl text-base leading-relaxed opacity-75 md:text-lg">
                {blurb}
              </p>
            )}
            <Link
              href={`/${encodeURIComponent(getArticleTitleFromSlug(firstEpisode.slug))}`}
              className={[
                'inline-flex items-center gap-2 rounded-full bg-bento-ink px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-bento-ink/90',
                FOCUS_RING,
              ].join(' ')}
            >
              처음부터 읽기
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <aside className="col-span-12 rounded-card-lg bg-white/50 p-6 text-center md:col-span-4">
            <div className="text-[11px] uppercase tracking-wider text-bento-dim">전체</div>
            <div className="mt-2 text-6xl font-bold leading-none tracking-tightest md:text-7xl">
              {sorted.length}
            </div>
            <div className="mt-2 text-sm text-bento-dim">편 발행</div>
            <div className="mt-4 border-t border-bento-ink/10 pt-3 text-xs text-bento-dim">
              <div className="uppercase tracking-wider">최신</div>
              <div className="mt-1 line-clamp-1 font-medium text-bento-ink">{sorted[sorted.length - 1].title}</div>
              <div className="mt-1 text-[11px]">{formatDate(sorted[sorted.length - 1].date)}</div>
            </div>
          </aside>
        </div>
      </section>

      {/* Episodes timeline */}
      <section className="mx-auto mt-12 max-w-3xl px-6 md:px-0">
        <h2 className="mb-5 text-2xl font-bold tracking-tighter text-bento-ink md:text-3xl">편별 목록</h2>
        <ol className="flex flex-col">
          {sorted.map((ep, i) => {
            const epNum = ep.seriesOrder ?? i + 1;
            const isLast = i === sorted.length - 1;
            return (
              <li key={ep.slug} className="grid grid-cols-[44px_1fr] gap-5">
                <div className="flex flex-col items-center">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-bento-ink text-sm font-bold text-white">
                    {epNum}
                  </div>
                  {!isLast && (
                    <div className="my-1 min-h-[40px] w-0.5 flex-1 bg-bento-ink/10" />
                  )}
                </div>
                <Link
                  href={`/${encodeURIComponent(getArticleTitleFromSlug(ep.slug))}`}
                  className={[
                    'mb-4 block rounded-card border border-bento-ink/10 bg-bento-card p-5 no-underline transition hover:bg-bento-ink/[0.03] dark:border-white/10 dark:hover:bg-white/[0.03]',
                    FOCUS_RING,
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-bento-dim">
                    <span>EP {String(epNum).padStart(2, '0')}</span>
                    <span>·</span>
                    <span>{formatDate(ep.date)}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold tracking-tighter text-bento-ink md:text-xl">
                    {ep.title}
                  </h3>
                  {ep.excerpt && (
                    <p className="mt-2 text-sm leading-relaxed text-bento-dim line-clamp-2">{ep.excerpt}</p>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Other series */}
      {others.length > 0 && (
        <section className="mx-auto mt-16 max-w-canvas px-6 md:px-10">
          <h3 className="mb-4 text-xl font-bold tracking-tighter text-bento-ink md:text-2xl">다른 시리즈</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
            {others.map((s, i) => (
              <Link
                key={s.name}
                href={`/series/${encodeURIComponent(s.slug)}`}
                className={[
                  'flex flex-col gap-3 rounded-card-lg p-6 no-underline text-bento-ink',
                  OTHER_TINTS[i % OTHER_TINTS.length],
                  FOCUS_RING,
                ].join(' ')}
              >
                <div className="text-[11px] uppercase tracking-wider text-bento-dim opacity-80">Series</div>
                <div className="text-lg font-bold leading-snug tracking-tighter md:text-xl">{s.name}</div>
                <div className="mt-auto text-xs text-bento-dim">{s.count}편</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
```

⚠️ 변경 노트:
- imports 에 `Breadcrumb` 추가
- Hero: lavender 2-col (8/4). 좌측: 시리즈명 큰 텍스트 + blurb (첫 글 excerpt 자동) + "처음부터 읽기" CTA. 우측: white/50 mini 카드 ("N편 발행" + 최신 에피소드)
- Timeline: 번호 원 (44px col) + 연결선 + 카드 (border + bg-bento-card). 상태 뱃지 없음 (prototype 의 done/next/planned 모델 미보유)
- Other series: 3장 sage/rose/butter 톤 + 편수 (진행 바 없음)

- [ ] **Step 2: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공.

- [ ] **Step 3: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add "app/series/[slug]/page.tsx" && git commit -m "$(cat <<'EOF'
feat(series): detail 페이지 풍부화 — 2-col Hero + Timeline + 다른 시리즈

* Hero: lavender 2-col 그리드. 좌측 시리즈명 (text-6xl) + blurb (첫 글 excerpt 자동) + 처음부터 읽기 CTA
* Hero 우측 mini card: 편수 큰 숫자 + 최신 에피소드 미리보기
* Timeline 형식 에피소드 리스트: 번호 원 + vertical 연결선 + card 안에 EP NN · 날짜 + 제목 + excerpt
* 다른 시리즈 섹션 3장 (sage/rose/butter) 알파벳 순
* prototype 의 done/next/planned 상태 모델은 manifest 미보유 → 모든 에피소드 동일 스타일

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: 태그 detail 풍부화

**Files:**
- Modify: `app/tags/[name]/page.tsx`

⚠️ Breadcrumb 는 Task 1 에서 추가됨.

- [ ] **Step 1: `app/tags/[name]/page.tsx` 전면 재작성**

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getAllArticles,
  getArticlesByTag,
  getArticleTitleFromSlug,
} from '@/lib/articles';
import { PostsList } from '@/components/posts/posts-list';
import { Breadcrumb } from '@/components/breadcrumb';

interface PageProps {
  params: Promise<{ name: string }>;
}

export const dynamicParams = false;

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export async function generateStaticParams() {
  const all = await getAllArticles();
  const tags = new Set<string>();
  for (const a of all) {
    if (!a.tags) continue;
    for (const t of a.tags) tags.add(t);
  }
  return Array.from(tags).map((tag) => ({ name: tag }));
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  return {
    title: `#${decoded} | Frank's IT Blog`,
    description: `#${decoded} 태그가 붙은 글 모음`,
  };
}

export default async function TagDetailPage({ params }: PageProps) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  const matched = await getArticlesByTag(decoded);
  if (matched.length === 0) notFound();

  const sorted = matched
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const articles = sorted.map((a) => ({
    slug: getArticleTitleFromSlug(a.slug),
    title: a.title,
    category: a.category,
    date: a.date,
  }));

  // Related tags: aggregate from all articles, exclude current, top 12 by count
  const all = await getAllArticles();
  const counts = new Map<string, number>();
  for (const a of all) {
    if (!a.tags) continue;
    for (const t of a.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const related = Array.from(counts.entries())
    .filter(([t]) => t !== decoded)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Tags', href: '/tags' },
          { label: `#${decoded}` },
        ]}
      />

      {/* Hero: 2-col (dark + cream sidebar) */}
      <section className="mx-auto grid max-w-canvas grid-cols-12 gap-4 px-6 md:px-10">
        <div className="relative col-span-12 overflow-hidden rounded-card-xl bg-bento-hero-dark p-8 text-white md:col-span-8 md:p-12">
          <div
            aria-hidden="true"
            className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-55"
            style={{ background: 'radial-gradient(circle, rgb(var(--bento-accent)) 0%, transparent 70%)' }}
          />
          <div className="relative">
            <p className="text-[12px] uppercase tracking-[0.12em] text-white/70">Tag</p>
            <div className="my-4 text-[48px] font-bold leading-[0.95] tracking-tightest md:text-[80px]">
              <span className="text-bento-accent">#</span>
              {decoded}
            </div>
            <div className="flex gap-6 text-xs text-white/70">
              <span><strong className="text-base text-white">{articles.length}</strong> 편</span>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <aside className="col-span-12 rounded-card-lg bg-bento-cream p-5 md:col-span-4">
            <div className="mb-3 text-[11px] uppercase tracking-wider text-bento-dim">
              Related tags
            </div>
            <div className="flex flex-wrap gap-2">
              {related.map((t) => (
                <Link
                  key={t.tag}
                  href={`/tags/${encodeURIComponent(t.tag)}`}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-full bg-bento-card px-3.5 py-2 text-[13px] text-bento-ink no-underline',
                    FOCUS_RING,
                  ].join(' ')}
                >
                  <span className="text-bento-accent">#</span>
                  {t.tag}
                  <span className="text-[11px] text-bento-dim">{t.count}</span>
                </Link>
              ))}
            </div>
          </aside>
        )}
      </section>

      {/* Article list */}
      <section className="mx-auto mt-8 max-w-canvas px-6 md:px-10">
        <PostsList articles={articles} />
      </section>
    </main>
  );
}
```

⚠️ 변경 노트:
- imports 에 `Breadcrumb`, `Link` 추가
- Hero: 8/4 grid. 좌측 dark hero (#tag 큰 텍스트 + accent radial). 우측 cream "Related tags" sidebar (count desc 상위 12개)
- 본문 list 는 그대로 (PostsList 재사용)

- [ ] **Step 2: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공.

- [ ] **Step 3: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add "app/tags/[name]/page.tsx" && git commit -m "$(cat <<'EOF'
feat(tags): detail 페이지 풍부화 — 2-col Hero + Related tags 사이드바

* Hero 8/4 grid: 좌측 dark hero (text-80px #tag + accent radial) / 우측 cream "Related tags" 사이드바
* Related tags: 카운트 desc 상위 12개 (현재 태그 제외)
* 본문은 PostsList 그대로 (연도 그룹 compact list)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: 회귀 검증

**Files:** (변경 없음)

- [ ] **Step 1: 타입 검사 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

- [ ] **Step 2: 프로덕션 빌드 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. 페이지 수 1097 (동일).

- [ ] **Step 3: 컨트롤러 시각 확인**

`npx serve out -l 3000` 후:
- `/category/cloud/` — Breadcrumb + 큰 카테고리 hero + Other categories 사이드바 + variable col-span grid + 태그 칩
- `/series/golang-concurrency/` — Breadcrumb + 2-col Hero (이름 + blurb + CTA / 우측 mini card) + Timeline + 다른 시리즈 3장
- `/tags/kubernetes/` — Breadcrumb + dark Hero (#tag) + Related tags + 연도 그룹 list
- 다크 모드: 모든 카드 + breadcrumb 정상

- [ ] **Step 4: 브랜치 상태**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git log --oneline feature/redesign-bento ^main | wc -l
```

기대: 약 47개 (sub#1~#9 의 43 + sub#10 의 4).

---

## Self-Review Notes

### 시각 깊이 강화 항목 커버
- Breadcrumbs → Task 1 ✓
- 카테고리 Hero (큰 타이포 + 사이드바) → Task 2 ✓
- 카테고리 variable grid + 카드 태그 → Task 2 ✓
- 시리즈 detail Hero (2-col + CTA) → Task 3 ✓
- 시리즈 timeline → Task 3 ✓
- 다른 시리즈 섹션 → Task 3 ✓
- 태그 detail Hero + Related tags → Task 4 ✓

### Placeholder scan
TBD/TODO 없음.

### Type consistency
- `Breadcrumb items` 셰이프 일관
- `seriesSlug`, `categorySlug` from `lib/url.ts` 일관 사용

### 의도적 단순화
- 시리즈 progress 도넛 차트: manifest 에 done/planned 데이터 없어 "N편 발행" 큰 숫자로 대체
- 시리즈 status 뱃지 (READING/NEXT UP/planned): 미보유 데이터 → 모든 에피소드 동일 스타일
- 카드 readTime: manifest 미보유 → 카테고리 · 날짜 · 태그로 대체

### Risks 및 완화
- **Breadcrumb 와 기존 헤더 nav 중복**: 헤더는 site-wide, breadcrumb 는 위치 표시 — 표준 패턴, 중복 아님.
- **Hero 우측 사이드바 모바일 stack**: `col-span-12 md:col-span-8` + `col-span-12 md:col-span-4` 패턴 — 모바일에서 자연스럽게 stack.
- **Variable col-span 의 모바일 영향**: 모바일에서는 모두 `col-span-12` 또는 `col-span-6` 으로 처리 (1줄 또는 2줄 stack), variable 패턴은 desktop 만.
- **categories-card.tsx 의 cream lavender 변경**: 톤 순환은 `app/category/[name]/page.tsx` 안에서 정의 — 다른 페이지 (홈의 Categories card) 에는 영향 없음.
