# 퀴즈 목록 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 퀴즈가 있는 글을 모아 보는 `/quiz` 목록 페이지와 헤더 메뉴를 추가한다.

**Architecture:** 기존 `/slides` 배관을 그대로 본뜬다 — manifest 생성 시 `hasQuiz`/`quizCount`를 채우고, `lib/articles.ts`의 조회 함수로 뽑아, ko/en 페이지 두 개가 카드로 그린다. 카드 링크는 글 페이지의 `#quiz` 앵커로 보내고, 그 앵커는 퀴즈 마운트 지점에 고정 id로 심는다.

**Tech Stack:** Next.js 16 (App Router, static export), React 19, Tailwind

**Spec:** `docs/superpowers/specs/2026-08-08-quiz-index-page-design.md`

**브랜치:** `feat/quiz-index-page` (이미 존재, 스펙 커밋 `24d9f3c`)

**검증:** 이 저장소에는 테스트 러너가 없다. 게이트는 `npm run check`(tsc)와 `npm run build`이고, 화면 확인은 `npx serve out -l 3000` + Playwright로 한다. **`npm run dev`는 동적 slug 라우트에서 500이 나므로 쓰지 마라** (Turbopack dev + `output: export`, 기존 문제).

---

## File Structure

| 파일 | 작업 | 책임 |
|------|------|------|
| `scripts/generate-content-manifest.ts` | Modify | `hasQuiz`/`quizCount` 산출, 유효 문항 0개 경고 |
| `lib/articles.ts` | Modify | `ManifestArticle`에 두 필드 추가, `getArticlesWithQuiz` |
| `components/article/quiz-renderer.tsx` | Modify | 첫 마운트에 `id="quiz"`, 해시 도착 시 스크롤 |
| `components/quiz/quiz-card.tsx` | Create | 목록 카드 |
| `app/quiz/page.tsx` | Create | 한국어 목록 페이지 |
| `app/en/quiz/page.tsx` | Create | 영문 목록 페이지 |
| `lib/i18n/dictionaries.ts` | Modify | `nav.quiz` 라벨 |
| `components/site-header.tsx` | Modify | `NAV`에 항목 추가 |
| `app/sitemap.ts` | Modify | `/quiz`, `/en/quiz` |

---

## Task 1: manifest에 퀴즈 정보 추가

**Files:**
- Modify: `scripts/generate-content-manifest.ts`

- [ ] **Step 1: 인터페이스에 필드 추가**

`ArticleMetadata` 인터페이스의 `slideCount` 다음에 추가한다:

```typescript
  /** 본문에 ```quiz 블록이 있고 유효 문항이 1개 이상인가 */
  hasQuiz?: boolean;
  /** 첫 quiz 블록의 유효 문항 수. 0이면 필드를 생략한다 */
  quizCount?: number;
```

- [ ] **Step 2: parseQuiz import 추가**

파일 상단 import 블록에 추가한다. 이 스크립트는 `tsx`로 실행되므로 `@/` 별칭 대신 상대 경로를 쓴다:

```typescript
import { parseQuiz } from '../lib/quiz';
```

**정규식으로 `- type:`을 세지 않는다.** 형식이 깨진 문항까지 포함되어 UI가 실제로 그리는 수와 어긋난다. `parseQuiz`는 렌더링과 같은 검증을 거치므로 수가 일치한다.

- [ ] **Step 3: 문항 수 산출**

`hasSlidesMarker` 계산 다음, `if (hasSlidesFile && !hasSlidesMarker)` 경고 앞에 넣는다:

```typescript
          // 퀴즈: 본문의 첫 ```quiz 블록을 파서로 세어 실제 렌더 수와 맞춘다.
          const quizMatch = content.match(/```quiz\n([\s\S]*?)```/);
          const quizCount = quizMatch ? parseQuiz(quizMatch[1]).length : 0;

          if (quizMatch && quizCount === 0) {
            console.warn(
              `⚠️  ${category}/${articleDir} (${lang}): quiz 블록이 있는데 유효 문항이 0개입니다 (YAML 확인 필요)`
            );
          }
```

- [ ] **Step 4: 반환 객체에 추가**

`articles.push({...})`의 `slideCount` 다음 줄에 추가한다:

```typescript
            hasQuiz: quizCount > 0 || undefined,
            quizCount: quizCount || undefined,
```

- [ ] **Step 5: 생성 확인**

```bash
cd /Users/frankoh/src/workspace_blog/blog-v2.advenoh.pe.kr
npm run generate:manifest
```

Expected: 경고 없이 완료. 이어서:

```bash
node -e "
const m = require('./public/content-manifest.json');
const q = m.articles.filter(a => a.hasQuiz);
console.log('hasQuiz 글 수:', q.length);
const ko = q.filter(a => a.lang === 'ko').map(a => a.slug + ' (' + a.quizCount + ')');
const en = q.filter(a => a.lang === 'en').map(a => a.slug + ' (' + a.quizCount + ')');
console.log('ko:', ko.length); ko.forEach(s => console.log('  ' + s));
console.log('en:', en.length); en.forEach(s => console.log('  ' + s));
"
```

Expected: ko 7편, en 7편, 모두 `quizCount`가 10. 글 목록은 go-fx, grafana 1편, concurrency 1·2·3, generics 1, urdf.

- [ ] **Step 6: 타입 체크 후 커밋**

```bash
npm run check
git add scripts/generate-content-manifest.ts
git commit -m "feat: manifest에 퀴즈 보유 여부와 문항 수 추가

* parseQuiz로 세어 실제 렌더 문항 수와 일치시킴
* quiz 블록이 있는데 유효 문항이 0개면 경고"
```

---

## Task 2: 조회 함수

**Files:**
- Modify: `lib/articles.ts`

- [ ] **Step 1: ManifestArticle에 필드 추가**

`ManifestArticle` 인터페이스의 `slideCount?: number;` 다음에 추가한다:

```typescript
  hasQuiz?: boolean;
  quizCount?: number;
```

- [ ] **Step 2: 조회 함수 추가**

`getArticlesWithSlides` 함수 바로 다음에 추가한다:

```typescript
/**
 * 퀴즈가 있는 아티클 가져오기 (최신순)
 *
 * hasQuiz 는 본문의 ```quiz 블록에 유효 문항이 1개 이상 있을 때만 true다.
 * YAML이 깨져 렌더되지 않는 글은 목록에 넣지 않는다.
 */
export async function getArticlesWithQuiz(lang: 'ko' | 'en' = 'ko'): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  return manifest.articles
    .filter(a => a.hasQuiz === true && a.lang === lang)
    .sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());
}
```

- [ ] **Step 3: 타입 체크 후 커밋**

```bash
npm run check
git add lib/articles.ts
git commit -m "feat: 퀴즈 보유 글 조회 함수 추가"
```

---

## Task 3: 앵커 id와 스크롤

**Files:**
- Modify: `components/article/quiz-renderer.tsx`

**이 태스크가 이번 작업의 유일한 불확실 요소다.** 퀴즈는 클라이언트에서 마운트되므로 페이지 로드 직후엔 `#quiz` 요소가 없고, 브라우저의 자동 앵커 스크롤이 그 전에 끝난다. 마운트 후 직접 스크롤해야 한다.

- [ ] **Step 1: 첫 마운트에 id 부여**

`mount.className = 'quiz-mount';` 다음 줄에 추가한다:

```typescript
      // 목록 페이지(/quiz)의 카드가 /{글}/#quiz 로 링크한다.
      // 헤딩 번호가 글마다 달라 rehype-slug 의 id 를 쓸 수 없으므로 고정 id 를 심는다.
      if (index === 0) mount.id = 'quiz';
```

**주의**: `index`는 `codes.forEach((code, index) => {...})`의 인덱스다. 파싱 실패로 건너뛴 블록이 있으면 `next` 배열의 순서와 어긋날 수 있으나, 첫 블록이 유효하면 `index === 0`이 곧 첫 마운트다. 현재 모든 글이 블록 하나뿐이라 문제되지 않는다.

- [ ] **Step 2: 마운트 후 스크롤 처리**

`setMounts(next);` **앞**에 넣는다 (cleanup 반환 전):

```typescript
    // 클라이언트 마운트라 페이지 로드 시점엔 #quiz 가 없어 브라우저 자동 스크롤이
    // 걸리지 않는다. 마운트 직후 직접 이동시킨다.
    if (next.length > 0 && window.location.hash === '#quiz') {
      const target = next[0].container;
      requestAnimationFrame(() => target.scrollIntoView({ behavior: 'auto', block: 'start' }));
    }

    setMounts(next);
```

`requestAnimationFrame`으로 미루는 이유: 이 시점엔 mount div가 비어 있어 높이가 0이다. portal 렌더 후로 미뤄야 실제 위치로 간다.

- [ ] **Step 3: 타입 체크**

```bash
npm run check
```

Expected: 통과

- [ ] **Step 4: 실제 동작 확인 (필수)**

```bash
npm run build
npx serve out -l 3000
```

Playwright MCP로 아래를 확인한다:

1. `http://localhost:3000/golang-concurrency-1-goroutine-기초/#quiz` 를 열어 **퀴즈 위치로 스크롤되는지**. 페이지 최상단에 머물면 실패다
2. 같은 페이지를 해시 없이(`/golang-concurrency-1-goroutine-기초/`) 열었을 때는 최상단에 있는지 (해시 없을 때 스크롤되면 버그)
3. 영문 `http://localhost:3000/en/golang-concurrency-1-goroutine-기초/#quiz` 도 같은지
4. DOM에 `div#quiz.quiz-mount`가 하나 있는지

스크롤이 안 되면 **고치지 말고 보고하라** — `requestAnimationFrame` 대신 `setTimeout(…, 0)`이나 이중 rAF가 필요할 수 있고, 어느 쪽이 맞는지는 실측으로 정해야 한다.

확인 후 serve 종료.

- [ ] **Step 5: 커밋**

```bash
git add components/article/quiz-renderer.tsx
git commit -m "feat: 퀴즈 마운트에 고정 앵커 id와 해시 스크롤 추가

* 목록 페이지가 /{글}/#quiz 로 링크할 수 있게 첫 세트에 id 부여
* 클라이언트 마운트라 자동 앵커 스크롤이 안 걸려 직접 이동시킴"
```

---

## Task 4: 카드 컴포넌트

**Files:**
- Create: `components/quiz/quiz-card.tsx`

- [ ] **Step 1: 파일 작성**

`components/slides/slide-card.tsx`를 본뜨되 배지·단위·경로를 퀴즈용으로 바꾼다.

```tsx
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export interface QuizCardProps {
  /** manifest 의 slug ({category}/{articleDir}) */
  slug: string;
  title: string;
  date: string;
  series?: string;
  quizCount?: number;
  /** 'ko' | 'en' — 글 주소의 언어 prefix 를 정한다 */
  lang: 'ko' | 'en';
  /** 분량 단위. ko: "문항", en: " questions" */
  countLabel: string;
  /** 스크린 리더용 링크 설명 */
  ariaLabel: string;
}

export function QuizCard({
  slug,
  title,
  date,
  series,
  quizCount,
  lang,
  countLabel,
  ariaLabel,
}: QuizCardProps) {
  // 글 주소에는 카테고리가 들어가지 않는다. manifest slug 는 {category}/{articleDir} 이므로
  // 뒤쪽만 쓴다 (components/slides/slide-card.tsx 와 같은 규칙).
  // #quiz 는 components/article/quiz-renderer.tsx 가 첫 마운트에 심는 고정 id 다.
  const articleDir = slug.split('/').pop() ?? slug;
  const href = lang === 'en' ? `/en/${articleDir}/#quiz` : `/${articleDir}/#quiz`;

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={[
        'col-span-12 flex flex-col rounded-card-xl bg-bento-butter p-6 text-bento-ink no-underline md:col-span-6 md:p-7',
        FOCUS_RING,
      ].join(' ')}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.1em] opacity-60">Quiz</span>
        {quizCount ? (
          <span className="text-xs text-bento-dim">
            {quizCount}
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

- [ ] **Step 2: 타입 체크 후 커밋**

```bash
npm run check
git add components/quiz/quiz-card.tsx
git commit -m "feat: 퀴즈 목록 카드 컴포넌트 추가"
```

---

## Task 5: 목록 페이지 두 개

**Files:**
- Create: `app/quiz/page.tsx`
- Create: `app/en/quiz/page.tsx`

- [ ] **Step 1: 한국어 페이지**

`app/quiz/page.tsx`:

```tsx
import { getArticlesWithQuiz } from '@/lib/articles';
import { QuizCard } from '@/components/quiz/quiz-card';

export const metadata = {
  title: "Quiz | Frank's IT Blog",
  description: '퀴즈가 있는 글 모음',
};

export default async function QuizPage() {
  const articles = await getArticlesWithQuiz('ko');

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <header className="mx-auto max-w-canvas px-6 pt-8 md:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-bento-dim">
          Quiz
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tighter text-bento-ink md:text-4xl">
          Quiz
        </h1>
        <p className="mt-2 text-sm text-bento-dim">{articles.length}개의 퀴즈</p>
      </header>

      {articles.length === 0 ? (
        <section className="mx-auto max-w-canvas px-6 py-20 text-center text-bento-dim md:px-10">
          아직 퀴즈가 있는 글이 없습니다.
        </section>
      ) : (
        <section className="mx-auto mt-8 grid max-w-canvas grid-cols-12 gap-3 px-6 md:gap-4 md:px-10">
          {articles.map((a) => (
            <QuizCard
              key={a.slug}
              slug={a.slug}
              title={a.title}
              date={a.date}
              series={a.series}
              quizCount={a.quizCount}
              lang="ko"
              countLabel="문항"
              ariaLabel={`${a.title} 퀴즈 풀기`}
            />
          ))}
        </section>
      )}
    </main>
  );
}
```

- [ ] **Step 2: 영문 페이지**

`app/en/quiz/page.tsx`:

```tsx
import { getArticlesWithQuiz } from '@/lib/articles';
import { QuizCard } from '@/components/quiz/quiz-card';

export const metadata = {
  title: "Quiz | Frank's IT Blog",
  description: 'Blog posts with quizzes',
};

export default async function QuizPage() {
  const articles = await getArticlesWithQuiz('en');

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <header className="mx-auto max-w-canvas px-6 pt-8 md:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-bento-dim">
          Quiz
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tighter text-bento-ink md:text-4xl">
          Quiz
        </h1>
        <p className="mt-2 text-sm text-bento-dim">
          {articles.length} quiz set{articles.length === 1 ? '' : 's'}
        </p>
      </header>

      {articles.length === 0 ? (
        <section className="mx-auto max-w-canvas px-6 py-20 text-center text-bento-dim md:px-10">
          No posts with quizzes yet.
        </section>
      ) : (
        <section className="mx-auto mt-8 grid max-w-canvas grid-cols-12 gap-3 px-6 md:gap-4 md:px-10">
          {articles.map((a) => (
            <QuizCard
              key={a.slug}
              slug={a.slug}
              title={a.title}
              date={a.date}
              series={a.series}
              quizCount={a.quizCount}
              lang="en"
              countLabel=" questions"
              ariaLabel={`Take the quiz for ${a.title}`}
            />
          ))}
        </section>
      )}
    </main>
  );
}
```

- [ ] **Step 3: 타입 체크 후 커밋**

```bash
npm run check
git add app/quiz/page.tsx app/en/quiz/page.tsx
git commit -m "feat: 퀴즈 목록 페이지 추가 (ko/en)"
```

---

## Task 6: 헤더·i18n·sitemap 연결

**Files:**
- Modify: `lib/i18n/dictionaries.ts`
- Modify: `components/site-header.tsx`
- Modify: `app/sitemap.ts`

- [ ] **Step 1: i18n 라벨**

`lib/i18n/dictionaries.ts`의 `Dict` 타입에서 `nav` 줄을 아래로 바꾼다:

```typescript
  nav: { home: string; posts: string; series: string; slides: string; quiz: string; tags: string };
```

`ko` 객체:

```typescript
  nav: { home: '홈', posts: '글', series: '시리즈', slides: '슬라이드', quiz: '퀴즈', tags: '태그' },
```

`en` 객체:

```typescript
  nav: { home: 'Home', posts: 'Posts', series: 'Series', slides: 'Slides', quiz: 'Quiz', tags: 'Tags' },
```

- [ ] **Step 2: 헤더 네비 항목**

`components/site-header.tsx`의 `NAV` 배열에서 `slides` 다음에 추가한다:

```typescript
const NAV = [
  { key: 'home', href: '/' },
  { key: 'posts', href: '/posts' },
  { key: 'series', href: '/series' },
  { key: 'slides', href: '/slides' },
  { key: 'quiz', href: '/quiz' },
  { key: 'tags', href: '/tags' },
] as const;
```

- [ ] **Step 3: sitemap**

`app/sitemap.ts`에서 한국어 `/slides` 항목 다음에 추가한다:

```typescript
    {
      url: `${SITE_URL}/quiz`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
```

영문 `/en/slides` 항목 다음에도 추가한다:

```typescript
    {
      url: `${SITE_URL}/en/quiz`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
```

- [ ] **Step 4: 타입 체크 후 커밋**

```bash
npm run check
git add lib/i18n/dictionaries.ts components/site-header.tsx app/sitemap.ts
git commit -m "feat: 헤더 네비게이션과 sitemap에 퀴즈 목록 연결"
```

---

## Task 7: 최종 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 빌드**

```bash
npm run check
npm run build
```

Expected: 둘 다 성공

- [ ] **Step 2: 산출물 확인**

```bash
# 목록 페이지가 생성됐는지
ls -la out/quiz/index.html out/en/quiz/index.html

# sitemap에 두 경로가 있는지
grep -c "/quiz" out/sitemap.xml

# manifest에 7편 × 2언어
node -e "
const m = require('./public/content-manifest.json');
const q = m.articles.filter(a => a.hasQuiz);
console.log('ko:', q.filter(a=>a.lang==='ko').length, 'en:', q.filter(a=>a.lang==='en').length);
console.log('quizCount 값:', [...new Set(q.map(a=>a.quizCount))].join(','));
"
```

Expected: 두 HTML 존재, sitemap `/quiz` 2건 이상, ko 7 / en 7, quizCount는 10 하나뿐

- [ ] **Step 3: 브라우저 확인**

```bash
npx serve out -l 3000
```

Playwright MCP로 확인하고 스크린샷을 남긴다:

1. `http://localhost:3000/quiz/` — 카드 7개, 각 카드에 제목·시리즈·날짜·"10문항"
2. `http://localhost:3000/en/quiz/` — 카드 7개, "10 questions"
3. **카드 클릭 → 해당 글의 퀴즈 위치로 이동하는지** (ko/en 각각 최소 1건). 최상단에 머물면 실패
4. 헤더에 "퀴즈"/"Quiz" 메뉴가 보이고, `/quiz`에서 **활성 표시**가 되는지
5. 모바일 폭(예: 390px)에서 헤더 메뉴와 카드 그리드가 깨지지 않는지
6. 다크 모드에서 카드가 읽히는지
7. **기존 `/slides` 회귀 없는지** — `/slides`와 `/en/slides`가 여전히 7개 카드를 보여주는지

확인 후 serve 종료.

- [ ] **Step 4: 발견 사항 보고**

문제를 발견하면 고치지 말고 보고한다.

---

## Task 8: PR 생성

**Files:** 없음

- [ ] **Step 1: push와 PR 생성**

```bash
git push -u origin feat/quiz-index-page
gh pr create --assignee kenshin579 --base main --title "feat: 퀴즈 목록 페이지와 헤더 메뉴 추가" --body "$(cat <<'EOF'
## 배경

퀴즈가 있는 글이 7편이 되었는데 모아 볼 곳이 없었습니다. `/slides`와 같은 구조로 `/quiz` 목록 페이지를 만들고 헤더에 메뉴를 추가합니다.

## 변경 사항

* `scripts/generate-content-manifest.ts` — `hasQuiz`/`quizCount` 산출. `parseQuiz`를 재사용해 실제 렌더 문항 수와 일치시키고, quiz 블록이 있는데 유효 문항이 0개면 경고
* `lib/articles.ts` — `getArticlesWithQuiz`
* `components/article/quiz-renderer.tsx` — 첫 마운트에 `id="quiz"`, 해시로 들어왔을 때 스크롤
* `components/quiz/quiz-card.tsx`, `app/quiz/page.tsx`, `app/en/quiz/page.tsx`
* 헤더 네비게이션, i18n 라벨, sitemap

## 설계 결정

카드는 퀴즈 전용 페이지가 아니라 **글 페이지의 `#quiz` 앵커**로 보냅니다. 퀴즈는 글의 일부라 본문과 함께 있는 게 맞고, 전용 페이지를 만들면 같은 퀴즈가 두 URL에 존재하며 해설의 "(3.2절)" 참조가 갈 곳을 잃습니다.

앵커는 `rehype-slug`가 만드는 헤딩 id 대신 **마운트 지점에 고정 id**를 심었습니다. 퀴즈 절 헤딩이 글마다 달라(`9. 퀴즈`, `6. 퀴즈`, `8. Quiz`) slug 규칙을 생성 스크립트에서 재현해야 하는데, 어긋나도 빌드가 실패하지 않고 조용히 깨진 앵커가 됩니다.

퀴즈는 클라이언트에서 마운트되므로 페이지 로드 시점엔 `#quiz`가 없어 브라우저 자동 앵커 스크롤이 걸리지 않습니다. 마운트 직후 직접 이동시킵니다.

## 검증

- [x] `npm run check` / `npm run build` 통과
- [x] manifest에 ko 7편 / en 7편, `quizCount` 10
- [x] `/quiz`·`/en/quiz`가 카드 7개 표시
- [x] 카드 클릭 시 글의 퀴즈 위치로 이동 (ko/en)
- [x] 헤더 메뉴 표시와 활성 상태, 모바일 폭, 다크 모드
- [x] 기존 `/slides` 회귀 없음
- [ ] Netlify deploy preview 확인

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01ECYScWgZhRSGEbKvWr8Yt4
EOF
)"
```

Expected: PR URL 출력
