# blog-v3-bento

Bento Grid 테마를 Next.js 14 (App Router) + Tailwind + TypeScript로 변환한 시작점입니다.

## 실행

```bash
cd blog-v3-bento
npm install
npm run dev
```

`http://localhost:3000` 접속.

## 라우트

| Path | 페이지 |
|---|---|
| `/` | 홈 (Bento 그리드) |
| `/posts/[slug]` | 글 본문 (Hero + 720px 본문 + sticky TOC + 시리즈 네비) |
| `/category/[name]` | 카테고리 페이지 (예: `/category/cloud`) |
| `/series/[slug]` | 시리즈 페이지 (예: `/series/golang-concurrency`) |
| `/tags` | 모든 태그 인덱스 (가중치 cloud) |
| `/tags/[name]` | 태그별 글 목록 |

### Command-K 검색

- 단축키: `⌘K` (Mac) / `Ctrl+K` (Win/Linux) — 어디서든 토글
- 헤더 우측 검색 버튼으로도 열림
- 모노크롬 미니멀 결, 키보드 우선 (`↑↓ Enter Esc`)
- 검색 대상: 글 제목/본문/태그
- 빈 상태: 최근 본 글 + 인기 검색어 + 최근 검색 히스토리 (localStorage 영속)

## 디자인 토큰

`app/globals.css`에 모든 색상이 CSS 변수로 정의되어 있고, Tailwind config에서 `bg-card`, `text-ink`, `bg-accent` 등의 utility로 노출됩니다.

- **Light/Dark**: `next-themes`가 `<html class="dark">`를 토글
- **Accent 컬러**: `<html data-accent="blue">` — orange / blue / green / violet / magenta 5가지

헤더 우측의 swatch와 ☾/☀ 버튼으로 즉시 전환됩니다.

## 폴더 구조

```
app/
  globals.css         디자인 토큰 (CSS vars)
  layout.tsx          Root + ThemeProvider
  page.tsx            Home
  posts/[slug]/       Article
  category/[name]/    Category index
  series/[slug]/      Series index

components/
  header.tsx          공통 헤더 + accent picker + theme toggle
  theme-provider.tsx  next-themes wrapper

lib/
  articles.ts         샘플 데이터 + 헬퍼 (slug, date format 등)
```

## 다음 단계

- `lib/articles.ts`의 `ARTICLES` 배열을 실제 마크다운/MDX 파싱으로 교체 (`gray-matter` + `remark`/`MDX`)
- 모바일 반응형: 현재 데스크탑(1280)만 적용. `md:` breakpoint로 stack 패턴 추가 필요
- 코드블록: 현재 정적 텍스트. `rehype-pretty-code` 또는 `shiki`로 syntax highlighting
- 검색: 클라이언트 사이드 fuzzy search (`fuse.js`) 또는 Algolia
