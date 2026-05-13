# Sub-project #5: Article 페이지 리디자인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 shadcn 카드 스타일의 Article 페이지(`/[slug]`)를 Bento 디자인으로 전면 교체. Hero 카드(lavender) → 720px 본문(`.prose-bento`) + 240px sticky TOC → 시리즈 글일 때 Series nav 카드 + Prev/Next → 모든 글에 Related 3장 (Bento 톤).

**Architecture:** `components/article/` 아래 3개 신규 컴포넌트(HeroCard, PrevNext, RelatedCards) + 기존 2개 리디자인 (SeriesNavigation, TableOfContents). 본문 typography 는 `app/globals.css` 에 새 `.prose-bento` 클래스로 정의 (Tailwind Typography `.prose` 와 독립). 코드블록 다크 스타일 + 언어 라벨은 globals.css 의 `pre.language-*::before` 셀렉터로 처리. 페이지(`app/[slug]/page.tsx`)는 전면 재작성하여 새 컴포넌트들 조합. `RecordView` (sub#3 Task 4) 와 기존 markdown 파이프라인(unified + rehype-prism-plus + rehype-slug)은 그대로 유지.

**Tech Stack:** Next.js 16 App Router (server component for page, client for TOC/Mermaid), Tailwind CSS, rehype-prism-plus (코드 하이라이팅, 변경 없음), mermaid (다이어그램, 변경 없음), 기존 `lib/articles.ts` 함수 (`getArticle`, `getRelatedArticles`, `getArticleByTitle`, `getArticlesBySeries`, `findArticleByTitle`, `getArticleTitleFromSlug`).

**브랜치:** `feature/redesign-bento` 위에서 누적. main 직접 커밋 금지.

**참고 문서:**
- spec: `docs/superpowers/specs/2026-05-13-blog-v2-bento-redesign-design.md` (§8 Article 페이지)
- prototype: `docs/design/blog-v3-bento/app/posts/[slug]/page.tsx`
- 기존 페이지: `app/[slug]/page.tsx`, `components/article/*`

---

## Files Touched

### Task 1 — 신규 컴포넌트 3개
- Create: `components/article/hero-card.tsx` — Hero (lavender, category + series 뱃지 + title + excerpt + 메타)
- Create: `components/article/prev-next.tsx` — 시리즈 이전/다음 2-column 카드 (cream / ink)
- Create: `components/article/related-cards.tsx` — Related 3장 (Bento 톤 sage/butter/rose, 이미지 없음)

### Task 2 — prose-bento CSS + 기존 컴포넌트 리디자인
- Modify: `app/globals.css` — `.prose-bento` 본문 타이포 + 다크 코드블록 + butter blockquote + 언어 라벨
- Modify: `components/article/series-navigation.tsx` — lavender 카드, 현재 글 강조
- Modify: `components/article/table-of-contents.tsx` — Bento 토큰 매핑, 모바일 `<details>` disclosure 모드 추가

### Task 3 — 페이지 재작성
- Modify: `app/[slug]/page.tsx` — 전면 재작성, Hero + 본문 + Series nav + PrevNext + Related 조합

### Task 4 — 회귀 검증
(변경 없음)

---

## Design Decisions

### 1. Tailwind Typography 와 별도로 `.prose-bento` 신규 클래스
기존 `.prose` 셀렉터 (Tailwind Typography 플러그인 + globals.css 커스텀) 는 그대로 둔다. 새 article 페이지는 `<article className="prose-bento">` 만 사용. 두 클래스 동시 적용 시 충돌 위험을 피한다. sub#9 cleanup 에서 `.prose` 셀렉터 정리 검토.

### 2. 코드블록 언어 라벨
`pre.language-{lang}::before { content: "{lang}"; }` 정적 CSS 셀렉터로 처리. 흔한 언어 15개 커버 (go/java/typescript/javascript/tsx/jsx/python/bash/sh/yaml/json/sql/css/html/dockerfile). 매치 안 되는 언어(예: kotlin)는 라벨 없음 — 코드는 정상 표시.

### 3. RecordView
sub#3 Task 4 에서 추가된 `<RecordView />` 호출은 그대로 유지. 새 page 가 import + 렌더링.

### 4. Mermaid 렌더러
`components/article/mermaid-renderer.tsx` 는 변경 없음. 기존 `.mermaid-diagram` CSS 그대로. Mermaid 자체는 light/dark 테마 자동 전환 (resolvedTheme 사용).

### 5. Related 톤 순환
sage / butter / rose 순서로 3장 (cream 은 4번째 톤이지만 Related 는 3장이므로 제외). `getRelatedArticles(slug, 3)` 이 ManifestArticle[] 반환 → 컴포넌트가 톤 매핑.

### 6. 시리즈 prev/next 선정
`getArticlesBySeries(name)` → `seriesOrder` asc 정렬 → 현재 글의 인덱스 찾아 `articles[idx-1]`(prev), `articles[idx+1]`(next). 시리즈 글 아닐 때 PrevNext 미렌더.

### 7. 모바일 TOC
`<details>` disclosure 패턴. 데스크탑 (`md:hidden` 으로 숨김 안 함, `md:` 이상에서 사이드바 모드). 본문 위 collapsible "목차" 그룹.

### 8. Hero 메타
prototype 의 reading time 표시는 기존 `calculateReadingTime` 함수 결과 사용. 작성자는 "Frank Advenoh" 하드코딩 (현재 사이트 운영자 고정).

### 9. Article body 너비
`max-w-prose` (720px, sub#1 에서 override) 적용. 모바일에선 단일 컬럼이라 `max-w-prose` 가 자연스럽게 화면 안에 fit.

---

## Tailwind Dynamic-Class Note

Related 톤 매핑은 page 에서 정적 배열 (`['sage', 'butter', 'rose']`) → RelatedCards 컴포넌트가 `TONE_BG` 맵으로 변환. 동적 className interpolation 없음. safelist 불필요.

---

### Task 1: 신규 article 컴포넌트 3개

**Files:**
- Create: `components/article/hero-card.tsx`
- Create: `components/article/prev-next.tsx`
- Create: `components/article/related-cards.tsx`

⚠️ 신규 3개 파일만 생성. 다른 파일 절대 touch 금지.

- [ ] **Step 1: `components/article/hero-card.tsx` 생성**

```tsx
import { formatDate } from '@/lib/utils';

type Props = {
  category: string;
  title: string;
  excerpt?: string;
  date: string;        // ISO format
  readingTime: number; // minutes
  series?: string;
  seriesOrder?: number;
  author?: string;     // default "Frank Advenoh"
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export function HeroCard({
  category,
  title,
  excerpt,
  date,
  readingTime,
  series,
  seriesOrder,
  author = 'Frank Advenoh',
}: Props) {
  return (
    <section className="mx-auto max-w-canvas px-6 pt-4 md:px-10">
      <div className="rounded-card-xl bg-bento-lavender p-6 text-bento-ink md:p-10">
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-bento-ink/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider capitalize">
            {category}
          </span>
          {series && (
            <span className="rounded-full bg-bento-ink px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              EP {String(seriesOrder ?? 0).padStart(2, '0')} · {series}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold leading-[1.15] tracking-tighter md:text-5xl md:leading-[1.1]">
          {title}
        </h1>
        {excerpt && (
          <p className="mt-5 max-w-2xl text-base leading-relaxed opacity-75 md:text-lg">
            {excerpt}
          </p>
        )}
        <div className="mt-8 flex items-center justify-between border-t border-bento-ink/10 pt-5 text-xs text-bento-dim">
          <span>{author} · {formatDate(date)}</span>
          <span>{readingTime}분 읽기</span>
        </div>
      </div>
    </section>
  );
}

// FOCUS_RING currently unused in this file; reserved for future interactive elements.
void FOCUS_RING;
```

⚠️ 마지막 `void FOCUS_RING;` 줄은 TypeScript unused 경고 회피. 향후 Hero 카드에 share 버튼 등 추가 시 사용. 지금은 불필요하면 라인 자체 제거해도 됨 — 단순화를 위해 처음부터 빼는 것도 OK. 다음 코드처럼:

대신 다음으로 단순화 (FOCUS_RING 제거):

```tsx
import { formatDate } from '@/lib/utils';

type Props = {
  category: string;
  title: string;
  excerpt?: string;
  date: string;
  readingTime: number;
  series?: string;
  seriesOrder?: number;
  author?: string;
};

export function HeroCard({
  category,
  title,
  excerpt,
  date,
  readingTime,
  series,
  seriesOrder,
  author = 'Frank Advenoh',
}: Props) {
  return (
    <section className="mx-auto max-w-canvas px-6 pt-4 md:px-10">
      <div className="rounded-card-xl bg-bento-lavender p-6 text-bento-ink md:p-10">
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-bento-ink/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider capitalize">
            {category}
          </span>
          {series && (
            <span className="rounded-full bg-bento-ink px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              EP {String(seriesOrder ?? 0).padStart(2, '0')} · {series}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold leading-[1.15] tracking-tighter md:text-5xl md:leading-[1.1]">
          {title}
        </h1>
        {excerpt && (
          <p className="mt-5 max-w-2xl text-base leading-relaxed opacity-75 md:text-lg">
            {excerpt}
          </p>
        )}
        <div className="mt-8 flex items-center justify-between border-t border-bento-ink/10 pt-5 text-xs text-bento-dim">
          <span>{author} · {formatDate(date)}</span>
          <span>{readingTime}분 읽기</span>
        </div>
      </div>
    </section>
  );
}
```

이 단순화된 버전을 채택. (FOCUS_RING void 트릭은 사용하지 않음.)

- [ ] **Step 2: `components/article/prev-next.tsx` 생성**

```tsx
import Link from 'next/link';

type Article = {
  slug: string;   // URL slug (title only, no category prefix)
  title: string;
};

type Props = {
  prev: Article | null;
  next: Article | null;
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export function PrevNext({ prev, next }: Props) {
  if (!prev && !next) return null;

  return (
    <section className="mx-auto mt-6 grid max-w-prose grid-cols-1 gap-3 px-6 md:grid-cols-2 md:px-0">
      {prev ? (
        <Link
          href={`/${encodeURIComponent(prev.slug)}`}
          className={[
            'rounded-card bg-bento-cream p-4 no-underline text-bento-ink transition hover:bg-bento-cream/80',
            FOCUS_RING,
          ].join(' ')}
        >
          <div className="text-[11px] text-bento-dim">← 이전</div>
          <div className="mt-1 text-[13px] font-semibold leading-snug">{prev.title}</div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/${encodeURIComponent(next.slug)}`}
          className={[
            'rounded-card bg-bento-ink p-4 no-underline text-white transition hover:bg-bento-ink/90',
            FOCUS_RING,
          ].join(' ')}
        >
          <div className="text-right text-[11px] text-white/60">다음 →</div>
          <div className="mt-1 text-right text-[13px] font-semibold leading-snug">{next.title}</div>
        </Link>
      ) : (
        <div />
      )}
    </section>
  );
}
```

- [ ] **Step 3: `components/article/related-cards.tsx` 생성**

```tsx
import Link from 'next/link';

type Tone = 'sage' | 'butter' | 'rose';

const TONE_BG: Record<Tone, string> = {
  sage: 'bg-bento-sage',
  butter: 'bg-bento-butter',
  rose: 'bg-bento-rose',
};

type Article = {
  slug: string;   // URL slug (title only)
  title: string;
  category: string;
};

type Props = {
  articles: Article[];
};

const TONES: Tone[] = ['sage', 'butter', 'rose'];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export function RelatedCards({ articles }: Props) {
  if (articles.length === 0) return null;

  return (
    <section className="mx-auto mt-12 max-w-canvas px-6 md:px-10">
      <h2 className="mb-4 text-xl font-bold tracking-tighter text-bento-ink md:text-2xl">
        관련 글
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {articles.slice(0, 3).map((a, i) => (
          <Link
            key={a.slug}
            href={`/${encodeURIComponent(a.slug)}`}
            className={[
              'flex min-h-[140px] flex-col justify-between rounded-card-lg p-5 text-bento-ink no-underline transition hover:opacity-90 md:min-h-[180px]',
              TONE_BG[TONES[i % TONES.length]],
              FOCUS_RING,
            ].join(' ')}
          >
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-wider text-bento-dim">
                {a.category}
              </div>
              <h3 className="text-[14px] font-semibold leading-snug tracking-tight md:text-[15px]">
                {a.title}
              </h3>
            </div>
            <div className="mt-3 text-[10px] text-bento-dim" aria-hidden="true">→</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

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
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add components/article/hero-card.tsx components/article/prev-next.tsx components/article/related-cards.tsx && git commit -m "$(cat <<'EOF'
feat(article): 신규 컴포넌트 — HeroCard / PrevNext / RelatedCards

* HeroCard: lavender Hero, category + series 뱃지, h1 제목, excerpt, 메타라인 (author · date / 읽기시간)
* PrevNext: 시리즈 이전(cream) · 다음(ink) 2-column, 모바일 1-column stack
* RelatedCards: 3장 Bento 톤 (sage/butter/rose), 이미지 없음, getRelatedArticles(slug, 3) 결과 매핑
* 모든 인터랙티브 요소에 focus-visible ring
* sub#5 Task 2 가 globals.css 추가, Task 3 가 page 통합

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `.prose-bento` CSS + 기존 컴포넌트 리디자인

**Files:**
- Modify: `app/globals.css` — `.prose-bento` + 다크 코드블록 + butter blockquote + 언어 라벨
- Modify: `components/article/series-navigation.tsx`
- Modify: `components/article/table-of-contents.tsx`

⚠️ 위 3개 파일만 수정. 다른 파일 절대 touch 금지.

- [ ] **Step 1: `app/globals.css` 끝에 `.prose-bento` 블록 추가**

`app/globals.css` 의 **파일 맨 끝**에 다음을 append:

```css

/* ========================================================== */
/* .prose-bento — Article 본문 typography (Bento 스타일)       */
/* ========================================================== */

.prose-bento {
  color: rgb(var(--bento-ink));
  font-size: 17px;
  line-height: 1.75;
}

.prose-bento h1 {
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  margin-top: 2rem;
  margin-bottom: 1rem;
  scroll-margin-top: 5rem;
}

.prose-bento h2 {
  font-size: 1.875rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  margin-top: 2.5rem;
  margin-bottom: 0.75rem;
  scroll-margin-top: 5rem;
}

.prose-bento h3 {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-top: 2rem;
  margin-bottom: 0.5rem;
  scroll-margin-top: 5rem;
}

.prose-bento h4 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  scroll-margin-top: 5rem;
}

.prose-bento p {
  margin-bottom: 1.25rem;
}

.prose-bento a {
  color: rgb(var(--bento-accent));
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
}

.prose-bento a:hover {
  text-decoration-thickness: 2px;
}

.prose-bento ul,
.prose-bento ol {
  margin-bottom: 1.25rem;
  padding-left: 1.5rem;
}

.prose-bento ul { list-style-type: disc; }
.prose-bento ol { list-style-type: decimal; }

.prose-bento li {
  margin-bottom: 0.5rem;
}

.prose-bento li::marker {
  color: rgb(var(--bento-dim));
}

.prose-bento hr {
  margin: 2rem 0;
  border: 0;
  border-top: 1px solid rgb(var(--bento-ink) / 0.1);
}

.prose-bento strong {
  font-weight: 700;
  color: rgb(var(--bento-ink));
}

.prose-bento em {
  font-style: italic;
}

/* Inline code (not language-*) */
.prose-bento code:not([class*="language-"]) {
  font-family: var(--font-mono);
  font-size: 0.875em;
  padding: 0.125em 0.375em;
  border-radius: 4px;
  background: rgb(var(--bento-ink) / 0.06);
  color: rgb(var(--bento-ink));
}

.dark .prose-bento code:not([class*="language-"]) {
  background: rgb(255 255 255 / 0.1);
}

.prose-bento code:not([class*="language-"])::before,
.prose-bento code:not([class*="language-"])::after {
  content: none;
}

/* Tables (GFM) */
.prose-bento table {
  width: 100%;
  margin: 1.5rem 0;
  border-collapse: collapse;
  font-size: 0.9375rem;
}

.prose-bento thead {
  border-bottom: 2px solid rgb(var(--bento-ink) / 0.15);
}

.prose-bento th,
.prose-bento td {
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.prose-bento tbody tr {
  border-bottom: 1px solid rgb(var(--bento-ink) / 0.06);
}

/* Blockquote — butter bg + Instrument Serif italic */
.prose-bento blockquote {
  margin: 2rem 0;
  padding: 1.75rem;
  border-radius: 20px;
  background: rgb(var(--bento-butter));
  color: rgb(var(--bento-ink));
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 1.25rem;
  line-height: 1.5;
  letter-spacing: -0.01em;
}

.prose-bento blockquote p {
  margin: 0;
}

.prose-bento blockquote p + p {
  margin-top: 0.75rem;
}

/* Images */
.prose-bento img {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  margin: 1.5rem 0;
}

/* ========================================================== */
/* Article 코드블록 — 다크 카드 + 언어 라벨                     */
/* ========================================================== */

.prose-bento pre[class*="language-"] {
  position: relative;
  margin: 1.5rem 0;
  padding: 2rem 1.25rem 1.25rem;
  border-radius: 20px;
  background: #0F0F0F;
  color: #E8E6E1;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.65;
}

.prose-bento pre[class*="language-"] code {
  font-family: inherit;
  font-size: inherit;
  background: transparent;
  color: inherit;
  padding: 0;
}

/* 언어 라벨 (top-right) */
.prose-bento pre[class*="language-"]::before {
  position: absolute;
  top: 0.5rem;
  right: 0.875rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #7A7770;
  content: 'code';
}

.prose-bento pre.language-go::before        { content: 'go'; }
.prose-bento pre.language-java::before      { content: 'java'; }
.prose-bento pre.language-typescript::before{ content: 'ts'; }
.prose-bento pre.language-tsx::before       { content: 'tsx'; }
.prose-bento pre.language-javascript::before{ content: 'js'; }
.prose-bento pre.language-jsx::before       { content: 'jsx'; }
.prose-bento pre.language-python::before    { content: 'py'; }
.prose-bento pre.language-bash::before      { content: 'bash'; }
.prose-bento pre.language-sh::before        { content: 'sh'; }
.prose-bento pre.language-yaml::before      { content: 'yaml'; }
.prose-bento pre.language-yml::before       { content: 'yaml'; }
.prose-bento pre.language-json::before      { content: 'json'; }
.prose-bento pre.language-sql::before       { content: 'sql'; }
.prose-bento pre.language-css::before       { content: 'css'; }
.prose-bento pre.language-html::before      { content: 'html'; }
.prose-bento pre.language-dockerfile::before{ content: 'dockerfile'; }
.prose-bento pre.language-kotlin::before    { content: 'kotlin'; }
.prose-bento pre.language-rust::before      { content: 'rust'; }
.prose-bento pre.language-ruby::before      { content: 'ruby'; }
.prose-bento pre.language-swift::before     { content: 'swift'; }
.prose-bento pre.language-php::before       { content: 'php'; }
.prose-bento pre.language-mermaid::before   { content: 'mermaid'; }

/* Prism token colors — adapt to dark background */
.prose-bento pre[class*="language-"] .token.comment,
.prose-bento pre[class*="language-"] .token.prolog,
.prose-bento pre[class*="language-"] .token.doctype,
.prose-bento pre[class*="language-"] .token.cdata { color: #6B6B6B; }

.prose-bento pre[class*="language-"] .token.punctuation { color: #E8E6E1; }

.prose-bento pre[class*="language-"] .token.property,
.prose-bento pre[class*="language-"] .token.tag,
.prose-bento pre[class*="language-"] .token.boolean,
.prose-bento pre[class*="language-"] .token.number,
.prose-bento pre[class*="language-"] .token.constant,
.prose-bento pre[class*="language-"] .token.symbol,
.prose-bento pre[class*="language-"] .token.deleted { color: #F5AE7A; }

.prose-bento pre[class*="language-"] .token.selector,
.prose-bento pre[class*="language-"] .token.attr-name,
.prose-bento pre[class*="language-"] .token.string,
.prose-bento pre[class*="language-"] .token.char,
.prose-bento pre[class*="language-"] .token.builtin,
.prose-bento pre[class*="language-"] .token.inserted { color: #A8D5B0; }

.prose-bento pre[class*="language-"] .token.operator,
.prose-bento pre[class*="language-"] .token.entity,
.prose-bento pre[class*="language-"] .token.url,
.prose-bento pre[class*="language-"] .language-css .token.string,
.prose-bento pre[class*="language-"] .style .token.string { color: #E8E6E1; }

.prose-bento pre[class*="language-"] .token.atrule,
.prose-bento pre[class*="language-"] .token.attr-value,
.prose-bento pre[class*="language-"] .token.keyword { color: #FF8866; }

.prose-bento pre[class*="language-"] .token.function,
.prose-bento pre[class*="language-"] .token.class-name { color: #C9A8F2; }

.prose-bento pre[class*="language-"] .token.regex,
.prose-bento pre[class*="language-"] .token.important,
.prose-bento pre[class*="language-"] .token.variable { color: #F5D5AB; }
```

⚠️ 위 블록은 globals.css 의 **맨 끝에 append**. 기존 `.prose`, `.token.*` 셀렉터는 그대로 둔다.

- [ ] **Step 2: `components/article/series-navigation.tsx` 전면 재작성**

`components/article/series-navigation.tsx` 의 전체 내용을 다음으로 덮어쓴다:

```tsx
import Link from 'next/link';
import { getArticleTitleFromSlug } from '@/lib/articles';

interface ManifestArticle {
  slug: string;
  category: string;
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  series?: string;
  seriesOrder?: number;
  firstImage?: string;
}

interface SeriesNavigationProps {
  seriesName: string;
  articles: ManifestArticle[];
  currentSlug: string;
}

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export function SeriesNavigation({
  seriesName,
  articles,
  currentSlug,
}: SeriesNavigationProps) {
  return (
    <section className="mx-auto mt-12 max-w-prose px-6 md:px-0">
      <div className="rounded-card-lg border border-bento-ink/10 bg-bento-card p-6 dark:border-white/10">
        <div className="mb-3 text-[10px] uppercase tracking-wider text-bento-dim">
          Series · {seriesName}
        </div>
        <ul className="flex flex-col gap-1">
          {articles.map((article, index) => {
            const isCurrent = article.slug === currentSlug;
            const articleTitle = getArticleTitleFromSlug(article.slug);
            return (
              <li key={article.slug}>
                <Link
                  href={`/${encodeURIComponent(articleTitle)}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={[
                    'flex items-center gap-3 rounded-card-sm p-2.5 no-underline text-bento-ink transition',
                    isCurrent ? 'bg-bento-lavender' : 'hover:bg-bento-ink/5 dark:hover:bg-white/5',
                    FOCUS_RING,
                  ].join(' ')}
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-bento-ink text-[10px] font-bold text-white">
                    {isCurrent ? '★' : article.seriesOrder ?? index + 1}
                  </span>
                  <span className={['text-[13px] leading-snug', isCurrent ? 'font-semibold' : ''].join(' ')}>
                    {article.title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: `components/article/table-of-contents.tsx` 리디자인**

`components/article/table-of-contents.tsx` 의 전체 내용을 다음으로 덮어쓴다 (기존 IntersectionObserver 로직 유지 + Bento 토큰 + 모바일 disclosure mode prop 추가):

```tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TOCItem } from '@/lib/markdown';

interface TableOfContentsProps {
  items: TOCItem[];
  /** When true, renders as collapsible <details> (for mobile). Default false = sidebar list */
  collapsible?: boolean;
}

export function TableOfContents({ items, collapsible = false }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const isClickScrollingRef = useRef(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = useCallback((id: string) => {
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    setActiveId(id);
    isClickScrollingRef.current = true;
    clickTimeoutRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 500);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrollingRef.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      {
        rootMargin: '-80px 0px -35% 0px',
        threshold: 0,
      },
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const list = (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 0.75}rem` }}>
            <a
              href={`#${item.id}`}
              onClick={() => handleClick(item.id)}
              className={[
                'block py-1 text-[13px] no-underline transition',
                active ? 'font-semibold text-bento-accent' : 'text-bento-ink hover:text-bento-accent',
              ].join(' ')}
            >
              {item.text}
            </a>
          </li>
        );
      })}
    </ul>
  );

  if (collapsible) {
    return (
      <details className="rounded-card-lg border border-bento-ink/10 bg-bento-card dark:border-white/10">
        <summary className="cursor-pointer px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-bento-dim">
          목차 · {items.length}
        </summary>
        <div className="px-4 pb-4">{list}</div>
      </details>
    );
  }

  return (
    <div className="rounded-card-lg border border-bento-ink/10 bg-bento-card p-5 dark:border-white/10">
      <div className="mb-3 text-[10px] uppercase tracking-wider text-bento-dim">목차</div>
      {list}
    </div>
  );
}
```

⚠️ heading level 2~4 가 들여쓰기되도록 `paddingLeft: (item.level - 2) * 0.75rem` 적용. h2 = 0 padding, h3 = 0.75rem, h4 = 1.5rem.

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
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add app/globals.css components/article/series-navigation.tsx components/article/table-of-contents.tsx && git commit -m "$(cat <<'EOF'
feat(article): prose-bento CSS + SeriesNavigation·TOC 리디자인

* app/globals.css: .prose-bento 본문 typography (h1~h4, p, a, ul/ol, table, blockquote, img)
  — blockquote: butter bg + Instrument Serif italic 1.25rem
  — 다크 코드블록: #0F0F0F + 우상단 언어 라벨 (15+ 언어 매핑, 매치 안 되면 'code')
  — Prism token 색상을 다크 배경에 맞게 재조정
* SeriesNavigation: shadcn Card → bento-card border, 현재 글 lavender 강조 + ★ 표시
* TableOfContents: bento 토큰 매핑, collapsible prop 추가 (모바일 <details> disclosure 모드)
  — heading level 들여쓰기 유지, IntersectionObserver 로직 그대로

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `app/[slug]/page.tsx` 전면 재작성

**Files:**
- Modify: `app/[slug]/page.tsx`

⚠️ 단 1개 파일만 수정. 기존 imports / functions (`getArticleByTitle`, `extractTOC`, `calculateReadingTime`, `getRelatedArticles`, `getArticlesBySeries`, `findArticleByTitle`, `RecordView`) 는 모두 그대로 활용.

- [ ] **Step 1: 현재 파일 구조 확인 (read-only)**

```bash
cat /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/app/[slug]/page.tsx | head -50
```

기대: `'use server'` 또는 server component, imports 영역 + `generateStaticParams` + `generateMetadata` + default async function.

- [ ] **Step 2: page.tsx 전면 교체**

`app/[slug]/page.tsx` 의 전체 내용을 다음으로 덮어쓴다:

```tsx
import { notFound } from 'next/navigation';
import {
  getArticleByTitle,
  getAllArticles,
  getRelatedArticles,
  getArticleTitleFromSlug,
  getArticlesBySeries,
  findArticleByTitle,
} from '@/lib/articles';
import { extractTOC, calculateReadingTime } from '@/lib/markdown';
import { MermaidRenderer } from '@/components/article/mermaid-renderer';
import { TableOfContents } from '@/components/article/table-of-contents';
import { SeriesNavigation } from '@/components/article/series-navigation';
import { HeroCard } from '@/components/article/hero-card';
import { PrevNext } from '@/components/article/prev-next';
import { RelatedCards } from '@/components/article/related-cards';
import { RecordView } from '@/components/article/record-view';
import { formatDate } from '@/lib/utils';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((article) => ({
    slug: getArticleTitleFromSlug(article.slug),
  }));
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const resolvedParams = await params;
  if (!resolvedParams.slug) return { title: '게시글을 찾을 수 없습니다' };

  const decodedSlug = decodeURIComponent(resolvedParams.slug);
  const article = await getArticleByTitle(decodedSlug);
  if (!article) return { title: '게시글을 찾을 수 없습니다' };

  return {
    title: `${article.frontmatter.title} | Frank's IT Blog`,
    description: article.frontmatter.excerpt || article.frontmatter.title,
    openGraph: {
      title: article.frontmatter.title,
      description: article.frontmatter.excerpt,
      type: 'article',
      publishedTime: article.frontmatter.date,
      tags: article.frontmatter.tags,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const resolvedParams = await params;
  if (!resolvedParams.slug) notFound();

  const decodedSlug = decodeURIComponent(resolvedParams.slug);
  const article = await getArticleByTitle(decodedSlug);
  if (!article) notFound();

  const toc = extractTOC(article.html);
  const readingTime = calculateReadingTime(article.content);

  const manifestArticle = await findArticleByTitle(decodedSlug);
  const category = manifestArticle?.category || 'Uncategorized';

  // Related articles (3 cards, Bento tinted)
  const relatedRaw = manifestArticle
    ? await getRelatedArticles(manifestArticle.slug, 3)
    : [];
  const related = relatedRaw.map((r) => ({
    slug: getArticleTitleFromSlug(r.slug),
    title: r.title,
    category: r.category,
  }));

  // Series prev/next + episode list (only if part of a series)
  let seriesEpisodes: Awaited<ReturnType<typeof getArticlesBySeries>> = [];
  let prev: { slug: string; title: string } | null = null;
  let next: { slug: string; title: string } | null = null;
  if (manifestArticle?.series) {
    const eps = await getArticlesBySeries(manifestArticle.series);
    seriesEpisodes = eps;
    const idx = eps.findIndex((e) => e.slug === manifestArticle.slug);
    if (idx > 0) {
      const p = eps[idx - 1];
      prev = { slug: getArticleTitleFromSlug(p.slug), title: p.title };
    }
    if (idx >= 0 && idx < eps.length - 1) {
      const n = eps[idx + 1];
      next = { slug: getArticleTitleFromSlug(n.slug), title: n.title };
    }
  }

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <RecordView
        slug={decodedSlug}
        title={article.frontmatter.title}
        category={category}
        date={article.frontmatter.date}
      />

      <HeroCard
        category={category}
        title={article.frontmatter.title}
        excerpt={article.frontmatter.excerpt}
        date={article.frontmatter.date}
        readingTime={readingTime}
        series={manifestArticle?.series}
        seriesOrder={manifestArticle?.seriesOrder}
      />

      {/* Body + sticky TOC (desktop) / collapsible TOC (mobile) */}
      <section className="mx-auto mt-12 max-w-canvas px-6 md:px-10">
        {toc.length > 0 && (
          <div className="mb-6 md:hidden">
            <TableOfContents items={toc} collapsible />
          </div>
        )}

        <div className="md:grid md:grid-cols-[1fr_240px] md:gap-10">
          <article className="prose-bento max-w-prose">
            <MermaidRenderer html={article.html} />
          </article>

          {toc.length > 0 && (
            <aside className="hidden md:block">
              <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <TableOfContents items={toc} />
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* Series nav (only when series article) */}
      {manifestArticle?.series && seriesEpisodes.length > 1 && (
        <SeriesNavigation
          seriesName={manifestArticle.series}
          articles={seriesEpisodes}
          currentSlug={manifestArticle.slug}
        />
      )}

      {/* Prev/Next (only when series article and has prev or next) */}
      {(prev || next) && (
        <div className="mx-auto max-w-prose px-6 md:px-0">
          <PrevNext prev={prev} next={next} />
        </div>
      )}

      {/* Related cards (all articles) */}
      <RelatedCards articles={related} />
    </main>
  );
}
```

⚠️ 변경 노트:
- `<div className="container mx-auto px-4 py-8 max-w-7xl">` → `<main className="min-h-screen bg-bento-bg pb-20">`
- Article header (Badge + date + readingTime + h1 + excerpt + tags) → `<HeroCard ... />`
- 본문 wrapper: `<article className="mb-12">` → `<article className="prose-bento max-w-prose">`
- 2-column TOC: 기존 `flex gap-8 lg:gap-12` → CSS Grid `md:grid-cols-[1fr_240px] md:gap-10`. lg → md 로 breakpoint 변경 (TOC 가 더 일찍 사이드바로 전환)
- 모바일 TOC: 기존 `<aside className="lg:hidden ...">` → `collapsible` prop 의 TableOfContents
- Series nav: 위치 변경 (헤더 바로 아래 → 본문 아래)
- Related: shadcn 카드 3개 (이미지 + Badge + Title + Description + Tags) → RelatedCards (Bento 톤 3장, 이미지/태그 없음)
- "목록으로 돌아가기" 버튼 제거 (헤더 nav 가 대신)

- [ ] **Step 3: 타입 검사 + 빌드**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run check
```

기대: 빈 출력. 에러 시 quote + BLOCKED.

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && npm run build
ls out/ | head -5
ls "out/claude-code-superpowers-완벽-가이드/index.html" 2>&1 | head -1
```

기대: 빌드 성공. 산출물에 article HTML 존재.

- [ ] **Step 4: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git add "app/[slug]/page.tsx" && git commit -m "$(cat <<'EOF'
feat(article): app/[slug]/page.tsx 전면 재작성 — Bento Hero + prose-bento + Series nav + Prev/Next + Related

* HeroCard: 기존 Badge + date + readingTime + h1 + excerpt + tags 영역 대체 (lavender 카드)
* 본문 wrapper: <article className="prose-bento max-w-prose"> 적용
* 2-column 그리드: md:grid-cols-[1fr_240px] (lg → md breakpoint 변경)
* TOC 데스크탑: sticky sidebar / 모바일: collapsible <details>
* Series 글: Series nav (lavender 강조) → Prev/Next (cream/ink) 추가
* Related: 이미지 있는 shadcn 카드 3개 → Bento 톤 3장 (sage/butter/rose, 이미지 없음)
* 기존 generateStaticParams, generateMetadata, RecordView 유지

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

기대: 성공. 188 static pages (기존 187 + 변동 없음 — page 수는 동일, 단지 article 페이지가 새로 렌더링됨).

- [ ] **Step 3: 빌드 산출물 sample article 확인**

```bash
ls /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/out/ | grep -i superpower | head -3
ls "/Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/out/claude-code-superpowers-완벽-가이드/" 2>&1 | head -5
```

기대: article 디렉토리 + index.html 존재.

- [ ] **Step 4: 컨트롤러 시각 + 동작 확인 (subagent SKIP, controller 진행)**

`npm start` (or `npx serve out -l 3000`) 후 확인:

샘플 article 페이지 (예: `/claude-code-superpowers-완벽-가이드/`):
- Hero 카드 lavender 배경, 카테고리 + (해당시) Series 뱃지, h1 제목 큰 사이즈, excerpt, 메타라인 (Frank Advenoh · 날짜 / 분 읽기)
- 본문 typography: Pretendard, h2/h3 큰 사이즈 + tightening, 단락 spacing, link accent 색상, 인라인 코드 회색 배경
- 코드블록: 다크 #0F0F0F 배경, 언어 라벨 우상단 (예: 'go', 'typescript'), Prism 컬러 다크 톤으로 적용됨
- blockquote: butter 배경 + Instrument Serif italic
- TOC: 데스크탑은 우측 240px sticky 사이드바 (스크롤 시 active section accent), 모바일은 본문 위 collapsible "목차 · N" disclosure
- Mermaid 다이어그램: 기존 렌더링 그대로
- 시리즈 글이면: 본문 아래 Series nav 카드 (모든 에피소드, 현재 글 lavender + ★) → Prev (cream) / Next (ink) 2-column → Related 3장
- 비시리즈 글: 본문 아래 바로 Related 3장
- 모바일 viewport: Hero 사이즈 축소, TOC collapsible, Prev/Next + Related 1열 stack
- 다크 모드: 모든 카드 정상, 본문 텍스트 light/dark 자동 전환

샘플 시리즈 article (예: `/golang-concurrency-2-channel-완벽-가이드/`):
- Hero 에 "EP 02 · Golang Concurrency" 뱃지 표시
- 본문 아래 Series nav (5편 모두, ★ 표시는 현재 글)
- Prev/Next 양쪽 모두 (1편 prev, 3편 next)

샘플 비시리즈 article (예: 일반 단일 글):
- Series nav 없음
- Prev/Next 없음
- Related 3장만 본문 아래

CommandK 검색 (sub#3): 정상 작동 확인 (헤더 변경 없음).

- [ ] **Step 5: 브랜치 상태 확인**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr && git log --oneline feature/redesign-bento ^main | head -30
```

기대: sub#1+#2+#3+#4 의 24 + sub#5 의 4 = 약 28 커밋.

---

## Self-Review Notes

### Spec coverage (§8)
- §8.1 새 구조 → Task 1 (HeroCard, PrevNext, RelatedCards) + Task 3 (page integration)
- §8.2 코드블록 / Pull quote / Mermaid → Task 2 globals.css (.prose-bento pre + 언어 라벨 + blockquote butter)
- §8.3 시리즈 / Related 정책 → Task 3 의 조건부 렌더링 (prev/next 시리즈 글만, Related 모든 글)
- §8.4 모바일 → HeroCard `md:text-5xl`, TOC `collapsible`, PrevNext `md:grid-cols-2`, RelatedCards `md:grid-cols-3`
- §8.5 영향 범위 → Files Touched 와 일치
- 모두 커버됨.

### Placeholder scan
TBD/TODO 없음. 모든 코드 스니펫 완성형. (Task 1 Step 1 의 FOCUS_RING void 트릭은 본문에서 명시적으로 거부하고 단순화 버전 채택.)

### Type consistency
- `ManifestArticle` 인터페이스: SeriesNavigation 안에서만 inline 정의 — page 가 전달하는 셰이프와 일치
- HeroCard / PrevNext / RelatedCards / SeriesNavigation 의 prop 타입: page 가 매핑하는 데이터 셰이프와 일치
- `RecordView` prop 셰이프 (slug/title/category/date): sub#3 Task 4 정의 그대로 사용
- `TOCItem` 타입: `lib/markdown.ts` 에서 import (기존)

### 외부 의존성 사전 검증
- `lib/markdown.ts` (extractTOC, calculateReadingTime, TOCItem) ✓
- `lib/articles.ts` (getArticleByTitle, getAllArticles, getRelatedArticles, getArticleTitleFromSlug, getArticlesBySeries, findArticleByTitle) ✓
- `lib/utils.ts` (formatDate) ✓
- `components/article/mermaid-renderer.tsx` (MermaidRenderer) — 그대로 유지 ✓
- `components/article/record-view.tsx` (RecordView) — sub#3 Task 4 에서 추가됨 ✓
- `@tailwindcss/typography` (`.prose` 셀렉터) — 새 `.prose-bento` 와 독립이므로 영향 없음 ✓

### Decoupling
- 신규 3개 컴포넌트는 prop 으로만 데이터 받음 — ManifestArticle 직접 의존 없음
- SeriesNavigation 만 inline ManifestArticle 타입 (lib 의 unexport 와 일치, page 가 직접 전달)
- 기존 imports (Badge, Card, Separator from shadcn) 는 새 page 에서 모두 제거 — shadcn 의존성 축소

### Risks 및 완화
- **Prism 토큰 색상 다크 배경 대비**: globals.css 에서 토큰 색상을 새로 정의 (기존 light 모드 토큰 색은 기존 `.prose pre` 에서 그대로). `.prose-bento pre` 셀렉터로 격리되어 기존 페이지 영향 없음.
- **Mermaid 색상**: light/dark 자동 전환 (resolvedTheme). 새 페이지에서도 동일 동작.
- **`<details>` 모바일 disclosure**: 브라우저 기본 disclosure widget — accessibility 자동 (toggle expanded state). 별도 a11y 작업 불필요.
- **rehype-prism-plus 의 `showLineNumbers: true`**: 라인 번호가 렌더링되는데, 새 다크 배경에서 line-number 색상이 어색할 수 있음 — controller 시각 검토 단계에서 확인. 문제 있으면 .prose-bento `.line-numbers` 셀렉터 추가.
- **scroll-margin-top: 5rem**: 기존 `.prose h2` 등의 scroll-margin 과 동일 값 — 새 `.prose-bento` 에서도 동일. sticky 헤더(56px) + 여유(24px) 호환.
- **모바일 코드블록 가로 스크롤**: `overflow-x-auto` 적용됨. line-numbers 가 wrap 안 되도록 width 보장.
- **Article 본문 너비 720px 와 max-w-canvas 1280px 중첩**: 본문 영역 (col-1) 은 `max-w-prose` (720px) 로 제한, 부모 grid 는 `max-w-canvas` (1280px). 240px sidebar 와 충돌 시 본문이 자동 축소되어 leading 깨질 우려. 검증 단계에서 확인 — 문제 시 `md:grid-cols-[minmax(0,720px)_240px]` 로 명시.
