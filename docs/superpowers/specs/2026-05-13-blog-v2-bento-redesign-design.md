# Blog v2 Bento 리디자인 설계서

**작성일**: 2026-05-13
**대상 프로젝트**: `blog-v2.advenoh.pe.kr`
**참고 프로토타입**: `docs/design/blog-v3-bento/` (Next.js 14 + Tailwind + TypeScript 변환본)

---

## 1. 개요

`blog-v2.advenoh.pe.kr` 사이트(현재 Next.js 15 + shadcn/ui 카드 그리드, Medium/Dev.to 톤)를 `docs/design/blog-v3-bento/` 프로토타입의 **Bento Grid 미학**으로 전면 리디자인한다. 시각 정체성과 정보 위계를 카드 그리드 → Bento 블록(색상 톤 + 타이포 위계)으로 전환하되, 운영 인프라(SEO, AdSense, GA, RSS, sitemap, ChatButton)와 콘텐츠 모델(마크다운 + frontmatter)은 그대로 유지한다.

배포는 단일 시점에서 일어나야 하므로, 통합 feature 브랜치에 sub-PR을 점진적으로 누적한 뒤 한 번에 `main`으로 머지하는 패턴을 사용한다.

## 2. 목표 & 비목표

### 목표
- 홈 / 글 / 카테고리 / 시리즈 / 태그 페이지를 Bento 디자인 시스템으로 통일
- 라이트/다크 테마 유지, 단일 brand accent로 운영
- ⌘K Command-K 검색으로 SearchDialog 교체 (MiniSearch 인덱스 재사용)
- 신규 라우트 `/posts`, `/category/[name]`, `/series/[slug]`, `/tags/[name]` 추가
- 풀 반응형 (모바일 → 데스크탑)
- 운영 인프라(AdSense / GA / JSON-LD / RSS / sitemap / robots / ChatButton) 무손실 보존

### 비목표
- URL 구조 변경 (기존 `/[slug]` 유지 → SEO 보호)
- 5색 accent picker (프로토타입 기능, 단순화를 위해 제외)
- 콘텐츠 모델 변경 (`contents/{category}/{title}/index.md` 그대로)
- 백엔드/API 추가 (정적 export 유지)
- 대대적인 리팩토링 (이 리디자인 범위 밖의 코드는 손대지 않음)

## 3. 전체 전략

### 3.1 브랜치 모델
- 통합 브랜치 `feature/redesign-bento`를 `main`에서 분기
- 모든 sub-PR은 이 브랜치를 base로 머지 (main 직접 머지 금지)
- 통합 브랜치는 정기적으로 `main`을 동기화 (운영 패치/콘텐츠 추가와의 충돌 방지)
- 통합 브랜치 내부에서 전체 검증이 끝나면 `main`으로 단일 머지 = 단일 배포 시점

### 3.2 9개 sub-project 분해

각 항목은 독립적인 spec → plan → 구현 사이클로 진행한다.

| # | Sub-project | 의존 |
|---|---|---|
| 1 | 디자인 시스템 기반 | — |
| 2 | 공통 레이아웃 셸 (Header + Footer) | 1 |
| 3 | Command-K 검색 | 1, 2 |
| 4 | 홈 Bento + `/posts` 전체 리스트 | 1, 2 |
| 5 | Article 페이지 리디자인 | 1, 2 |
| 6 | 카테고리 페이지 (`/category/[name]`) | 1, 2 |
| 7 | 시리즈 페이지 (`/series` 인덱스 + `/series/[slug]`) | 1, 2 |
| 8 | 태그 페이지 (`/tags` 가중치 클라우드 + `/tags/[name]`) | 1, 2 |
| 9 | 운영 통합 & 최종 정리 | 3-8 |

## 4. 디자인 시스템 기반 (Sub-project #1)

### 4.1 CSS 디자인 토큰

프로토타입의 `app/globals.css`를 기반으로 하되, 5색 accent picker는 제외하고 단일 brand accent로 운영한다. 기존 shadcn/ui 토큰은 점진적 마이그레이션 동안 충돌 방지를 위해 유지하고, sub-project #9에서 미사용분 정리.

```css
:root {
  --bg: 242 239 234;
  --card: 255 255 255;
  --ink: 15 15 15;
  --dim: 107 107 107;
  --cream: 248 244 237;
  --accent: 255 91 34;
  --accent-soft: 255 217 201;
  --sage: 217 228 212;
  --rose: 245 213 203;
  --lavender: 224 213 240;
  --butter: 245 230 168;
}
.dark {
  --bg: 22 21 18;
  --card: 31 29 26;
  --ink: 244 241 234;
  --dim: 140 133 122;
  --cream: 38 35 31;
  --sage: 58 74 58;
  --rose: 74 47 47;
  --lavender: 58 48 80;
  --butter: 74 66 32;
}
```

`data-accent` 기반 5색 토글은 도입하지 않는다.

### 4.2 Tailwind 확장

`tailwind.config.ts`에 다음을 추가한다.

- `colors`: bg, card, ink, dim, cream, accent, accent-soft, sage, rose, lavender, butter — 모두 `rgb(var(--...) / <alpha-value>)` 형태
- `borderRadius`: card-sm 12px, card 20px, card-lg 24px, card-xl 32px
- `maxWidth`: prose 720px, canvas 1280px
- `letterSpacing`: tightest -0.04em, tighter -0.025em
- `fontFamily`: sans → Pretendard, serif → Instrument Serif, mono → JetBrains Mono

### 4.3 폰트 로딩

- **Pretendard** — `next/font/local` 또는 webfont CDN. 본문/제목 sans.
- **Instrument Serif** — `next/font/google`. headline의 italic 강조용 (예: 큰 헤드라인의 한 단어).
- **JetBrains Mono** — Google Fonts. 코드 + 모노 메타.

`app/layout.tsx`에서 세 폰트의 CSS 변수(`--font-pretendard`, `--font-instrument`, `--font-mono`)를 `<body>`에 적용.

### 4.4 ThemeProvider
현재 `components/theme-provider.tsx`는 `next-themes` wrapper로 light/dark를 이미 지원한다. **그대로 재사용**한다. `data-accent` 코드는 추가하지 않는다.

### 4.5 공통 utility 클래스

- `.bento-card` — `border-radius: 24px; background: rgb(var(--card));`
- `.headline-hi` — butter 배경 + Instrument Serif italic + 미세 padding
- `.no-scrollbar` — 필터 레일용 (모바일 카테고리 칩 가로 스크롤)

### 4.6 영향 범위
- `app/globals.css` 토큰 추가
- `tailwind.config.ts` 확장
- `app/layout.tsx`에 폰트 변수 등록
- 기존 컴포넌트는 새 토큰을 사용하지 않는 한 영향 없음 — 단독 머지 가능

## 5. 공통 레이아웃 셸 (Sub-project #2)

### 5.1 Header 구조

```
┌────────────────────────────────────────────────────────────────────────┐
│ [F] frank.blog    [pill nav]      [Search ⌘K]  [☾]  [RSS]              │
└────────────────────────────────────────────────────────────────────────┘
```

- **로고**: bento "F" 정사각 아이콘(`bg-accent` 위 흰색 글자) + `frank.blog` 워드마크
  - 워드마크 카피는 구현 단계에서 "frank.blog" vs "Frank's IT Blog" 중 선택 (기본은 "frank.blog")
- **Pill nav**: `bg-ink/[0.06]` 둥근 캡슐 배경. 활성 항목 `bg-ink text-white`, 비활성 `text-ink hover:bg-ink/5`
- **Nav 4개**: Home / Posts / Series / Tags
- **Search 트리거**: `bg-ink/[0.06]` 캡슐, 돋보기 아이콘 + "Search" + `⌘K` kbd
- **Theme toggle**: 둥근 버튼, `☾` ↔ `☀`
- **RSS 버튼**: `bg-ink text-white` 캡슐. 클릭 시 `/rss.xml` (현재 RSS 경로) 이동

### 5.2 Sticky 헤더
`sticky top-0 z-50 backdrop-blur` 유지 (현재 동작 보존, 모바일 UX 향상).

### 5.3 모바일
- Pill nav → 햄버거 메뉴 → shadcn `Sheet` 또는 `Drawer` 드로어. 동일 4개 항목.
- Search / Theme / RSS는 아이콘 단독 버튼으로 축소.

### 5.4 Footer
`components/site-footer.tsx`는 색상 토큰만 새 토큰으로 매핑한다. 구조 변경 없음.

### 5.5 영향 범위
- `components/site-header.tsx` 전면 재작성 (파일 자리 유지)
- `components/site-footer.tsx` 토큰만 매핑
- `app/layout.tsx`의 import 그대로

## 6. Command-K 검색 (Sub-project #3)

### 6.1 재사용
- 검색 인덱스 `public/search-index.json` (빌드 시 생성) **그대로**
- `MiniSearch` 그대로 (title×2, excerpt×1.5, tags×1.2, fuzzy 0.2, prefix true)
- `⌘K`/`Ctrl+K` 핸들러 그대로

### 6.2 신규 UI

프로토타입의 모노크롬 미니멀 모달로 교체.

- **Top bar**: `›` 프롬프트 + 입력 + `esc` 버튼
- **본문 섹션**:
  - Empty state: `recently viewed` / `popular this week` / `your history`
  - Search state: `articles` / `tags`
- **Footer**: kbd hint (`↑↓ navigate / ↵ open / esc close`) + `● indexed · {N} posts`

### 6.3 localStorage

- `cmdk:recently_viewed` — 글 열람 시 누적 (최대 10개, 표시는 상위 5개)
- `cmdk:history` — 검색어 확정 시 누적 (최대 10개, 표시는 상위 5개, "clear" 버튼으로 삭제)
- `popular this week` — `config/popular-searches.ts` 고정 큐레이션 (분석 연동 없음)
- 모든 localStorage 접근은 try/catch로 감싸 quota/비활성화 무시

### 6.4 키보드 네비게이션
- `↑↓` — 활성 row 이동 (left-border accent로 강조)
- `Enter` — article → 글 페이지로 이동 / tag → `/tags/[name]` / popular·history → query에 채워 재검색
- `Esc` — 모달 닫기

### 6.5 결과 하이라이트
매치 부분 `<span class="bg-accent/20">` 처리. 결과 없음일 때 `∅` 아이콘 + `"{query}"에 대한 결과 없음`.

### 6.6 영향 범위
- `components/command-k.tsx` 신규
- `components/search-dialog.tsx` 삭제 (sub-project #9)
- `lib/cmdk-storage.ts` 신규 (`recordView`, `recordSearch`, `clearHistory`)
- `config/popular-searches.ts` 신규
- `components/site-header.tsx`에서 새 모달 연결
- `app/[slug]/page.tsx` (또는 클라이언트 effect)에서 페이지 로드 시 `recordView()` 호출

### 6.7 모바일
- 모달 `inset-0` 전체 화면
- 키보드 hint는 모바일에서 숨김
- 입력란 sticky top, 결과 영역만 스크롤

## 7. 홈 + `/posts` (Sub-project #4)

### 7.1 홈 (`/`) Bento 레이아웃

```
┌──────────────────────────────────────────────────────┐
│ Headline                                              │
│  "Field notes from a working engineer."              │
│  Cloud · Java · Go · Database · {N}편 누적            │
├──────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────┐                    │
│ │ Featured       │ │ Series     │                    │
│ │ col-7 row-2    │ │ spotlight  │                    │
│ │ dark + accent  │ │ col-5      │                    │
│ │ radial         │ │ lavender   │                    │
│ └────────────────┘ └────────────┘                    │
│ ┌────────────────────────┐ ┌──────────────┐          │
│ │ Latest (col-7)         │ │ Categories   │          │
│ │ accent bg              │ │ col-5 cream  │          │
│ └────────────────────────┘ └──────────────┘          │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│ │Recent│ │Recent│ │Recent│ │Recent│  col-3 × 4        │
│ │ sage │ │butter│ │ rose │ │cream │  tinted           │
│ └──────┘ └──────┘ └──────┘ └──────┘                  │
└──────────────────────────────────────────────────────┘
```

### 7.2 데이터 매핑

`articles` 배열은 발행일 desc 정렬 (`getAllArticles()` 기존 함수).

| 슬롯 | 데이터 |
|---|---|
| `{N}편 누적` | `articles.length` |
| Featured | `articles[0]` |
| Series spotlight | 가장 최근 글 중 `series` 필드가 있는 글의 시리즈 → `getArticlesBySeries(name)` → 에피소드 리스트. 진행 메타는 외부 없어 "{N}편 발행 중"으로 단순화 |
| Latest | `articles.slice(1, 5)` |
| Categories | `lib/articles.ts` 카테고리 집계 (현재 `HomeContent` 로직 그대로) |
| Recent | `articles.slice(5, 9)` — 4개, 톤 순환 (sage/butter/rose/cream) |

### 7.3 Headline 카피

- 메인: "Field notes from a working engineer." (또는 한국어 톤 "한 개발자의 현장 노트." — 구현 단계에서 최종 선택)
- 서브: "Cloud · Java · Go · Database. {N}편 누적."

### 7.4 이미지 정책
홈 모든 카드는 **이미지 없음**. Bento 미학의 핵심. `firstImage` 추출 로직은 article 본문/related 외에서는 사용하지 않음.

### 7.5 `/posts` 전체 리스트

```
┌──────────────────────────────────────────────────────┐
│ Header                                                │
├──────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌────────────────────────────────────┐  │
│ │ Sticky   │ │ 2026                                │  │
│ │ Category │ │  04.21  AI       Claude Code...    │  │
│ │ Filter   │ │  04.08  Cloud    Terraform...      │  │
│ │ Rail     │ │  03.28  Go       Channel 완전...    │  │
│ │          │ │ 2025                                │  │
│ │ All  178 │ │  ...                                │  │
│ │ Cloud 26 │ │                                     │  │
│ │ Java 24  │ │                                     │  │
│ └──────────┘ └────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

- 좌측 sticky category 필터 레일 (col-3) + 우측 글 리스트 (col-9)
- 연도별 헤더로 그룹핑 + 그 아래 `MM.DD · category · title` row
- URL query `?cat=cloud`로 카테고리 필터 (북마크/공유 가능)
- 모바일: 카테고리 필터는 상단 가로 스크롤 chip 레일

### 7.6 영향 범위
- `app/page.tsx` 재작성
- `app/posts/page.tsx` 신규
- `components/home-content.tsx` → sub-project #9에서 삭제
- `components/home/featured-card.tsx`, `series-spotlight-card.tsx`, `latest-card.tsx`, `categories-card.tsx`, `recent-card.tsx` 신규 분할
- `components/posts/posts-list.tsx`, `category-rail.tsx` 신규

## 8. Article 페이지 리디자인 (Sub-project #5)

### 8.1 새 구조

```
Header
─────
┌───────────────────────────────────────────────┐
│ Hero card (lavender, rounded-card-xl)         │
│  [Category] [EP02 · Series Name]               │
│  H1 글 제목                                     │
│  Excerpt                                       │
│  ─────                                         │
│  Frank Advenoh · 2026.04.21    14m read       │
└───────────────────────────────────────────────┘

┌─────────────────────────────────┐ ┌──────────┐
│ Article body (max-prose 720px)  │ │ Sticky    │
│  prose-bento 스타일               │ │ TOC 240px│
│  코드블록: 다크 #0F0F0F + 라벨    │ │ active   │
│  Pull quote: butter bg + italic │ │ highlight│
│  Mermaid: 기존 렌더러            │ │          │
└─────────────────────────────────┘ └──────────┘

(시리즈 글) Series nav 카드
┌───────────────────────────────────────────────┐
│ Series · {series name}                        │
│  1. 1편 제목                                    │
│  ★ 2편 제목 (현재) ← lavender 강조              │
│  3. 3편 제목                                    │
└───────────────────────────────────────────────┘

(시리즈 prev/next가 있을 때) 2-column
┌──────────────┐ ┌──────────────────┐
│ ← 이전        │ │ 다음 →             │
│ {title}      │ │ {title}            │
│ cream bg     │ │ ink bg, white     │
└──────────────┘ └──────────────────┘

(모든 글) Related 3장 (Bento 톤, 이미지 없음)
┌──────┐ ┌──────┐ ┌──────┐
│ sage │ │butter│ │ rose │
└──────┘ └──────┘ └──────┘
```

### 8.2 코드블록 / Pull quote / Mermaid
- 코드블록: 기존 marked + Prism 처리 그대로. 외관 마크업/CSS만 다크 카드(`bg-[#0F0F0F]`, 언어 라벨, `rounded-card`)로 조정
- Pull quote: 마크다운 `> ...` 렌더링에서 butter bg + Instrument Serif italic 클래스 부여 (`lib/markdown.ts` 손봄)
- Mermaid: 현재 `MermaidRenderer` 그대로, 색상만 새 토큰

### 8.3 시리즈 / Related 정책
- 시리즈 글: Hero → 본문 → Series nav 카드 → Prev/Next → Related 3장
- 비시리즈 글: Hero → 본문 → Related 3장
- Related는 `getRelatedArticles()` 기존 로직 재사용, Bento 톤 카드(이미지 없음, sage/butter/rose 순환)

### 8.4 모바일
- Hero title: `text-3xl` (데스크탑 `text-5xl`)
- 본문 padding 축소 (`px-5`)
- TOC: 데스크탑 sticky sidebar 240px → 모바일에서는 본문 상단에 collapsible `<details>` disclosure로 노출
- Prev/Next: 1열 stack
- Related: 1열 stack

### 8.5 영향 범위
- `app/[slug]/page.tsx` 전면 재작성 (URL 구조 / `generateStaticParams` / `generateMetadata` 그대로)
- `components/article/series-navigation.tsx` 리스타일링 (lavender + 현재 글 강조)
- `components/article/table-of-contents.tsx` 리스타일링 (active section, 모바일 disclosure)
- `components/article/hero-card.tsx` 신규
- `components/article/prev-next.tsx` 신규
- `components/article/related-cards.tsx` 신규 (이미지 없는 톤 카드)
- `components/article/mermaid-renderer.tsx` 외부 마크업/CSS
- `lib/markdown.ts` blockquote 클래스 부여 추가

## 9. 카테고리 · 시리즈 · 태그 (Sub-project #6, #7, #8)

### 9.1 카테고리 (Sub-project #6)

**`/category/[name]`** 신규
- `app/category/[name]/page.tsx`
- 헤더: 카테고리 이름 + 글 개수 ("Cloud · 26편")
- 본문: Bento 톤 카드 그리드 (이미지 없음, 4가지 톤 순환 + 가장 최근 글은 dark featured 톤)
- `generateStaticParams`: 카테고리 슬러그 정적 빌드
- 슬러그: `categorySlug(name)` lowercase (현재 카테고리는 모두 영문 lowercase — `cloud`, `java`, `go` 등)

**`/category` 인덱스 없음**: 홈의 Categories Bento 카드가 인덱스 역할 수행.

### 9.2 시리즈 (Sub-project #7)

**`/series` 인덱스 리디자인**
- 헤더: "Series" + 시리즈 개수
- 카드 그리드: 시리즈마다 lavender 톤 카드
  - 시리즈 이름 (h3)
  - 에피소드 수 ("5편 발행")
  - 가장 최근 에피소드 제목 + 날짜
  - 클릭 시 `/series/[slug]`

**`/series/[slug]`** 신규
- `app/series/[slug]/page.tsx`
- Hero (lavender): 시리즈 이름 + 진행 메타 ("5편 발행")
- 본문: 에피소드 리스트 (seriesOrder asc) — 번호 원 + 제목 + 날짜 + 짧은 excerpt
- `generateStaticParams`: 모든 시리즈 정적 빌드
- 슬러그: `seriesSlug(name)` (lowercase + 공백 → hyphen)

### 9.3 태그 (Sub-project #8)

**`/tags` 인덱스 — 가중치 클라우드**
- 모든 태그 + 글 개수 (`getAllTags()` 재사용)
- 폰트 사이즈를 글 개수에 비례 (예: count 1 → 12px, count 20+ → 32px)
- 클릭 시 `/tags/[name]`
- 모바일: 단일 컬럼 wrap
- 기존 `tag-bubble-chart.tsx` 제거

**`/tags/[name]`** 신규
- `app/tags/[name]/page.tsx`
- 헤더: `#{tag}` + 글 개수
- 본문: 글 리스트 (`/posts`와 동일 compact list 패턴)
- `generateStaticParams`: 모든 태그
- 슬러그: 한글 태그는 `encodeURIComponent`로 인코딩, Next.js의 `decodeURIComponent`로 디코드

### 9.4 영향 범위
- `app/series/page.tsx` 재작성
- `app/series/[slug]/page.tsx` 신규
- `app/tags/page.tsx` 재작성 (bubble chart 제거)
- `app/tags/[name]/page.tsx` 신규
- `app/category/[name]/page.tsx` 신규
- `components/tag-bubble-chart.tsx` 삭제 (sub-project #9)
- `components/tags-page-client.tsx` → 새 tag cloud로 교체
- `lib/articles.ts`에 `getAllSeries()` 헬퍼 추가 (필요 시)

## 10. 운영 통합 & 최종 정리 (Sub-project #9)

### 10.1 sitemap & SEO
- `app/sitemap.ts`에 새 라우트 추가: `/posts`, `/category/[name]`, `/series/[slug]`, `/tags/[name]`
- `app/robots.ts` 변경 없음 (모든 새 라우트 크롤 허용)
- 신규 페이지 `generateMetadata` 정확 세팅 (title/description/og:image)
- JSON-LD WebSite Schema(`app/layout.tsx`) 변경 없음

### 10.2 RSS
RSS는 글 단위만 포함. 새 인덱스/카테고리/태그 라우트는 RSS에 포함하지 않는다. 헤더 RSS 버튼은 현재 RSS 경로(`/rss.xml`)로 링크.

### 10.3 AdSense / GA
- AdSense 글로벌 스크립트는 layout.tsx에 유지. 홈 Bento에는 광고 슬롯을 끼지 않음. Article 본문 중간 인-피드 광고는 현재 위치 유지
- GA / JSON-LD 변경 없음

### 10.4 ChatButton
- 위치/동작 변경 없음
- 색상 토큰만 새 디자인 시스템(`bg-accent`, `text-white`)으로 매핑
- 모바일 Command-K 모달과 z-index 충돌 검토

### 10.5 미사용 자원 정리

| 파일 | 처리 |
|---|---|
| `components/search-dialog.tsx` | 삭제 |
| `components/home-content.tsx` | 삭제 |
| `components/tag-bubble-chart.tsx` | 삭제 |
| `components/feature/*` | 삭제 또는 `/posts`에서 재활용 |
| `components/tags-page-client.tsx` | 새 tag cloud로 교체 또는 삭제 |
| shadcn/ui 미사용 토큰 | `globals.css`에서 정리 |
| dead imports / dead code | 일괄 정리 |

### 10.6 에러 처리
- Article/Series/Tag/Category not found → `notFound()` (Next.js 표준)
- Search index 로드 실패 → 콘솔 경고 + empty state
- localStorage 비활성/quota 초과 → silent fail (try/catch wrapping)

## 11. 최종 검증 체크리스트

- `npm run check` 타입 검사 통과
- `npm run build` static export 성공 (`output: 'export'` 유지)
- `out/` 모든 라우트 brouseable:
  - `/`, `/posts`, `/[기존 글 slug]`, `/series`, `/series/[slug]`, `/category/[name]`, `/tags`, `/tags/[name]`
- 기존 `/[slug]` URL 모두 동작 (구글 인덱스 보호)
- 모바일 (375, 414) / 태블릿 (768) / 데스크탑 (1280) 시각 확인
- light/dark 테마 토글 정상
- Command-K: ⌘K 단축키, 키보드 nav, localStorage 영속
- AdSense / GA 스크립트 정상 로드 (devtools Network)
- sitemap.xml에 신규 라우트 포함
- ChatButton 정상 동작 (ai-chatbot 연동)

## 12. 결정 사항 요약

| 결정 항목 | 결정 |
|---|---|
| 배포 전략 | 통합 feature 브랜치 + sub-PR 누적 + main 한 번 머지 |
| URL 구조 | `/[slug]` 유지, 신규 라우트만 추가 (`/posts`, `/category/[name]`, `/series/[slug]`, `/tags/[name]`) |
| 모바일 | 풀 반응형 |
| 5색 accent picker | 미채택 (단일 brand accent) |
| Command-K | 채택 (SearchDialog 교체) |
| Series spotlight | 채택, 자동 선정 (가장 최근 시리즈 에피소드) |
| Biweekly | "Latest" 라벨로 일반화 |
| 카드 이미지 | 제거 (Bento 톤 + 타이포로 위계) |
| 신규 페이지 | `/category/[name]`, `/tags/[name]`, `/series/[slug]` 채택 |
| Article 하단 | 시리즈 prev/next + Related 3장 유지 |
| 태그 인덱스 | 가중치 클라우드 (bubble chart 제거) |
| 운영 보존 | ChatButton, AdSense, GA, JSON-LD, RSS, sitemap, robots 모두 유지 |
| Nav | Home / Posts / Series / Tags (4개) |
