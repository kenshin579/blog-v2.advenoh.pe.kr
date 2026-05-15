# Sub-project #4: 홈 Bento + /posts 전체 리스트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈(`/`)을 shadcn 카드 그리드에서 Bento 큐레이션 레이아웃(Featured + Series spotlight + Latest + Categories + Recent)으로 전면 교체. 전체 178편 글 브라우징은 신규 `/posts` 라우트(연도 그룹핑 compact list + 카테고리 sticky 필터 레일)로 분리.

**Architecture:** `components/home/` 아래 6개 작은 카드 컴포넌트(Headline, FeaturedCard, SeriesSpotlightCard, LatestCard, CategoriesCard, RecentCard)로 분할. `app/page.tsx`는 server component 로 articles 를 fetch 한 뒤 컴포넌트들을 조합. `/posts` 는 server component (`app/posts/page.tsx`) + client wrapper (`components/posts/posts-page-client.tsx`) 패턴으로 URL `?cat=` 필터 상태 관리. 카테고리/시리즈/태그 detail 라우트(sub-project #6/#7/#8)는 미존재 시 임시 404 허용 (의도된 상태).

**Tech Stack:** Next.js 16 App Router (server + client composition), `next/navigation` (`useSearchParams`, `useRouter`), Tailwind (`bento-*` tokens), `lib/articles.ts` 기존 함수 재사용 (`getAllArticles`, `getArticlesBySeries`).

**브랜치:** `feature/redesign-bento` 위에서 누적. main 직접 커밋 금지.

**참고 문서:**
- spec: `docs/superpowers/specs/2026-05-13-blog-v2-bento-redesign-design.md` (§7 홈 + `/posts`)
- prototype: `docs/design/blog-v3-bento/app/page.tsx`, `docs/design/blog-v3-bento/lib/articles.ts`
- 기존 home: `components/home-content.tsx` (sub-project #9 에서 삭제 예정)
- ManifestArticle 셰이프 (lib/articles.ts): `{ slug, category, title, date, excerpt?, tags?, series?, seriesOrder?, firstImage? }`

---

## Files Touched

### Task 1 — 홈 Bento
- Create: `components/home/headline.tsx` — 상단 큰 헤드라인 + 서브카피
- Create: `components/home/featured-card.tsx` — Featured (col-span-7 row-span-2, dark + accent radial)
- Create: `components/home/series-spotlight-card.tsx` — Series spotlight (col-span-5, lavender)
- Create: `components/home/latest-card.tsx` — Latest 4편 (col-span-7, accent bg)
- Create: `components/home/categories-card.tsx` — Categories chips (col-span-5, cream)
- Create: `components/home/recent-card.tsx` — Recent tinted (col-span-3, 4번 호출)
- Modify: `app/page.tsx` — 새 Bento 컴포넌트 조합으로 재작성

### Task 2 — `/posts` 전체 리스트
- Create: `components/posts/category-rail.tsx` — 좌측 sticky 카테고리 필터 레일 (모바일은 가로 chip 레일)
- Create: `components/posts/posts-list.tsx` — 우측 연도 그룹 compact list
- Create: `components/posts/posts-page-client.tsx` — client wrapper (URL `?cat=` 상태 관리)
- Create: `app/posts/page.tsx` — server component (articles fetch + client 컴포넌트 렌더)

### Task 3 — 검증 (변경 없음)

---

## Design Decisions

### 1. URL 정책
- Featured/Latest/Recent article click → `/${urlSlug}` (기존 라우팅, `getArticleTitleFromSlug` 헬퍼 사용)
- Series spotlight 카드 → `/series/${seriesSlug}` (sub-project #7 까지 임시 404)
- Categories chips → `/category/${categorySlug}` (sub-project #6 까지 임시 404)
- /posts 페이지의 카테고리 필터는 동일 페이지 내 URL `?cat=name` 으로 관리 — 라우트 이동 아님

### 2. Series spotlight 선정 로직
articles 가 발행일 desc 정렬되어 있다고 가정 → `articles.find(a => a.series)` 가 가장 최근 시리즈 글. 그 글의 series 이름으로 `getArticlesBySeries(name)` → `seriesOrder` asc 정렬 → 에피소드 리스트.

진행 상태 메타데이터가 없으므로 모든 에피소드를 동등하게 표기 (✓ 표시 없음). 부제는 "{N}편 발행" 으로 단순화.

### 3. Headline 카피 (spec §7.3)
- 메인: "Field notes from a working engineer." (영문 그대로)
- 서브: `Cloud · Java · Go · Database · {N}편 누적.`

향후 컨텐츠 톤에 따라 한국어 카피로 교체 가능 — Headline 컴포넌트의 prop 이 아니라 default value 로 시작 (간단함 우선).

### 4. 이미지 정책 (spec §7.4)
홈 모든 카드에 이미지 없음. `firstImage` 필드 사용 안 함.

### 5. Series/Category slug 함수
이미 존재하는 함수가 없으므로 컴포넌트에서 inline 변환:
- `seriesSlug(name)` = `name.toLowerCase().replace(/\s+/g, '-')`
- `categorySlug(name)` = `name.toLowerCase()` (현재 카테고리는 모두 lowercase 영문)

향후 라우트 추가 시 `lib/articles.ts` 또는 `lib/url.ts` 로 추출 가능.

### 6. /posts 의 URL 쿼리
`useSearchParams()` 로 `?cat=cloud` 읽고, 카테고리 클릭 시 `router.push('/posts?cat=cloud', { scroll: false })`. "All" 클릭 시 `router.push('/posts', { scroll: false })`. 정적 export 환경에서도 client navigation 동작.

### 7. ManifestArticle import
`lib/articles.ts` 의 `interface ManifestArticle` 는 unexport. 새 컴포넌트들은 prop 으로 필요한 필드만 받음 (decoupling). 컴포넌트 내부에서 type 을 다음과 같이 정의:

```ts
type ArticleProps = {
  slug: string;
  title: string;
  category: string;
  date: string;
  excerpt?: string;
};
```

Page 가 ManifestArticle 을 위 셰이프로 매핑해서 전달.

---

## Tailwind Dynamic-Class Note

Recent 카드의 톤(sage/butter/rose/cream)은 page 에서 정적 className 배열로 매핑하여 전달 — dynamic safelist 불필요. 카테고리 chips, year 헤더 등 다른 dynamic class 도 사용 안 함.

---

### Task 1: 홈 Bento 컴포넌트 + 페이지 재작성

**Files:**
- Create: `components/home/headline.tsx`
- Create: `components/home/featured-card.tsx`
- Create: `components/home/series-spotlight-card.tsx`
- Create: `components/home/latest-card.tsx`
- Create: `components/home/categories-card.tsx`
- Create: `components/home/recent-card.tsx`
- Modify: `app/page.tsx`

⚠️ 신규 6개 파일 + 기존 1개 파일 수정만. 다른 파일 절대 touch 금지. 특히 `components/home-content.tsx` 는 그대로 둔다 (sub-project #9 에서 삭제).

- [ ] **Step 1: `components/home/headline.tsx` 생성**

```tsx
type Props = {
  totalCount: number;
};

export function Headline({ totalCount }: Props) {
  return (
    <section className="mx-auto max-w-canvas px-6 pb-10 pt-6 md:px-10">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-bento-dim">
        Field notes from a working engineer
      </p>
      <h1 className="mt-4 text-[56px] font-bold leading-[0.95] tracking-tightest md:text-[88px]">
        Field notes <span className="headline-hi">from</span> a working engineer.
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-bento-dim md:text-lg">
        Cloud · Java · Go · Database · {totalCount}편 누적.
      </p>
    </section>
  );
}
```

- [ ] **Step 2: `components/home/featured-card.tsx` 생성**

```tsx
import Link from 'next/link';

type Props = {
  href: string;
  title: string;
  category: string;
  date: string;
  excerpt?: string;
};

export function FeaturedCard({ href, title, category, date, excerpt }: Props) {
  return (
    <Link
      href={href}
      className="relative col-span-12 row-span-1 flex min-h-[320px] flex-col justify-between overflow-hidden rounded-card-xl bg-bento-hero-dark p-8 text-white no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg md:col-span-7 md:row-span-2 md:min-h-[420px] md:p-10"
    >
      <div
        aria-hidden="true"
        className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-50"
        style={{ background: 'radial-gradient(circle, rgb(var(--bento-accent)) 0%, transparent 70%)' }}
      />
      <div className="relative">
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="rounded-full bg-bento-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
            Featured
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px]">
            {category}
          </span>
        </div>
        <h2 className="text-3xl font-bold leading-tight tracking-tighter md:text-4xl">
          {title}
        </h2>
        {excerpt && (
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75 md:text-base">
            {excerpt}
          </p>
        )}
      </div>
      <div className="relative flex items-end justify-between text-xs text-white/70">
        <span>{date}</span>
        <span aria-hidden="true">→</span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: `components/home/series-spotlight-card.tsx` 생성**

```tsx
import Link from 'next/link';

type Episode = {
  num: number;
  title: string;
  slug: string;        // URL slug (title only, no category prefix)
};

type Props = {
  seriesName: string;
  seriesHref: string;  // /series/[slug]
  episodes: Episode[];
};

export function SeriesSpotlightCard({ seriesName, seriesHref, episodes }: Props) {
  return (
    <Link
      href={seriesHref}
      className="col-span-12 flex flex-col rounded-card-xl bg-bento-lavender p-6 text-bento-ink no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg md:col-span-5 md:p-7"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.1em] opacity-60">Active Series</span>
        <span className="text-xs text-bento-dim">{episodes.length}편</span>
      </div>
      <h3 className="mb-4 text-xl font-bold tracking-tighter md:text-2xl">{seriesName}</h3>
      <ul className="flex flex-col gap-1">
        {episodes.map((ep, i) => (
          <li
            key={ep.slug}
            className={`flex items-center gap-3 py-1.5 ${i > 0 ? 'border-t border-bento-ink/10' : ''}`}
          >
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-bento-ink/10 text-[10px] font-bold text-bento-dim">
              {ep.num}
            </span>
            <span className="text-[13px] text-bento-ink line-clamp-1">
              {ep.title}
            </span>
          </li>
        ))}
      </ul>
    </Link>
  );
}
```

- [ ] **Step 4: `components/home/latest-card.tsx` 생성**

```tsx
import Link from 'next/link';

type Item = {
  slug: string;
  title: string;
  date: string;
};

type Props = {
  items: Item[];
};

export function LatestCard({ items }: Props) {
  return (
    <div className="col-span-12 rounded-card-xl bg-bento-accent p-6 text-white md:col-span-7 md:p-7">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold md:text-xl">Latest</h3>
        <span className="text-[11px] uppercase tracking-wider opacity-75">최신순</span>
      </div>
      <ul>
        {items.map((it, i) => (
          <li key={it.slug}>
            <Link
              href={`/${encodeURIComponent(it.slug)}`}
              className={`flex items-start gap-3 py-3 no-underline text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bento-accent ${
                i > 0 ? 'border-t border-white/20' : ''
              }`}
            >
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold leading-snug md:text-[15px]">{it.title}</div>
                <div className="mt-1 text-[11px] opacity-75">{it.date}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 5: `components/home/categories-card.tsx` 생성**

```tsx
import Link from 'next/link';

type CategoryEntry = {
  name: string;
  count: number;
};

type Props = {
  categories: CategoryEntry[];
};

export function CategoriesCard({ categories }: Props) {
  return (
    <div className="col-span-12 rounded-card-xl bg-bento-cream p-6 md:col-span-5 md:p-7">
      <h3 className="mb-4 text-base font-bold text-bento-ink">Browse by topic</h3>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link
            key={c.name}
            href={`/category/${encodeURIComponent(c.name.toLowerCase())}`}
            className="inline-flex items-center gap-2 rounded-full bg-bento-card px-3.5 py-2 text-[13px] text-bento-ink no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-cream"
          >
            <span className="capitalize">{c.name}</span>
            <span className="text-[11px] text-bento-dim">{c.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: `components/home/recent-card.tsx` 생성**

```tsx
import Link from 'next/link';

type Tone = 'sage' | 'butter' | 'rose' | 'cream';

const TONE_BG: Record<Tone, string> = {
  sage: 'bg-bento-sage',
  butter: 'bg-bento-butter',
  rose: 'bg-bento-rose',
  cream: 'bg-bento-cream',
};

type Props = {
  href: string;
  title: string;
  category: string;
  tone: Tone;
};

export function RecentCard({ href, title, category, tone }: Props) {
  return (
    <Link
      href={href}
      className={`col-span-6 flex min-h-[140px] flex-col justify-between rounded-card-lg p-5 text-bento-ink no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg md:col-span-3 md:min-h-[180px] ${TONE_BG[tone]}`}
    >
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-wider text-bento-dim">
          {category}
        </div>
        <h4 className="text-[14px] font-semibold leading-snug tracking-tight md:text-[15px]">
          {title}
        </h4>
      </div>
      <div className="mt-3 text-[10px] text-bento-dim" aria-hidden="true">→</div>
    </Link>
  );
}
```

- [ ] **Step 7: `app/page.tsx` 재작성**

기존 `app/page.tsx` 를 다음으로 덮어쓴다:

```tsx
import { getAllArticles, getArticlesBySeries, getArticleTitleFromSlug } from '@/lib/articles';
import { formatDate } from '@/lib/utils';
import { Headline } from '@/components/home/headline';
import { FeaturedCard } from '@/components/home/featured-card';
import { SeriesSpotlightCard } from '@/components/home/series-spotlight-card';
import { LatestCard } from '@/components/home/latest-card';
import { CategoriesCard } from '@/components/home/categories-card';
import { RecentCard } from '@/components/home/recent-card';

export const metadata = {
  title: "Frank's IT Blog",
  description: 'IT 기술 블로그 - 개발, 클라우드, 데이터베이스',
};

const RECENT_TONES = ['sage', 'butter', 'rose', 'cream'] as const;

function seriesSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export default async function HomePage() {
  const articles = await getAllArticles();
  const totalCount = articles.length;

  // Featured: most recent article
  const featured = articles[0];

  // Latest: next 4 articles
  const latest = articles.slice(1, 5);

  // Recent: 4 articles after latest
  const recent = articles.slice(5, 9);

  // Series spotlight: most recent article that has a series
  const featuredSeriesArticle = articles.find((a) => a.series);
  let spotlightEpisodes: Array<{ num: number; title: string; slug: string }> = [];
  let spotlightName = '';
  if (featuredSeriesArticle?.series) {
    spotlightName = featuredSeriesArticle.series;
    const eps = await getArticlesBySeries(spotlightName);
    spotlightEpisodes = eps
      .slice()
      .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0))
      .map((a, i) => ({
        num: a.seriesOrder ?? i + 1,
        title: a.title,
        slug: getArticleTitleFromSlug(a.slug),
      }));
  }

  // Categories aggregation (sorted by count desc)
  const categoryCounts = new Map<string, number>();
  for (const a of articles) {
    categoryCounts.set(a.category, (categoryCounts.get(a.category) ?? 0) + 1);
  }
  const categories = Array.from(categoryCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <main className="min-h-screen bg-bento-bg pb-20 pt-2">
      <Headline totalCount={totalCount} />

      <section className="mx-auto grid max-w-canvas grid-cols-12 gap-3 px-6 md:gap-4 md:px-10">
        {featured && (
          <FeaturedCard
            href={`/${encodeURIComponent(getArticleTitleFromSlug(featured.slug))}`}
            title={featured.title}
            category={featured.category}
            date={formatDate(featured.date)}
            excerpt={featured.excerpt}
          />
        )}

        {spotlightName && (
          <SeriesSpotlightCard
            seriesName={spotlightName}
            seriesHref={`/series/${encodeURIComponent(seriesSlug(spotlightName))}`}
            episodes={spotlightEpisodes}
          />
        )}

        {latest.length > 0 && (
          <LatestCard
            items={latest.map((a) => ({
              slug: getArticleTitleFromSlug(a.slug),
              title: a.title,
              date: formatDate(a.date),
            }))}
          />
        )}

        {categories.length > 0 && (
          <CategoriesCard categories={categories} />
        )}

        {recent.map((a, i) => (
          <RecentCard
            key={a.slug}
            href={`/${encodeURIComponent(getArticleTitleFromSlug(a.slug))}`}
            title={a.title}
            category={a.category}
            tone={RECENT_TONES[i % RECENT_TONES.length]}
          />
        ))}
      </section>
    </main>
  );
}
```

- [ ] **Step 8: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력. 에러 시 quote + BLOCKED.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공.

- [ ] **Step 9: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add components/home app/page.tsx && git commit -m "$(cat <<'EOF'
feat(home): Bento 레이아웃 — Featured / Series spotlight / Latest / Categories / Recent

* 신규 6개 컴포넌트: Headline, FeaturedCard, SeriesSpotlightCard, LatestCard, CategoriesCard, RecentCard (모두 components/home/)
* app/page.tsx 재작성 — server component 가 articles fetch 후 컴포넌트 조합
* Featured: articles[0] (가장 최근, dark + accent radial)
* Series spotlight: 가장 최근 시리즈 글의 시리즈 자동 선정 (seriesOrder asc 정렬)
* Latest: articles[1..4] (accent bg)
* Categories: 카운트 desc 칩 (cream bg, /category/[name] 링크 — sub#6 까지 임시 404)
* Recent: articles[5..8] (4가지 톤 순환: sage/butter/rose/cream)
* Series spotlight 카드 클릭 → /series/[slug] (sub#7 까지 임시 404)
* 이미지 없음 (Bento 미학), focus-visible ring 모든 인터랙션 요소
* components/home-content.tsx 는 sub#9 에서 삭제 — 지금은 그대로 유지

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `/posts` 전체 리스트 라우트

**Files:**
- Create: `components/posts/category-rail.tsx`
- Create: `components/posts/posts-list.tsx`
- Create: `components/posts/posts-page-client.tsx`
- Create: `app/posts/page.tsx`

⚠️ 신규 4개 파일만 생성. 다른 파일 수정 금지.

- [ ] **Step 1: `components/posts/category-rail.tsx` 생성**

```tsx
'use client';

import Link from 'next/link';

type CategoryEntry = {
  name: string;
  count: number;
};

type Props = {
  categories: CategoryEntry[];
  totalCount: number;
  selectedCategory: string | null;
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export function CategoryRail({ categories, totalCount, selectedCategory }: Props) {
  return (
    <>
      {/* Desktop sticky rail */}
      <aside className="hidden md:block">
        <div className="sticky top-24 flex flex-col gap-1">
          <CategoryItem
            href="/posts"
            name="All"
            count={totalCount}
            active={selectedCategory === null}
          />
          {categories.map((c) => (
            <CategoryItem
              key={c.name}
              href={`/posts?cat=${encodeURIComponent(c.name)}`}
              name={c.name}
              count={c.count}
              active={selectedCategory === c.name}
            />
          ))}
        </div>
      </aside>

      {/* Mobile horizontal chip rail */}
      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2 no-scrollbar md:hidden">
        <CategoryChip
          href="/posts"
          name="All"
          count={totalCount}
          active={selectedCategory === null}
        />
        {categories.map((c) => (
          <CategoryChip
            key={c.name}
            href={`/posts?cat=${encodeURIComponent(c.name)}`}
            name={c.name}
            count={c.count}
            active={selectedCategory === c.name}
          />
        ))}
      </div>
    </>
  );
}

function CategoryItem({
  href,
  name,
  count,
  active,
}: {
  href: string;
  name: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'page' : undefined}
      className={[
        'flex items-center justify-between rounded-card-sm px-3 py-2 text-sm no-underline transition',
        FOCUS_RING,
        active
          ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-ink'
          : 'text-bento-ink hover:bg-bento-ink/5 dark:text-white dark:hover:bg-white/10',
      ].join(' ')}
    >
      <span className="capitalize">{name}</span>
      <span className={['text-xs', active ? 'opacity-70' : 'text-bento-dim'].join(' ')}>
        {count}
      </span>
    </Link>
  );
}

function CategoryChip({
  href,
  name,
  count,
  active,
}: {
  href: string;
  name: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'page' : undefined}
      className={[
        'inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] no-underline transition',
        FOCUS_RING,
        active
          ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-ink'
          : 'bg-bento-ink/[0.06] text-bento-ink hover:bg-bento-ink/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15',
      ].join(' ')}
    >
      <span className="capitalize">{name}</span>
      <span className={['text-[11px]', active ? 'opacity-70' : 'text-bento-dim'].join(' ')}>
        {count}
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: `components/posts/posts-list.tsx` 생성**

```tsx
import Link from 'next/link';

type Article = {
  slug: string;     // URL slug (title only)
  title: string;
  category: string;
  date: string;     // ISO format
};

type Props = {
  articles: Article[];
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

function yearOf(iso: string): number {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? 0 : d.getFullYear();
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function PostsList({ articles }: Props) {
  if (articles.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-bento-dim">
        해당 카테고리에 글이 없습니다.
      </div>
    );
  }

  // Group by year (descending)
  const byYear = new Map<number, Article[]>();
  for (const a of articles) {
    const y = yearOf(a.date);
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(a);
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b - a);

  return (
    <div className="flex flex-col gap-10">
      {years.map((year) => (
        <section key={year}>
          <h2 className="mb-3 font-mono text-lg font-bold tracking-tight text-bento-ink">
            {year}
          </h2>
          <ul className="flex flex-col">
            {byYear.get(year)!.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/${encodeURIComponent(a.slug)}`}
                  className={[
                    'group grid grid-cols-[44px_72px_1fr] items-baseline gap-3 rounded-card-sm px-2 py-2.5 no-underline text-bento-ink transition hover:bg-bento-ink/[0.04] dark:hover:bg-white/[0.04]',
                    FOCUS_RING,
                  ].join(' ')}
                >
                  <span className="font-mono text-[12px] text-bento-dim">
                    {shortDate(a.date)}
                  </span>
                  <span className="truncate text-[11px] uppercase tracking-wider text-bento-dim">
                    {a.category}
                  </span>
                  <span className="truncate text-[14px] font-medium tracking-tight group-hover:text-bento-accent">
                    {a.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: `components/posts/posts-page-client.tsx` 생성**

```tsx
'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { CategoryRail } from './category-rail';
import { PostsList } from './posts-list';

type Article = {
  slug: string;
  title: string;
  category: string;
  date: string;
};

type CategoryEntry = {
  name: string;
  count: number;
};

type Props = {
  articles: Article[];
  categories: CategoryEntry[];
};

export function PostsPageClient({ articles, categories }: Props) {
  const params = useSearchParams();
  const cat = params.get('cat');
  const selectedCategory = cat && cat.trim() ? cat : null;

  const filtered = useMemo(() => {
    if (!selectedCategory) return articles;
    return articles.filter((a) => a.category === selectedCategory);
  }, [articles, selectedCategory]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr] md:gap-10">
      <CategoryRail
        categories={categories}
        totalCount={articles.length}
        selectedCategory={selectedCategory}
      />
      <div>
        {selectedCategory && (
          <p className="mb-4 text-sm text-bento-dim">
            <span className="capitalize">{selectedCategory}</span> · {filtered.length}편
          </p>
        )}
        <PostsList articles={filtered} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `app/posts/page.tsx` 생성**

```tsx
import { Suspense } from 'react';
import { getAllArticles, getArticleTitleFromSlug } from '@/lib/articles';
import { PostsPageClient } from '@/components/posts/posts-page-client';

export const metadata = {
  title: '전체 글',
  description: '발행된 모든 글 — 연도별, 카테고리 필터 지원',
};

export default async function PostsPage() {
  const all = await getAllArticles();
  const articles = all.map((a) => ({
    slug: getArticleTitleFromSlug(a.slug),
    title: a.title,
    category: a.category,
    date: a.date,
  }));

  // Categories aggregation (count desc)
  const categoryCounts = new Map<string, number>();
  for (const a of all) {
    categoryCounts.set(a.category, (categoryCounts.get(a.category) ?? 0) + 1);
  }
  const categories = Array.from(categoryCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <div className="mx-auto max-w-canvas px-6 pt-8 md:px-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tighter text-bento-ink md:text-4xl">
            전체 글
          </h1>
          <p className="mt-2 text-sm text-bento-dim">
            {articles.length}편 · 카테고리로 필터링하여 둘러보세요
          </p>
        </header>

        <Suspense fallback={<div className="py-20 text-center text-sm text-bento-dim">로딩 중…</div>}>
          <PostsPageClient articles={articles} categories={categories} />
        </Suspense>
      </div>
    </main>
  );
}
```

⚠️ `useSearchParams()` 는 Next.js 가 Suspense boundary 안에 있어야 정적 export 시 에러 없음. 그래서 `<Suspense>` 로 감쌈.

- [ ] **Step 5: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
ls /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/out/posts/ 2>&1 | head -3
```

기대: 빌드 성공. `out/posts/index.html` 존재.

- [ ] **Step 6: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add components/posts app/posts && git commit -m "$(cat <<'EOF'
feat(posts): /posts 전체 글 라우트 — 연도 그룹 compact list + 카테고리 필터

* 신규 4개 파일: category-rail / posts-list / posts-page-client / app/posts/page.tsx
* 좌측 sticky CategoryRail (데스크탑) / 상단 가로 chip 레일 (모바일)
* 우측 PostsList: 연도 desc 그룹, MM.DD · category · title compact row
* URL ?cat=name 으로 필터 상태 관리 (useSearchParams + scroll: false 클라이언트 nav)
* Suspense 로 useSearchParams 감싸 정적 export 호환
* 헤더 nav 의 Posts 링크가 이제 정상 동작 (sub#2 시점부터 임시 404 였던 것 해소)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 회귀 검증

**Files:** (변경 없음)

코드 변경 + 커밋 없음.

- [ ] **Step 1: 타입 검사 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력.

- [ ] **Step 2: 프로덕션 빌드 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. 라우트 목록에 `/`, `/posts`, `/[slug]` × 175, `/series`, `/tags`, `/dev/tokens` 모두 존재.

- [ ] **Step 3: 빌드 산출물 확인**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
ls out/ | head -10
ls out/posts/index.html
ls out/index.html
```

기대: 모두 존재.

- [ ] **Step 4: 컨트롤러 시각 확인 (subagent SKIP, controller 진행)**

`npm run dev` 후 `http://localhost:3000/`:
- 새 헤드라인 + Bento 그리드 (Featured big dark / Series spotlight lavender / Latest accent / Categories cream / 4× Recent tinted)
- "{N}편 누적" 의 N 이 실제 article 수 (~178)
- Featured 가 가장 최근 글
- Series spotlight 가 가장 최근 시리즈 (예: Golang Concurrency 또는 MQTT v5 등)
- Categories 칩이 카운트 desc 정렬
- 카드 클릭 → 정상 article 페이지 이동
- 다크 모드 토글 시 모든 카드 정상 표시
- 모바일 viewport (<768px): 단일 컬럼 stack, Featured 가 위, 나머지 아래

`http://localhost:3000/posts`:
- 좌측 카테고리 레일 (All / Cloud / Java / Go ...) — sticky scrolling
- 우측 연도 그룹 (2026 / 2025 / ...) compact list
- 카테고리 클릭 → URL 이 `/posts?cat=cloud` 로 변경, 우측 리스트가 필터됨, 페이지 reload 없음
- "All" 클릭 → URL 이 `/posts` 로, 전체 리스트
- 모바일: 카테고리가 가로 chip 레일로 변환 (스크롤바 없음)
- 다크 모드 정상

`http://localhost:3000/series` (변경 없음 — sub#7 에서 처리)
`http://localhost:3000/tags` (변경 없음 — sub#8 에서 처리)
샘플 article 페이지 (변경 없음 — sub#5 에서 처리)
`http://localhost:3000/dev/tokens` (변경 없음)

- [ ] **Step 5: 브랜치 상태 확인**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git log --oneline feature/redesign-bento ^main | head -25
```

기대: sub-project #1+#2+#3 의 19 커밋 + sub-project #4 의 3~4 커밋 = 약 22~23 커밋.

---

## Self-Review Notes

### Spec coverage (§7)

- §7.1 홈 Bento 레이아웃 → Task 1 (Headline + 5개 카드 + page 조합)
- §7.2 데이터 매핑 → app/page.tsx 의 articles[0] / find(series) / slice(1,5) / category aggregation / slice(5,9)
- §7.3 Headline 카피 → Headline 컴포넌트 (영문 default, prop 없이 inline)
- §7.4 이미지 정책 → 모든 카드에 firstImage 사용 안 함
- §7.5 /posts 전체 리스트 → Task 2 (CategoryRail + PostsList + client wrapper + page)
- §7.6 영향 범위 → Files Touched 섹션과 일치, home-content.tsx 는 sub#9 에서 삭제 명시

### Placeholder scan
TBD/TODO 없음. 모든 코드 스니펫 완성형.

### Type consistency
- Article prop 셰이프 (`{slug, title, category, date, excerpt?}`) 일관됨 — 컴포넌트마다 필요한 부분 집합만 받음
- Tone 타입은 `RecentCard` 내부 정의 + page 가 const 배열로 매핑
- `getArticleTitleFromSlug` 일관 사용 (manifest slug → URL slug 변환)
- `getArticlesBySeries` 의 반환 타입은 page 내에서 sort + map

### 외부 의존성 사전 검증
- `getAllArticles`, `getArticlesBySeries`, `getArticleTitleFromSlug` — `lib/articles.ts` 에 존재 ✓
- `formatDate` — `lib/utils.ts` 에 존재 ✓
- `useSearchParams`, Suspense — Next.js 16 기본 ✓
- ManifestArticle 셰이프 (slug/category/title/date/excerpt?/tags?/series?/seriesOrder?/firstImage?) — 위 lib/articles.ts 에서 확인됨 ✓

### Decoupling
- 6개 home 카드 컴포넌트가 prop 으로만 데이터 받음 — `lib/articles.ts` 의 ManifestArticle 에 직접 의존하지 않음
- /posts 도 동일 패턴
- `home-content.tsx` 는 그대로 두되 사용처가 사라짐 → sub#9 cleanup 시 grep + delete

### Risks 및 완화
- **Series spotlight 미존재**: 모든 articles 에 series 가 없으면 컴포넌트 자체 렌더 안 함 (`spotlightName &&` 가드).
- **Categories 라우트 미존재**: 임시 404, sub#6 완료 시 해소.
- **Series 라우트 미존재**: 임시 404, sub#7 완료 시 해소.
- **/posts 의 useSearchParams + 정적 export**: Suspense boundary 로 감싸서 안전.
- **모바일 Featured min-height 320px**: 콘텐츠 잘림 위험 — title + excerpt 길이가 길면 문제 가능. line-clamp 사용? 일단 spec 그대로 두고 시각 확인 단계에서 판단.
- **카테고리 capitalize**: CSS `capitalize` 로 처리 — 이미 lowercase 이므로 표시 시 첫 글자 대문자.
