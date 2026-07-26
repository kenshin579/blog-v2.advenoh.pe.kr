# 발표 슬라이드 목록 페이지 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 슬라이드가 있는 글을 `/slides`·`/en/slides`에 모아 보여주고, 카드에서 바로 발표 화면으로 들어가되 발표 화면에서 글로 돌아올 수 있게 한다.

**Architecture:** 빌드 타임 manifest(`scripts/generate-content-manifest.ts`)에 `hasSlides`·`slideCount` 두 필드를 얹고, 페이지는 `lib/articles.ts`의 새 조회 함수로 그 데이터를 읽어 `/series`와 같은 bento 카드 그리드를 그린다. 발표 화면의 돌아가기 링크는 `scripts/copy-assets.ts`가 배포 사본에만 주입한다 — 테마 동기화 스크립트와 같은 자리, 같은 방식이다.

**Tech Stack:** Next.js App Router (static export), TypeScript, Tailwind (bento 디자인 토큰), tsx로 도는 독립 빌드 스크립트

**설계 문서:** `docs/superpowers/specs/2026-07-26-slides-index-page-design.md`

---

## 시작 전 알아둘 것

**이 저장소에는 테스트 러너가 없다.** `devDependencies`에 vitest·jest·playwright가 모두 없고 `package.json`에 `test` 스크립트도 없다. 그러니 각 태스크의 검증 단계는 단위 테스트 대신 **실제 명령과 그 출력 확인**으로 되어 있다. 테스트 프레임워크를 새로 도입하지 말 것 — 이 작업의 범위가 아니다.

**빌드 순서** (`package.json`의 `build`):

```
generate:manifest → generate:search → generate:feeds → copy:assets → next build
```

manifest가 먼저 돌고 copy-assets가 나중이다. 이 순서에 의존하는 변경은 없지만 알고 있어야 한다.

**타입이 두 곳에 복제돼 있다.** `ArticleMetadata`(`scripts/generate-content-manifest.ts`)와 `ManifestArticle`(`lib/articles.ts`)이 같은 모양을 각자 손으로 선언한다. **한쪽만 고치면 `npm run check`는 통과하는데 페이지에서 값이 `undefined`로 나온다.** Task 1에서 반드시 둘 다 고친다.

**현재 상태 (기준값)**

| 항목 | 값 |
|---|---|
| `contents/**/slides.html` | 7개 |
| `contents/**/slides_en.html` | 0개 |
| 각 데크 장 수 | grafana 38 · fx 32 · concurrency-1 36 · concurrency-2 36 · concurrency-3 27 · generics-1 24 · urdf 34 |

---

## 파일 구조

| 파일 | 역할 | 변경 |
|---|---|---|
| `scripts/generate-content-manifest.ts` | 슬라이드 유무·장 수를 manifest에 싣는다 | 수정 |
| `lib/articles.ts` | 타입 동기화 + `getArticlesWithSlides()` | 수정 |
| `components/slides/slide-card.tsx` | 카드 하나. ko/en 페이지가 공유한다 | 생성 |
| `app/slides/page.tsx` | 한국어 목록 페이지 | 생성 |
| `app/en/slides/page.tsx` | 영문 목록 페이지 | 생성 |
| `components/site-header.tsx` | `NAV`에 항목 추가 | 수정 |
| `lib/i18n/dictionaries.ts` | `nav.slides` 라벨 | 수정 |
| `scripts/copy-assets.ts` | 돌아가기 링크 주입 | 수정 |
| `CLAUDE.md` | 슬라이드 절 갱신 | 수정 |
| `.claude/skills/generate-slides/SKILL.md` | 자동 등록 안내 | 수정 |

카드를 `components/slides/slide-card.tsx`로 뽑는 이유는 ko/en 페이지가 **같은 마크업**을 쓰기 때문이다. `/series`는 카드를 두 페이지에 복제해 놨는데, 그 중복을 따라 하지 않는다. 페이지 파일에는 언어별 문구와 데이터 조회만 남는다.

---

## Task 1: manifest에 hasSlides · slideCount 싣기

**Files:**
- Modify: `scripts/generate-content-manifest.ts:5-17` (타입), `:72-91` (계산), `:97-109` (레코드)
- Modify: `lib/articles.ts:5-17` (타입)

- [ ] **Step 1: 스크립트 타입에 필드 두 개 추가**

`scripts/generate-content-manifest.ts`의 `interface ArticleMetadata`에서 `readTime?: number;` 다음 줄에 추가한다.

```ts
  readTime?: number;
  /** slides.html(en: slides_en.html) 파일이 존재하는가. 본문 마커와 무관하다 */
  hasSlides?: boolean;
  /** 데크의 슬라이드 장 수. 0이면 필드를 생략한다 */
  slideCount?: number;
```

- [ ] **Step 2: 장 수를 세는 헬퍼 추가**

같은 파일, `calculateReadingTime` 함수 바로 아래에 추가한다.

```ts
/**
 * 데크 HTML에서 슬라이드 장 수를 센다.
 * 슬라이드 한 장은 <div class="holder" data-n="NN"> 하나에 대응한다.
 */
function countSlides(slidesPath: string): number {
  try {
    const html = fs.readFileSync(slidesPath, 'utf-8');
    return (html.match(/data-n="\d+"/g) ?? []).length;
  } catch {
    return 0;
  }
}
```

- [ ] **Step 3: 스캔 루프에서 값 계산**

`scanContents` 안, `const hasSlidesMarker = ...` 줄 **바로 다음**에 추가한다. `hasSlidesFile`은 이미 위에서 계산돼 있으니 재사용한다.

```ts
          const slideCount = hasSlidesFile
            ? countSlides(path.join(dirPath, slidesFile))
            : 0;
```

- [ ] **Step 4: 레코드에 필드 싣기**

같은 함수의 `articles.push({ ... })` 안, `readTime: calculateReadingTime(content),` 다음 줄에 추가한다.

```ts
            readTime: calculateReadingTime(content),
            hasSlides: hasSlidesFile || undefined,
            slideCount: slideCount || undefined,
```

`|| undefined`를 쓰는 이유는 `JSON.stringify`가 `undefined` 필드를 아예 빼기 때문이다. 데크 없는 글 수백 개에 `false`/`0`을 싣지 않아 manifest가 깨끗해진다.

- [ ] **Step 5: lib 쪽 타입도 같이 고치기**

`lib/articles.ts`의 `interface ManifestArticle`에서 `readTime?: number;` 다음 줄에 **똑같이** 추가한다. 이 단계를 빼먹으면 페이지에서 필드가 안 보인다.

```ts
  readTime?: number;
  hasSlides?: boolean;
  slideCount?: number;
```

- [ ] **Step 6: manifest 생성 후 값 확인**

```bash
npm run generate:manifest
```

기대: 기존 슬라이드 마커 경고가 그대로 나오고(회귀 없음) `✅ Manifest generated at ...`로 끝난다.

```bash
python3 -c "
import json
m = json.load(open('public/content-manifest.json'))
d = [a for a in m['articles'] if a.get('hasSlides')]
print('hasSlides 글 수:', len(d))
for a in sorted(d, key=lambda x: x['slug']):
    print(' ', a['lang'], a.get('slideCount'), a['slug'])
"
```

기대 출력 — 정확히 이 7줄이어야 한다.

```
hasSlides 글 수: 7
  ko 38 cloud/grafana-완벽-가이드-1-prometheus와-grafana-기초
  ko 32 go/go-fx-의존성-주입
  ko 36 go/golang-concurrency-1-goroutine-기초
  ko 36 go/golang-concurrency-2-channel-완전-정복
  ko 27 go/golang-concurrency-3-select와-channel-심화
  ko 24 go/golang-generics-1-개요와-기본-문법
  ko 34 ros/urdf를-이용한-로봇-모델링
```

- [ ] **Step 7: 타입 체크**

```bash
npm run check
```

기대: 출력 없이 종료(exit 0).

- [ ] **Step 8: 커밋**

```bash
git add scripts/generate-content-manifest.ts lib/articles.ts
git commit -m "feat: manifest에 hasSlides · slideCount 필드 추가

* 데크 파일 존재 여부와 장 수를 빌드 타임에 수집
* hasSlides 기준은 파일 존재뿐 — 본문 마커와 무관하다
* ArticleMetadata / ManifestArticle 양쪽 타입 동기화"
```

`public/content-manifest.json`은 빌드 산출물이다. 저장소에서 추적 중인지 `git status`로 확인하고, 추적 중이면 함께 커밋한다.

---

## Task 2: getArticlesWithSlides 조회 함수

**Files:**
- Modify: `lib/articles.ts` (`getArticlesBySeries` 다음)

- [ ] **Step 1: 함수 추가**

`lib/articles.ts`의 `getArticlesBySeries` 함수 **바로 다음**에 추가한다. 기존 조회 함수들과 같은 모양이다.

```ts
/**
 * 발표 슬라이드가 있는 아티클 가져오기 (최신순)
 *
 * hasSlides 는 데크 파일 존재만으로 정해진다. 본문에 <!-- slides --> 마커가
 * 없어도 데크는 /{articleDir}/slides/ 로 배포되므로 목록에 포함해야 한다.
 */
export async function getArticlesWithSlides(lang: 'ko' | 'en' = 'ko'): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  return manifest.articles
    .filter(a => a.hasSlides === true && a.lang === lang)
    .sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());
}
```

- [ ] **Step 2: 실제로 동작하는지 확인**

```bash
npx tsx -e "
import { getArticlesWithSlides } from './lib/articles';
(async () => {
  const ko = await getArticlesWithSlides('ko');
  const en = await getArticlesWithSlides('en');
  console.log('ko:', ko.length, '| en:', en.length);
  ko.forEach(a => console.log(' ', a.date.slice(0, 10), a.slideCount + '장', a.title));
})();
"
```

기대: `ko: 7 | en: 0`, 그리고 7줄이 **날짜 내림차순**으로 나온다. 날짜가 뒤죽박죽이면 정렬이 틀린 것이다.

- [ ] **Step 3: 타입 체크**

```bash
npm run check
```

기대: 출력 없이 종료.

- [ ] **Step 4: 커밋**

```bash
git add lib/articles.ts
git commit -m "feat: getArticlesWithSlides 조회 함수 추가

* hasSlides 가 true 인 글만 날짜 내림차순으로 반환"
```

---

## Task 3: 카드 컴포넌트

**Files:**
- Create: `components/slides/slide-card.tsx`

- [ ] **Step 1: 카드 컴포넌트 작성**

`/series` 카드(`app/series/page.tsx:60-87`)와 같은 골격이되 색만 `bento-butter`로 바꾼다.

```tsx
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export interface SlideCardProps {
  /** manifest 의 slug ({category}/{articleDir}) */
  slug: string;
  title: string;
  date: string;
  series?: string;
  slideCount?: number;
  /** 'ko' | 'en' — 발표 화면 경로의 언어 prefix 를 정한다 */
  lang: 'ko' | 'en';
  /** 분량 단위. ko: "장", en: "slides" */
  countLabel: string;
}

export function SlideCard({
  slug,
  title,
  date,
  series,
  slideCount,
  lang,
  countLabel,
}: SlideCardProps) {
  // 글 주소에는 카테고리가 들어가지 않는다. manifest slug 는 {category}/{articleDir} 이므로
  // 뒤쪽만 쓴다 (lib/articles.ts 의 getArticleTitleFromSlug 와 같은 규칙).
  const articleDir = slug.split('/')[1] ?? slug;
  const href = lang === 'en' ? `/en/${articleDir}/slides/` : `/${articleDir}/slides/`;

  return (
    <Link
      href={href}
      className={[
        'col-span-12 flex flex-col rounded-card-xl bg-bento-butter p-6 text-bento-ink no-underline md:col-span-6 md:p-7',
        FOCUS_RING,
      ].join(' ')}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.1em] opacity-60">Slides</span>
        {slideCount ? (
          <span className="text-xs text-bento-dim">
            {slideCount}
            {countLabel}
          </span>
        ) : null}
      </div>
      <h2 className="mb-4 text-xl font-bold tracking-tighter md:text-2xl">{title}</h2>
      <div className="mt-auto border-t border-bento-ink/10 pt-3">
        {series && (
          <div className="text-[13px] font-medium leading-snug">{series}</div>
        )}
        <div className="mt-1 text-[11px] text-bento-dim">{formatDate(date)}</div>
      </div>
    </Link>
  );
}
```

`countLabel`을 props로 받는 이유는 한국어가 `27장`(붙여 씀)이고 영어가 `27 slides`(띄어 씀)라서다. 호출부에서 `"장"` / `" slides"`를 넘긴다.

- [ ] **Step 2: 타입 체크**

```bash
npm run check
```

기대: 출력 없이 종료. `rounded-card-xl`이나 `bg-bento-butter`가 없다는 오류가 나면 `tailwind.config.ts`를 확인한다 — 둘 다 이미 정의돼 있어야 한다.

- [ ] **Step 3: 커밋**

```bash
git add components/slides/slide-card.tsx
git commit -m "feat: 발표 슬라이드 카드 컴포넌트 추가

* ko/en 목록 페이지가 공유한다
* 카드 링크는 글이 아니라 발표 화면(/{articleDir}/slides/)으로 간다"
```

---

## Task 4: /slides 페이지 (한국어)

**Files:**
- Create: `app/slides/page.tsx`

- [ ] **Step 1: 페이지 작성**

```tsx
import { getArticlesWithSlides } from '@/lib/articles';
import { SlideCard } from '@/components/slides/slide-card';

export const metadata = {
  title: "Slides | Frank's IT Blog",
  description: '발표 슬라이드가 있는 글 모음',
};

export default async function SlidesPage() {
  const decks = await getArticlesWithSlides('ko');

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <header className="mx-auto max-w-canvas px-6 pt-8 md:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-bento-dim">
          Slides
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tighter text-bento-ink md:text-4xl">
          Slides
        </h1>
        <p className="mt-2 text-sm text-bento-dim">{decks.length}개의 발표 자료</p>
      </header>

      {decks.length === 0 ? (
        <section className="mx-auto max-w-canvas px-6 py-20 text-center text-bento-dim md:px-10">
          아직 발표 자료가 없습니다.
        </section>
      ) : (
        <section className="mx-auto mt-8 grid max-w-canvas grid-cols-12 gap-3 px-6 md:gap-4 md:px-10">
          {decks.map((d) => (
            <SlideCard
              key={d.slug}
              slug={d.slug}
              title={d.title}
              date={d.date}
              series={d.series}
              slideCount={d.slideCount}
              lang="ko"
              countLabel="장"
            />
          ))}
        </section>
      )}
    </main>
  );
}
```

- [ ] **Step 2: 개발 서버로 확인**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000/slides`를 연다.

기대:
- 헤더에 `7개의 발표 자료`
- butter 색 카드 7장, 2열(데스크톱)
- 각 카드에 `SLIDES` 라벨 + `27장` 같은 분량, 글 제목, 시리즈명, 날짜
- 카드를 누르면 발표 화면이 뜬다 (예: `/golang-concurrency-3-select와-channel-심화/slides/`)

카드 링크가 404면 `slug.split('/')[1]`이 제대로 동작하는지 본다 — 카테고리가 주소에 섞여 들어갔을 가능성이 높다.

확인 후 서버를 끈다.

- [ ] **Step 3: 커밋**

```bash
git add app/slides/page.tsx
git commit -m "feat: /slides 발표 자료 목록 페이지 추가"
```

---

## Task 5: /en/slides 페이지 (영문)

**Files:**
- Create: `app/en/slides/page.tsx`

- [ ] **Step 1: 페이지 작성**

Task 4와 같은 구조에 언어와 문구만 다르다. 기존 `app/en/series/page.tsx`도 같은 방식의 복제본이다.

```tsx
import { getArticlesWithSlides } from '@/lib/articles';
import { SlideCard } from '@/components/slides/slide-card';

export const metadata = {
  title: "Slides | Frank's IT Blog",
  description: 'Blog posts with presentation slide decks',
};

export default async function SlidesPage() {
  const decks = await getArticlesWithSlides('en');

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <header className="mx-auto max-w-canvas px-6 pt-8 md:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-bento-dim">
          Slides
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tighter text-bento-ink md:text-4xl">
          Slides
        </h1>
        <p className="mt-2 text-sm text-bento-dim">{decks.length} slide decks</p>
      </header>

      {decks.length === 0 ? (
        <section className="mx-auto max-w-canvas px-6 py-20 text-center text-bento-dim md:px-10">
          No slide decks yet.
        </section>
      ) : (
        <section className="mx-auto mt-8 grid max-w-canvas grid-cols-12 gap-3 px-6 md:gap-4 md:px-10">
          {decks.map((d) => (
            <SlideCard
              key={d.slug}
              slug={d.slug}
              title={d.title}
              date={d.date}
              series={d.series}
              slideCount={d.slideCount}
              lang="en"
              countLabel=" slides"
            />
          ))}
        </section>
      )}
    </main>
  );
}
```

- [ ] **Step 2: 개발 서버로 확인**

```bash
npm run dev
```

`http://localhost:3000/en/slides`를 연다.

기대: `0 slide decks` + `No slide decks yet.` 빈 상태. **이게 정상이다** — 영문 데크(`slides_en.html`)가 아직 하나도 없다. 오류 화면이 뜨면 안 된다.

확인 후 서버를 끈다.

- [ ] **Step 3: 커밋**

```bash
git add app/en/slides/page.tsx
git commit -m "feat: /en/slides 영문 발표 자료 목록 페이지 추가

* 영문 데크가 아직 없어 빈 상태로 나온다
* slides_en.html 이 생기면 코드 수정 없이 채워진다"
```

---

## Task 6: 네비게이션에 항목 추가

**Files:**
- Modify: `lib/i18n/dictionaries.ts:4` (타입), `:13` (ko), `:33` (en)
- Modify: `components/site-header.tsx:20-25`

- [ ] **Step 1: 사전 타입과 값 추가**

`lib/i18n/dictionaries.ts`에서 세 줄을 고친다. `slides` 키를 `series`와 `tags` 사이에 둔다.

```ts
// 타입 (4번째 줄 근처)
  nav: { home: string; posts: string; series: string; slides: string; tags: string };

// ko
  nav: { home: '홈', posts: '글', series: '시리즈', slides: '슬라이드', tags: '태그' },

// en
  nav: { home: 'Home', posts: 'Posts', series: 'Series', slides: 'Slides', tags: 'Tags' },
```

- [ ] **Step 2: NAV 배열에 항목 추가**

`components/site-header.tsx`의 `NAV`를 이렇게 바꾼다.

```ts
const NAV = [
  { key: 'home', href: '/' },
  { key: 'posts', href: '/posts' },
  { key: 'series', href: '/series' },
  { key: 'slides', href: '/slides' },
  { key: 'tags', href: '/tags' },
] as const;
```

렌더 코드는 손대지 않는다. 이 배열 하나가 데스크톱 pill(`:81`)과 모바일 메뉴(`:212`)를 함께 그리므로 양쪽에 자동 반영된다.

- [ ] **Step 3: 타입 체크**

```bash
npm run check
```

기대: 출력 없이 종료. `t.nav[n.key]`가 `slides` 키를 못 찾는다는 오류가 나면 Step 1의 타입 줄을 빠뜨린 것이다.

- [ ] **Step 4: 좁은 화면에서 pill nav 확인 — 이 단계를 건너뛰지 말 것**

```bash
npm run dev
```

브라우저 개발자 도구에서 **폭 360px**(iPhone SE 등)로 맞추고 `http://localhost:3000/`을 본다.

- 360px에서는 pill nav가 `hidden ... md:flex`라 **숨겨져 있어야** 정상이다. 햄버거 메뉴를 열어 `홈 · 글 · 시리즈 · 슬라이드 · 태그` 다섯 줄이 나오는지 본다
- 이어서 폭을 **768px**(md 시작점)로 올린다. 여기서 pill nav가 나타나는데, 항목이 4개에서 5개로 늘어난 자리다. **pill이 로고나 오른쪽 검색 버튼과 겹치거나 줄바꿈되는지** 확인한다

겹치면 이 순서로 대응한다.

1. 한국어 라벨을 `슬라이드` → `발표`로 줄인다 (`dictionaries.ts`의 ko만)
2. 그래도 좁으면 pill의 좌우 여백을 `px-4` → `px-3`으로 줄인다 (`site-header.tsx:90`)

`/en`에서도 같은 폭으로 한 번 더 본다 — `Slides`가 `슬라이드`보다 길다.

확인 후 서버를 끈다.

- [ ] **Step 5: 커밋**

```bash
git add lib/i18n/dictionaries.ts components/site-header.tsx
git commit -m "feat: 헤더 네비게이션에 슬라이드 항목 추가

* NAV 배열 하나로 데스크톱 pill 과 모바일 메뉴에 함께 반영된다"
```

---

## Task 7: 발표 화면에 돌아가기 링크 주입

**Files:**
- Modify: `scripts/copy-assets.ts:41-44` (`SLIDE_VARIANTS`), `:54-81` (`findSlides`), `:178-193` (`copySlides`), `:268-277` (main)
- Modify: `scripts/copy-assets.ts` — 주입 상수/함수 추가 (`injectThemeSync` 다음)

`findSlides`가 지금은 `Map<목적지, 원본경로>`를 돌려주는데, 링크를 만들려면 글 주소와 언어가 필요하다. 목적지 문자열에서 되짚어 파싱하는 대신 **값을 객체로 바꾼다.**

- [ ] **Step 1: SLIDE_VARIANTS에 lang 추가**

```ts
const SLIDE_VARIANTS = [
  { file: 'slides.html', prefix: '', lang: 'ko' as const },
  { file: 'slides_en.html', prefix: 'en', lang: 'en' as const },
];
```

- [ ] **Step 2: findSlides 반환 타입 변경**

`findSlides` 위에 타입을 선언하고, 함수 시그니처와 `slides.set(...)` 호출을 바꾼다.

```ts
interface SlideSource {
  /** contents 아래 원본 절대 경로 */
  sourcePath: string;
  /** 이 데크가 속한 글의 주소. 돌아가기 링크의 목적지 */
  articleUrl: string;
  lang: 'ko' | 'en';
}
```

```ts
function findSlides(contentsDir: string): Map<string, SlideSource> {
  const slides = new Map<string, SlideSource>();
```

```ts
      for (const { file, prefix, lang } of SLIDE_VARIANTS) {
        const sourcePath = path.join(categoryPath, articleDir, file);
        if (!fs.existsSync(sourcePath)) continue;

        const destPath = path.join(prefix, articleDir, 'slides', 'index.html');
        // 글 주소에는 카테고리가 들어가지 않는다 (라우트 규칙과 동일).
        // 한글 폴더명은 인코딩하지 않는다 — lib/markdown.ts 의 임베드 src 와 같은 방식이다.
        const articleUrl = prefix ? `/${prefix}/${articleDir}/` : `/${articleDir}/`;
        slides.set(destPath, { sourcePath, articleUrl, lang });
      }
```

- [ ] **Step 3: 주입 상수와 함수 추가**

`injectThemeSync` 함수 **바로 다음**에 붙인다.

```ts
/**
 * 배포되는 슬라이드에 주입할 "글로 돌아가기" 링크.
 * 원본(contents 아래 slides.html)은 건드리지 않는다 — 테마 동기화와 같은 원칙이다.
 *
 * 데크는 글 본문에 iframe 으로도 박힌다. 그 경우 이 링크는 자기를 감싼 글로 가는
 * 링크가 되어 클릭하면 iframe 안에 글이 중첩된다. 그래서 프레임 안에서는 숨긴다.
 * 검사를 </head> 안에서 하는 이유는 첫 페인트 전에 끝내기 위해서다 — body 에서
 * 지우면 가장 흔한 화면인 글 임베드에서 링크가 한 번 깜빡였다 사라진다.
 */
const BACK_LINK_MARKER = 'data-slides-back-link';

/** 라벨 원본: lib/i18n/dictionaries.ts 의 t.slides. 이 스크립트는 tsx 로 도는
 *  독립 프로세스라 @/ 별칭을 해석하지 못해 여기에 복제해 둔다. */
const BACK_LABEL: Record<'ko' | 'en', string> = {
  ko: '← 글 보기',
  en: '← Article',
};

const BACK_LINK_HEAD = `<!-- 아래 블록은 scripts/copy-assets.ts 가 배포 시 주입한다. 원본 slides.html 에는 없다. -->
<style ${BACK_LINK_MARKER}>
.deck-back {
  font-family: var(--f-mono);
  font-size: 11.5px;
  letter-spacing: .08em;
  color: var(--ink-faint);
  text-decoration: none;
  white-space: nowrap;
  transition: color .15s;
}
.deck-back:hover { color: var(--accent); }
.deck-back:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
[data-framed] .deck-back { display: none; }
</style>
<script ${BACK_LINK_MARKER}>
/* 임베드(iframe) 안이면 돌아가기 링크를 감춘다. 첫 페인트 전에 확정해야 깜빡임이 없다. */
(function () {
  try {
    if (window.self !== window.top) {
      document.documentElement.setAttribute("data-framed", "");
    }
  } catch (e) {
    /* 크로스 오리진 접근 차단도 프레임 안이라는 뜻이다 */
    document.documentElement.setAttribute("data-framed", "");
  }
})();
</script>
`;

/**
 * </head> 앞에 스타일·스크립트를, .chrome 안 맨 앞에 링크를 넣는다.
 * .chrome 은 flex row 라 항목이 하나 느는 것뿐이다.
 */
function injectBackLink(html: string, source: SlideSource, logLabel: string): string {
  if (html.includes(BACK_LINK_MARKER)) return html;

  const headIdx = html.lastIndexOf('</head>');
  if (headIdx === -1) {
    console.warn(`⚠️  ${logLabel}: </head> 를 찾을 수 없어 돌아가기 링크를 주입하지 못했습니다`);
    return html;
  }
  let out = html.slice(0, headIdx) + BACK_LINK_HEAD + html.slice(headIdx);

  const anchor = '<span class="deck-id">';
  const chromeIdx = out.indexOf(anchor);
  if (chromeIdx === -1) {
    console.warn(`⚠️  ${logLabel}: .chrome 의 deck-id 를 찾을 수 없어 돌아가기 링크를 넣지 못했습니다`);
    return out;
  }

  const link = `<a class="deck-back" href="${source.articleUrl}">${BACK_LABEL[source.lang]}</a>\n    `;
  out = out.slice(0, chromeIdx) + link + out.slice(chromeIdx);

  return out;
}
```

- [ ] **Step 4: copySlides에서 두 주입을 이어 붙이기**

`copySlides`의 시그니처와 본문을 바꾼다.

```ts
function copySlides(slides: Map<string, SlideSource>, destRoot: string) {
  let copiedCount = 0;

  for (const [relativePath, source] of slides) {
    const destPath = path.join(destRoot, relativePath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    try {
      const raw = fs.readFileSync(source.sourcePath, 'utf-8');
      const html = injectBackLink(injectThemeSync(raw, relativePath), source, relativePath);
      fs.writeFileSync(destPath, html, 'utf-8');
      copiedCount++;
    } catch (error) {
      console.error(`❌ Failed to copy ${relativePath}:`, error);
    }
  }
```

`return copiedCount;` 이하는 그대로 둔다.

- [ ] **Step 5: 타입 체크**

```bash
npm run check
```

기대: 출력 없이 종료. `main()`에서 `slides.size`를 쓰는 곳은 `Map`이라 그대로 동작한다.

- [ ] **Step 6: 복사 실행 후 주입 결과 확인**

```bash
npm run copy:assets
```

기대: `✅ Slides copied: 7` (경고 없음)

```bash
python3 -c "
import glob, re
files = sorted(glob.glob('public/*/slides/index.html')) + sorted(glob.glob('public/en/*/slides/index.html'))
print('데크 수:', len(files))
for f in files:
    s = open(f, encoding='utf-8').read()
    m = re.search(r'<a class=\"deck-back\" href=\"([^\"]+)\">([^<]+)</a>', s)
    ok = 'data-slides-theme-sync' in s and 'data-slides-back-link' in s
    print(' ', 'OK ' if ok else 'BAD', m.group(1) if m else '링크없음', '|', m.group(2) if m else '')
"
```

기대: 7줄 모두 `OK`, `href`가 `/{글폴더}/`로 끝나고 라벨이 `← 글 보기`다. `href`에 `slides`가 들어가 있으면 잘못 만든 것이다.

- [ ] **Step 7: 링크가 `.chrome` 안에 들어갔는지 확인**

```bash
python3 -c "
s = open('public/golang-concurrency-3-select와-channel-심화/slides/index.html', encoding='utf-8').read()
i = s.index('<div class=\"chrome\">')
print(s[i:i+300])
"
```

기대: `<div class="chrome">` 다음 줄에 `<a class="deck-back" ...>`, 그 다음에 `<span class="deck-id">`가 온다.

- [ ] **Step 8: 커밋**

```bash
git add scripts/copy-assets.ts
git commit -m "feat: 배포 슬라이드에 글로 돌아가기 링크 주입

* .chrome 맨 앞에 <a class=\"deck-back\"> 를 넣는다
* 글 본문 임베드(iframe) 안에서는 감춘다 — head 에서 프레임을 검사해 깜빡임 없이
* 원본 contents/**/slides.html 은 그대로 둔다"
```

---

## Task 8: 문서 갱신

**Files:**
- Modify: `CLAUDE.md` ("슬라이드 데크 (선택)" 절)
- Modify: `.claude/skills/generate-slides/SKILL.md`

- [ ] **Step 1: CLAUDE.md에 두 줄 추가**

"슬라이드 데크 (선택)" 절의 번호 목록 다음, `파일과 마커의 짝이 안 맞으면...` 문단 **앞**에 넣는다.

```markdown
데크를 만들면 `/slides` 목록 페이지에 자동으로 뜬다 — 별도 등록이 필요 없다. 목록에 뜨는 기준은 **`slides.html` 파일의 존재**이고 본문 마커와는 무관하다(마커는 본문 임베드 여부만 정한다).

배포된 데크의 하단 바에는 글로 돌아가는 링크가 붙는다(빌드 시 `copy-assets.ts`가 주입). 글 본문 임베드 안에서는 보이지 않는다.
```

- [ ] **Step 2: SKILL.md에 한 줄 추가**

`.claude/skills/generate-slides/SKILL.md`의 "### 7. 검증한다" 절 끝, 마지막 문단 다음에 넣는다.

```markdown
데크를 만들면 `/slides` 목록 페이지에 자동으로 올라간다. 별도 등록 작업은 없다. 빌드 후 `out/slides/index.html`에 카드가 하나 늘었는지 함께 확인하면 좋다.
```

- [ ] **Step 3: 커밋**

```bash
git add CLAUDE.md .claude/skills/generate-slides/SKILL.md
git commit -m "docs: 슬라이드 목록 페이지와 돌아가기 링크 문서화"
```

---

## Task 9: 전체 빌드 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 전체 빌드**

```bash
npm run build
```

기대:
- 기존 슬라이드 마커 경고가 그대로 (새 경고 없음)
- `✅ Slides copied: 7`
- `✓ Compiled successfully`

- [ ] **Step 2: 산출물 확인**

```bash
ls out/slides/index.html out/en/slides/index.html
python3 -c "
s = open('out/slides/index.html', encoding='utf-8').read()
import re
hrefs = sorted(set(re.findall(r'href=\"(/[^\"]*?/slides/)\"', s)))
print('카드 링크 수:', len(hrefs))
for h in hrefs: print(' ', h)
"
```

기대: 링크 7개. 각각 `/{글폴더}/slides/` 형태이고 카테고리(`go/`, `cloud/`, `ros/`)가 섞여 있지 않다.

- [ ] **Step 3: 링크가 실제 파일과 맞는지 대조**

```bash
python3 -c "
import re, os, urllib.parse
s = open('out/slides/index.html', encoding='utf-8').read()
hrefs = sorted(set(re.findall(r'href=\"(/[^\"]*?/slides/)\"', s)))
for h in hrefs:
    p = 'out' + urllib.parse.unquote(h) + 'index.html'
    print('OK ' if os.path.exists(p) else 'MISSING', h)
"
```

기대: 7줄 전부 `OK`. `MISSING`이 있으면 카드의 `href` 생성 규칙이 배포 경로와 어긋난 것이다.

- [ ] **Step 4: 브라우저로 최종 확인**

```bash
npx serve@latest out -l 3100
```

이 다섯 가지를 **눈으로** 확인한다.

1. `http://localhost:3100/slides` — 카드 7장, 헤더 pill nav에 `슬라이드`가 활성 상태
2. 카드 하나를 클릭 → 발표 화면이 뜨고 **하단 바 왼쪽에 `← 글 보기`가 보인다.** 클릭하면 글로 간다
3. `http://localhost:3100/golang-concurrency-3-select와-channel-심화/` — 본문 임베드 안에는 **`← 글 보기`가 보이지 않는다.** 이게 이 작업에서 제일 깨지기 쉬운 지점이다
4. `http://localhost:3100/en/slides` — `No slide decks yet.` 빈 상태. 헤더에 `Slides` 항목이 있고 눌러서 여기로 온다
5. 테마를 다크로 바꾼 뒤 발표 화면을 다시 열어 `← 글 보기`가 배경에 묻히지 않는지 본다

확인 후 서버를 끈다.

- [ ] **Step 5: 작업 트리 정리 확인**

```bash
git status --short
```

기대: 비어 있거나 빌드 산출물(`public/content-manifest.json` 등 저장소가 추적하는 것)만 남는다. 추적 중인 산출물이 바뀌었으면 커밋한다.

```bash
git log --oneline main..HEAD
```

기대: Task 1~8의 커밋이 순서대로 보인다.

---

## 완료 후

`superpowers:finishing-a-development-branch` 스킬로 PR 생성 여부를 정한다. 이 저장소는 `gh pr create` + HEREDOC 방식을 쓰고 리뷰어는 지정하지 않는다 (`~/.claude/CLAUDE.md` 참고).
