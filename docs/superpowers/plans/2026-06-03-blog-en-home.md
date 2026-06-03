# 영어 홈 페이지 (Plan 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** `/en/` 홈을 한국어 홈(`app/page.tsx`)과 동일한 bento 레이아웃으로 완성한다 — 영어 데이터, 현지화 라벨, `/en` 링크. (현재 영어 글 135건으로 위젯이 충분히 채워짐)

**Architecture:** `app/en/page.tsx`를 `app/page.tsx` 기반으로 미러링하되 모든 데이터 조회에 `'en'`을 쓰고, href는 `/en` prefix. 홈 위젯 대부분은 `href`를 prop으로 받으므로 페이지에서 `/en` 링크를 넘기면 된다. 링크/라벨을 하드코딩한 3개 위젯(`wide-latest-list`, `categories-card`, `latest-card`)에만 선택적 `basePath`(기본 `''`)와 라벨 prop(기본 한국어)을 추가한다. QOTD(QuoteSection)는 한국어 명언 기반이라 영어 홈에서 제외.

**Tech Stack:** Next.js App Router(static export), TS. 검증: `npm run check`, `npm run build`, `npm run dev`.

---

## File Structure

- `components/home/wide-latest-list.tsx` — 수정: `basePath?=''` + `heading?` 라벨 prop("이번 달 글")
- `components/home/categories-card.tsx` — 수정: `basePath?=''` + 문구 prop(또는 영어 분기)
- `components/home/latest-card.tsx` — 수정: `basePath?=''` + `subtitle?` 라벨 prop("격주에 한 편씩")
- `app/en/page.tsx` — 교체: 최소 홈 → 한국어 홈 전체 미러(영어판)

---

## Task 1: 링크/라벨 하드코딩 위젯 3종에 prop 추가

**Files:** `components/home/wide-latest-list.tsx`, `components/home/categories-card.tsx`, `components/home/latest-card.tsx`

각 위젯에 선택적 prop을 추가하되 **기본값은 현재 한국어 동작과 동일**(한국어 홈 무변경).

- [ ] **Step 1: wide-latest-list.tsx**
  - Props에 `basePath?: string` (기본 `''`), `heading?: string` (기본 `'이번 달 글'`) 추가.
  - 33행 텍스트 `이번 달 글` → `{heading}`.
  - 37행 `href="/posts"` → `` href={`${basePath}/posts`} ``; 50행 `` href={`/${encodeURIComponent(a.slug)}`} `` → `` href={`${basePath}/${encodeURIComponent(a.slug)}`} ``.

- [ ] **Step 2: latest-card.tsx**
  - Props에 `basePath?: string` (기본 `''`), `subtitle?: string` (기본 `'격주에 한 편씩'`) 추가.
  - 17행 `격주에 한 편씩` → `{subtitle}`; 24행 slug href에 `${basePath}` prefix.

- [ ] **Step 3: categories-card.tsx**
  - Props에 `basePath?: string` (기본 `''`) 추가; 29행 `` href={`/category/${encodeURIComponent(categorySlug(c.name))}`} `` → `${basePath}` prefix.
  - 22-23행 한글 문구(`{totalCount}편을 {categories.length}개의 결로`)는 선택적 prop `caption?: React.ReactNode`로 빼서 기본값을 현재 한글 JSX로 두고, 영어 페이지에서 영어 문구를 넘길 수 있게 한다. (기본값 유지로 한국어 홈 무변경)

- [ ] **Step 4: 타입 체크**

Run: `npm run check`
Expected: 통과 (기본값으로 한국어 홈 무영향).

- [ ] **Step 5: 커밋**

```bash
git add components/home/wide-latest-list.tsx components/home/latest-card.tsx components/home/categories-card.tsx
git commit -m "feat: 홈 위젯 3종에 basePath/라벨 prop 추가 (기본 한국어 유지)"
```

---

## Task 2: 영어 홈 전체 미러 (app/en/page.tsx)

**Files:** `app/en/page.tsx` (기존 최소 홈을 교체), Read first: `app/page.tsx`

- [ ] **Step 1: 한국어 홈 전체 읽기**

Run: `cat app/page.tsx`
목적: `buildHeatmap` 헬퍼, 데이터 조회, 위젯 배치, props 파악.

- [ ] **Step 2: 영어 홈 작성**

`app/page.tsx`를 기반으로 `app/en/page.tsx`를 작성:
- 모든 데이터: `getAllArticles('en')`, `getAllSeries('en')`, `getArticlesBySeries(name, 'en')`.
- `buildHeatmap` 헬퍼는 동일 로직 재사용(영어 글 날짜 기반).
- href를 prop으로 받는 위젯(FeaturedCard, RecentCard, SeriesSpotlightCard, QuoteCard 등)에는 `/en/...` 링크를 넘긴다.
- `WideLatestList`, `LatestCard`, `CategoriesCard`에는 `basePath="/en"`과 영어 라벨 전달:
  - WideLatestList `heading="This month"`
  - LatestCard `subtitle="One post biweekly"`
  - CategoriesCard `caption={<>{totalCount} posts<br />across {categories.length} categories</>}`
- `<Headline>`는 이미 영어(언어 중립) — 그대로 사용.
- **QuoteSection 제외** (한국어 명언 기반). 그 자리는 비우거나 레이아웃이 깨지지 않게 조정.
- `metadata`는 영어 title/description.

- [ ] **Step 3: 타입 체크 + 빌드**

Run: `npm run generate:manifest && npm run check && npm run build`
검증: `npm run build` 성공, `out/en/index.html` 생성. `grep -c "/en/" out/en/index.html` > 0 (영어 홈 내부 링크가 /en).

- [ ] **Step 4: dev 확인**

`http://localhost:3000/en/` — 한국어 홈과 동일 레이아웃, 영어 글/시리즈/카테고리로 채워지고 모든 링크가 `/en/...`. 헤더 토글로 `/`↔`/en/` 정상.

- [ ] **Step 5: 커밋**

```bash
git add app/en/page.tsx
git commit -m "feat: 영어 홈을 한국어 홈 레이아웃으로 완성 (/en 전체 위젯)"
```

---

## Self-Review

- **Coverage:** 영어 홈 완전 현지화(레이아웃·데이터·링크·라벨) Task 1~2로 커버. QOTD는 의도적 제외(한국어 명언).
- **Type consistency:** `basePath?: string = ''` + 라벨 prop 기본값으로 한국어 홈 무변경 보장.
- **Scope:** 종료 시 `/en/`이 한국어 홈과 동등한 경험 제공.
