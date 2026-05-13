# Sub-project #6: 카테고리 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 신규 라우트 `/category/[name]` 추가. 카테고리별 글 Bento 그리드 (첫 번째 글 = dark Featured, 나머지 = 4가지 톤 순환). 홈 Categories 칩 클릭 시 임시 404 였던 것 해소.

**Architecture:** server component 단일 파일 (`app/category/[name]/page.tsx`). `generateStaticParams` 로 모든 카테고리 정적 빌드. 첫 번째 글은 dark Featured 카드 (col-span-12), 나머지는 sage/butter/rose/cream 순환 (col-span-6 md:col-span-3). 별도 컴포넌트 추출 없이 페이지 안에서 인라인 — sub#7/#8 의 유사 패턴이 등장하면 추후 공통 컴포넌트로 추출 검토.

**Tech Stack:** Next.js 16 App Router (server component), `lib/articles.ts` (`getAllArticles`, `getArticlesByCategory`, `getArticleTitleFromSlug`), `lib/utils.ts` (`formatDate`).

**브랜치:** `feature/redesign-bento` 위에서 누적. main 직접 커밋 금지.

**참고 문서:**
- spec: `docs/superpowers/specs/2026-05-13-blog-v2-bento-redesign-design.md` (§9.1 카테고리)
- 홈 컴포넌트 패턴: `components/home/featured-card.tsx`, `components/home/recent-card.tsx` (style 참고)
- 카테고리 URL 패턴: sub#4 의 CategoriesCard / sub#7~#8 의 다른 라우트와 일치

---

## Files Touched

- Create: `app/category/[name]/page.tsx`

---

## Design Decisions

### 1. 카테고리 정규화
홈 Categories 칩의 `href` 는 `/category/${encodeURIComponent(c.name.toLowerCase())}`. URL 의 `name` 은 lowercase 영문 (현재 카테고리: ai, algorithm, biweekly, cloud, database, devops, git, go, java, javascript, linux, mac, network, node, python, ros, spring, web). `getArticlesByCategory` 가 case-sensitive 비교를 하므로 manifest 의 정확한 카테고리 문자열을 사용해야 함. 현재 manifest 의 카테고리는 모두 lowercase 라 lowercase 그대로 사용.

### 2. `generateStaticParams`
`getAllArticles()` 에서 카테고리 deduplication 후 lowercase 정적 빌드.

### 3. dynamicParams
`dynamicParams = false` 명시 — `output: 'export'` + `trailingSlash: true` 환경에서 정적 export 필수 설정.

### 4. 빈 카테고리 처리
URL 의 `name` 이 어느 카테고리와도 매치 안 되면 `notFound()`. 하지만 `generateStaticParams` 가 알고 있는 카테고리만 빌드되므로 실제로는 unreachable (방어 코드).

### 5. 정렬
`getArticlesByCategory` 반환을 `date desc` 로 정렬 — manifest 정렬을 신뢰하지 않고 페이지에서 명시. 첫 번째가 가장 최근 글.

### 6. Featured 처리
articles 개수가 1개면 Featured 만 표시. 0개면 아예 unreachable (위 §4).

### 7. URL 인코딩 (Korean 안전)
헤더 카테고리 출력은 `decoded` 사용. URL 인코딩 / 디코딩 일관성.

---

## Tailwind Dynamic-Class Note

톤 매핑은 정적 배열 (`const TONES = ['sage', 'butter', 'rose', 'cream'] as const`) + `TONE_BG` 맵으로 처리. dynamic safelist 불필요.

---

### Task 1: `/category/[name]` 페이지 구현

**Files:**
- Create: `app/category/[name]/page.tsx`

⚠️ 신규 1개 파일만 생성. 다른 파일 절대 touch 금지.

- [ ] **Step 1: 디렉토리 + 파일 생성**

```bash
mkdir -p "/Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/app/category/[name]"
```

`app/category/[name]/page.tsx` 의 전체 내용:

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getAllArticles,
  getArticlesByCategory,
  getArticleTitleFromSlug,
} from '@/lib/articles';
import { formatDate } from '@/lib/utils';

interface PageProps {
  params: Promise<{ name: string }>;
}

export const dynamicParams = false;

const TONES = ['sage', 'butter', 'rose', 'cream'] as const;
type Tone = (typeof TONES)[number];
const TONE_BG: Record<Tone, string> = {
  sage: 'bg-bento-sage',
  butter: 'bg-bento-butter',
  rose: 'bg-bento-rose',
  cream: 'bg-bento-cream',
};

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

  // Find the exact category name in manifest (preserves original case if any)
  const all = await getAllArticles();
  const matchedCategory = all.find(
    (a) => a.category.toLowerCase() === decoded,
  )?.category;
  if (!matchedCategory) notFound();

  const articles = (await getArticlesByCategory(matchedCategory)).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  if (articles.length === 0) notFound();

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <header className="mx-auto max-w-canvas px-6 pt-8 md:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-bento-dim">
          Category
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tighter text-bento-ink md:text-4xl">
          <span className="capitalize">{matchedCategory}</span>
        </h1>
        <p className="mt-2 text-sm text-bento-dim">
          {articles.length}편
        </p>
      </header>

      <section className="mx-auto mt-8 grid max-w-canvas grid-cols-12 gap-3 px-6 md:gap-4 md:px-10">
        {/* Featured: latest article — dark card spanning full width */}
        <Link
          href={`/${encodeURIComponent(getArticleTitleFromSlug(featured.slug))}`}
          className={[
            'relative col-span-12 flex min-h-[260px] flex-col justify-between overflow-hidden rounded-card-xl bg-bento-hero-dark p-8 text-white no-underline md:min-h-[320px] md:p-10',
            FOCUS_RING,
          ].join(' ')}
        >
          <div
            aria-hidden="true"
            className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-50"
            style={{ background: 'radial-gradient(circle, rgb(var(--bento-accent)) 0%, transparent 70%)' }}
          />
          <div className="relative">
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-bento-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
                Latest
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] capitalize">
                {matchedCategory}
              </span>
            </div>
            <h2 className="text-2xl font-bold leading-tight tracking-tighter md:text-3xl">
              {featured.title}
            </h2>
            {featured.excerpt && (
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75 md:text-base">
                {featured.excerpt}
              </p>
            )}
          </div>
          <div className="relative flex items-end justify-between text-xs text-white/70">
            <span>{formatDate(featured.date)}</span>
            <span aria-hidden="true">→</span>
          </div>
        </Link>

        {/* Rest: tinted cards cycling sage/butter/rose/cream */}
        {rest.map((a, i) => (
          <Link
            key={a.slug}
            href={`/${encodeURIComponent(getArticleTitleFromSlug(a.slug))}`}
            className={[
              'col-span-6 flex min-h-[140px] flex-col justify-between rounded-card-lg p-5 text-bento-ink no-underline md:col-span-3 md:min-h-[180px]',
              TONE_BG[TONES[i % TONES.length]],
              FOCUS_RING,
            ].join(' ')}
          >
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-wider text-bento-dim">
                {formatDate(a.date)}
              </div>
              <h3 className="text-[14px] font-semibold leading-snug tracking-tight md:text-[15px]">
                {a.title}
              </h3>
            </div>
            <div className="mt-3 text-[10px] text-bento-dim" aria-hidden="true">→</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
```

- [ ] **Step 2: 타입 검사**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력. 에러 시 quote + BLOCKED.

- [ ] **Step 3: 프로덕션 빌드 + 카테고리 산출물 확인**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 빌드 성공. 라우트 목록에 `● /category/[name]` (정적 빌드된 카테고리 N개) 표시.

```bash
ls /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/out/category/ 2>&1 | head -10
ls /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/out/category/cloud/ 2>&1 | head -3
```

기대: 18개 정도의 카테고리 디렉토리 (`ai`, `algorithm`, `biweekly`, `cloud`, `database`, ...) 각각 `index.html` 포함.

- [ ] **Step 4: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add app/category && git commit -m "$(cat <<'EOF'
feat(category): /category/[name] 신규 라우트 — Bento 톤 그리드

* generateStaticParams 로 18개 카테고리 정적 빌드
* 첫 번째(가장 최근) 글: dark Featured 카드 (col-span-12, accent radial)
* 나머지: 4가지 톤 순환 (sage/butter/rose/cream), col-span-6 md:col-span-3
* date desc 정렬 명시 (manifest 정렬 의존도 ↓)
* 매치 안 되는 카테고리 → notFound()
* 홈 Categories 칩 클릭 시 임시 404 였던 것 해소

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: 회귀 검증

**Files:** (변경 없음)

- [ ] **Step 1: 타입 검사 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

- [ ] **Step 2: 프로덕션 빌드 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. 빌드 로그에 `● /category/[name]` (정적 카테고리) + 기존 모든 라우트 그대로.

- [ ] **Step 3: 카테고리 라우트 sample 확인**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
ls out/category/ | head -10
test -f out/category/cloud/index.html && echo "cloud OK" || echo "cloud MISSING"
test -f out/category/go/index.html && echo "go OK" || echo "go MISSING"
test -f out/category/ai/index.html && echo "ai OK" || echo "ai MISSING"
```

기대: cloud OK / go OK / ai OK.

- [ ] **Step 4: 컨트롤러 시각 + 동작 확인 (subagent SKIP, controller 진행)**

`npm start` (또는 `npx serve out -l 3000`) 후 확인:

`/category/cloud/`:
- 헤더: "Category" eyebrow + h1 "Cloud" (capitalize) + "26편"
- 본문: 첫 번째 글이 dark Featured 카드 (full-width, accent radial), "LATEST" 뱃지 + "Cloud" 카테고리 뱃지
- 나머지 25개 글: 톤 순환 cards — 4개씩 (sage/butter/rose/cream) 7행 (모바일에선 2개씩 2열)
- 각 카드 클릭 → 해당 article 페이지로 이동

`/category/go/`:
- 동일 패턴, 30편

`/category/ai/`:
- 동일 패턴, ~8편

모바일 viewport (<768px):
- Featured: col-span-12 그대로, padding 축소
- 나머지: col-span-6 (2열)

다크 모드:
- 모든 카드 정상 전환 (lavender → dark lavender, cream → dark cream 등)

홈에서 통합 확인:
- 홈 (`/`) → Categories 칩 (`Cloud 26` 등) 클릭 → `/category/cloud/` 정상 이동 (이전엔 404 였음)

- [ ] **Step 5: 브랜치 상태 확인**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git log --oneline feature/redesign-bento ^main | head -32
```

기대: sub#1~#5 의 28 + sub#6 의 2 = 약 30 커밋.

---

## Self-Review Notes

### Spec coverage (§9.1)
- 신규 `/category/[name]` 라우트 → Task 1 ✓
- 헤더 (카테고리 이름 + 글 개수) → header 섹션 ✓
- Bento 톤 카드 그리드 (이미지 없음) → Featured + tinted grid ✓
- 4가지 톤 순환 + 첫 번째 dark Featured → TONES 배열 + featured 분리 ✓
- generateStaticParams → 정적 빌드 ✓
- 슬러그: lowercase → `c.category.toLowerCase()` ✓
- `/category` 인덱스 없음 → 별도 페이지 안 만듦 ✓

### Placeholder scan
TBD/TODO 없음. 모든 코드 완성형.

### Type consistency
- `getArticlesByCategory` 반환은 `ManifestArticle[]`, sort 후 `articles` 변수
- `featured`, `rest` 모두 동일 타입 (`ManifestArticle` 셰이프)
- `formatDate` ISO 문자열 받아 yyyy.MM.dd 반환 — 일관

### 외부 의존성 사전 검증
- `getAllArticles`, `getArticlesByCategory`, `getArticleTitleFromSlug` — `lib/articles.ts` 존재 ✓
- `formatDate` — `lib/utils.ts` 존재 ✓
- `next/navigation` `notFound` — 표준 ✓
- bento-* 토큰 — sub#1 에서 정의 ✓

### Decoupling
- 페이지 1개 파일에 모든 UI inline — sub#7 (series detail), sub#8 (tags detail) 에서 유사 패턴 등장 시 공통 컴포넌트 추출 검토 (`components/listing/featured-card.tsx`, `components/listing/tinted-card.tsx` 등)
- 컴포넌트 추출 안 한 이유: 카테고리/시리즈/태그 페이지의 디자인 변형 가능성 (시리즈는 episode list, 태그는 다른 정렬 등) — YAGNI

### Risks 및 완화
- **카테고리 이름 대소문자**: manifest 가 lowercase 영문이라 가정. 만약 대문자 들어가면 `matchedCategory` 찾기에서 lowercase 비교로 보호.
- **빈 카테고리**: `articles.length === 0` 가드. 실제로는 `generateStaticParams` 가 articles 있는 카테고리만 빌드하므로 unreachable.
- **태그/시리즈 detail 라우트**: 본 sub-project 와 무관. sub#7/#8 에서 별도 처리.
- **홈 Series spotlight 자동 선정 변경**: 영향 없음 (별도 데이터 source).
- **모바일 Featured 가독성**: min-h 모바일 260px 로 줄임 (homepage Featured 의 320px 보다 작게) — 카테고리 페이지는 Featured 외 다른 카드도 많아 너무 큰 hero 불필요.
