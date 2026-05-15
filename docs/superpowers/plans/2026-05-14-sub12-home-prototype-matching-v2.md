# Sub-project #12: 홈 prototype 매칭 v2 (readTime / Wide Latest / Quote) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** prototype theme-bento.jsx 의 남은 격차 매칭 — readTime 데이터를 manifest 에 사전 계산 추가하고, Quote card · Wide Latest list · Recent/Featured 카드 메타 강화로 홈 페이지의 마지막 누락 영역 보충.

**Architecture:** 데이터 모델 1개 필드만 확장 (`readTime: number` in ManifestArticle). manifest 생성 스크립트 (`scripts/generate-content-manifest.ts`) 가 빌드 시점에 본문 word count 기반으로 계산. 신규 컴포넌트 2개 (QuoteCard, WideLatestList) + 기존 카드 2개 풍부화 (RecentCard 메타, FeaturedCard meta line 재배치) + `app/page.tsx` 통합.

**Tech Stack:** Next.js 16 server components, `gray-matter` (frontmatter + content 파싱), `scripts/generate-content-manifest.ts` (build 단계 manifest 생성), 기존 `lib/markdown.ts` 의 `calculateReadingTime` (200 wpm 단순화 알고리즘) 동일 로직 inline.

**브랜치:** `feature/redesign-bento` 위에서 누적.

**참고 문서:**
- prototype: `docs/design/theme-bento.jsx` (Quote card / Wide Latest list / Recent cards 메타)
- 누락 항목: Quote card / Wide Latest list "이번 달 글" / Recent/Featured readTime · arrow

---

## Files Touched

### Task 1 — readTime manifest 추가
- Modify: `scripts/generate-content-manifest.ts` — inline `calculateReadingTime` + ArticleMetadata 에 `readTime` 필드
- Modify: `lib/articles.ts` — `ManifestArticle` interface 에 `readTime?: number` 필드

### Task 2 — Quote card + Wide Latest list 신규
- Create: `components/home/quote-card.tsx`
- Create: `components/home/wide-latest-list.tsx`

### Task 3 — Recent + Featured 카드 메타 강화
- Modify: `components/home/recent-card.tsx` — date + readTime + arrow 우하단
- Modify: `components/home/featured-card.tsx` — meta line ★ FEATURED · category · date · {readTime}m read 상단 한 줄 + CTA 우하단 separate

### Task 4 — page.tsx 통합
- Modify: `app/page.tsx` — Quote + WideLatestList 호출, RecentCard 에 date/readTime 전달, FeaturedCard 에 readTime 전달

### Task 5 — 검증

---

## Design Decisions

### 1. readTime 계산
prototype 의 `12m read` 표현. 200 wpm 기준 word count. `lib/markdown.ts` 의 `calculateReadingTime` 와 동일 로직을 `scripts/generate-content-manifest.ts` 안에 inline (script 는 단독 node 프로세스, lib import 의존성 줄임).

### 2. Wide Latest list "이번 달 글" 데이터
"이번 달" — 모호함. 두 가지 옵션:
- (a) **이번 달 발행** (current month): 발행 글 0개 가능
- (b) **최근 N편** (가장 최근 4편): 항상 4편 표시 보장

prototype 의 articles.slice(5, 9) 는 (b) 패턴 (이미 home 의 다른 슬롯들이 articles[0..8] 까지 쓰므로 slice 5~9 가 "최근 4편 그 다음"). 우리 home 도 같은 패턴 — Latest 카드가 1~4 인덱스, Wide Latest 는 articles[9..13] (5번째~8번째 그 다음) 또는 그냥 articles[5..9] (Recent 와 중복) 결정 필요.

⚠️ 결정: Wide Latest list 는 **articles.slice(9, 13)** (4편) — 홈 모든 슬롯이 1..13 articles 까지 균일하게 분포. Latest(1..4), Recent(5..8), WideLatest(9..12). 라벨 "이번 달 글" 은 prototype 그대로 유지 (의미상 "최신") 또는 "더 보기" 로 변경 — 후자는 prototype 다르므로 prototype 그대로 채택.

### 3. Quote card 콘텐츠
prototype 의 placeholder: "잘 정리된 노트는 / 미래의 나에게 보내는 / 가장 좋은 선물." + "— writing principle". 사용자 본인 문구 결정 영역이지만 placeholder 그대로 사용 (사용자가 후에 commit 으로 교체 가능).

### 4. RecentCard 메타 강화
prototype 의 RecentCard 메타 라인:
- 상단: 카테고리 (uppercase)
- 본문: 제목 (큰 텍스트)
- 하단: 날짜 (좌) + arrow (우, "{readTime}m →")

우리 현재: 카테고리 + 제목만. → 날짜 + "{readTime}m →" 추가.

### 5. FeaturedCard meta line 재배치
prototype 의 Featured meta line:
- 상단 한 줄: ★ FEATURED · {category} · {date} · {readTime} min read
- 본문: 제목 + excerpt (tags 없음 — prototype Featured 에 tags 칩 없음. 우리는 sub#11 에서 추가했지만 prototype 다시 보면 없음)
- 하단: "Read article →" CTA (단독)

⚠️ tags 칩은 prototype 에 없으나 sub#11 에서 추가했음. **제거** 결정 — prototype 매칭 우선.

### 6. WideLatestList 컴포넌트 디자인
prototype `col-span-8 row-span-2 bg-card`:
- 헤더: LATEST eyebrow + "이번 달 글" 큰 텍스트 + "See all 178 →" 우측
- 본문: 4-row compact list, 각 row 4-col grid: [date(70px)] [title(1fr)] [category(100px)] [readTime(60px)]
- row 사이 top border

### 7. QuoteCard 디자인
prototype `col-span-4 row-span-2 bg-ink text-white`:
- 좌상단: 큰 따옴표 `"` accent 색 (text-6xl, line-height: 0.7)
- 중간: serif italic 핵심 문장
- 하단: "— writing principle" 작은 dim 텍스트

### 8. Manifest 호환
`readTime?` 옵셔널 필드 — 기존 빌드/소비처가 미정의 경우 안전. 새 manifest 빌드 후 기존 코드 (e.g., `/[slug]/page.tsx` 에서 `calculateReadingTime` 직접 호출하던 부분) 그대로 유지 가능.

---

## Tailwind Dynamic-Class Note

새 컴포넌트의 className 정적. safelist 불필요.

---

### Task 1: readTime 을 manifest 에 추가

**Files:**
- Modify: `scripts/generate-content-manifest.ts`
- Modify: `lib/articles.ts`

⚠️ 정확히 2개 파일. 다른 파일 절대 touch 금지.

- [ ] **Step 1: 현재 manifest 스크립트 + interface 확인**

```bash
grep -n "readTime\|ArticleMetadata" scripts/generate-content-manifest.ts lib/articles.ts | head -10
```

기대: 현재 양쪽에 `readTime` 없음. `ArticleMetadata` 가 manifest 스크립트 안에 정의됨. `ManifestArticle` 이 `lib/articles.ts` 안에 정의됨. 둘은 별개 type 이지만 셰이프 동일.

- [ ] **Step 2: `scripts/generate-content-manifest.ts` 수정**

해당 파일을 Read 한 뒤:

(a) `ArticleMetadata` interface 에 `readTime?: number` 추가:

```ts
interface ArticleMetadata {
  slug: string;
  category: string;
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  series?: string;
  seriesOrder?: number;
  firstImage?: string;
  readTime?: number;  // 추가
}
```

(b) inline `calculateReadingTime` helper 추가 (파일 상단 import 영역 아래):

```ts
/**
 * 읽기 시간 계산 (분). lib/markdown.ts 의 calculateReadingTime 와 동일 로직.
 * Script 는 단독 node 프로세스이므로 의존성 최소화 위해 inline.
 */
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
```

(c) `matter()` 호출 후 metadata 생성 부분에서 readTime 계산 추가. `matter` 는 `{ data, content }` 를 반환. content 가 본문 markdown. 해당 위치에서:

```ts
const { data, content } = matter(raw);
// ...기존 metadata 구성...
metadata.readTime = calculateReadingTime(content);
```

정확한 삽입 위치는 파일을 Read 한 뒤 metadata 객체 생성/push 직전.

- [ ] **Step 3: `lib/articles.ts` 의 `ManifestArticle` interface 에 readTime 추가**

`lib/articles.ts` 의 `interface ManifestArticle` 정의에 다음 라인 추가:

```ts
  readTime?: number;
```

(이미 있는 firstImage 라인 다음에 두는 것이 자연스러움.)

- [ ] **Step 4: manifest 재생성 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run generate:manifest
```

기대: 새 manifest 생성. readTime 필드 포함 확인:

```bash
grep -E '"readTime":' /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/public/content-manifest.json | head -3
```

기대: `"readTime": N,` 라인 3개 출력.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. 1097 페이지.

- [ ] **Step 5: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add scripts/generate-content-manifest.ts lib/articles.ts public/content-manifest.json && git commit -m "$(cat <<'EOF'
feat(manifest): readTime 필드 추가 — 본문 word count 기반 분 단위 계산

* scripts/generate-content-manifest.ts: inline calculateReadingTime (200 wpm) + metadata.readTime 채움
* lib/articles.ts: ManifestArticle interface 에 readTime?: number 옵셔널 필드
* public/content-manifest.json 재생성 (178개 article 에 readTime 포함)
* prototype 의 "12 min read" 같은 메타 표시에 필요한 데이터 사전 보존

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Quote card + Wide Latest list 신규

**Files:**
- Create: `components/home/quote-card.tsx`
- Create: `components/home/wide-latest-list.tsx`

⚠️ 정확히 2개 신규 파일. build/check SKIP (page.tsx 미통합 상태라 안전), Task 4 가 통합 후 검증.

- [ ] **Step 1: `components/home/quote-card.tsx` 생성**

```tsx
type Props = {
  /** quote body (가능하면 줄바꿈은 <br/> 또는 prop 으로 처리) */
  lines: string[];
  /** attribution e.g. "— writing principle" */
  attribution: string;
};

export function QuoteCard({ lines, attribution }: Props) {
  return (
    <div className="col-span-12 flex min-h-[260px] flex-col justify-between rounded-card-xl bg-bento-hero-dark p-7 text-white md:col-span-4 md:min-h-[260px] md:p-8">
      <div
        aria-hidden="true"
        className="text-6xl font-bold leading-none text-bento-accent"
        style={{ lineHeight: 0.7 }}
      >
        “
      </div>
      <blockquote className="my-3 font-serif text-lg font-medium leading-tight tracking-tighter md:text-xl">
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </blockquote>
      <cite className="text-xs not-italic text-white/60">{attribution}</cite>
    </div>
  );
}
```

⚠️ 주의: `lines` prop 으로 여러 줄 처리 (한국어 의도된 줄바꿈 보존).

- [ ] **Step 2: `components/home/wide-latest-list.tsx` 생성**

```tsx
import Link from 'next/link';

type Item = {
  slug: string;
  title: string;
  category: string;
  date: string;       // ISO
  readTime?: number;
};

type Props = {
  items: Item[];
  totalCount: number;
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-card';

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function WideLatestList({ items, totalCount }: Props) {
  if (items.length === 0) return null;
  return (
    <div className="col-span-12 flex flex-col rounded-card-xl bg-bento-card p-6 md:col-span-8 md:p-7">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-bento-dim">Latest</div>
          <h3 className="mt-1 text-xl font-bold tracking-tighter text-bento-ink md:text-2xl">
            이번 달 글
          </h3>
        </div>
        <Link
          href="/posts"
          className={[
            'text-[13px] text-bento-dim no-underline transition hover:text-bento-ink',
            FOCUS_RING,
          ].join(' ')}
        >
          See all {totalCount} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <ul className="flex flex-col">
        {items.map((a, i) => (
          <li key={a.slug}>
            <Link
              href={`/${encodeURIComponent(a.slug)}`}
              className={[
                'grid grid-cols-[60px_1fr_80px_50px] items-baseline gap-3 py-3 no-underline text-bento-ink transition hover:bg-bento-ink/[0.02] dark:hover:bg-white/[0.02]',
                i > 0 ? 'border-t border-bento-ink/[0.06]' : '',
                FOCUS_RING,
              ].join(' ')}
            >
              <span className="font-mono text-[12px] text-bento-dim">{shortDate(a.date)}</span>
              <span className="truncate text-[14px] font-medium md:text-[15px]">{a.title}</span>
              <span className="truncate text-[11px] text-bento-dim capitalize">{a.category}</span>
              <span className="text-right text-[11px] text-bento-dim">
                {a.readTime !== undefined ? `${a.readTime}m` : ''}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: 커밋 (build/check SKIP)**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add components/home/quote-card.tsx components/home/wide-latest-list.tsx && git commit -m "$(cat <<'EOF'
feat(home): QuoteCard + WideLatestList 신규 (prototype 매칭)

* QuoteCard: col-4 dark hero 카드, 큰 accent 따옴표 + serif italic + attribution
  — lines prop 으로 여러 줄 처리
* WideLatestList: col-8 compact list, 4-col grid (date / title / category / readTime)
  — 헤더 "Latest · 이번 달 글" + "See all N →" 우측 링크
* page.tsx 통합은 Task 4

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Recent + Featured 카드 메타 강화

**Files:**
- Modify: `components/home/recent-card.tsx`
- Modify: `components/home/featured-card.tsx`

⚠️ 정확히 2개 파일 수정. build/check SKIP (page.tsx 미전달 props 가 발생할 수 있음, Task 4 가 통합).

- [ ] **Step 1: `components/home/recent-card.tsx` 전면 재작성**

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
  date: string;      // formatted string
  readTime?: number; // 분 (있으면 표시)
  tone: Tone;
};

export function RecentCard({ href, title, category, date, readTime, tone }: Props) {
  return (
    <Link
      href={href}
      className={`col-span-6 flex min-h-[160px] flex-col justify-between rounded-card-lg p-5 text-bento-ink no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg md:col-span-3 md:min-h-[220px] ${TONE_BG[tone]}`}
    >
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-wider text-bento-dim capitalize">
          {category}
        </div>
        <h4 className="text-[14px] font-semibold leading-snug tracking-tight md:text-[15px]">
          {title}
        </h4>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-bento-dim">
        <span>{date}</span>
        <span className="font-medium text-bento-ink">
          {readTime !== undefined ? `${readTime}m` : ''} <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
```

⚠️ 변경 노트:
- `date`, `readTime` props 추가 (date 는 required, readTime 옵셔널)
- 하단 footer: date (좌) + "{readTime}m →" (우)
- min-h 살짝 크게

- [ ] **Step 2: `components/home/featured-card.tsx` 전면 재작성**

prototype 매칭: 상단 한 줄 ★ FEATURED · category · date · {readTime} min read / 본문 제목 + excerpt (tags 없음, sub#11에서 추가했던 거 제거) / 하단 우측 Read article → CTA.

```tsx
import Link from 'next/link';

type Props = {
  href: string;
  title: string;
  category: string;
  date: string;
  excerpt?: string;
  readTime?: number;
};

export function FeaturedCard({ href, title, category, date, excerpt, readTime }: Props) {
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
        <div className="mb-6 flex flex-wrap items-center gap-2 text-[11px] text-white/70">
          <span className="rounded-full bg-bento-accent px-3 py-1 font-semibold uppercase tracking-wider text-white">
            ★ Featured
          </span>
          <span className="capitalize">{category}</span>
          <span aria-hidden="true">·</span>
          <span>{date}</span>
          {readTime !== undefined && (
            <>
              <span aria-hidden="true">·</span>
              <span>{readTime} min read</span>
            </>
          )}
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
      <div className="relative flex justify-end">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-bento-accent px-5 py-2.5 text-[13px] font-semibold text-white">
          Read article
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
```

⚠️ 변경 노트:
- `tags` prop 제거 (prototype Featured 에 tags 칩 없음)
- 상단 한 줄: ★ Featured · category · date · {readTime} min read
- 하단 우측 정렬: Read article → CTA
- excerpt 는 본문 영역

- [ ] **Step 3: 커밋 (build/check SKIP)**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add components/home/recent-card.tsx components/home/featured-card.tsx && git commit -m "$(cat <<'EOF'
feat(home): Recent + Featured 카드 메타 강화 (prototype 매칭)

* RecentCard: date + "{readTime}m →" 하단 footer 추가
  — date prop required, readTime prop optional
* FeaturedCard: 상단 한 줄 ★ Featured · category · date · {readTime} min read 정렬
  — sub#11 에서 추가했던 tags 칩 제거 (prototype 에 없음)
  — Read article → CTA 는 하단 우측 단독
* page.tsx 통합은 Task 4

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: page.tsx 통합

**Files:**
- Modify: `app/page.tsx`

⚠️ 단 1개 파일. 빌드가 반드시 성공해야 함.

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
import { QuoteCard } from '@/components/home/quote-card';
import { WideLatestList } from '@/components/home/wide-latest-list';

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

  let streakWeeks = 0;
  for (let w = HEATMAP_WEEKS - 1; w >= 0; w--) {
    const weekDays = days.slice(w * 7, w * 7 + 7);
    const hasPost = weekDays.some((d) => d.count > 0);
    if (hasPost) streakWeeks += 1;
    else break;
  }

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

  const firstYear = articles
    .map((a) => new Date(a.date).getFullYear())
    .filter((y) => !isNaN(y))
    .reduce((acc, y) => Math.min(acc, y), new Date().getFullYear());
  const yearsWriting = Math.max(1, new Date().getFullYear() - firstYear);

  const featured = articles[0];
  const latest = articles.slice(1, 5);
  const recent = articles.slice(5, 9);
  const wideLatest = articles.slice(9, 13);

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
            readTime={featured.readTime}
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
            date={formatDate(a.date)}
            readTime={a.readTime}
            tone={RECENT_TONES[i % RECENT_TONES.length]}
          />
        ))}

        {wideLatest.length > 0 && (
          <WideLatestList
            items={wideLatest.map((a) => ({
              slug: getArticleTitleFromSlug(a.slug),
              title: a.title,
              category: a.category,
              date: a.date,
              readTime: a.readTime,
            }))}
            totalCount={totalCount}
          />
        )}

        <QuoteCard
          lines={[
            '잘 정리된 노트는',
            '미래의 나에게 보내는',
            '가장 좋은 선물.',
          ]}
          attribution="— writing principle"
        />
      </section>
    </main>
  );
}
```

⚠️ 변경 노트:
- imports: `QuoteCard`, `WideLatestList` 신규
- `wideLatest = articles.slice(9, 13)` (Recent 다음 4편)
- `FeaturedCard` 에 `readTime` prop, `tags` 제거
- `RecentCard` 에 `date`, `readTime` props 추가
- 마지막 행: WideLatest (col-8) + QuoteCard (col-4)

- [ ] **Step 2: 빌드 + 타입 검사 (반드시 성공)**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력. 에러 시 BLOCKED.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. 1097 페이지.

- [ ] **Step 3: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add app/page.tsx && git commit -m "$(cat <<'EOF'
feat(home): page.tsx 통합 — WideLatestList + QuoteCard + 카드 메타 props

* import: QuoteCard, WideLatestList 추가
* wideLatest = articles.slice(9, 13) — Recent 다음 4편
* FeaturedCard 에 readTime prop, tags prop 제거 (prototype 매칭)
* RecentCard 에 date + readTime props 추가
* 마지막 행: WideLatest (col-8) + Quote (col-4)
* Quote 콘텐츠 placeholder: "잘 정리된 노트는 / 미래의 나에게 보내는 / 가장 좋은 선물."

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: 검증

**Files:** (변경 없음)

- [ ] **Step 1: 타입 검사 + 빌드 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check && npm run build
```

기대: 빈 출력 + 빌드 성공.

- [ ] **Step 2: 컨트롤러 시각 확인**

`npx serve out -l 3000` 후 `/`:
- Featured 카드: 상단 ★ Featured · {cat} · {date} · {N} min read + 우하단 Read article → CTA
- Recent 카드 (4장): 하단 {date} + {N}m → 메타라인
- WideLatestList: "Latest / 이번 달 글" + 4 articles compact list (date · title · category · readTime) + "See all 178 →"
- QuoteCard: dark + 큰 accent 따옴표 + "잘 정리된 노트는 / 미래의 나에게 보내는 / 가장 좋은 선물." + "— writing principle"

- [ ] **Step 3: 브랜치 상태**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git log --oneline feature/redesign-bento ^main | wc -l
```

기대: 약 60개 (sub#1~#11 의 55 + sub#12 의 5).

---

## Self-Review Notes

### 누락 항목 커버
- ✅ readTime manifest 추가 → Task 1
- ✅ Quote card → Task 2 + 4
- ✅ Wide Latest list "이번 달 글" → Task 2 + 4
- ✅ Recent cards 메타 (date + readTime + arrow) → Task 3 + 4
- ✅ Featured 카드 meta line 재배치 (한 줄) + tags 제거 → Task 3 + 4

### Placeholder scan
TBD/TODO 없음.

### Type consistency
- `ArticleMetadata.readTime?: number` (script) ↔ `ManifestArticle.readTime?: number` (lib) ↔ FeaturedCard/RecentCard/WideLatestList `readTime?: number` props
- `wideLatest = articles.slice(9, 13)` (4편)
- `QuoteCard lines: string[]` 일관

### 외부 의존성 사전 검증
- `gray-matter` (이미 의존성), `calculateReadingTime` 로직 200 wpm (inline)
- 모든 home 컴포넌트 import 일관 (`@/components/home/*`)

### 의도된 단순화
- Quote 콘텐츠: prototype placeholder 그대로. 사용자가 후에 본인 글귀로 교체 가능.
- "이번 달 글" 라벨: prototype 그대로 유지하지만 실제 데이터는 "최근 9~12번째 글". 의미 mismatch 가능하나 prototype 매칭 우선.
- Heatmap 26주 ("Last 12 months" 라벨): sub#11 의 동일 의미 미스매치 — 그대로 유지.

### Risks 및 완화
- **Manifest 재생성 시간 증가**: 178개 글 본문 word count 계산은 미세. ~수백 ms 추가. 안전.
- **wideLatest 빈 배열**: 글 13개 미만이면 빈 배열 → `if (wideLatest.length > 0)` 가드.
- **모바일 WideLatest grid**: `grid-cols-[60px_1fr_80px_50px]` 가 모바일 (375px) 에서 좁음. 4-col 유지하되 column 폭만 자동 조정. 자연스러운 fit. 더 좁으면 readTime 칸 hidden 검토.
