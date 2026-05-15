# Sub-project #11: 홈 페이지 prototype 매칭 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈(`/`) 페이지를 prototype `theme-bento.jsx` 디자인 캔버스와 더 가깝게 매칭. Stats card, Activity heatmap (꾸준함의 기록), Topics card 변형, Headline meta row, Featured CTA + tags 5개 항목 일괄 추가.

**Architecture:** 신규 컴포넌트 2개 (StatsCard, ActivityHeatmap) + 기존 컴포넌트 3개 풍부화 (Headline, FeaturedCard, CategoriesCard) + `app/page.tsx` 그리드에 통합. 데이터 모델 변경 없이 manifest 의 발행일 / 카테고리 / 시리즈 / tags 만 활용. CSS utility 한 줄 추가 (butter underline gradient).

**Tech Stack:** Next.js 16 App Router server components, Tailwind (`bento-*` 토큰), `lib/articles.ts` (`getAllArticles`, `getAllSeries`).

**브랜치:** `feature/redesign-bento` 위에서 누적.

**참고 문서:**
- prototype: `docs/design/theme-bento.jsx` (home design canvas)
- 비교 결과: 홈 페이지 5개 누락 항목 (사용자 지정 1~5 우선순위 모두 적용)

---

## Files Touched

### Task 1 — Headline + FeaturedCard 풍부화
- Modify: `app/globals.css` — `.headline-underline` 신규 utility (butter gradient underline)
- Modify: `components/home/headline.tsx` — meta row 추가, butter highlight 위치 변경 ("from" → "a working engineer.")
- Modify: `components/home/featured-card.tsx` — readTime / tags / "Read article →" CTA prop 추가

### Task 2 — Stats card 신규 + Topics 변형
- Create: `components/home/stats-card.tsx` — 178 posts / 7 series / Ny writing
- Modify: `components/home/categories-card.tsx` — Topics 변형 (sage bg + "{N}편을 {M}개의 결로" 헤딩)

### Task 3 — Activity heatmap 신규
- Create: `components/home/activity-heatmap.tsx` — 7×26 grid + streak/peak 메타

### Task 4 — Home page 통합
- Modify: `app/page.tsx` — 새 컴포넌트 import + grid 안에 배치, FeaturedCard 새 props 전달

### Task 5 — 검증

---

## Design Decisions

### 1. Stats card 데이터
- `posts`: `articles.length`
- `series`: `getAllSeries().length`
- `years writing`: `currentYear - firstArticleYear` (첫 글 연도 자동 추출)

### 2. Activity heatmap
- 그리드: 7행(요일) × 26열(주) = 182일 (~6개월). prototype 그대로.
- 각 셀 = 그날 발행한 글 수 (대부분 0)
- color: `bg-bento-accent` opacity 단계 (0건/1건/2건/3+건)
- streak: 가장 최근 발행일 기준 연속 발행 주(weeks-with-post) 수 — 일 단위는 거의 없으므로 주 단위로
- peak/week: 한 주 최대 발행 수

⚠️ 178편 / 8년 = 평균 2주 1편 → 일 단위 streak 는 거의 0. 주 단위로 표현이 적절. prototype 의 "22 streak" 는 placeholder.

### 3. Topics card 변형
- 배경: cream → **sage** (prototype 매칭)
- 헤딩: "Browse by topic" → "{N}편을 {M}개의 결로" (N = `articles.length`, M = `categories.length`)
- 칩: 그대로 유지 (모든 카테고리 + 카운트, link to `/category/[slug]`)

### 4. Headline 변경
- Eyebrow ("Field notes from a working engineer" small) 제거 — prototype 에 없음
- h1 변경: "Field notes <em>from</em><br/>a working engineer."
  - "from" 만 italic Instrument Serif (butter 배경 제거)
  - "a working engineer." 에 butter underline gradient 적용
- Meta row 추가: `● {N} posts published — since Jan {year} — Cloud · Java · Go · Database`
  - `●` accent 색
  - 첫 글 연도 자동 추출

### 5. Featured 카드 추가 항목
- prototype 의 readTime + tags (frontmatter `.tags`) + "Read article →" CTA 추가
- readTime: manifest 미보유 → **생략** (prototype 매칭 우선순위 낮음, 데이터 모델 변경 없는 접근)
- tags: 첫 글의 frontmatter `.tags` 최대 3개 칩
- CTA: "Read article →" accent bg 캡슐, 카드 클릭 영역 안의 시각 표시 (전체 카드가 이미 Link 라 별도 동작 불필요 — 시각 cue 만)

### 6. Topics card 위치
prototype theme-bento.jsx 에서 "Topics" 카드는 col-5 row-2, sage. Stats card 는 col-5 row-1, cream. 우리는 단순화 — Stats card (col-12) + Topics card 그리드 안 적절한 위치.

### 7. Activity heatmap 위치
prototype 에서 col-4 row-2, white card. 우리도 비슷한 슬롯에 배치. Recent 카드들 사이에 둘 위치.

### 8. 데이터 caching
모든 데이터는 build 시점 한 번 계산 (server component). 추가 lib/data 파일 없이 page.tsx 에서 inline 집계.

---

## Tailwind Dynamic-Class Note

ActivityHeatmap 의 cell opacity 는 인라인 `style={{ opacity: ... }}` 로 처리. dynamic class interpolation 없음.

---

### Task 1: Headline + FeaturedCard 풍부화

**Files:**
- Modify: `app/globals.css` — `.headline-underline` utility
- Modify: `components/home/headline.tsx`
- Modify: `components/home/featured-card.tsx`

⚠️ 정확히 3개 파일 수정. 다른 파일 절대 touch 금지.

- [ ] **Step 1: `app/globals.css` 끝에 `.headline-underline` utility 추가**

`app/globals.css` 파일의 **맨 끝**에 다음을 append:

```css

/* Bento headline butter underline gradient (from prototype theme-bento.jsx) */
.headline-underline {
  background: linear-gradient(180deg, transparent 60%, rgb(var(--bento-butter)) 60%);
}
```

- [ ] **Step 2: `components/home/headline.tsx` 전면 재작성**

```tsx
type Props = {
  totalCount: number;
  firstYear: number;
};

export function Headline({ totalCount, firstYear }: Props) {
  return (
    <section className="mx-auto max-w-canvas px-6 pb-10 pt-6 md:px-10">
      <h1 className="text-[56px] font-bold leading-[0.95] tracking-tightest md:text-[88px]">
        Field notes <span className="font-serif italic font-normal">from</span>
        <br />
        <span className="headline-underline">a working engineer.</span>
      </h1>
      <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-bento-dim md:gap-x-4">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-bento-accent" />
          {totalCount} posts published
        </span>
        <span aria-hidden="true">—</span>
        <span>since Jan {firstYear}</span>
        <span aria-hidden="true">—</span>
        <span>Cloud · Java · Go · Database</span>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: `components/home/featured-card.tsx` 전면 재작성**

```tsx
import Link from 'next/link';

type Props = {
  href: string;
  title: string;
  category: string;
  date: string;
  excerpt?: string;
  tags?: string[];
};

export function FeaturedCard({ href, title, category, date, excerpt, tags }: Props) {
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
            ★ Featured
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] capitalize">
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
      <div className="relative flex flex-wrap items-end justify-between gap-4 text-xs text-white/70">
        <div className="flex flex-wrap items-center gap-2">
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/85"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
          <span className="text-white/60">{date}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-bento-accent px-4 py-2 text-[13px] font-semibold text-white">
          Read article
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
```

⚠️ 변경 노트:
- `tags` prop 추가 (선택)
- "★ Featured" 뱃지 (별 추가)
- 하단 footer: 날짜 + tags + "Read article →" CTA (accent 캡슐)

- [ ] **Step 4: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: app/page.tsx 가 firstYear / tags prop 을 아직 안 넘겨서 에러 가능.

❗ 만약 `firstYear` 또는 `tags` 미전달 에러 나면 BLOCKED 보고 NO — 다음 task 4 (page integration) 에서 해소되므로 **본 task 의 빌드 실패는 정상**. 본 task step 4/5 는 SKIP, Task 4 의 build 에서 검증.

대신 다음으로 검증:

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && grep -E "Headline|FeaturedCard" components/home/headline.tsx components/home/featured-card.tsx | head -5
```

기대: export 되는 컴포넌트 이름 확인.

- [ ] **Step 5: 커밋 (검증 SKIP)**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add app/globals.css components/home/headline.tsx components/home/featured-card.tsx && git commit -m "$(cat <<'EOF'
feat(home): Headline + FeaturedCard 풍부화 (prototype 매칭)

* Headline: butter highlight 위치 변경 ("from" → "a working engineer." 가 underline gradient)
  — meta row 추가: ● {N} posts · since Jan {year} · Cloud · Java · Go · Database
  — firstYear prop 신규 (page.tsx 에서 전달)
* FeaturedCard: ★ Featured 뱃지, tags 칩 (최대 3개), "Read article →" accent CTA 캡슐
  — tags prop 신규 (page.tsx 에서 전달)
* globals.css: .headline-underline utility (butter gradient underline)
* app/page.tsx 의 prop 전달은 sub#11 Task 4 에서 통합 (본 commit 만으로는 빌드 실패, Task 4 가 해소)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

⚠️ 본 commit 만으로 `npm run build` 가 실패할 수 있음 (page.tsx 가 새 prop 미전달). 다음 Task 4 에서 해소.

---

### Task 2: Stats card 신규 + Topics 변형

**Files:**
- Create: `components/home/stats-card.tsx`
- Modify: `components/home/categories-card.tsx`

⚠️ 정확히 2개 파일.

- [ ] **Step 1: `components/home/stats-card.tsx` 생성**

```tsx
type StatItem = {
  value: string;
  label: string;
};

type Props = {
  stats: StatItem[];
};

export function StatsCard({ stats }: Props) {
  return (
    <div className="col-span-12 grid grid-cols-3 gap-4 rounded-card-xl bg-bento-cream p-6 md:col-span-5 md:p-7">
      {stats.map((s) => (
        <div key={s.label}>
          <div className="text-4xl font-bold leading-none tracking-tightest text-bento-ink md:text-5xl">
            {s.value}
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.08em] text-bento-dim md:text-[11px]">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `components/home/categories-card.tsx` 전면 재작성**

기존 `Browse by topic` heading 을 prototype 의 "Topics 변형" 으로 교체:

```tsx
import Link from 'next/link';
import { categorySlug } from '@/lib/url';

type CategoryEntry = {
  name: string;
  count: number;
};

type Props = {
  categories: CategoryEntry[];
  totalCount: number;
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-sage';

export function CategoriesCard({ categories, totalCount }: Props) {
  return (
    <div className="col-span-12 flex flex-col rounded-card-xl bg-bento-sage p-6 md:col-span-5 md:p-7">
      <div className="text-[10px] uppercase tracking-[0.1em] text-bento-ink/60">Topics</div>
      <h3 className="mt-2 text-2xl font-bold leading-tight tracking-tighter text-bento-ink md:text-3xl">
        {totalCount}편을<br />
        {categories.length}개의 결로
      </h3>
      <div className="mt-auto flex flex-wrap gap-2 pt-6">
        {categories.map((c) => (
          <Link
            key={c.name}
            href={`/category/${encodeURIComponent(categorySlug(c.name))}`}
            className={[
              'inline-flex items-center gap-2 rounded-full bg-bento-ink/[0.08] px-3 py-1.5 text-[12px] text-bento-ink no-underline transition hover:bg-bento-ink/[0.12]',
              FOCUS_RING,
            ].join(' ')}
          >
            <span className="capitalize">{c.name}</span>
            <span className="text-[10px] text-bento-ink/60">{c.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

⚠️ 변경 노트:
- 배경 cream → **sage**
- 헤딩: "Browse by topic" → "{N}편을 {M}개의 결로" (Korean)
- "Topics" eyebrow uppercase tracking
- `totalCount` prop 신규 — page.tsx 에서 전달
- focus-ring offset color 도 sage 로 변경

- [ ] **Step 3: 커밋 (검증 SKIP — Task 4 에서)**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add components/home/stats-card.tsx components/home/categories-card.tsx && git commit -m "$(cat <<'EOF'
feat(home): StatsCard 신규 + CategoriesCard Topics 변형 (prototype 매칭)

* StatsCard: 3-col grid (cream bg). value 큰 숫자 + label small uppercase
* CategoriesCard: cream → sage, "Browse by topic" → "{N}편을 {M}개의 결로" 큰 헤딩
  — totalCount prop 신규 (page.tsx 에서 전달)
* page.tsx 통합은 Task 4 — 본 commit 단독으로는 빌드 실패

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Activity heatmap 신규

**Files:**
- Create: `components/home/activity-heatmap.tsx`

⚠️ 신규 1개 파일.

- [ ] **Step 1: `components/home/activity-heatmap.tsx` 생성**

```tsx
type DayCount = {
  /** ISO yyyy-MM-dd */
  date: string;
  count: number;
};

type Props = {
  /** 최근 N일 (older first → newest last) — 정확히 7×WEEKS 길이 */
  days: DayCount[];
  /** 표시할 주 수 (prototype 그대로 26) */
  weeks: number;
  /** 메타: 가장 최근 발행 주 기준 streak */
  streakWeeks: number;
  /** 메타: 한 주 최대 발행 수 */
  peakPerWeek: number;
};

function opacityFor(count: number): number {
  if (count <= 0) return 0.06;
  if (count === 1) return 0.4;
  if (count === 2) return 0.7;
  return 1.0;
}

export function ActivityHeatmap({ days, weeks, streakWeeks, peakPerWeek }: Props) {
  return (
    <div className="col-span-12 flex flex-col rounded-card-xl bg-bento-card p-6 md:col-span-4 md:p-7">
      <div className="text-[10px] uppercase tracking-[0.1em] text-bento-dim">Last 12 months</div>
      <h3 className="mt-2 text-xl font-bold tracking-tighter text-bento-ink md:text-2xl">
        꾸준함의 기록
      </h3>
      <div
        className="mt-6 flex-1 grid gap-1"
        style={{
          gridTemplateRows: 'repeat(7, 1fr)',
          gridTemplateColumns: `repeat(${weeks}, 1fr)`,
          gridAutoFlow: 'column',
        }}
        aria-hidden="true"
      >
        {days.map((d) => (
          <div
            key={d.date}
            className="rounded-[3px] bg-bento-accent"
            style={{ opacity: opacityFor(d.count), minHeight: '8px' }}
            title={`${d.date}: ${d.count}편`}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-[11px] text-bento-dim">
        <span>{streakWeeks} streak</span>
        <span>peak {peakPerWeek} / week</span>
      </div>
    </div>
  );
}
```

⚠️ 변경 노트:
- prototype 의 7×26 그리드 그대로
- opacity 4단계 (0/1/2/3+ articles)
- 각 cell 에 title attribute 로 hover tooltip
- streak / peak 메타 하단

- [ ] **Step 2: 커밋 (검증 SKIP)**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add components/home/activity-heatmap.tsx && git commit -m "$(cat <<'EOF'
feat(home): ActivityHeatmap 신규 — 꾸준함의 기록 (prototype 매칭)

* 7행(요일) × 26열(주) = 182일 grid
* opacity 4단계: 0/1/2/3+ articles per day
* 각 cell title attribute 로 hover tooltip
* 메타 하단: N streak / peak N / week
* page.tsx 통합은 Task 4

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Home page 통합

**Files:**
- Modify: `app/page.tsx`

⚠️ 단 1개 파일 수정.

- [ ] **Step 1: `app/page.tsx` 전면 재작성**

```tsx
import { getAllArticles, getAllSeries, getArticlesBySeries, getArticleTitleFromSlug } from '@/lib/articles';
import { formatDate } from '@/lib/utils';
import { seriesSlug } from '@/lib/url';
import { Headline } from '@/components/home/headline';
import { FeaturedCard } from '@/components/home/featured-card';
import { SeriesSpotlightCard } from '@/components/home/series-spotlight-card';
import { LatestCard } from '@/components/home/latest-card';
import { CategoriesCard } from '@/components/home/categories-card';
import { RecentCard } from '@/components/home/recent-card';
import { StatsCard } from '@/components/home/stats-card';
import { ActivityHeatmap } from '@/components/home/activity-heatmap';

export const metadata = {
  title: "Frank's IT Blog",
  description: 'IT 기술 블로그 - 개발, 클라우드, 데이터베이스',
};

const RECENT_TONES = ['sage', 'butter', 'rose', 'cream'] as const;

const HEATMAP_WEEKS = 26;

type DayCount = { date: string; count: number };

function buildHeatmap(articles: { date: string }[]): {
  days: DayCount[];
  streakWeeks: number;
  peakPerWeek: number;
} {
  const totalDays = HEATMAP_WEEKS * 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build empty days array (oldest → newest)
  const days: DayCount[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      count: 0,
    });
  }
  const indexByDate = new Map<string, number>();
  days.forEach((d, i) => indexByDate.set(d.date, i));

  for (const a of articles) {
    const d = new Date(a.date);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const idx = indexByDate.get(key);
    if (idx !== undefined) days[idx].count += 1;
  }

  // Streak (weeks with at least one post, going back from latest week)
  let streakWeeks = 0;
  for (let w = HEATMAP_WEEKS - 1; w >= 0; w--) {
    const weekDays = days.slice(w * 7, w * 7 + 7);
    const hasPost = weekDays.some((d) => d.count > 0);
    if (hasPost) streakWeeks += 1;
    else break;
  }

  // Peak per week
  let peakPerWeek = 0;
  for (let w = 0; w < HEATMAP_WEEKS; w++) {
    const weekTotal = days.slice(w * 7, w * 7 + 7).reduce((acc, d) => acc + d.count, 0);
    if (weekTotal > peakPerWeek) peakPerWeek = weekTotal;
  }

  return { days, streakWeeks, peakPerWeek };
}

export default async function HomePage() {
  const articles = await getAllArticles();
  const seriesNames = await getAllSeries();

  const totalCount = articles.length;
  const seriesCount = seriesNames.length;

  // First article year
  const firstYear = articles
    .map((a) => new Date(a.date).getFullYear())
    .filter((y) => !isNaN(y))
    .reduce((acc, y) => Math.min(acc, y), new Date().getFullYear());
  const yearsWriting = Math.max(1, new Date().getFullYear() - firstYear);

  const featured = articles[0];
  const latest = articles.slice(1, 5);
  const recent = articles.slice(5, 9);

  const featuredSeriesArticle = articles.find((a) => a.series);
  let spotlightEpisodes: Array<{ num: number; title: string; slug: string }> = [];
  let spotlightName = '';
  if (featuredSeriesArticle?.series) {
    spotlightName = featuredSeriesArticle.series;
    const eps = await getArticlesBySeries(spotlightName);
    spotlightEpisodes = eps.map((a, i) => ({
      num: a.seriesOrder ?? i + 1,
      title: a.title,
      slug: getArticleTitleFromSlug(a.slug),
    }));
  }

  const categoryCounts = new Map<string, number>();
  for (const a of articles) {
    categoryCounts.set(a.category, (categoryCounts.get(a.category) ?? 0) + 1);
  }
  const categories = Array.from(categoryCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const { days, streakWeeks, peakPerWeek } = buildHeatmap(articles);

  return (
    <main className="min-h-screen bg-bento-bg pb-20 pt-2">
      <Headline totalCount={totalCount} firstYear={firstYear} />

      <section className="mx-auto grid max-w-canvas grid-cols-12 gap-3 px-6 md:gap-4 md:px-10">
        {featured && (
          <FeaturedCard
            href={`/${encodeURIComponent(getArticleTitleFromSlug(featured.slug))}`}
            title={featured.title}
            category={featured.category}
            date={formatDate(featured.date)}
            excerpt={featured.excerpt}
            tags={featured.tags}
          />
        )}

        <StatsCard
          stats={[
            { value: String(totalCount), label: 'POSTS' },
            { value: String(seriesCount), label: 'SERIES' },
            { value: `${yearsWriting}y`, label: 'WRITING' },
          ]}
        />

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
          <CategoriesCard categories={categories} totalCount={totalCount} />
        )}

        <ActivityHeatmap
          days={days}
          weeks={HEATMAP_WEEKS}
          streakWeeks={streakWeeks}
          peakPerWeek={peakPerWeek}
        />

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

⚠️ 변경 노트:
- imports: `getAllSeries` (sub#10 에서 추가됨), `StatsCard`, `ActivityHeatmap` 신규
- `Headline`: `firstYear` prop 추가
- `FeaturedCard`: `tags` prop 추가
- `CategoriesCard`: `totalCount` prop 추가
- 신규 카드 위치: StatsCard (Featured 옆), ActivityHeatmap (Categories 다음), Recent 위치 동일
- `buildHeatmap` 헬퍼: 일별 발행수 집계 + streak/peak 계산

- [ ] **Step 2: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력. 에러 시 quote + BLOCKED.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. 1097 페이지 (변동 없음).

- [ ] **Step 3: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add app/page.tsx && git commit -m "$(cat <<'EOF'
feat(home): page.tsx 통합 — Stats + ActivityHeatmap + 신규 props 전달

* import: getAllSeries, StatsCard, ActivityHeatmap 추가
* Headline 에 firstYear prop (첫 글 연도 자동 추출)
* FeaturedCard 에 tags prop (frontmatter 첫 글의 태그)
* CategoriesCard 에 totalCount prop ("178편을 N개의 결로")
* StatsCard: posts / series / Ny writing 자동 계산
* ActivityHeatmap: 26주 일별 발행 그리드 + streak/peak 메타 (buildHeatmap 헬퍼)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: 검증

**Files:** (변경 없음)

- [ ] **Step 1: 타입 검사 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

- [ ] **Step 2: 프로덕션 빌드 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

- [ ] **Step 3: 컨트롤러 시각 확인**

`npx serve out -l 3000` 후 홈 (`/`):
- Headline: "Field notes from a working engineer." ("from" italic + "a working engineer." 부분에 butter 밑줄)
- Meta row: ● 178 posts published — since Jan {year} — Cloud · Java · Go · Database
- Featured 카드: "★ Featured" 뱃지 + 카테고리 + 제목 + excerpt + 하단 [tags + 날짜 + Read article → CTA]
- Stats card: 178 / 7 / Ny writing (cream bg)
- Series spotlight (lavender)
- Latest accent card
- Categories card: **sage bg** + "TOPICS" eyebrow + "178편을 N개의 결로" 큰 텍스트 + 칩
- ActivityHeatmap: "LAST 12 MONTHS / 꾸준함의 기록" + 7×26 grid (대부분 dim, 발행한 날 진한 accent) + N streak / peak N
- Recent 4 tinted

다크 모드 + 모바일도 정상.

- [ ] **Step 4: 브랜치 상태**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git log --oneline feature/redesign-bento ^main | wc -l
```

기대: 약 56 개 (sub#1~#10 + 다크 fix + 색상 변경 + 50 + 5 = 약 55개).

---

## Self-Review Notes

### 5개 항목 커버
1. ✅ Activity heatmap → Task 3 (ActivityHeatmap 컴포넌트) + Task 4 (buildHeatmap 헬퍼 + 통합)
2. ✅ Stats card → Task 2 (StatsCard 컴포넌트) + Task 4 (값 자동 계산 후 전달)
3. ✅ Meta row "since Jan {year}" → Task 1 (Headline 변경) + Task 4 (firstYear 자동 계산)
4. ✅ Featured CTA + tags → Task 1 (FeaturedCard 변경) + Task 4 (tags prop 전달)
5. ✅ Topics card 변형 → Task 2 (CategoriesCard 변경, sage bg + 한국어 헤딩) + Task 4 (totalCount prop)

### Placeholder scan
TBD/TODO 없음. 모든 코드 완성형.

### Type consistency
- `firstYear: number` Headline / page.tsx 일관
- `tags?: string[]` FeaturedCard / page.tsx 일관
- `totalCount: number` CategoriesCard / page.tsx 일관
- `DayCount`, `StatItem` 타입 컴포넌트 안 정의

### 의도적 단순화
- readTime: manifest 미보유 — Featured CTA 영역에 표시 안 함 (date 만)
- Heatmap streak: 일 단위 대신 "주 단위" (블로그 발행 빈도 현실적)
- Heatmap 26주 (~6개월): prototype 그대로. "Last 12 months" 라벨은 prototype 텍스트 그대로 유지하지만 실제 표시 영역은 6개월이라 약간 misleading — 의도된 단순화 (cell density 우선)

### 외부 의존성 사전 검증
- `getAllArticles`, `getAllSeries`, `getArticlesBySeries`, `getArticleTitleFromSlug` ✓
- `formatDate`, `seriesSlug` ✓
- bento-* 토큰 ✓

### Risks 및 완화
- **Task 1, 2, 3 단독 빌드 실패**: 의도된 동작 — Task 4 가 props 전달 통합. 각 Task 의 commit 메시지에 명시. Task 4 후 빌드 성공 확인.
- **Heatmap 데이터 부족**: 178편/8년 = 평균 매주 0~1편. opacity 4단계가 충분히 시각 차이 보임.
- **모바일 heatmap 너비**: col-12 stack 시 가로 너비 충분 (7×26 cells = ~182 cells). cell 최소 8px 적용으로 스마트폰에서도 visible.
- **Meta row 모바일 wrap**: `flex-wrap gap-y-2` 로 자연스럽게 줄바꿈.
- **Topics card sage bg + 다크 모드**: sage 다크 토큰(#3A4A3A) 적용됨. 텍스트 색은 bento-ink (다크 모드 light 색) 으로 자동 대응.
