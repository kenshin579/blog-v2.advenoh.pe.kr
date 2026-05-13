# Sub-project #7: 시리즈 인덱스 + `/series/[slug]` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/series` 인덱스 페이지를 Bento 디자인(시리즈마다 lavender 카드)으로 리디자인하고, `/series/[slug]` 상세 페이지를 신규 추가 (Hero + 에피소드 리스트). 홈 Series spotlight 카드 클릭 시 임시 404 였던 것 해소.

**Architecture:** 두 페이지 모두 server component. `lib/url.ts` 신규 — `seriesSlug` / `categorySlug` 헬퍼를 한 곳에 모으고 기존 inline 호출(`app/page.tsx`, `components/home/categories-card.tsx`)을 교체 (sub#4 code review M5 follow-up). `/series` 인덱스는 시리즈마다 lavender 카드 한 장 (이름 + 편수 + 최신 에피소드). `/series/[slug]` 상세는 lavender Hero + 에피소드 vertical list (번호 원 + 제목 + 날짜 + excerpt).

**Tech Stack:** Next.js 16 App Router (server components), `lib/articles.ts` (`getAllSeries`, `getArticlesBySeries`, `getArticleTitleFromSlug`), `lib/utils.ts` (`formatDate`), 신규 `lib/url.ts`.

**브랜치:** `feature/redesign-bento` 위에서 누적. main 직접 커밋 금지.

**참고 문서:**
- spec: `docs/superpowers/specs/2026-05-13-blog-v2-bento-redesign-design.md` (§9.2 시리즈)
- 기존 인덱스: `app/series/page.tsx` (shadcn 카드 그리드, 모든 글을 풀어서 표시)
- prototype 참고: `docs/design/blog-v3-bento/app/series/[slug]/page.tsx`
- sub#4 code review M5 (lib/url.ts 추출 권장)

---

## Files Touched

### Task 1 — `lib/url.ts` 추출 + 기존 호출자 업데이트
- Create: `lib/url.ts` — `seriesSlug(name)` + `categorySlug(name)` 헬퍼
- Modify: `app/page.tsx` — inline `seriesSlug` 함수 제거, import 로 교체
- Modify: `components/home/categories-card.tsx` — inline `c.name.toLowerCase()` → `categorySlug(c.name)`

### Task 2 — `/series` 인덱스 리디자인
- Modify: `app/series/page.tsx` — 전면 재작성 (shadcn → Bento lavender 카드 그리드)

### Task 3 — `/series/[slug]` 신규
- Create: `app/series/[slug]/page.tsx` — Hero (lavender) + 에피소드 리스트

### Task 4 — 검증
(변경 없음)

---

## Design Decisions

### 1. 슬러그 함수 단일 출처
`lib/url.ts` 에 정의. 함수명 / 시그니처 (`seriesSlug(name: string): string`, `categorySlug(name: string): string`) 는 기존 inline 정의와 동일. 동작도 동일 (lowercase + 공백 → hyphen for series, lowercase for category). 따라서 호출자 변경은 mechanical import 교체만.

### 2. `/series` 카드 디자인
모든 시리즈를 한 줄씩 lavender 톤 카드로 표시. spec §9.2 의 "시리즈마다 lavender 톤 카드 통일" 선택.

각 카드 내용:
- eyebrow: "Series" (uppercase tracking)
- h3: 시리즈 이름
- 메타: 편수 ("5편 발행")
- 최신 에피소드: 제목 + 날짜
- 전체 카드가 `/series/[slug]` 링크

그리드: `col-span-12 md:col-span-6` (2 per row on desktop, 1 per row on mobile).

### 3. `/series/[slug]` 상세 디자인
- Hero (lavender, rounded-card-xl): "Series" eyebrow + 시리즈 이름 h1 + "N편 발행"
- 본문: 에피소드 리스트 — seriesOrder asc 정렬. 각 row: 번호 원 (ink bg, 흰 텍스트) + 제목 + 날짜 + (있다면) excerpt. 클릭 → article 페이지.
- 리스트는 단순 vertical (그리드 아님, 시리즈 순서 명확)

### 4. 빈 시리즈 처리
slug 가 매치 안 되면 `notFound()`. `generateStaticParams` 가 모든 시리즈를 빌드하므로 실제로는 unreachable.

### 5. 에피소드 정렬
`getArticlesBySeries` 의 반환 ordering 신뢰하지 않고 `seriesOrder` asc 로 명시 정렬. `seriesOrder` 가 없으면 fallback 으로 date asc 사용.

### 6. URL 인코딩
시리즈 이름은 영문 + 한글 혼합 가능. slug 는 lowercase 영문 + hyphen (현재 "Golang Concurrency" → "golang-concurrency", "MQTT v5" → "mqtt-v5"). 한글 시리즈 이름은 slug 생성 시 그대로 들어감 (encodeURIComponent 로 URL 안전 처리).

### 7. 헤더 카피
- 인덱스: "Series" eyebrow + h1 "Series" + "{N}개의 시리즈"
- 상세: "Series" eyebrow + h1 "{name}" + "{N}편 발행"

---

## Tailwind Dynamic-Class Note

모든 className 정적 문자열. safelist 불필요.

---

### Task 1: `lib/url.ts` 추출 + 기존 호출자 업데이트

**Files:**
- Create: `lib/url.ts`
- Modify: `app/page.tsx`
- Modify: `components/home/categories-card.tsx`

⚠️ 정확히 3개 파일 (1 신규 + 2 수정). 다른 파일 절대 touch 금지.

- [ ] **Step 1: `lib/url.ts` 생성**

```ts
// URL slug 헬퍼.
// sub#7 에서 inline 정의를 단일 출처로 추출.

export function seriesSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export function categorySlug(name: string): string {
  return name.toLowerCase();
}
```

- [ ] **Step 2: `app/page.tsx` 수정 — inline `seriesSlug` 제거 + import 추가**

기존 (line 14~16 근처, 정확한 위치는 read 로 확인):

```ts
function seriesSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}
```

→ 삭제. 그리고 imports 영역에 추가:

```ts
import { seriesSlug } from '@/lib/url';
```

기존 `seriesSlug(spotlightName)` 호출은 동일 함수명이므로 변경 없음.

- [ ] **Step 3: `components/home/categories-card.tsx` 수정 — `categorySlug` 사용**

`components/home/categories-card.tsx` 의 Link href 부분을 다음으로 교체:

기존:
```tsx
href={`/category/${encodeURIComponent(c.name.toLowerCase())}`}
```

→

```tsx
href={`/category/${encodeURIComponent(categorySlug(c.name))}`}
```

그리고 imports 영역에 추가:

```ts
import { categorySlug } from '@/lib/url';
```

- [ ] **Step 4: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력. 에러 시 quote + BLOCKED.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. 빌드 페이지 수 동일 (205).

- [ ] **Step 5: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add lib/url.ts app/page.tsx components/home/categories-card.tsx && git commit -m "$(cat <<'EOF'
refactor(url): lib/url.ts 추출 — seriesSlug + categorySlug 단일 출처

* lib/url.ts 신규 — sub#4 code review M5 follow-up
* app/page.tsx: inline seriesSlug 제거, import 로 교체
* components/home/categories-card.tsx: c.name.toLowerCase() → categorySlug(c.name)
* sub#7 시리즈 페이지에서도 동일 헬퍼 재사용 예정
* 행동 동일 (mechanical refactor), 빌드 결과 변동 없음

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `/series` 인덱스 리디자인

**Files:**
- Modify: `app/series/page.tsx`

⚠️ 단 1개 파일 수정. 기존 shadcn imports (Card, Badge, Separator) 모두 제거. lib/url.ts 의 seriesSlug 사용.

- [ ] **Step 1: `app/series/page.tsx` 전면 재작성**

`app/series/page.tsx` 의 전체 내용을 다음으로 덮어쓴다:

```tsx
import Link from 'next/link';
import { getAllSeries, getArticlesBySeries, getArticleTitleFromSlug } from '@/lib/articles';
import { seriesSlug } from '@/lib/url';
import { formatDate } from '@/lib/utils';

export const metadata = {
  title: "Series | Frank's IT Blog",
  description: '시리즈별로 정리된 기술 블로그 글 모음',
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export default async function SeriesPage() {
  const seriesNames = await getAllSeries();

  // 각 시리즈의 에피소드 + 메타 집계
  const seriesData = await Promise.all(
    seriesNames.map(async (name) => {
      const eps = await getArticlesBySeries(name);
      const sorted = eps.slice().sort(
        (a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0),
      );
      const byDateDesc = eps.slice().sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      const latest = byDateDesc[0];
      return {
        name,
        slug: seriesSlug(name),
        count: sorted.length,
        latestTitle: latest?.title ?? '',
        latestDate: latest?.date ?? '',
      };
    }),
  );

  // 최신 에피소드 날짜 desc 정렬
  seriesData.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <header className="mx-auto max-w-canvas px-6 pt-8 md:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-bento-dim">
          Series
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tighter text-bento-ink md:text-4xl">
          Series
        </h1>
        <p className="mt-2 text-sm text-bento-dim">
          {seriesData.length}개의 시리즈
        </p>
      </header>

      {seriesData.length === 0 ? (
        <section className="mx-auto max-w-canvas px-6 py-20 text-center text-bento-dim md:px-10">
          등록된 시리즈가 없습니다.
        </section>
      ) : (
        <section className="mx-auto mt-8 grid max-w-canvas grid-cols-12 gap-3 px-6 md:gap-4 md:px-10">
          {seriesData.map((s) => (
            <Link
              key={s.name}
              href={`/series/${encodeURIComponent(s.slug)}`}
              className={[
                'col-span-12 flex flex-col rounded-card-xl bg-bento-lavender p-6 text-bento-ink no-underline md:col-span-6 md:p-7',
                FOCUS_RING,
              ].join(' ')}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.1em] opacity-60">Series</span>
                <span className="text-xs text-bento-dim">{s.count}편</span>
              </div>
              <h2 className="mb-4 text-xl font-bold tracking-tighter md:text-2xl">{s.name}</h2>
              {s.latestTitle && (
                <div className="mt-auto border-t border-bento-ink/10 pt-3">
                  <div className="text-[10px] uppercase tracking-wider text-bento-dim">Latest</div>
                  <div className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug">
                    {s.latestTitle}
                  </div>
                  {s.latestDate && (
                    <div className="mt-1 text-[11px] text-bento-dim">
                      {formatDate(s.latestDate)}
                    </div>
                  )}
                </div>
              )}
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
```

⚠️ `getArticleTitleFromSlug` 는 더 이상 사용 안 함 (인덱스 카드는 시리즈 단위, article 페이지 직접 링크 안 함). import 에서 제외.

⚠️ shadcn imports (Card, Badge, Separator) 모두 제거.

⚠️ "← 홈으로 돌아가기" 버튼 제거 — 헤더 nav 가 대체.

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
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add app/series/page.tsx && git commit -m "$(cat <<'EOF'
feat(series): /series 인덱스 리디자인 — lavender 카드 그리드

* shadcn Card/Badge/Separator 제거 → Bento lavender 카드
* 시리즈마다 카드 1장 (col-span-12 md:col-span-6)
  — Series eyebrow + 시리즈 이름 h2 + "N편" + 최신 에피소드 메타
* 최신 에피소드 날짜 desc 정렬
* 카드 클릭 → /series/[slug] (sub#7 Task 3 에서 페이지 신설)
* "← 홈으로 돌아가기" 버튼 제거 (헤더 nav 가 대체)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `/series/[slug]` 상세 페이지 신규

**Files:**
- Create: `app/series/[slug]/page.tsx`

⚠️ 신규 1개 파일만 생성. 다른 파일 절대 touch 금지.

- [ ] **Step 1: 디렉토리 + 파일 생성**

```bash
mkdir -p "/Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/app/series/[slug]"
```

`app/series/[slug]/page.tsx` 의 전체 내용:

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

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

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

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <section className="mx-auto max-w-canvas px-6 pt-4 md:px-10">
        <div className="rounded-card-xl bg-bento-lavender p-6 text-bento-ink md:p-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] opacity-60">
            Series
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tighter md:text-5xl">
            {matched}
          </h1>
          <p className="mt-3 text-sm opacity-75 md:text-base">
            {sorted.length}편 발행
          </p>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-prose px-6 md:px-0">
        <ul className="flex flex-col gap-3">
          {sorted.map((ep, idx) => {
            const titlePart = getArticleTitleFromSlug(ep.slug);
            const epNum = ep.seriesOrder ?? idx + 1;
            return (
              <li key={ep.slug}>
                <Link
                  href={`/${encodeURIComponent(titlePart)}`}
                  className={[
                    'flex items-start gap-4 rounded-card-lg border border-bento-ink/10 bg-bento-card p-5 no-underline text-bento-ink transition hover:bg-bento-ink/[0.03] dark:border-white/10 dark:hover:bg-white/[0.03]',
                    FOCUS_RING,
                  ].join(' ')}
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-bento-ink text-sm font-bold text-white">
                    {epNum}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold leading-snug tracking-tight md:text-lg">
                      {ep.title}
                    </h2>
                    {ep.excerpt && (
                      <p className="mt-2 text-sm leading-relaxed text-bento-dim line-clamp-2">
                        {ep.excerpt}
                      </p>
                    )}
                    <div className="mt-3 text-[11px] text-bento-dim">
                      {formatDate(ep.date)}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. 라우트 목록에 `● /series/[slug]` 표시. 시리즈 N개 정적 빌드 (현재 manifest 의 시리즈 수에 따라 약 10~15개).

```bash
ls /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/out/series/ 2>&1 | head -20
```

기대: `index.html` (인덱스 페이지) + 시리즈별 디렉토리 (예: `golang-concurrency/index.html`).

- [ ] **Step 3: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add "app/series/[slug]" && git commit -m "$(cat <<'EOF'
feat(series): /series/[slug] 상세 페이지 신규

* Hero (lavender, rounded-card-xl): Series eyebrow + 시리즈 이름 h1 + "N편 발행"
* 본문: 에피소드 vertical list (max-prose), seriesOrder asc 정렬
  — 번호 원 (ink bg, 흰 텍스트) + 제목 + excerpt + 날짜
* generateStaticParams 로 모든 시리즈 정적 빌드
* 매치 안 되는 슬러그 → notFound()
* 홈 Series spotlight 카드 + /series 인덱스 카드 클릭 시 임시 404 였던 것 해소

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: 회귀 검증

**Files:** (변경 없음)

- [ ] **Step 1: 타입 검사 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

- [ ] **Step 2: 프로덕션 빌드 최종**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
```

기대: 성공. 빌드 페이지 수 = 205 + 시리즈 개수 (~10~15) = 약 215~220.

- [ ] **Step 3: 빌드 산출물 확인**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
test -f out/series/index.html && echo "index OK" || echo "index MISSING"
ls out/series/ | head -10
```

기대: index OK + 시리즈 디렉토리들.

- [ ] **Step 4: 컨트롤러 시각 확인 (subagent SKIP)**

`npm start` 후 확인:

`/series/` (인덱스):
- 헤더: "Series" eyebrow + h1 "Series" + "{N}개의 시리즈"
- lavender 카드 grid (col-span-12 md:col-span-6): 각 시리즈 1장
  - eyebrow "Series" + 우측 편수 ("5편")
  - h2 시리즈 이름
  - 하단: Latest 라벨 + 최신 에피소드 제목 + 날짜
- 카드 클릭 → `/series/[slug]` 정상 이동 (이전엔 404)

`/series/golang-concurrency/` (또는 다른 정적 빌드 슬러그):
- Hero (lavender, 큰 카드): Series eyebrow + h1 "Golang Concurrency" + "5편 발행"
- 본문: 5개 에피소드 vertical list (max-prose)
  - 번호 원 (ink + 흰 글자) + 제목 + excerpt + 날짜
  - 클릭 → 해당 article 페이지
- 모바일: 헤더/본문 패딩 축소, 카드 1열 stack

홈 → Series spotlight 카드 클릭 → `/series/[slug]` 정상 이동 (이전엔 404).

- [ ] **Step 5: 브랜치 상태 확인**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git log --oneline feature/redesign-bento ^main | head -35
```

기대: sub#1~#6 의 30 + sub#7 의 4 = 약 34 커밋.

---

## Self-Review Notes

### Spec coverage (§9.2)
- `/series` 인덱스 리디자인 → Task 2 ✓
  - 헤더 + 시리즈 개수 ✓
  - 시리즈마다 lavender 카드 (h3, 편수, 최신 에피소드 제목+날짜) ✓
- `/series/[slug]` 신규 → Task 3 ✓
  - Hero (lavender) + 시리즈 이름 + 진행 메타 ✓
  - 본문 에피소드 리스트 (seriesOrder asc) — 번호 원 + 제목 + 날짜 + excerpt ✓
  - generateStaticParams ✓
  - 슬러그 `seriesSlug(name)` ✓

### Placeholder scan
TBD/TODO 없음. 모든 코드 완성형.

### Type consistency
- `seriesSlug` 함수 시그니처 `(name: string) => string` — Task 1, 2, 3 일관
- `getArticlesBySeries` 반환 셰이프 — Task 2, 3 동일 (`ManifestArticle[]`)
- 에피소드 정렬: 양쪽 페이지 모두 `seriesOrder asc` (Task 2 인덱스는 추가로 date desc 로 카드 정렬에 사용)

### 외부 의존성 사전 검증
- `getAllSeries`, `getArticlesBySeries`, `getArticleTitleFromSlug` — `lib/articles.ts` 존재 ✓
- `formatDate` — `lib/utils.ts` 존재 ✓
- bento-* 토큰 — sub#1 ✓
- `lib/url.ts` — Task 1 에서 신규 추가 ✓

### Decoupling
- Task 1 의 url.ts 추출이 sub#8 (태그 detail) 에서 재사용 가능 (만약 `tagSlug` 추가 필요 시 같은 파일에 함수만 추가)
- 시리즈 페이지들은 ManifestArticle 직접 의존 (다른 컴포넌트 없이 페이지 안에서 직접 매핑)

### Risks 및 완화
- **빈 시리즈** (manifest 에 시리즈 이름은 있지만 에피소드 0개): `notFound()` 가드. 인덱스에서는 `s.count === 0` 시 자동으로 latestTitle 비어 있어 화면에 표시 안 됨.
- **빌드 시간**: 시리즈 detail 페이지 ~10~15개 추가로 빌드 시간 거의 영향 없음.
- **슬러그 충돌**: 두 시리즈 이름이 동일한 slug 로 변환되는 경우 — 현재 manifest 에 그런 케이스 없음 (서로 다른 영문 이름들). 충돌 발생 시 `generateStaticParams` 가 중복 entry 만들 수 있으나 Next.js 가 첫 번째만 빌드. 방어 코드 불필요.
- **모바일 Hero 텍스트 잘림**: 시리즈 이름이 길면 (예: "MQTT v5 완벽 가이드") `md:text-5xl` 에서 줄바꿈 가능. 의도된 동작 (자연스러운 wrap).
